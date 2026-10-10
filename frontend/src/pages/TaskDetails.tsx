import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiAlertCircle } from "react-icons/fi";
import { getTaskById } from "../api/api";

interface DelayHistory {
  id: string;
  reason: string;
  old_date: string;
  new_date: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  feedback_date: string;
  delay_count: number;
  delays: DelayHistory[];
  is_overdue: number;
  completed_at?: string;
  creator_name?: string;
  assignee_name?: string;
}

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        if (!id) {
          throw new Error("Task ID is missing");
        }
        const data = await getTaskById(id);
        setTask(data as Task);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!task) {
    return <div className="flex h-screen items-center justify-center text-red-500">Task not found</div>;
  }

  const badgeStyles = {
    COMPLETED: "bg-green-100 text-green-600",
    DELAYED: "bg-yellow-100 text-yellow-700",
    ONGOING: "bg-blue-100 text-blue-600",
  } as const;

  const badge = badgeStyles[task.status as keyof typeof badgeStyles] || "bg-gray-100 text-gray-600";

  return (
    // FIX 1: h-screen + flex col + overflow-hidden — fills full viewport, no scroll on outer
    <div className="premium-task-detail h-screen flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(219,234,254,0.65),_rgba(248,250,252,1)_35%,_rgba(255,255,255,1)_100%)]">

      {/* FIX 2: removed max-w-7xl, full width, flex-1 fills remaining height */}
      <div className="flex flex-col gap-3 h-full w-full px-4 sm:px-6 py-4 overflow-hidden">

        <button
          onClick={() => navigate(-1)}
          className="w-fit shrink-0 rounded-full border border-sky-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-slate-900"
        >
          {"<- Back to Tasks"}
        </button>

        {/* FIX 3: flex-1 + min-h-0 so grid fills all remaining height */}
        <div className="grid gap-4 flex-1 min-h-0 xl:grid-cols-[2fr_1fr]">

          {/* FIX 4: left section scrolls independently */}
          <section className="flex flex-col gap-4 overflow-y-auto min-h-0 pr-1">

            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shrink-0">
              <div className="relative flex items-start gap-4">
                <div className="min-w-0 flex-1 pr-20 sm:pr-24">
                  <p className="text-xs uppercase tracking-[0.28em] text-sky-500">
                    Task Overview
                  </p>
                  <h1 className="text-3xl font-semibold text-slate-900">
                    {task.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-slate-600">
                    {task.description || "No description provided"}
                  </p>
                </div>
                <div className="absolute right-0 top-0 flex flex-col items-end gap-2">
                  {task.is_overdue === 1 && (
                    <div className="flex items-center gap-2 text-sm font-medium text-rose-500">
                      <FiAlertCircle />
                      <span>Overdue</span>
                    </div>
                  )}
                  <span className={`rounded-full px-4 py-1 text-xs font-semibold shadow-sm ${badge}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 shrink-0">
              {[
                ["Created", new Date(task.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
                ["Last Updated", new Date(task.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
                ["Feedback Date", new Date(task.feedback_date).toLocaleDateString()],
                ["Delay Count", task.delay_count],
                ["Created By", task.creator_name || "-"],
                ["Assigned To", task.assignee_name || "-"],
              ].map(([label, value], index) => (
                <div key={index} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="font-medium text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shrink-0">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-500">Status Summary</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Status</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{task.status}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completed At</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {task.completed_at ? new Date(task.completed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Not completed yet"}
                  </p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overdue State</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {task.is_overdue === 1 ? "Requires attention" : "Within expected timeline"}
                  </p>
                </div>
              </div>
            </div>

          </section>

          {/* FIX 5: right aside — removed max-h-[540px], now fills full height dynamically */}
          <aside className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 shrink-0">Delay History</h2>
            <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              {task.delays.length === 0 ? (
                <p className="text-sm text-slate-500">No delays recorded.</p>
              ) : (
                <div className="space-y-5">
                  {task.delays.map((delay) => (
                    <article key={delay.id} className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {new Date(delay.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </p>
                      <p className="mt-2 font-medium text-slate-900">{delay.reason}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {new Date(delay.old_date).toLocaleDateString()} to{" "}
                        {new Date(delay.new_date).toLocaleDateString()}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default TaskDetails;