import { RouterProvider } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { GymDataProvider } from "./contexts/GymDataContext";
import { router } from "./routes/routes";

export default function App() {
  return (
    <AuthProvider>
      <GymDataProvider>
        <RouterProvider router={router} />
      </GymDataProvider>
    </AuthProvider>
  );
}
