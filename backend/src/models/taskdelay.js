import mongoose from "mongoose";

const taskDelaySchema = new mongoose.Schema(
  {
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    old_date: {
      type: Date,
      required: true,
    },
    new_date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 255,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export default mongoose.model("TaskDelay", taskDelaySchema);
