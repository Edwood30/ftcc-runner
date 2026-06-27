import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardPage } from "../components/pages/DashboardPage";
import { LandingPage, RgMedPage } from "../components/pages/LandingPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/system" element={<DashboardPage />} />
      <Route path="/rg-med" element={<RgMedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
