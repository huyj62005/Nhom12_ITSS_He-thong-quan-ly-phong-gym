import React from "react";
import {
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { useGymData } from "../contexts/GymDataContext";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className={`inline-flex p-3 rounded-lg mb-4 ${color}`}>{icon}</div>
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { members, payments } = useGymData();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const completedPayments = payments.filter(
    (payment) => payment.status === "completed",
  );
  const pendingPayments = payments.filter(
    (payment) => payment.status === "pending",
  ).length;
  const activeMembers = members.filter(
    (member) => member.membershipStatus === "active",
  ).length;
  const newMembersThisMonth = members.filter(
    (member) => member.joinDate?.slice(0, 7) === currentMonth,
  ).length;
  const revenueThisMonth = completedPayments
    .filter((payment) => payment.paymentDate?.slice(0, 7) === currentMonth)
    .reduce((total, payment) => total + payment.amount, 0);
  const revenueToday = completedPayments
    .filter((payment) => payment.paymentDate?.slice(0, 10) === today)
    .reduce((total, payment) => total + payment.amount, 0);
  const transactionsToday = completedPayments.filter(
    (payment) => payment.paymentDate?.slice(0, 10) === today,
  ).length;
  const currentMember = members.find(
    (member) =>
      member.userId === user?.id ||
      member.email === user?.email ||
      member.name === user?.name,
  );
  const daysLeft = currentMember?.packageExpiry
    ? Math.max(
        0,
        Math.ceil(
          (new Date(currentMember.packageExpiry).getTime() -
            new Date(today).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  const revenueData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const monthKey = date.toISOString().slice(0, 7);

    return {
      month: `${date.getMonth() + 1}/${date.getFullYear()}`,
      revenue: completedPayments
        .filter((payment) => payment.paymentDate?.slice(0, 7) === monthKey)
        .reduce((total, payment) => total + payment.amount, 0),
      members: members.filter((member) => member.joinDate?.slice(0, 7) <= monthKey)
        .length,
    };
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

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
                title="Tổng hội viên"
                value={members.length}
                icon={<Users className="text-blue-600" size={24} />}
                color="bg-blue-50"
              />
              <StatCard
                title="Hội viên hoạt động"
                value={activeMembers}
                icon={<UserCheck className="text-green-600" size={24} />}
                color="bg-green-50"
              />
              <StatCard
                title="Hội viên mới tháng này"
                value={newMembersThisMonth}
                icon={<UserPlus className="text-purple-600" size={24} />}
                color="bg-purple-50"
              />
              <StatCard
                title="Doanh thu tháng này"
                value={formatCurrency(revenueThisMonth)}
                icon={<DollarSign className="text-orange-600" size={24} />}
                color="bg-orange-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Doanh thu theo tháng
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Xu hướng hội viên
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Thanh toán chờ xử lý"
              value={pendingPayments}
              icon={<AlertCircle className="text-orange-600" size={24} />}
              color="bg-orange-50"
            />
            <StatCard
              title="Tổng thu hôm nay"
              value={formatCurrency(revenueToday)}
              icon={<DollarSign className="text-green-600" size={24} />}
              color="bg-green-50"
            />
            <StatCard
              title="Giao dịch hôm nay"
              value={transactionsToday}
              icon={<TrendingUp className="text-blue-600" size={24} />}
              color="bg-blue-50"
            />
          </div>
        )}

        {user?.role === "trainer" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Hội viên đang hoạt động"
              value={activeMembers}
              icon={<Users className="text-green-600" size={24} />}
              color="bg-green-50"
            />
            <StatCard
              title="Lịch hôm nay"
              value={0}
              icon={<Calendar className="text-blue-600" size={24} />}
              color="bg-blue-50"
            />
          </div>
        )}

        {user?.role === "member" && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Gói tập của bạn</h2>
            <p className="text-blue-100">
              {currentMember?.currentPackage?.name ?? "Chưa có gói tập"}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Còn lại</p>
                <p className="text-2xl font-bold">{daysLeft} ngày</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Hết hạn</p>
                <p className="font-medium">
                  {currentMember?.packageExpiry
                    ? new Date(currentMember.packageExpiry).toLocaleDateString("vi-VN")
                    : "--"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
