import OpenAI from "openai";
import mongoose from "mongoose";
import Task from "../models/task.js";
import TaskDelay from "../models/taskdelay.js";
import User from "../models/user.js";

const INTENTS = [
  "LIST_TASKS",
  "COUNT_TASKS",
  "USER_STATS",
  "LIST_OVERDUE_TASKS",
  "LIST_TASKS_WITH_MIN_DELAYS",
  "SUMMARIZE_TASK_DELAYS",
  "UNSUPPORTED",
];

const querySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: { type: "string", enum: INTENTS },
    assignee_name: { type: ["string", "null"] },
    task_title: { type: ["string", "null"] },
    min_delays: { type: ["integer", "null"], minimum: 0, maximum: 100 },
    status: { type: ["string", "null"], enum: ["ONGOING", "DELAYED", "COMPLETED", null] },
  },
  required: ["intent", "assignee_name", "task_title", "min_delays", "status"],
};

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const distance = (left, right) => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[right.length];
};

const mentionsUser = (question, name) => {
  const escaped = name.toLowerCase().trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, "i").test(question);
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveUser = (requestedName, users) => {
  if (!requestedName) return { user: null };
  const input = normalize(requestedName);
  const exact = users.find((user) => normalize(user.name) === input);
  if (exact) return { user: exact };

  const ranked = users
    .map((user) => ({ user, score: distance(input, normalize(user.name)) }))
    .sort((a, b) => a.score - b.score);
  const best = ranked[0];
  if (!best) return { user: null, suggestions: [] };

  const limit = Math.max(1, Math.floor(Math.max(input.length, normalize(best.user.name).length) * 0.34));
  if (best.score <= limit && ranked.filter((item) => item.score === best.score).length === 1) {
    return { user: best.user, correctedFrom: requestedName };
  }
  return { user: null, suggestions: ranked.slice(0, 3).map((item) => item.user.name) };
};

const visibleUsers = async (req) => {
  const filter = req.user.role === "ADMIN"
    ? { role: "USER" }
    : { _id: new mongoose.Types.ObjectId(req.user.id) };
  const users = await User.find(filter).select({ name: 1 }).sort({ name: 1 }).lean();
  return users.map((user) => ({ id: user._id.toString(), name: user.name }));
};

const accessScope = (req) => {
  const filter = { is_deleted: false };
  if (req.user.role !== "ADMIN") {
    filter.assigned_to = new mongoose.Types.ObjectId(req.user.id);
  }
  return filter;
};

const inferTaskTitle = async (req, question) => {
  const rows = await Task.find(accessScope(req)).select({ title: 1 }).limit(1000).lean();
  const normalizedQuestion = normalize(question);
  return rows
    .filter((row) => normalizedQuestion.includes(normalize(row.title)))
    .sort((a, b) => normalize(b.title).length - normalize(a.title).length)[0]?.title || null;
};

const taskDto = (task) => ({
  id: task._id?.toString() || task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  feedback_date: task.feedback_date,
  assignee_name: task.assignee_name,
  delay_count: Number(task.delay_count),
});

const client = () => {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-5.4-nano";
  console.log("AI provider:", baseURL.includes("groq.com") ? "Groq" : "OpenAI");
  console.log("AI model:", model);
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL });
};

const interpret = async (question, users) => {
  const response = await client().responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
    store: false,
    instructions: "Extract the task tracker operation and filters. Understand any question about tasks or users, including listing, counting, status (ONGOING, DELAYED, COMPLETED), overdue state, assignees, title/description keywords, delay counts, and user workload. Use LIST_TASKS for show/find/what questions, COUNT_TASKS for how-many questions, USER_STATS for user workload questions, and SUMMARIZE_TASK_DELAYS for delay explanations. Never answer the question, invent a person, or invent a task title. Use UNSUPPORTED only for unrelated requests.",
    input: `Question: ${question}\nVisible users: ${JSON.stringify(users.map(({ name }) => name))}`,
    text: { format: { type: "json_schema", name: "task_query", strict: true, schema: querySchema } },
  });
  return JSON.parse(response.output_text);
};

