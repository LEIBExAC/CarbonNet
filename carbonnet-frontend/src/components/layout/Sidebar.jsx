import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Activity,
  BarChart3,
  Award,
  TrendingUp,
  FileText,
  Users,
  LogOut,
  Shield,
  Database,
  Settings,
} from "lucide-react";
import { Leaf } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/dashboard",
      admin: false,
    },
    {
      id: "activities",
      label: "Activities",
      icon: Activity,
      path: "/activities",
      admin: false,
    },
    {
      id: "statistics",
      label: "Statistics",
      icon: BarChart3,
      path: "/statistics",
      admin: false,
    },
    {
      id: "challenges",
      label: "Challenges",
      icon: Award,
      path: "/challenges",
      admin: false,
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: TrendingUp,
      path: "/leaderboard",
      admin: false,
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
      path: "/reports",
      admin: false,
    },
    {
      id: "profile",
      label: "Profile",
      icon: Users,
      path: "/profile",
      admin: false,
    },
    ...(isAdmin
      ? [
          {
            id: "admin-users",
            label: "Manage user",
            icon: Shield,
            path: "/admin/users",
            admin: true,
          },
          {
            id: "admin-institutions",
            label: "Institutions",
            icon: Settings,
            path: "/admin/institutions",
            admin: true,
          },
          {
            id: "admin-challenges",
            label: "Challenge Manage",
            icon: Award,
            path: "/admin/challenges",
            admin: true,
          },
          {
            id: "admin-factors",
            label: "Emission Factors",
            icon: Database,
            path: "/admin/factors",
            admin: true,
          },
          {
            id: "admin-analytics",
            label: "Analytics",
            icon: BarChart3,
            path: "/admin/analytics",
            admin: true,
          },
        ]
      : []),
  ];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-linear-to-b shadow-2xl from-emerald-900 to-emerald-800 text-white z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col`}
      >
        <div className="flex-1 overflow-y-auto p-4 py-6">
          <div className="flex items-center gap-2 mb-8">
            <Leaf size={32} />
            <h1 className="text-2xl font-bold">CarbonNet</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  location.pathname === item.path
                    ? "bg-emerald-700 shadow-lg"
                    : "hover:bg-emerald-800"
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-all mt-8"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-semibold">
              {(user?.name || "").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-sm text-emerald-300 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
