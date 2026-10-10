import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Task from "../models/task.js";
import TaskDelay from "../models/taskdelay.js";
import User from "../models/user.js";

const objectId = (value) => new mongoose.Types.ObjectId(value);

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const mapTask = (task) => ({
  id: task._id.toString(),
  title: task.title,
  description: task.description,
  status: task.status,
  feedback_date: task.feedback_date,
  completed_at: task.completed_at,
  created_at: task.created_at,
  updated_at: task.updated_at,
  created_by: task.created_by?._id?.toString() || task.created_by?.toString(),
  assigned_to: task.assigned_to?._id?.toString() || task.assigned_to?.toString(),
  creator_name: task.creator_name || task.created_by?.name,
  assignee_name: task.assignee_name || task.assigned_to?.name,
  is_overdue: Number(task.is_overdue),
});

const mapDelay = (delay) => ({
  id: delay._id.toString(),
  old_date: delay.old_date,
  new_date: delay.new_date,
  reason: delay.reason,
  created_at: delay.created_at,
});

const ensureAssignableUser = async (assignedTo) => {
  if (!isValidObjectId(assignedTo)) {
    throw new Error("Assigned user not found");
  }

  const user = await User.findById(assignedTo).select({ role: 1 }).lean();
  if (!user) {
    throw new Error("Assigned user not found");
  }

  if (user.role !== "USER") {
    throw new Error("Tasks can only be assigned to USER accounts");
  }
};

