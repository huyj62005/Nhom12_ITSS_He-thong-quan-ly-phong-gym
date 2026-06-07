import React from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { User, Bell, Lock, Globe, Database } from "lucide-react";

export const Settings: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài Đặt Hệ Thống</h1>
          <p className="text-gray-600 mt-1">
            Quản lý cấu hình và tùy chỉnh hệ thống
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="text-blue-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Quản Lý Người Dùng
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Thêm, sửa, xóa tài khoản người dùng và phân quyền
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Quản Lý User
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lock className="text-green-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Phân Quyền</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Cấu hình quyền truy cập cho từng vai trò
            </p>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Cấu Hình Quyền
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="text-yellow-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Thông Báo</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Cấu hình thông báo email và SMS
            </p>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
              Cài Đặt Thông Báo
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="text-purple-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Thông Tin Phòng Gym
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Cập nhật thông tin, giờ mở cửa, địa chỉ
            </p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Chỉnh Sửa Thông Tin
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Database className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Sao Lưu & Khôi Phục
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Backup và restore dữ liệu hệ thống
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Backup Ngay
              </button>
              <button className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                Restore
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Cấu Hình Hệ Thống
          </h3>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên phòng gym
                </label>
                <input
                  type="text"
                  defaultValue="Pro Fitness"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  defaultValue="contact@profitness.vn"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  defaultValue="0901234567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Múi giờ
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Asia/Ho_Chi_Minh (UTC+7)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <textarea
                defaultValue="123 Nguyễn Huệ, Quận 1, TP.HCM"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              ></textarea>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Lưu Thay Đổi
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
