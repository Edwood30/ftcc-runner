import { Navigate, Route, Routes } from "react-router-dom";
import { BranchPage } from "../components/pages/BranchPage";
import { DashboardPage } from "../components/pages/DashboardPage";
import { HistoryPage } from "../components/pages/HistoryPage";
import { LandingPage } from "../components/pages/LandingPage";
import { RgMedSystemPage } from "../components/pages/RgMedSystemPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/system" element={<DashboardPage />} />
      <Route path="/branches" element={<BranchPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/rg-med" element={<RgMedSystemPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
