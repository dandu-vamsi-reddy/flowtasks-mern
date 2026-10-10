import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createManagedUser, getStoredRole, isAdminRole, registerUser } from "../api/api";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = getStoredRole();

  const isCreateUserMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("mode") === "create-user";
  }, [location.search]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCreateUserMode && !isAdminRole()) {
      navigate("/login", { replace: true });
    }
  }, [isCreateUserMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("All fields are required");
      return;
    }

    if (form.name.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      toast.error("Enter a valid email");
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      if (isCreateUserMode) {
        const response = await createManagedUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: "USER",
        });

        toast.success(response?.message || "User created successfully");
        navigate("/dashboard");
      } else {
        const response = await registerUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });

        toast.success(response?.message || "Registration successful");
        navigate("/login");
      }

      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      toast.error((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:grid lg:grid-cols-2">
      <section className="hidden bg-black px-16 text-white lg:flex lg:flex-col lg:justify-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-gray-400">
          {isCreateUserMode ? "Admin Workspace" : "FlowTasks"}
        </p>
        <h1 className="mb-6 text-5xl font-semibold leading-tight">
          {isCreateUserMode ? "Create a user from the admin console." : "Create your FlowTasks account."}
        </h1>
        <p className="max-w-lg text-lg leading-8 text-gray-300">
          {isCreateUserMode
            ? `Signed in as ${currentRole ?? "ADMIN"}. New users will use the same login page after creation.`
            : "Start managing tasks, delays, and completion status from one clean workspace."}
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.25em] text-gray-400">
            {isCreateUserMode ? "Create user" : "Register"}
          </p>
          <h2 className="mb-2 text-3xl font-semibold text-gray-900">
            {isCreateUserMode ? "Add a new user" : "Create account"}
          </h2>
          <p className="mb-8 text-sm text-gray-500">
            {isCreateUserMode
              ? "This user will sign in with the same login form as everyone else."
              : "Create an account to access your personal task dashboard."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(isCreateUserMode ? "/dashboard" : "/login")}
                className="flex-1 rounded-xl border border-gray-300 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-black py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : isCreateUserMode ? "Create User" : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Register;