const listTasks = async (req, {
  overdue = false,
  assigneeId,
  assigneeIds,
  minDelays,
  delayOperator = ">",
  status,
  title,
  titleOnly = false,
  sort = { feedback_date: 1 },
  limit = 100,
}) => {
  const match = accessScope(req);
  const assigneeFilters = [];
  if (overdue) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    match.status = { $ne: "COMPLETED" };
    match.feedback_date = { $lt: startOfToday };
  }
  if (assigneeId) assigneeFilters.push({ assigned_to: new mongoose.Types.ObjectId(assigneeId) });
  if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
    assigneeFilters.push({ assigned_to: { $in: assigneeIds.map((id) => new mongoose.Types.ObjectId(id)) } });
  }
  if (assigneeFilters.length > 0) match.$and = assigneeFilters;
  if (status) match.status = status;
  if (title) {
    const titlePattern = new RegExp(escapeRegex(title), "i");
    if (titleOnly) match.title = titlePattern;
    else match.$or = [{ title: titlePattern }, { description: titlePattern }];
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: User.collection.name,
        localField: "assigned_to",
        foreignField: "_id",
        as: "assignee",
      },
    },
    { $unwind: "$assignee" },
    {
      $lookup: {
        from: TaskDelay.collection.name,
        localField: "_id",
        foreignField: "task_id",
        as: "delays",
      },
    },
    { $addFields: { delay_count: { $size: "$delays" } } },
  ];

  if (Number.isInteger(minDelays)) {
    const safeOperator = [">", "<", ">=", "<=", "="].includes(delayOperator) ? delayOperator : ">";
    const mongoOperator = { ">": "$gt", "<": "$lt", ">=": "$gte", "<=": "$lte", "=": "$eq" }[safeOperator];
    pipeline.push({ $match: { delay_count: { [mongoOperator]: minDelays } } });
  }
  pipeline.push(
    { $sort: sort },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        status: 1,
        feedback_date: 1,
        assignee_name: "$assignee.name",
        delay_count: 1,
      },
    }
  );
  console.log("AI MongoDB task filter:", { overdue, assigneeId, assigneeIds, minDelays, status, title });

  const tasks = await Task.aggregate(pipeline);
  const result = tasks.map(taskDto);
  console.log("AI MongoDB task result counts:", result.map(({ id, title, delay_count }) => ({ id, title, delay_count })));
  return result;
};

const summarize = async (task, delays) => {
  const response = await client().responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
    store: false,
    instructions: "Write a concise natural-language summary of why this task was delayed. Use only the supplied task and delay-history data. Mention the number of delays and recorded reasons. Do not return JSON, operation names, filters, or code. If there are no delay records, say that no delays are recorded.",
    input: JSON.stringify({ task: taskDto(task), delays }),

  });
  return response.output_text;
};