const taskScope = (req) => {
  const filter = { is_deleted: false };
  if (req.user.role !== "ADMIN") {
    filter.assigned_to = objectId(req.user.id);
  }
  return filter;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const invalidObjectIdResponse = (res, label) =>
  res.status(400).json({ message: `Invalid ${label} id` });

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.exists({ email: normalizedEmail });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email: normalizedEmail, password_hash: hashed, role: "USER" });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "USER" } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.exists({ email: normalizedEmail });

    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email: normalizedEmail, password_hash: hashed, role });

    return res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const getUsers = async (_req, res) => {
  try {
    const users = await User.find({ role: "USER" })
      .select({ name: 1, email: 1, role: 1, created_at: 1 })
      .sort({ created_at: -1 })
      .lean();
    const taskCounts = await Task.aggregate([
      {
        $match: {
          is_deleted: false,
          assigned_to: { $in: users.map((user) => user._id) },
        },
      },
      {
        $group: {
          _id: "$assigned_to",
          total_tasks: { $sum: 1 },
          ongoing_tasks: {
            $sum: { $cond: [{ $eq: ["$status", "ONGOING"] }, 1, 0] },
          },
        },
      },
    ]);
    const countsByUser = new Map(taskCounts.map((item) => [item._id.toString(), item]));

    return res.json({
      users: users.map((user) => {
        const counts = countsByUser.get(user._id.toString());
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          total_tasks: counts?.total_tasks || 0,
          ongoing_tasks: counts?.ongoing_tasks || 0,
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  if (!isValidObjectId(userId)) {
    return invalidObjectIdResponse(res, "user");
  }

  if (userId.toLowerCase() !== req.user.id.toLowerCase()) {
    try {
      const user = await User.findById(userId).select({ role: 1 }).lean();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.role === "ADMIN") {
        return res.status(400).json({ message: "Admin accounts cannot be deleted" });
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const taskIds = await Task.find({
            $or: [{ created_by: objectId(userId) }, { assigned_to: objectId(userId) }],
          })
            .select({ _id: 1 })
            .session(session)
            .lean();
          const ids = taskIds.map((task) => task._id);
          if (ids.length > 0) {
            await TaskDelay.deleteMany({ task_id: { $in: ids } }, { session });
            await Task.deleteMany({ _id: { $in: ids } }, { session });
          }
          await User.deleteOne({ _id: objectId(userId) }, { session });
        });
      } finally {
        await session.endSession();
      }

      return res.json({ message: "User deleted successfully" });
    } catch (err) {
      return res.status(500).json({
        message: "Something went wrong",
        error: err.message,
      });
    }
  }

  return res.status(400).json({ message: "You cannot delete your own account" });
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select({ name: 1, email: 1, role: 1, password_hash: 1 })
      .lean();

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userId = user._id.toString();
    const token = jwt.sign(
      { userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      role: user.role,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, feedback_date, status = "ONGOING", assignedTo } = req.body;
    const creatorId = objectId(req.user.id);
    let assigneeId = creatorId;

    if (req.user.role === "ADMIN" && assignedTo) {
      await ensureAssignableUser(assignedTo);
      assigneeId = objectId(assignedTo);
    }

    const task = await Task.create({
      title,
      description,
      feedback_date,
      status,
      completed_at: status === "COMPLETED" ? new Date() : null,
      created_by: creatorId,
      assigned_to: assigneeId,
    });

    return res.status(201).json({
      message: "Task created successfully",
      taskId: task._id.toString(),
    });
  } catch (err) {
    const statusCode =
      err.message === "Assigned user not found" ||
      err.message === "Tasks can only be assigned to USER accounts"
        ? 400
        : 500;

    return res.status(statusCode).json({
      message: err.message || "Something went wrong",
    });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { date, status, search, filter, assignedTo, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(Number.parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
    const match = taskScope(req);

    if (req.user.role === "ADMIN" && assignedTo) {
      if (!isValidObjectId(assignedTo)) {
        return invalidObjectIdResponse(res, "user");
      }
      match.assigned_to = objectId(assignedTo);
    }
    if (status) match.status = status;
    if (date) {
      const startDate = new Date(`${date}T00:00:00`);
      if (!Number.isNaN(startDate.getTime())) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        match.created_at = { $gte: startDate, $lt: endDate };
      }
    }
    if (filter === "overdue") {
      match.$and = [
        { status: { $ne: "COMPLETED" } },
        { feedback_date: { $lt: startOfToday() } },
      ];
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: User.collection.name,
          localField: "created_by",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: "$creator" },
      {
        $lookup: {
          from: User.collection.name,
          localField: "assigned_to",
          foreignField: "_id",
          as: "assignee",
        },
      },
      { $unwind: "$assignee" },
    ];

    if (search) {
      const searchPattern = new RegExp(escapeRegex(search), "i");
      pipeline.push({
        $match: {
          $or: [
            { title: searchPattern },
            { description: searchPattern },
            { "assignee.name": searchPattern },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        meta: [{ $count: "total" }],
        tasks: [
          { $sort: { created_at: -1 } },
          { $skip: (pageNum - 1) * limitNum },
          { $limit: limitNum },
          {
            $addFields: {
              creator_name: "$creator.name",
              assignee_name: "$assignee.name",
              is_overdue: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$status", "COMPLETED"] },
                      { $lt: ["$feedback_date", startOfToday()] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
          {
            $project: {
              title: 1,
              description: 1,
              status: 1,
              feedback_date: 1,
              completed_at: 1,
              created_at: 1,
              updated_at: 1,
              created_by: 1,
              assigned_to: 1,
              creator_name: 1,
              assignee_name: 1,
              is_overdue: 1,
            },
          },
        ],
      },
    });

    const [result] = await Task.aggregate(pipeline);
    const total = result.meta[0]?.total || 0;
    return res.json({
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
      task: result.tasks.map(mapTask),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { title, description, feedback_date, status, assignedTo } = req.body;
    if (!isValidObjectId(taskId)) {
      return invalidObjectIdResponse(res, "task");
    }

    const task = await Task.findOne({ _id: taskId, is_deleted: false })
      .select({ assigned_to: 1 })
      .lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "ADMIN" && task.assigned_to.toString() !== req.user.id) {
      return res.status(403).json({ message: "You cannot edit this task" });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (feedback_date !== undefined) updates.feedback_date = feedback_date;
    if (status !== undefined) {
      updates.status = status;
      updates.completed_at = status === "COMPLETED" ? new Date() : null;
    }
    if (req.user.role === "ADMIN" && assignedTo !== undefined) {
      await ensureAssignableUser(assignedTo);
      updates.assigned_to = objectId(assignedTo);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    await Task.updateOne(
      { _id: taskId, is_deleted: false },
      { $set: updates },
      { runValidators: true }
    );

    return res.json({ message: "Task updated successfully" });
  } catch (err) {
    const statusCode =
      err.message === "Assigned user not found" ||
      err.message === "Tasks can only be assigned to USER accounts"
        ? 400
        : 500;

    return res.status(statusCode).json({
      message: err.message || "Something went wrong",
    });
  }
};

export const delayTask = async (req, res) => {
  const taskId = req.params.taskId;
  if (!isValidObjectId(taskId)) {
    return invalidObjectIdResponse(res, "task");
  }

  const { reason, newDate } = req.body;
  let response;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const task = await Task.findOne({ _id: taskId, is_deleted: false }).session(session);
      if (!task) {
        response = { status: 404, message: "Task not found" };
        return;
      }
      if (req.user.role !== "ADMIN" && task.assigned_to.toString() !== req.user.id) {
        response = { status: 403, message: "You cannot delay this task" };
        return;
      }
      if (task.status === "COMPLETED") {
        response = { status: 400, message: "Cannot delay a completed task" };
        return;
      }
      if (!task.feedback_date) {
        response = { status: 400, message: "Cannot delay a task without a feedback date" };
        return;
      }
      if (new Date(newDate) <= new Date(task.feedback_date)) {
        response = { status: 400, message: "New date must be greater than current feedback date" };
        return;
      }

      await TaskDelay.create(
        [{
          task_id: task._id,
          old_date: task.feedback_date,
          new_date: new Date(newDate),
          reason,
        }],
        { session }
      );
      task.status = "DELAYED";
      task.feedback_date = new Date(newDate);
      task.completed_at = null;
      await task.save({ session });
      response = { status: 200, message: "Task delayed successfully" };
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  } finally {
    await session.endSession();
  }
  return res.status(response.status).json({ message: response.message });
};

export const completeTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    if (!isValidObjectId(taskId)) {
      return invalidObjectIdResponse(res, "task");
    }

    const task = await Task.findOne({ _id: taskId, is_deleted: false })
      .select({ status: 1, assigned_to: 1 })
      .lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "ADMIN" && task.assigned_to.toString() !== req.user.id) {
      return res.status(403).json({ message: "You cannot complete this task" });
    }
    if (task.status === "COMPLETED") {
      return res.status(400).json({ message: "Task is already completed" });
    }

    await Task.updateOne(
      { _id: taskId, is_deleted: false },
      { $set: { status: "COMPLETED", completed_at: new Date() } }
    );
    return res.json({ message: "Task completed successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    if (!isValidObjectId(taskId)) {
      return invalidObjectIdResponse(res, "task");
    }

    const task = await Task.findOne({ _id: taskId, is_deleted: false })
      .select({ assigned_to: 1 })
      .lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "ADMIN" && task.assigned_to.toString() !== req.user.id) {
      return res.status(403).json({ message: "You cannot delete this task" });
    }

    await Task.updateOne(
      { _id: taskId, is_deleted: false },
      { $set: { is_deleted: true, deleted_at: new Date() } }
    );
    return res.json({ message: "Task deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    if (!isValidObjectId(taskId)) {
      return invalidObjectIdResponse(res, "task");
    }

    const task = await Task.findOne({ _id: taskId, is_deleted: false })
      .populate("created_by", "name")
      .populate("assigned_to", "name")
      .lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "ADMIN" && task.assigned_to._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "You cannot view this task" });
    }

    const delays = await TaskDelay.find({ task_id: task._id })
      .sort({ created_at: -1 })
      .lean();
    const today = startOfToday();
    const mappedTask = mapTask({
      ...task,
      creator_name: task.created_by.name,
      assignee_name: task.assigned_to.name,
      is_overdue: task.status !== "COMPLETED" && task.feedback_date < today ? 1 : 0,
    });

    return res.json({
      ...mappedTask,
      delay_count: delays.length,
      delays: delays.map(mapDelay),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
  }
};
