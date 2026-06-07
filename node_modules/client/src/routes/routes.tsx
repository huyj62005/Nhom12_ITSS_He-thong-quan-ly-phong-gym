import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Members } from "../pages/Members";
import { Packages } from "../pages/Packages";
import { Payments } from "../pages/Payments";
import { Schedules } from "../pages/Schedules";
import { Trainers } from "../pages/Trainers";
import { EquipmentPage } from "../pages/Equipment";
import { FeedbackPage } from "../pages/Feedback";
import { Reports } from "../pages/Reports";
import { Progress } from "../pages/Progress";
import { Settings } from "../pages/Settings";
import { Unauthorized } from "../pages/Unauthorized";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/members",
    element: (
      <ProtectedRoute allowedRoles={["admin", "manager"]}>
        <Members />
      </ProtectedRoute>
    ),
  },
  {
    path: "/packages",
    element: (
      <ProtectedRoute allowedRoles={["admin", "manager"]}>
        <Packages />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payments",
    element: (
      <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
        <Payments />
      </ProtectedRoute>
    ),
  },
  {
    path: "/schedules",
    element: (
      <ProtectedRoute allowedRoles={["admin", "manager", "trainer", "member"]}>
        <Schedules />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainers",
    element: (
      <ProtectedRoute allowedRoles={["admin", "manager"]}>
        <Trainers />
      </ProtectedRoute>
    ),
  },
  {
    path: "/progress",
    element: (
      <ProtectedRoute allowedRoles={["trainer", "member"]}>
        <Progress />
      </ProtectedRoute>
    ),
  },
  {
    path: "/equipment",
    element: (
      <ProtectedRoute allowedRoles={["admin", "manager"]}>
        <EquipmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/feedback",
    element: (
      <ProtectedRoute allowedRoles={["admin", "manager", "member"]}>
        <FeedbackPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute allowedRoles={["admin", "manager"]}>
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);
