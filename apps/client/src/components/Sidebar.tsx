import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGymData } from "../contexts/GymDataContext";
import {
  Users,
  Package,
  CreditCard,
  Calendar,
  Dumbbell,
  TrendingUp,
  MessageSquare,
  ClipboardList,
  Building2,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    path: "/members",
    label: "Quản Lý Hội Viên",
    icon: <Users size={20} />,
    roles: ["owner", "manager"],
  },
  {
    path: "/packages",
    label: "Gói Tập",
    icon: <Package size={20} />,
    roles: ["owner", "manager", "member"],
  },
  {
    path: "/payments",
    label: "Thanh Toán",
    icon: <CreditCard size={20} />,
    roles: ["owner", "manager"],
  },
  {
    path: "/schedules",
    label: "Lịch Tập",
    icon: <Calendar size={20} />,
    roles: ["owner", "manager", "trainer", "member"],
  },
  {
    path: "/trainers",
    label: "Quản Lý Nhân Sự",
    icon: <Users size={20} />,
    roles: ["owner", "manager"],
  },
  {
    path: "/gym-rooms",
    label: "Quản lý phòng tập",
    icon: <Building2 size={20} />,
    roles: ["owner", "manager"],
  },
  {
    path: "/progress",
    label: "Tiến Độ Tập",
    icon: <TrendingUp size={20} />,
    roles: ["trainer", "member"],
  },
  {
    path: "/equipment",
    label: "Thiết Bị",
    icon: <ClipboardList size={20} />,
    roles: ["owner", "manager"],
  },
  {
    path: "/feedback",
    label: "Phản Hồi",
    icon: <MessageSquare size={20} />,
    roles: ["owner", "manager", "member"],
  },
  {
    path: "/reports",
    label: "Báo Cáo",
    icon: <TrendingUp size={20} />,
    roles: ["owner", "manager"],
  },
];

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "trainer":
      return "PT/HLV";
    case "member":
      return "Hội viên";
    default:
      return role ?? "";
  }
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { members } = useGymData();
  const currentMember = user
    ? members.find(
        (member) =>
          member.userId === user.id ||
          (!member.userId && member.email === user.email),
      )
    : undefined;
  const memberHasActivePtPackage =
    currentMember?.hasActivePtPackage === true &&
    Boolean(currentMember.trainerId);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles.includes(user?.role || "")) {
      return false;
    }

    if (user?.role === "member" && item.path === "/progress") {
      return Boolean(memberHasActivePtPackage);
    }

    return true;
  });

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-blue-600" size={32} />
          <div>
            <h1 className="font-bold text-xl">GYM Manager</h1>
            <p className="text-sm text-gray-500">Pro Fitness</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-2">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
