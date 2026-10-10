import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Register from "./pages/Register";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import CreateTask from "./pages/CreateTask";
import TaskDetails from "./pages/TaskDetails";
import AdminDashboard from "./pages/AdminDashboard";
const hasToken = () => Boolean(localStorage.getItem("token"));

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={hasToken() ? "/dashboard" : "/login"} replace />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={hasToken() ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/createtask"
        element={hasToken() ? <CreateTask /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/tasks/:id"
        element={hasToken() ? <TaskDetails /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/admin" element={hasToken() ? <AdminDashboard />: <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