export const queryTasksWithAI = async (req, res) => {
  try {
    const users = await visibleUsers(req);
    const parsed = await interpret(req.body.question, users);
    console.log("AI parsed query:", JSON.stringify(parsed));
    const summarizePhrase = /\bsummar(?:ize|ise)\b/i.test(req.body.question);
    if (summarizePhrase) parsed.intent = "SUMMARIZE_TASK_DELAYS";
    if (parsed.intent === "SUMMARIZE_TASK_DELAYS" && !parsed.task_title) {
      parsed.task_title = await inferTaskTitle(req, req.body.question);
    }

    const overduePhrase = /\boverdue\b/i.test(req.body.question);
    if (overduePhrase) {
      parsed.intent = "LIST_OVERDUE_TASKS";
      parsed.status = null;
    }

    const delayPhrase = req.body.question.match(/more than\s+(\d+)\s+delays?/i);
    const lessPhrase = req.body.question.match(/less than\s+(\d+)\s+delays?/i);
    const atLeastPhrase = req.body.question.match(/at least\s+(\d+)\s+delays?/i);
    const exactPhrase = req.body.question.match(/exactly\s+(\d+)\s+delays?/i);
    let delayOperator = ">";
    if (lessPhrase) { parsed.min_delays = Number(lessPhrase[1]); delayOperator = "<"; parsed.intent = "LIST_TASKS"; }
    if (atLeastPhrase) { parsed.min_delays = Number(atLeastPhrase[1]); delayOperator = ">="; parsed.intent = "LIST_TASKS"; }
    if (exactPhrase) { parsed.min_delays = Number(exactPhrase[1]); delayOperator = "="; parsed.intent = "LIST_TASKS"; }

    if (delayPhrase) {
      parsed.min_delays = Number(delayPhrase[1]);
      parsed.intent = "LIST_TASKS_WITH_MIN_DELAYS";
    }
    if (parsed.intent === "UNSUPPORTED") {
      return res.status(400).json({ message: "I can search tasks by status, assignee, title, overdue state, and delay count, or summarize task delays." });
    }

    const userMatch = resolveUser(parsed.assignee_name, users);
    const questionLower = req.body.question.toLowerCase();
    const mentionedUsers = users.filter((user) => mentionsUser(questionLower, user.name));
    const assigneeIds = mentionedUsers.length > 0 ? mentionedUsers.map((user) => user.id) : (userMatch.user ? [userMatch.user.id] : undefined);
    if (parsed.assignee_name && !userMatch.user && mentionedUsers.length === 0) {
      return res.status(404).json({ message: "I could not confidently match that user.", suggestions: userMatch.suggestions || [] });
    }

    if (parsed.intent === "COUNT_TASKS") {
      const tasks = await listTasks(req, { assigneeIds, status: parsed.status || undefined, title: parsed.task_title || undefined, minDelays: parsed.min_delays ?? undefined, delayOperator });
      return res.json({ intent: parsed.intent, matched_users: mentionedUsers.length ? mentionedUsers.map((user) => user.name) : (userMatch.user ? [userMatch.user.name] : []), status: parsed.status || null, count: tasks.length });
    }

    if (parsed.intent === "USER_STATS") {
      const tasks = await listTasks(req, { assigneeIds });
      const stats = { total_tasks: tasks.length, ongoing_tasks: tasks.filter((task) => task.status === "ONGOING").length, delayed_tasks: tasks.filter((task) => task.status === "DELAYED").length, completed_tasks: tasks.filter((task) => task.status === "COMPLETED").length, overdue_tasks: tasks.filter((task) => task.status !== "COMPLETED" && task.feedback_date && new Date(task.feedback_date) < new Date()).length };
      return res.json({ intent: parsed.intent, matched_users: mentionedUsers.length ? mentionedUsers.map((user) => user.name) : (userMatch.user ? [userMatch.user.name] : []), stats });
    }

    if (parsed.intent === "LIST_TASKS") {
      const tasks = await listTasks(req, { assigneeIds, status: parsed.status || undefined, title: parsed.task_title || undefined, minDelays: parsed.min_delays ?? undefined, delayOperator });
      return res.json({ intent: parsed.intent, matched_users: mentionedUsers.length ? mentionedUsers.map((user) => user.name) : (userMatch.user ? [userMatch.user.name] : []), status: parsed.status || null, tasks });
    }

    if (parsed.intent === "LIST_OVERDUE_TASKS") {
      const tasks = await listTasks(req, { overdue: true, assigneeIds });
      return res.json({ intent: parsed.intent, matched_users: mentionedUsers.length ? mentionedUsers.map((user) => user.name) : (userMatch.user ? [userMatch.user.name] : []), corrected_from: userMatch.correctedFrom || null, tasks });
    }

    if (parsed.intent === "LIST_TASKS_WITH_MIN_DELAYS") {
      const tasks = await listTasks(req, { assigneeIds, minDelays: parsed.min_delays ?? 2, delayOperator });
      return res.json({ intent: parsed.intent, matched_users: mentionedUsers.length ? mentionedUsers.map((user) => user.name) : (userMatch.user ? [userMatch.user.name] : []), corrected_from: userMatch.correctedFrom || null, tasks });
    }

    if (parsed.intent === "SUMMARIZE_TASK_DELAYS" && !parsed.task_title) {
      return res.status(404).json({ message: "Please include the task title you want summarized." });
    }

    const tasks = await listTasks(req, {
      title: parsed.task_title || "",
      titleOnly: true,
      sort: { updated_at: -1 },
      limit: 4,
    });
    if (tasks.length === 0) return res.status(404).json({ message: "No matching task was found." });
    if (tasks.length > 1) return res.status(409).json({ message: "I found multiple matching tasks.", tasks });

    const delays = await TaskDelay.find({ task_id: tasks[0].id })
      .select({ _id: 0, old_date: 1, new_date: 1, reason: 1, created_at: 1 })
      .sort({ created_at: 1 })
      .lean();
    return res.json({ intent: parsed.intent, task: tasks[0], delays, summary: await summarize(tasks[0], delays) });
  } catch (error) {
    console.error("AI task query failed", {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      requestId: error?.request_id || error?.headers?.["x-request-id"],
      cause: error?.cause?.message,
    });
    const missingKey = error.message === "OPENAI_API_KEY is not configured";
    return res.status(missingKey ? 503 : 500).json({ message: missingKey ? error.message : "Unable to process the task question" });
  }
};
