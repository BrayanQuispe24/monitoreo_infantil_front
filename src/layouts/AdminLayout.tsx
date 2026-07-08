import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MonitorDot,
  QrCode,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  X,
  Loader2
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../features/auth/hooks/useAuth";

export type UserRole = "ADMIN" | "DAYCARE_MANAGER" | "OPERATOR" | "MONITOR";

type MenuItem = {
  label: string;
  path: string;
  icon: ReactNode;
  roles: UserRole[];
  badge?: string;
};


const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <LayoutDashboard size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER", "OPERATOR", "MONITOR"],
  },
  {
    label: "Guarderías",
    path: "/admin/guarderias",
    icon: <Building2 size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER"],
  },
  {
    label: "Área SIG",
    path: "/admin/area-sig",
    icon: <Map size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER"],
  },
  {
    label: "Niños",
    path: "/admin/ninos",
    icon: <UserRoundCheck size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER", "OPERATOR"],
  },
  {
    label: "Tutores",
    path: "/admin/tutores",
    icon: <UsersRound size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER", "OPERATOR"],
  },
  {
    label: "Rastreadores / QR",
    path: "/admin/rastreadores",
    icon: <QrCode size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER", "OPERATOR"],
  },
  {
    label: "Monitoreo",
    path: "/admin/monitoreo",
    icon: <MonitorDot size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER", "OPERATOR", "MONITOR"],
    badge: "Live",
  },
  {
    label: "Alertas",
    path: "/admin/alertas",
    icon: <AlertTriangle size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER", "OPERATOR", "MONITOR"],
    badge: "4",
  },
  {
    label: "Reportes",
    path: "/admin/reportes",
    icon: <BarChart3 size={20} />,
    roles: ["ADMIN", "DAYCARE_MANAGER", "OPERATOR"],
  },
  {
    label: "Usuarios y roles",
    path: "/admin/usuarios",
    icon: <CircleUserRound size={20} />,
    roles: ["ADMIN"],
  },
  {
    label: "Configuración",
    path: "/admin/configuracion",
    icon: <Settings size={20} />,
    roles: ["ADMIN"],
  },
];

function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    ADMIN: "Administrador",
    DAYCARE_MANAGER: "Encargado de guardería",
    OPERATOR: "Operador",
    MONITOR: "Monitor",
  };

  return labels[role];
}

function getPageTitle(pathname: string) {
  const activeItem = menuItems.find((item) => pathname.startsWith(item.path));
  return activeItem?.label ?? "Panel administrativo";
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // If not logged in, redirect to login page
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const userRole = (user?.role || "MONITOR") as UserRole;

  const visibleMenuItems = useMemo(() => {
    return menuItems.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const isPathAllowed = useMemo(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/dashboard") {
      return true;
    }
    const menuItem = menuItems.find(item => location.pathname.startsWith(item.path));
    if (!menuItem) return true; // fallback for non-menu subroutes
    return menuItem.roles.includes(userRole);
  }, [location.pathname, userRole]);

  const pageTitle = getPageTitle(location.pathname);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!isPathAllowed) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Acceso no autorizado</h2>
          <p className="text-xs font-semibold text-slate-500 leading-relaxed">
            Tu rol como <strong className="text-slate-800">{getRoleLabel(userRole)}</strong> no cuenta con los permisos necesarios para acceder a esta sección.
          </p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            Ir al Dashboard
          </button>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-slate-950 text-white shadow-2xl transition-all duration-300 ${collapsed ? "lg:w-24" : "lg:w-72"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } w-72`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20">
              <ShieldCheck size={25} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-sm font-black leading-5">
                  Sistema SIG
                </h1>
                <p className="truncate text-xs font-medium text-cyan-100/70">
                  Monitoreo Infantil
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div
            className={`mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 ${collapsed ? "hidden lg:block lg:p-3" : ""
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-100">
                <CircleUserRound size={22} />
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {user.username}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {getRoleLabel(userRole)}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="mt-3 rounded-xl bg-slate-900/80 px-3 py-2">
                <p className="truncate text-xs text-slate-400">
                  {user.daycare_id ? `ID Guardería: ${user.daycare_id.slice(0, 8)}...` : "Sistema General"}
                </p>
              </div>
            )}
          </div>

          <nav className="space-y-1.5">
            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${isActive
                    ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                  } ${collapsed ? "lg:justify-center lg:px-3" : ""}`
                }
              >
                <span className="shrink-0">{item.icon}</span>

                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>

                    {item.badge && (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-black text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={logout}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-100 ${collapsed ? "lg:justify-center lg:px-3" : ""
              }`}
          >
            <LogOut size={20} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <section
        className={`min-h-screen transition-all duration-300 ${collapsed ? "lg:pl-24" : "lg:pl-72"
          }`}
      >
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu size={21} />
              </button>

              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="hidden rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-slate-50 lg:inline-flex"
                aria-label="Contraer sidebar"
              >
                {collapsed ? <ChevronRight size={21} /> : <ChevronLeft size={21} />}
              </button>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">
                  Panel administrativo
                </p>
                <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                  {pageTitle}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* <button
                type="button"
                className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-slate-50"
                aria-label="Notificaciones"
              >
                <Bell size={21} />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                  4
                </span>
              </button> */}

              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <CircleUserRound size={22} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{user.username}</p>
                  <p className="truncate text-xs font-medium text-slate-500">
                    {getRoleLabel(userRole)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </section>
    </main>
  );
}