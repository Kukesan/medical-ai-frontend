import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  Brain,
  ClipboardList,
  Clock,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  PlusCircle,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { cn } from "../lib/cn";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: Home },
      { to: "/timeline", label: "Timeline", icon: Clock },
    ],
  },
  {
    label: "Analysis",
    items: [{ to: "/analyze", label: "Analysis", icon: Brain }],
  },
  {
    label: "Records",
    items: [
      { to: "/document", label: "Upload Documents", icon: FileText },
      { to: "/record-intake", label: "Add Record", icon: PlusCircle },
      { to: "/medical-records", label: "Medical Records", icon: ClipboardList },
      // { to: "/allergy", label: "Allergies", icon: Shield },
      // { to: "/vaccination", label: "Vaccinations", icon: Syringe },
      // { to: "/surgery", label: "Surgeries", icon: Stethoscope },
    ],
  },
  {
    label: "Assistant",
    items: [
      { to: "/chat", label: "Chat", icon: MessageCircle },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
];

// const pageTitles: Array<[string, string]> = [
//   ["/dashboard", "Dashboard"],
//   ["/timeline", "Timeline"],
//   ["/record-intake", "Add Record"],
//   ["/document", "Documents"],
//   ["/medical-records", "Medical Records"],
//   ["/analyze", "Analysis"],
//   ["/allergy", "Allergies"],
//   ["/vaccination", "Vaccinations"],
//   ["/surgery", "Surgeries"],
//   ["/chat", "Chat"],
//   ["/profile", "Profile"],
// ];

const logoutButtonClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white";

function Logo({ inverted }: { inverted?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg",
        inverted ? "bg-white/10 ring-1 ring-inset ring-white/15" : "bg-primary-600",
      )}
    >
      <Activity className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
    </div>
  );
}

function Brand({ inverted }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo inverted={inverted} />
      <p
        className={cn(
          "text-xs font-bold uppercase tracking-wider",
          inverted ? "text-white" : "text-primary-600",
        )}
      >
        Medical AI
      </p>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_var(--color-primary-300)]"
        : "text-white/70 hover:bg-white/5 hover:text-white",
    );

  return (
    <nav className="mt-8 flex flex-col gap-6" aria-label="Primary">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            {group.label}
          </p>
          <div className="grid gap-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navClass}
                onClick={onNavigate}
              >
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-primary-900 px-4 py-5 md:flex">
        <div className="px-1">
          <Brand inverted />
          {/* <p className="text-sm font-semibold text-gray-900">Clinical Operations Portal</p> */}
        </div>

        <NavList />

        <div className="mt-auto border-t border-white/10 pt-4">
          <button type="button" className={logoutButtonClass} onClick={logout}>
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px]"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[80vw] animate-fade-in flex-col overflow-y-auto bg-primary-900 px-4 py-5 shadow-pop">
            <div className="flex items-center justify-between gap-3 px-1">
              <Brand inverted />
              {/* <p className="text-sm font-semibold text-gray-900">
                Yarlit Portal
              </p> */}
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <NavList onNavigate={() => setIsMobileNavOpen(false)} />

            <div className="mt-auto border-t border-white/10 pt-4">
              <button type="button" className={logoutButtonClass} onClick={logout}>
                <LogOut className="h-4 w-4" strokeWidth={2} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Open menu"
                className="-ml-2 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
                onClick={() => setIsMobileNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="md:hidden">
                <Brand />
              </div>
              {/* <p className="font-display text-gray-900">Hi, {user?.full_name || "User"}</p> */}
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-gray-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[12rem] truncate sm:inline">{user.full_name}</span>
                </div>
              ) : null}
              <button
                type="button"
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
                onClick={logout}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
