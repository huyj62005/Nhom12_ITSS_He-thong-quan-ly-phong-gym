import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useGymData } from "../contexts/GymDataContext";
import { Plus, Edit, Trash2, Check } from "lucide-react";
import { MembershipPackage } from "../types";
import { getPackageDisplayName } from "../utils/packageNames";

type PackageForm = {
  name: string;
  description: string;
  duration: string;
  price: string;
  type: MembershipPackage["type"];
};

const emptyPackageForm: PackageForm = {
  name: "",
  description: "",
  duration: "",
  price: "",
  type: "quarterly",
};

export const Packages: React.FC = () => {
  const { packages, addPackage, updatePackage, deletePackage } = useGymData();
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"add" | "edit">("add");
  const [selectedPackage, setSelectedPackage] =
    useState<MembershipPackage | null>(null);
  const [packageForm, setPackageForm] = useState<PackageForm>(emptyPackageForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPackageTypeColor = (pkg: MembershipPackage) => {
    const displayName = getPackageDisplayName(pkg);

    if (displayName === "Gói PT") return "bg-red-100 text-red-800";
    if (displayName === "Gói 12 tháng") return "bg-purple-100 text-purple-800";
    if (displayName === "Gói 6 tháng") return "bg-green-100 text-green-800";
    return "bg-blue-100 text-blue-800";
  };

  const openAddModal = () => {
    setAction("add");
    setSelectedPackage(null);
    setPackageForm(emptyPackageForm);
    setShowModal(true);
  };

  const openEditModal = (pkg: MembershipPackage) => {
    setAction("edit");
    setSelectedPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      duration: String(pkg.duration),
      price: String(pkg.price),
      type: pkg.type,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPackage(null);
    setPackageForm(emptyPackageForm);
  };

  const buildPackagePayload = (
    id: string,
    basePackage?: MembershipPackage,
  ): MembershipPackage => ({
    id,
    name: getPackageDisplayName({
      name: packageForm.name,
      duration: Number(packageForm.duration),
      type: packageForm.type,
    }),
    description: packageForm.description.trim(),
    duration: Number(packageForm.duration),
    price: Number(packageForm.price),
    type: packageForm.type,
    features: basePackage?.features ?? [],
    isActive: basePackage?.isActive ?? true,
    createdAt: basePackage?.createdAt ?? new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (action === "edit" && selectedPackage) {
        const updatedPackage = buildPackagePayload(
          selectedPackage.id,
          selectedPackage,
        );

        await updatePackage(selectedPackage.id, updatedPackage);
        closeModal();
        return;
      }

      const newPackage = buildPackagePayload(`pkg-${Date.now()}`);
      await addPackage(newPackage);
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`Không thể lưu gói tập: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa gói tập này?")) {
      return;
    }

    try {
      await deletePackage(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`Không thể xóa gói tập: ${message}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gói Tập</h1>
            <p className="text-gray-600 mt-1">
              Quản lý các gói tập luyện và dịch vụ
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Thêm Gói Mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getPackageTypeColor(
                        pkg,
                      )}`}
                    >
                      {getPackageDisplayName(pkg)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(pkg)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Chỉnh sửa ${getPackageDisplayName(pkg)}`}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Xóa ${getPackageDisplayName(pkg)}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {getPackageDisplayName(pkg)}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(pkg.price)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{pkg.duration} ngày</p>
                </div>

                <div className="space-y-2 mb-6">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check
                        size={16}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Chọn Gói
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Danh Sách Chi Tiết
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tên Gói
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời Hạn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {getPackageDisplayName(pkg)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPackageTypeColor(
                          pkg,
                        )}`}
                      >
                        {getPackageDisplayName(pkg)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.duration} ngày
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {formatCurrency(pkg.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          pkg.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pkg.isActive ? "Hoạt động" : "Tạm ngưng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(pkg)}
                          className="text-blue-600 hover:text-blue-900"
                          aria-label={`Chỉnh sửa ${getPackageDisplayName(pkg)}`}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label={`Xóa ${getPackageDisplayName(pkg)}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {action === "add" ? "Thêm Gói Tập Mới" : "Chỉnh Sửa Gói Tập"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="package-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tên gói
                </label>
                <input
                  id="package-name"
                  type="text"
                  value={packageForm.name}
                  onChange={(event) =>
                    setPackageForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Gói 3 tháng"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="package-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mô tả
                </label>
                <textarea
                  id="package-description"
                  value={packageForm.description}
                  onChange={(event) =>
                    setPackageForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Mô tả chi tiết về gói tập"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="package-type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Loại gói
                  </label>
                  <select
                    id="package-type"
                    value={packageForm.type}
                    onChange={(event) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        type: event.target.value as MembershipPackage["type"],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="quarterly">Gói 3 tháng</option>
                    <option value="yearly">Gói 6 tháng / 12 tháng</option>
                    <option value="pt">PT</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="package-duration"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Thời hạn (ngày)
                  </label>
                  <input
                    id="package-duration"
                    type="number"
                    min={1}
                    value={packageForm.duration}
                    onChange={(event) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        duration: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="package-price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Giá (VNĐ)
                  </label>
                  <input
                    id="package-price"
                    type="number"
                    min={0}
                    value={packageForm.price}
                    onChange={(event) =>
                      setPackageForm((prev) => ({
                        ...prev,
                        price: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500000"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : action === "add"
                      ? "Thêm Gói"
                      : "Lưu Thay Đổi"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
