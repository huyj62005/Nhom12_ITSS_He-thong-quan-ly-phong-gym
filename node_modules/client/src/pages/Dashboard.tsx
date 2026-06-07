import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  Activity,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { mockStats, mockRevenueData } from "../data/mockData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      {trend && (
        <span className="text-sm text-green-600 font-medium">{trend}</span>
      )}
    </div>
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Chào mừng trở lại, {user?.name}!</p>
        </div>

        {(user?.role === "admin" || user?.role === "manager") && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Tổng Hội Viên"
                value={mockStats.totalMembers}
                icon={<Users className="text-blue-600" size={24} />}
                color="bg-blue-50"
              />
              <StatCard
                title="Hội Viên Hoạt Động"
                value={mockStats.activeMembers}
                icon={<UserCheck className="text-green-600" size={24} />}
                trend="+12%"
                color="bg-green-50"
              />
              <StatCard
                title="Hội Viên Mới Tháng Này"
                value={mockStats.newMembersThisMonth}
                icon={<UserPlus className="text-purple-600" size={24} />}
                trend="+8%"
                color="bg-purple-50"
              />
              <StatCard
                title="Doanh Thu Tháng Này"
                value={formatCurrency(mockStats.revenueThisMonth)}
                icon={<DollarSign className="text-orange-600" size={24} />}
                color="bg-orange-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <StatCard
                title="Lịch Tập Hôm Nay"
                value={mockStats.scheduledSessions}
                icon={<Calendar className="text-indigo-600" size={24} />}
                color="bg-indigo-50"
              />
              <StatCard
                title="Thanh Toán Chờ Xử Lý"
                value={mockStats.pendingPayments}
                icon={<AlertCircle className="text-red-600" size={24} />}
                color="bg-red-50"
              />
              <StatCard
                title="Thiết Bị Bảo Trì"
                value={mockStats.equipmentMaintenance}
                icon={<Activity className="text-yellow-600" size={24} />}
                color="bg-yellow-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Doanh Thu Theo Tháng
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Xu Hướng Hội Viên
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="members"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {user?.role === "cashier" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Thanh Toán Hôm Nay</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Thanh Toán Chờ Xử Lý"
                value={mockStats.pendingPayments}
                icon={<AlertCircle className="text-orange-600" size={24} />}
                color="bg-orange-50"
              />
              <StatCard
                title="Tổng Thu Hôm Nay"
                value={formatCurrency(15500000)}
                icon={<DollarSign className="text-green-600" size={24} />}
                color="bg-green-50"
              />
              <StatCard
                title="Giao Dịch Hôm Nay"
                value={12}
                icon={<TrendingUp className="text-blue-600" size={24} />}
                color="bg-blue-50"
              />
            </div>
          </div>
        )}

        {user?.role === "trainer" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Lịch Huấn Luyện Hôm Nay</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Buổi Tập Hôm Nay"
                value={8}
                icon={<Calendar className="text-blue-600" size={24} />}
                color="bg-blue-50"
              />
              <StatCard
                title="Học Viên Của Tôi"
                value={15}
                icon={<Users className="text-green-600" size={24} />}
                color="bg-green-50"
              />
              <StatCard
                title="Đánh Giá Trung Bình"
                value="4.8/5"
                icon={<TrendingUp className="text-yellow-600" size={24} />}
                color="bg-yellow-50"
              />
            </div>
          </div>
        )}

        {user?.role === "member" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Gói Tập Của Bạn</h2>
              <p className="text-blue-100">Gói Năm VIP</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Còn lại</p>
                  <p className="text-2xl font-bold">248 ngày</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Hết hạn</p>
                  <p className="font-medium">15/01/2027</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">Lịch Tập Sắp Tới</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Tập với PT Tuấn</p>
                      <p className="text-sm text-gray-600">
                        Thứ 7, 10/05 - 08:00
                      </p>
                    </div>
                    <Calendar className="text-blue-600" size={20} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Tập cá nhân</p>
                      <p className="text-sm text-gray-600">CN, 11/05 - 18:00</p>
                    </div>
                    <Calendar className="text-gray-600" size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">Tiến Độ Tháng Này</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Số buổi tập</span>
                      <span className="text-sm text-gray-600">12/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">
                        Mục tiêu cân nặng
                      </span>
                      <span className="text-sm text-gray-600">-2kg/5kg</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: "40%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
