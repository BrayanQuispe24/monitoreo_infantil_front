import { createBrowserRouter, Navigate } from "react-router";
import LoginPage from "../features/auth/pages/LoginPage";
import AdminLayout from "../layouts/AdminLayout";
import DashboardPage from "../features/Dashboard/pages/DashboardPage";
import DaycaresPage from "../features/daycares/pages/DaycaresPage";
import SigAreaPage from "../features/sig-area/pages/SigAreaPage";
import ChildrenPage from "../features/children/pages/ChildrenPage";
import GuardiansPage from "../features/guardians/pages/GuardiansPage";
import TrackersPage from "../features/trackers/pages/TrackersPage";
import MonitoringPage from "../features/monitoring/pages/MonitoringPage";
import AlertsPage from "../features/alerts/pages/AlertsPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import UsersPage from "../features/users/pages/UsersPage";
import SettingsPage from "../features/settings/pages/SettingsPage";
import NotFoundAdminPage from "../features/not-found/pages/NotFoundAdminPage";


export const Router = createBrowserRouter([
    {
        path: "/",
        element: <LoginPage />
    },
    {
        path: "/admin",
        element: <AdminLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/admin/dashboard" replace />
            },
            {
                path: "dashboard",
                element: <DashboardPage />,
            },
            {
                path: "guarderias",
                element: <DaycaresPage />,
            },
            {
                path: "area-sig",
                element: <SigAreaPage />,
            },
            {
                path: "ninos",
                element: <ChildrenPage />,
            },
            {
                path: "tutores",
                element: <GuardiansPage />,
            },
            {
                path: "rastreadores",
                element: <TrackersPage />,
            },
            {
                path: "monitoreo",
                element: <MonitoringPage />,
            },
            {
                path: "alertas",
                element: <AlertsPage />,
            },
            {
                path: "reportes",
                element: <ReportsPage />,
            },
            {
                path: "usuarios",
                element: <UsersPage />,
            },
            {
                path: "configuracion",
                element: <SettingsPage />,
            },
            {
                path: "*",
                element: <NotFoundAdminPage />,
            },
        ]
    }

])
