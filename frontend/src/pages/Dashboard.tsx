import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import {
  clearAuthSession,
  completeTask,
  createTask,
  delayTask,
  deleteTask,
  getStoredRole,
  getStoredUserId,
  getTasks,
  getUsers,
  isAdminRole,
  updateTask,
} from "../api/api";
import type { TaskItem, UserSummary } from "../api/api";
import AiAssistantModal from "../components/AiAssistantModal";
import DashboardParticles from "../components/DashboardParticles";

interface MetaState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialMeta: MetaState = { total: 0, page: 1, limit: 10, totalPages: 1 };

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateValue = (value?: string) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00`) : new Date();

const getNextDate = (value?: string) => {
  const date = getDateValue(value);
  date.setDate(date.getDate() + 1);
  return date;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const role = getStoredRole()?.toUpperCase() || "";
  const currentUserId = getStoredUserId();
  const isAdmin = isAdminRole();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showOverdue, setShowOverdue] = useState(false);
  const [meta, setMeta] = useState<MetaState>(initialMeta);
  const [assignedFilter, setAssignedFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feedbackDate, setFeedbackDate] = useState("");
  const [taskStatus, setTaskStatus] = useState("ONGOING");
  const [assignedTo, setAssignedTo] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDelay, setShowDelay] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayDate, setDelayDate] = useState("");
  const [delayTaskId, setDelayTaskId] = useState<string | null>(null);
  const [delaying, setDelaying] = useState(false);
  const [menuDir, setMenuDir] = useState<"up" | "down">("down");
  const [mobileMenuPosition, setMobileMenuPosition] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight?: number;
  }>({ left: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  const minimumFeedbackDate = new Date();

  const delayingTask = delayTaskId !== null
    ? tasks.find((task) => task.id === delayTaskId)
    : undefined;
  const minimumDelayDate = delayingTask?.feedback_date
    ? getNextDate(delayingTask.feedback_date)
    : new Date();

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })),
    [users]
  );

  const resetTaskForm = useCallback(() => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setFeedbackDate("");
    setTaskStatus("ONGOING");
    setAssignedTo(isAdmin ? "" : currentUserId);
  }, [currentUserId, isAdmin]);

  const closeDelayModal = () => {
    setShowDelay(false);
    setDelayReason("");
    setDelayDate("");
    setDelayTaskId(null);
  };

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) { setUsers([]); return; }
    try {
      setUsersLoading(true);
      const data = await getUsers();
      setUsers(data.users);
    } catch (err) {
      toast.error((err as Error).message || "Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  const fetchTasks = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);
      const data = await getTasks({
        page: targetPage, limit: 10, search, status,
        filter: showOverdue ? "overdue" : "",
        assignedTo: isAdmin && assignedFilter !== "" ? assignedFilter : "",
      });
      setTasks(data?.task || []);
      setMeta(data?.meta || initialMeta);
    } catch (err) {
      toast.error((err as Error).message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [assignedFilter, isAdmin, page, search, showOverdue, status]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => { resetTaskForm(); }, [resetTaskForm]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setSearch(searchInput); }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !mobileMenuRef.current?.contains(target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => { clearAuthSession(); navigate("/login"); };

  const openEditDrawer = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setFeedbackDate(task.feedback_date ? task.feedback_date.slice(0, 10) : "");
    setTaskStatus(task.status);
    setAssignedTo(task.assigned_to ?? "");
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) { toast.error("Title must be at least 3 characters"); return; }
    if (description.trim().length < 3) { toast.error("Description must be at least 3 characters"); return; }
    if (!feedbackDate) { toast.error("Feedback date is required"); return; }
    if (isAdmin && assignedTo === "") { toast.error("Please assign this task to a user"); return; }
    try {
      setCreating(true);
      const payload = {
        title: title.trim(), description: description.trim(),
        feedback_date: feedbackDate, status: taskStatus,
        ...(assignedTo ? { assignedTo } : {}),
      };
      if (editingTask) { await updateTask(editingTask.id, payload); toast.success("Task updated successfully"); }
      else { await createTask(payload); toast.success("Task created successfully"); }
      resetTaskForm();
      setShowCreate(false);
      setPage(1);
      await fetchTasks(1);
      if (isAdmin) await fetchUsers();
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      toast.success("Task completed");
      await fetchTasks();
      if (isAdmin) await fetchUsers();
    } catch (err) { toast.error((err as Error).message || "Something went wrong"); }
  };

  const handleDelayTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayTaskId || !delayReason.trim() || !delayDate) { toast.error("Reason and new date are required"); return; }
    try {
      setDelaying(true);
      await delayTask(delayTaskId, { reason: delayReason.trim(), newDate: delayDate });
      toast.success("Task delayed successfully");
      closeDelayModal();
      await fetchTasks();
      if (isAdmin) await fetchUsers();
    } catch (err) { toast.error((err as Error).message || "Something went wrong"); }
    finally { setDelaying(false); }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully");
      await fetchTasks();
      if (isAdmin) await fetchUsers();
    } catch (err) { toast.error((err as Error).message || "Something went wrong"); }
  };

  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const delayedTasks   = tasks.filter((t) => t.status === "DELAYED").length;
  const overdueTasks   = tasks.filter((t) => t.is_overdue === 1).length;

  const statusBadge = (s: string) => {
    if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
    if (s === "DELAYED")   return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    // ── Full viewport height, flex column, no page scroll ──
    <div className="premium-dashboard relative isolate h-screen flex flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(199,210,254,0.6),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(147,197,253,0.5),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(224,231,255,0.6),transparent_50%)]">
      <DashboardParticles />

      {/* ── HEADER (fixed height) ── */}
      <header className="relative z-10 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Title */}
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 leading-none">FlowTasks / {role} workspace</p>
              <h1 className="text-base sm:text-xl lg:text-2xl font-semibold text-slate-950 leading-tight truncate">
                {isAdmin ? "Admin Task Workspace" : "My Tasks"}
              </h1>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {isAdmin && (
                <button onClick={() => navigate("/register?mode=create-user")}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap">
                  Create User
                </button>
              )}
              {isAdmin && (
                <button onClick={() => navigate("/admin")}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap">
                  Admin Panel
                </button>
              )}
              <button onClick={() => { resetTaskForm(); setShowCreate(true); }}
                className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap">
                + Create Task
              </button>
              <button onClick={handleLogout}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Logout
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden p-2 rounded-lg border border-slate-300 bg-white"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden flex flex-col gap-2 pb-3 pt-2 border-t border-slate-100">
              {isAdmin && (
                <button onClick={() => { navigate("/register?mode=create-user"); setMobileMenuOpen(false); }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 text-left">
                  Create User
                </button>
              )}
              {isAdmin && (
                <button onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 text-left">
                  Admin Panel
                </button>
              )}
              <button onClick={() => { resetTaskForm(); setShowCreate(true); setMobileMenuOpen(false); }}
                className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white text-left">
                + Create Task
              </button>
              <button onClick={handleLogout}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 text-left">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT (flex-1 = takes all remaining height) ── */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="w-full h-full px-3 sm:px-4 lg:px-6 py-3 flex flex-col gap-2">

          {/* ── STATS (shrink-0 = never grows or shrinks) ── */}
          <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Total Tasks",  sub: isAdmin ? "All users" : "Your tasks",      val: meta.total,    color: "text-slate-950"   },
              { label: "Completed",    sub: "Tasks successfully completed",              val: completedTasks, color: "text-emerald-600" },
              { label: "Delayed",      sub: "Revised feedback dates",                   val: delayedTasks,  color: "text-amber-600"   },
              { label: "Overdue",      sub: "Needs attention",                          val: overdueTasks,  color: "text-rose-600"    },
            ].map(({ label, sub, val, color }) => (
              <article key={label} className="rounded-xl border border-white/70 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-400 leading-tight">{label}</p>
                  <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500 truncate">{sub}</p>
                </div>
                <p className={`text-2xl sm:text-3xl font-bold shrink-0 tabular-nums ${color}`}>{val}</p>
              </article>
            ))}
          </div>

          {/* ── FILTERS (shrink-0) ── */}
          <div className="shrink-0 rounded-lg border border-white/70 bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search tasks by title, description, or assignee"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-slate-950"
              />
              <div className="ml-auto flex gap-2 flex-wrap sm:flex-nowrap shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAiAssistant(true)}
                  className="w-full rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 sm:w-auto"
                >
                  AI Assistant
                </button>
                <select
                  value={status}
                  onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-slate-950 w-full sm:w-[130px]"
                >
                  <option value="">All Status</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="DELAYED">Delayed</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                {isAdmin && (
                  usersLoading
                    ? <div className="h-[30px] w-[150px] rounded-lg border border-slate-300 bg-white animate-pulse" />
                    : (
                      <select
                        value={assignedFilter}
                        onChange={(e) => { setPage(1); setAssignedFilter(e.target.value); }}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-slate-950 w-full sm:w-[150px]"
                      >
                        <option value="">All Users</option>
                        {userOptions.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </select>
                    )
                )}

                <button
                  onClick={() => { setPage(1); setShowOverdue((p) => !p); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition w-full sm:w-auto ${
                    showOverdue ? "bg-rose-500 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {showOverdue ? "Overdue Only" : "Show Overdue"}
                </button>
              </div>
            </div>
          </div>

          {/* ── TABLE CARD (flex-1 + overflow-hidden = fills ALL remaining space) ── */}
          <div className="flex-1 overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-sm backdrop-blur flex flex-col min-h-0 max-h-full">

            {/* ── MOBILE CARDS ── */}
            <div className="md:hidden flex-1 overflow-y-auto px-3 py-2">
              {loading ? (
                <p className="py-8 text-center text-xs text-slate-500">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">No tasks found</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {task.is_overdue === 1 && <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />}
                            <Link to={`/tasks/${task.id}`}
                              className="block truncate text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                              {task.title}
                            </Link>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-1">{task.description}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <div>Feedback: {task.feedback_date ? new Date(task.feedback_date).toLocaleDateString() : "-"}</div>
                        <div>Created: {new Date(task.created_at).toLocaleDateString()}</div>
                        {isAdmin && <div className="col-span-2">Assigned: {task.assignee_name || "Unassigned"}</div>}
                      </div>
                      <div className="mt-2 relative" ref={openMenuId === task.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const direction = window.innerHeight - rect.bottom < 160 ? "up" : "down";
                            setMenuDir(direction);
                            const availableHeight = direction === "up"
                              ? rect.top - 8
                              : window.innerHeight - rect.bottom - 8;
                            setMobileMenuPosition({
                              left: Math.min(rect.left, window.innerWidth - 164),
                              maxHeight: Math.max(0, availableHeight),
                              ...(direction === "up"
                                ? { bottom: window.innerHeight - rect.top + 4 }
                                : { top: rect.bottom + 4 }),
                            });
                            setOpenMenuId((p) => (p === task.id ? null : task.id));
                          }}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Actions ▾
                        </button>
                        {openMenuId === task.id && (
                          createPortal(
                            <div
                              ref={mobileMenuRef}
                              style={{
                                left: mobileMenuPosition.left,
                                top: mobileMenuPosition.top,
                                bottom: mobileMenuPosition.bottom,
                                maxHeight: mobileMenuPosition.maxHeight,
                              }}
                              className="fixed z-[100] w-40 touch-pan-y overscroll-y-contain overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg [-webkit-overflow-scrolling:touch]"
                            >
                              {task.status !== "COMPLETED" && (
                                <button onClick={() => { handleCompleteTask(task.id); setOpenMenuId(null); }}
                                  className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-emerald-700 hover:bg-slate-50">Mark Complete</button>
                              )}
                              <button onClick={() => { openEditDrawer(task); setOpenMenuId(null); }}
                                className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50">Edit Task</button>
                              <button onClick={() => {
                                if (task.status === "COMPLETED") { toast.error("Cannot delay a completed task"); return; }
                                setDelayTaskId(task.id); setShowDelay(true); setOpenMenuId(null);
                              }} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-amber-700 hover:bg-slate-50">Delay Task</button>
                              <button onClick={() => { handleDeleteTask(task.id); setOpenMenuId(null); }}
                                className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-slate-50">Delete Task</button>
                            </div>,
                            document.body
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable table body */}
              <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full min-w-[700px] text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 text-xs text-slate-600">
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[20%]">Title</th>
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[20%]">Description</th>
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[11%]">Status</th>
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[11%]">Feedback</th>
                      {isAdmin && <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[14%]">Assigned To</th>}
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[11%]">Created</th>
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[9%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-xs text-slate-500">Loading tasks...</td></tr>
                    ) : tasks.length === 0 ? (
                      <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-xs text-slate-500">No tasks found</td></tr>
                    ) : (
                      tasks.map((task) => (
                        <tr key={task.id} className="border-b border-slate-100 align-middle even:bg-slate-50/50 hover:bg-slate-100/70 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              {task.is_overdue === 1 && <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />}
                              <Link to={`/tasks/${task.id}`}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate block">
                                {task.title}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 max-w-0">
                            <p className="truncate">{task.description}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${statusBadge(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                            {task.feedback_date ? new Date(task.feedback_date).toLocaleDateString() : "-"}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-2.5 text-xs text-slate-600 max-w-0">
                              <p className="truncate">{task.assignee_name || "Unassigned"}</p>
                            </td>
                          )}
                          <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(task.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="relative" ref={openMenuId === task.id ? menuRef : null}>
                              <button
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuDir(window.innerHeight - rect.bottom < 160 ? "up" : "down");
                                  setOpenMenuId((p) => (p === task.id ? null : task.id));
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                              >
                                Actions ▾
                              </button>
                              {openMenuId === task.id && (
                                <div className={`absolute right-0 z-50 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${menuDir === "up" ? "bottom-full mb-1" : "top-full mt-1"}`}>
                                  {task.status !== "COMPLETED" && (
                                    <button onClick={() => { handleCompleteTask(task.id); setOpenMenuId(null); }}
                                      className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-emerald-700 hover:bg-slate-50">Mark Complete</button>
                                  )}
                                  <button onClick={() => { openEditDrawer(task); setOpenMenuId(null); }}
                                    className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50">Edit Task</button>
                                  <button onClick={() => {
                                    if (task.status === "COMPLETED") { toast.error("Cannot delay a completed task"); return; }
                                    setDelayTaskId(task.id); setShowDelay(true); setOpenMenuId(null);
                                  }} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-amber-700 hover:bg-slate-50">Delay Task</button>
                                  <button onClick={() => { handleDeleteTask(task.id); setOpenMenuId(null); }}
                                    className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-slate-50">Delete Task</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {!loading && tasks.length < 10 &&
                      Array.from({ length: 10 - tasks.length }).map((_, i) => (
                        <tr key={`filler-${i}`} className="border-b border-slate-100">
                          <td className="px-4 py-[18.5px]" colSpan={isAdmin ? 7 : 6}>&nbsp;</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── PAGINATION (always at bottom of card) ── */}
            <div className="shrink-0 flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 bg-white/60">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
          {/* end table card */}

        </div>
      </main>

      {/* ── CREATE / EDIT DRAWER ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex overflow-hidden bg-black/20 backdrop-blur-[2px]">
          <div className="flex-1" onClick={() => { setShowCreate(false); resetTaskForm(); }} />
          <aside className="h-dvh max-h-dvh min-h-0 min-w-0 w-full max-w-xl shrink-0 touch-pan-y overscroll-y-contain overflow-y-auto bg-white p-5 sm:p-8 shadow-2xl [-webkit-overflow-scrolling:touch]">
            <h2 className="mb-1 text-xl sm:text-2xl font-semibold text-slate-950">
              {editingTask ? "Update Task" : "Create New Task"}
            </h2>
            <p className="mb-5 text-xs sm:text-sm text-slate-500">
              {isAdmin ? "Create and assign tasks, or update status and ownership."
                       : "Manage your task details, feedback date, and completion status."}
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Feedback Date</label>
                  <DatePicker
                    selected={feedbackDate ? getDateValue(feedbackDate) : null}
                    onChange={(date: Date | null) => setFeedbackDate(date ? formatDateValue(date) : "")}
                    minDate={minimumFeedbackDate}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select feedback date"
                    popperPlacement="top-start"
                    portalId="root"
                    wrapperClassName="block w-full"
                    className="date-input w-full min-w-0 max-w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950">
                    <option value="ONGOING">Ongoing</option>
                    <option value="DELAYED">Delayed</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Assign To</label>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950">
                    <option value="">Select a user</option>
                    {userOptions.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); resetTaskForm(); }}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
                  {creating ? (editingTask ? "Updating..." : "Creating...") : (editingTask ? "Update Task" : "Create Task")}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* ── DELAY MODAL ── */}
      {showDelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-[2px]">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md touch-pan-y overscroll-y-contain overflow-y-auto rounded-3xl bg-white p-5 sm:max-h-none sm:p-6 shadow-xl [-webkit-overflow-scrolling:touch]">
            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-slate-950">Delay Task</h2>
            <form onSubmit={handleDelayTask} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
                <textarea rows={4} value={delayReason} onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">New Date</label>
                <DatePicker
                  selected={delayDate ? getDateValue(delayDate) : null}
                  onChange={(date: Date | null) => setDelayDate(date ? formatDateValue(date) : "")}
                  minDate={minimumDelayDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select new date"
                  popperPlacement="top-start"
                  portalId="root"
                  wrapperClassName="block w-full"
                  className="date-input w-full min-w-0 max-w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeDelayModal}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={delaying}
                  className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
                  {delaying ? "Saving..." : "Delay Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAiAssistant && <AiAssistantModal onClose={() => setShowAiAssistant(false)} />}
    </div>
  );
};

export default Dashboard;