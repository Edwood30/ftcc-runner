import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes";
import "./app.css";

const themeKey = "ftcc-theme";
const themeModeKey = "ftcc-theme-mode";
const storedTheme = window.localStorage.getItem(themeKey);
const storedThemeMode = window.localStorage.getItem(themeModeKey);
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const shouldUseDark = storedThemeMode === "manual" && storedTheme ? storedTheme === "dark" : prefersDark;

document.documentElement.classList.toggle("dark", shouldUseDark);
document.documentElement.style.colorScheme = shouldUseDark ? "dark" : "light";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>,
);
