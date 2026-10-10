import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createTask, getUsers, isAdminRole } from "../api/api";
import type { UserSummary } from "../api/api";

const CreateTask = () => {
  const navigate = useNavigate();
  const isAdmin = isAdminRole();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feedbackDate, setFeedbackDate] = useState("");
  const [status, setStatus] = useState("ONGOING");
  const [assignedTo, setAssignedTo] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) {
        return;
      }

      try {
        setUsersLoading(true);
        const data = await getUsers();
        setUsers(data.users);
      } catch (err) {
        toast.error((err as Error).message || "Failed to load users");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` })),
    [users]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      return toast.error("Title must be at least 3 characters");
    }

    if (description.trim().length < 5) {
      return toast.error("Description too short");
    }

    if (!feedbackDate) {
      return toast.error("Feedback date required");
    }

    if (isAdmin && assignedTo === "") {
      return toast.error("Please choose a user to assign");
    }

    try {
      setLoading(true);

      const data = await createTask({
        title: title.trim(),
        description: description.trim(),
        feedback_date: feedbackDate,
        status,
        ...(assignedTo ? { assignedTo } : {}),
      });

      toast.success(data?.message || "Task created successfully");
      navigate("/dashboard");
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(224,231,255,0.85),_rgba(248,250,252,1)_30%,_rgba(255,255,255,1)_100%)]">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">FlowTasks</p>
            <h1 className="text-2xl font-semibold text-slate-950">Create Task</h1>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94))] p-8 text-white shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Task Workflow</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight">
            Create a task with the same flow your deployed app will use.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
            {isAdmin
              ? "Admins can create tasks, assign them to managed users, and set the starting status right away."
              : "Users can create their own tasks, set the feedback date, and manage the work later from the dashboard."}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Available Actions</p>
              <p className="mt-3 text-sm leading-7 text-slate-100">
                Create, edit, delay, complete, and delete tasks without changing your current route flow.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Deployment Ready</p>
              <p className="mt-3 text-sm leading-7 text-slate-100">
                Clean form validation, role-aware fields, and consistent UI for admin and user accounts.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-sm backdrop-blur">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Task Form</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">New task details</h2>
          <p className="mt-2 text-sm text-slate-500">
            Fill in the required fields below. Everything stays in your existing backend flow.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Feedback Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={feedbackDate}
                  onChange={(e) => setFeedbackDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                >
                  <option value="ONGOING">Ongoing</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {isAdmin && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Assign To</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                  disabled={usersLoading}
                >
                  <option value="">{usersLoading ? "Loading users..." : "Select a user"}</option>
                  {userOptions.map((user) => (
                    <option key={user.value} value={user.value}>
                      {user.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default CreateTask;
