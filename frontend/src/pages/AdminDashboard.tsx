import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createTask } from "../api/api";
import toast from "react-hot-toast";
import {
    getUsers,
    deleteManagedUser,
    isAdminRole,
} from "../api/api";
import type { UserSummary } from "../api/api";

const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const isAdmin = isAdminRole();
    const [taskStatus, setTaskStatus] = useState("ONGOING");
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [assignedTo, setAssignedTo] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [feedbackDate, setFeedbackDate] = useState("");
    const [creating, setCreating] = useState(false);
    // 🔥 Fetch users
    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const data = await getUsers();
            setUsers(data.users || []);
        } catch (err) {
            toast.error((err as Error).message || "Failed to fetch users");
        } finally {
            setUsersLoading(false);
        }
    };

    const resetTaskForm = () => {
        setTitle("");
        setDescription("");
        setFeedbackDate("");
        setTaskStatus("ONGOING");
        setAssignedTo("");
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !description || !feedbackDate) {
            toast.error("All fields required");
            return;
        }

        try {
            setCreating(true);

            await createTask({
                title,
                description,
                feedback_date: feedbackDate,
                status: taskStatus,
                ...(assignedTo !== "" ? { assignedTo } : {}),
            });

            toast.success("Task created");
            fetchUsers();
            resetTaskForm();
            setShowCreate(false);
            setTitle("");
            setDescription("");
            setFeedbackDate("");

        } catch (err) {
            toast.error("Failed to create task");
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) {
            navigate("/dashboard");
            return;
        }

        fetchUsers();
    }, [isAdmin, navigate]);

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteManagedUser(userId);
            toast.success("User deleted successfully");
            // refresh
            fetchUsers();
        } catch (err) {
            toast.error((err as Error).message || "Failed to delete user");
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(224,231,255,0.9),_rgba(248,250,252,1)_35%,_rgba(255,255,255,1)_100%)]">

            {/* HEADER */}
            <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
                <div className="flex w-full items-center justify-between px-6 py-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            FlowTasks Workspace
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-950">
                            Admin Dashboard
                        </h1>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </header>

            {/* MAIN */}
            <main className="w-full px-4 sm:px-6 py-6 h-[calc(100vh-73px)]">
                <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">

                    {/* USERS */}
                    <article className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                                    Users
                                </p>
                                <h2 className="text-2xl font-semibold text-slate-950">
                                    Manage created users
                                </h2>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {users.length} users
                            </span>
                        </div>

                        {usersLoading ? (
                            <p className="text-sm text-slate-500">Loading users...</p>
                        ) : users.length === 0 ? (
                            <p className="text-sm text-slate-500">No users found.</p>
                        ) : (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-950">
                                                {user.name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {user.email}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {user.ongoing_tasks} ongoing of {user.total_tasks} tasks
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setAssignedTo(user.id);
                                                    setShowCreate(true);
                                                }}
                                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                            >
                                                Assign Task
                                            </button>

                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>

                    {/* OVERVIEW */}
                    <article className="rounded-3xl border border-white/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94))] p-6 text-white shadow-sm">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                            Overview
                        </p>

                        <h2 className="mt-2 text-2xl font-semibold">
                            Admin control panel
                        </h2>

                        <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
                            Manage users and assign tasks from a dedicated admin dashboard.
                        </p>

                        <div className="mt-6 grid gap-4 sm:grid-cols-1">
                            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                                    Total Users
                                </p>
                                <p className="mt-2 text-3xl font-semibold">
                                    {users.length}
                                </p>
                            </div>
                        </div>
                    </article>

                </section>
            </main>
            {showCreate && (
                <div className="fixed inset-0 z-50 flex overflow-hidden bg-black/20 backdrop-blur-[2px]">
                    <div
                        className="flex-1"
                        onClick={() => {
                            setShowCreate(false);
                            setTitle("");
                            setDescription("");
                            setFeedbackDate("");
                            setTaskStatus("ONGOING");
                        }}
                    />

                    <aside className="h-dvh max-h-dvh min-h-0 w-full max-w-xl shrink-0 touch-pan-y overscroll-y-contain overflow-y-auto bg-white p-8 shadow-2xl [-webkit-overflow-scrolling:touch]">
                        <h2 className="mb-2 text-2xl font-semibold text-slate-950">
                            Create New Task
                        </h2>
                        <p className="mb-6 text-sm text-slate-500">
                            {isAdmin
                                ? "Create and assign tasks, or update status and ownership from the same form."
                                : "Manage your task details, feedback date, and completion status."}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Feedback Date</label>
                                    <DatePicker
                                        selected={feedbackDate ? new Date(`${feedbackDate}T00:00:00`) : null}
                                        onChange={(date: Date | null) => setFeedbackDate(date ? formatDateValue(date) : "")}
                                        minDate={new Date()}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Select feedback date"
                                        popperPlacement="top-start"
                                        portalId="root"
                                        wrapperClassName="block w-full"
                                        className="date-input w-full min-w-0 max-w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                                    <select
                                        value={taskStatus}
                                        onChange={(e) => setTaskStatus(e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
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
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                                    >
                                        <option value="">Select a user</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreate(false);
                                        resetTaskForm();
                                    }}
                                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {creating ? "Creating..." : "Create Task"}
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;