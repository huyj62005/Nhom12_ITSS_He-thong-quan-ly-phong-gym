import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { Login } from "../pages/Login";
import { Members } from "../pages/Members";
import { Packages } from "../pages/Packages";
import { Payments } from "../pages/Payments";
import { Schedules } from "../pages/Schedules";
import { Trainers } from "../pages/Trainers";
import { EquipmentPage } from "../pages/Equipment";
import { FeedbackPage } from "../pages/Feedback";
import { Reports } from "../pages/Reports";
import { Progress } from "../pages/Progress";
import { Unauthorized } from "../pages/Unauthorized";
import { useAuth } from "../contexts/AuthContext";

const DefaultRedirect = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const defaultRoute =
    user?.role === "member"
      ? "/packages"
      : user?.role === "trainer"
        ? "/schedules"
        : "/reports";

  return <Navigate to={defaultRoute} replace />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultRedirect />,
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
    path: "/members",
    element: (
      <ProtectedRoute allowedRoles={["owner", "manager"]}>
        <Members />
      </ProtectedRoute>
    ),
  },
  {
    path: "/packages",
    element: (
      <ProtectedRoute allowedRoles={["owner", "manager", "member"]}>
        <Packages />
      </ProtectedRoute>
    ),
  },
  {
    path: "/payments",
    element: (
      <ProtectedRoute allowedRoles={["owner", "manager"]}>
        <Payments />
      </ProtectedRoute>
    ),
  },
  {
    path: "/schedules",
    element: (
      <ProtectedRoute
        allowedRoles={["owner", "manager", "trainer", "member"]}
      >
        <Schedules />
      </ProtectedRoute>
    ),
  },
  {
    path: "/trainers",
    element: (
      <ProtectedRoute allowedRoles={["owner", "manager"]}>
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
      <ProtectedRoute allowedRoles={["owner", "manager"]}>
        <EquipmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/feedback",
    element: (
      <ProtectedRoute allowedRoles={["owner", "manager", "member"]}>
        <FeedbackPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute allowedRoles={["owner", "manager"]}>
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <DefaultRedirect />,
  },
]);
