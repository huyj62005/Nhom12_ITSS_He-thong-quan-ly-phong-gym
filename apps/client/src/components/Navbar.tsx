import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3000";

type ApiNotification = {
  id?: number | string;
  title?: string;
  message?: string;
  content?: string;
  type?: string;
  targetRoute?: string;
  target_route?: string;
  relatedEntityId?: number | string;
  related_entity_id?: number | string;
  isRead?: boolean;
  is_read?: boolean;
  createdAt?: string;
  created_at?: string;
};

type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  targetRoute: string;
  relatedEntityId: string;
  isRead: boolean;
  createdAt: string;
};

const requestJson = async <T,>(
  path: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Request failed with ${response.status}`);
  }

  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
};

const mapNotification = (notification: ApiNotification): AppNotification => ({
  id: String(notification.id ?? ""),
  title: notification.title ?? "Thông báo",
  message: notification.message ?? notification.content ?? "",
  type: notification.type ?? "",
  targetRoute: notification.targetRoute ?? notification.target_route ?? "/",
  relatedEntityId: String(
    notification.relatedEntityId ?? notification.related_entity_id ?? "",
  ),
  isRead: notification.isRead ?? notification.is_read ?? false,
  createdAt:
    notification.createdAt ?? notification.created_at ?? new Date().toISOString(),
});

const formatNotificationTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveNotificationRoute = (notification: AppNotification) => {
  if (
    notification.type === "feedback" ||
    notification.type === "new_feedback" ||
    notification.type === "feedback_created" ||
    notification.type === "feedback_replied"
  ) {
    return "/feedback";
  }

  return notification.targetRoute || "/";
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    let isMounted = true;
    requestJson<unknown>(`/notifications/my?userId=${user.id}`)
      .then((apiNotifications) => {
        if (!isMounted) return;
        setNotifications(
          Array.isArray(apiNotifications)
            ? apiNotifications.map(mapNotification)
            : [],
        );
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) setNotifications([]);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isNotificationsOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    setIsNotificationsOpen(false);

    if (!notification.isRead && user?.id) {
      requestJson(`/notifications/${notification.id}/read?userId=${user.id}`, {
        method: "PATCH",
      }).catch((error) => console.error(error));
    }

    navigate(resolveNotificationRoute(notification));
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Thông báo"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Thông báo</p>
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium text-red-600">
                      {unreadCount} chưa đọc
                    </span>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có thông báo mới
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                          notification.isRead ? "bg-white" : "bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                              notification.isRead
                                ? "bg-gray-300"
                                : "bg-red-500"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="font-medium text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
