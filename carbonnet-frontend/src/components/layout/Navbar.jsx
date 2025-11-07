import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  Award,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.getAll({ limit: 10 });
      const items = res.data.notifications || [];
      setNotifications(
        items.map((n) => ({
          id: n._id,
          type: n.type || "info",
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleString(),
          read: n.read,
        }))
      );
      setUnreadCount(res.data.unreadCount || 0);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState && notifications.length === 0) {
      loadNotifications();
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(res.data.unreadCount);
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(res.data.unreadCount);
    } catch (_) {}
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} className="text-emerald-600" />;
      case "warning":
        return <AlertCircle size={20} className="text-amber-600" />;
      case "info":
        return <Info size={20} className="text-blue-600" />;
      default:
        return <Info size={20} className="text-gray-600" />;
    }
  };

  return (
    <nav className="bg-white shadow-md px-4 py-3 flex items-center justify-between lg:ml-64">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search activities, challenges..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading && (
                  <div className="p-6 text-center text-gray-500">
                    Loading...
                  </div>
                )}
                {!loading && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() =>
                        !notification.read && handleMarkRead(notification.id)
                      }
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? "bg-emerald-50" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : !loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell size={48} className="mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : null}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 flex justify-between items-center">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Mark All Read
                  </button>
                  <button
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    onClick={() => (window.location.href = "/notifications")}
                  >
                    View All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
          <Award size={18} />
          <span className="font-semibold">{user?.totalPoints || 0} pts</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
