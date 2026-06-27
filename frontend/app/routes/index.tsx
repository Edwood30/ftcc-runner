import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../components/pages/DashboardPage";
import { LandingPage } from "../components/pages/LandingPage";
import { RgMedSystemPage } from "../components/pages/RgMedSystemPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/system" element={<DashboardPage />} />
      <Route path="/rg-med" element={<RgMedSystemPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
