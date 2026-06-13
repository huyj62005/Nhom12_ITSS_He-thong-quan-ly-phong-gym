import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useGymData } from "../contexts/GymDataContext";
import { Plus, Edit, Trash2, Check, X, QrCode } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { MembershipPackage, Payment } from "../types";
import {
  getPackageDisplayName,
  isValidDisplayPackage,
} from "../utils/packageNames";
import { isMemberPackageStillValid } from "../utils/membership";

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

const getGenderText = (gender: string) => {
  switch (gender) {
    case "male":
      return "Nam";
    case "female":
      return "Nữ";
    default:
      return "Khác";
  }
};

export const Packages: React.FC = () => {
  const {
    packages,
    members,
    payments,
    addPackage,
    updatePackage,
    deletePackage,
    addPayment,
  } = useGymData();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"add" | "edit">("add");
  const [selectedPackage, setSelectedPackage] =
    useState<MembershipPackage | null>(null);
  const [packageForm, setPackageForm] = useState<PackageForm>(emptyPackageForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationPackageId, setRegistrationPackageId] = useState("");
  const [registrationPaymentMethod, setRegistrationPaymentMethod] = useState<
    "cash" | "transfer"
  >("cash");
  const [registrationNote, setRegistrationNote] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const canManagePackages =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "cashier";
  const canRegisterPackage = user?.role === "member";
  const currentMember = user
    ? members.find(
        (member) =>
          member.userId === user.id ||
          (!member.userId && member.email === user.email),
      )
    : undefined;
  const visiblePackages = canRegisterPackage
    ? packages.filter(isValidDisplayPackage)
    : packages;
  const hasValidCurrentPackage = isMemberPackageStillValid(currentMember);
  const currentPackageExpiryDate = currentMember?.packageExpiry
    ? new Date(currentMember.packageExpiry)
    : null;
  const currentPackageDaysLeft = currentPackageExpiryDate
    ? Math.max(
        0,
        Math.ceil(
          (currentPackageExpiryDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;
  const selectedRegistrationPackage = visiblePackages.find(
    (pkg) => pkg.id === registrationPackageId,
  );
  const pendingRegistration = currentMember
    ? payments.find(
        (payment) =>
          payment.memberId === currentMember.id && payment.status === "pending",
      )
    : undefined;
  const transferContent =
    currentMember && selectedRegistrationPackage
      ? `GYM_PAYMENT|memberId=${currentMember.id}|packageId=${selectedRegistrationPackage.id}|amount=${selectedRegistrationPackage.price}`
      : "";
  const transferQrUrl = transferContent
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        transferContent,
      )}`
    : "";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPackageTypeColor = (pkg: MembershipPackage) => {
    if (pkg.type === "pt") return "bg-red-100 text-red-800";
    if (pkg.duration >= 365) return "bg-purple-100 text-purple-800";
    if (pkg.duration >= 180) return "bg-green-100 text-green-800";
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
    name: packageForm.name.trim(),
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

  const openRegistrationModal = (pkg: MembershipPackage) => {
    if (!currentMember) {
      window.alert("Không tìm thấy hồ sơ hội viên cho tài khoản hiện tại.");
      return;
    }

    if (pendingRegistration) {
      window.alert(
        `Bạn đang có giao dịch ${pendingRegistration.id} chờ duyệt. Vui lòng chờ quản lý xác nhận trước khi đăng ký gói mới.`,
      );
      return;
    }

    if (
      isMemberPackageStillValid(currentMember) &&
      currentMember.currentPackage?.id !== pkg.id
    ) {
      window.alert(
        "Bạn vẫn còn gói tập đang hiệu lực. Chỉ có thể đổi sang gói khác sau khi gói hiện tại hết hạn.",
      );
      return;
    }

    setRegistrationPackageId(pkg.id);
    setRegistrationPaymentMethod("cash");
    setRegistrationNote("");
    setShowRegistrationModal(true);
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    setRegistrationPackageId("");
    setRegistrationPaymentMethod("cash");
    setRegistrationNote("");
  };

  const handleRegistrationSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!currentMember || !selectedRegistrationPackage) {
      window.alert("Vui lòng kiểm tra lại thông tin hội viên và gói tập.");
      return;
    }

    if (pendingRegistration) {
      window.alert("Bạn đang có giao dịch chờ duyệt.");
      return;
    }

    if (
      isMemberPackageStillValid(currentMember) &&
      currentMember.currentPackage?.id !== selectedRegistrationPackage.id
    ) {
      window.alert(
        "Bạn vẫn còn gói tập đang hiệu lực. Chỉ có thể đổi sang gói khác sau khi gói hiện tại hết hạn.",
      );
      return;
    }

    setIsRegistering(true);

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      memberId: currentMember.id,
      memberName: currentMember.name,
      amount: selectedRegistrationPackage.price,
      method: registrationPaymentMethod,
      status: "pending",
      packageId: selectedRegistrationPackage.id,
      packageName: selectedRegistrationPackage.name,
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: registrationNote.trim(),
    };

    try {
      await addPayment(payment);
      closeRegistrationModal();
      window.alert(
        "Yêu cầu đăng ký đã được gửi. Quản lý sẽ duyệt giao dịch sau khi xác nhận thanh toán.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`Không thể gửi yêu cầu đăng ký: ${message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gói Tập</h1>
            <p className="text-gray-600 mt-1">
              {canRegisterPackage
                ? hasValidCurrentPackage
                  ? "Theo dõi gói tập hiện tại của bạn"
                  : "Chọn gói tập và gửi yêu cầu đăng ký"
                : "Quản lý các gói tập luyện và dịch vụ"}
            </p>
          </div>
          {canManagePackages && (
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Thêm Gói Mới
            </button>
          )}
        </div>

        {canRegisterPackage && pendingRegistration && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Bạn đang có giao dịch chờ duyệt
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Mã giao dịch {pendingRegistration.id} cho gói{" "}
              {getPackageDisplayName({ name: pendingRegistration.packageName })}
              . Quản lý sẽ kích hoạt gói sau khi xác nhận thanh toán.
            </p>
          </div>
        )}

        {canRegisterPackage &&
        hasValidCurrentPackage &&
        currentMember?.currentPackage ? (
          <div className="bg-white rounded-lg shadow border border-green-200 p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-green-700">
                  Gói hiện tại của bạn
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {getPackageDisplayName(currentMember.currentPackage)}
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  {currentMember.currentPackage.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {currentMember.currentPackage.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                    >
                      <Check size={13} />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:text-right">
                <p className="text-sm text-gray-500">Ngày hết hạn</p>
                <p className="mt-1 text-2xl font-bold text-green-700">
                  {currentMember.packageExpiry
                    ? new Date(currentMember.packageExpiry).toLocaleDateString(
                        "vi-VN",
                      )
                    : "Không xác định"}
                </p>
                {currentPackageDaysLeft !== null && (
                  <p className="mt-1 text-sm text-gray-500">
                    Còn {currentPackageDaysLeft} ngày
                  </p>
                )}
                <p className="mt-4 text-xl font-bold text-gray-900">
                  {formatCurrency(currentMember.currentPackage.price)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePackages.map((pkg) => (
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
                    {canManagePackages && (
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
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {getPackageDisplayName(pkg)}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {pkg.description}
                  </p>

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

                  {canRegisterPackage && (
                    <button
                      type="button"
                      onClick={() => openRegistrationModal(pkg)}
                      disabled={Boolean(pendingRegistration)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Chọn Gói
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canManagePackages && (
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
        )}
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

      {showRegistrationModal && currentMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Đăng Ký Gói Tập
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Giao dịch sẽ được tạo ở trạng thái chờ duyệt.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRegistrationModal}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Đóng"
              >
                <X size={22} />
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleRegistrationSubmit}>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Thông tin hội viên
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Họ tên", value: currentMember.name },
                    { label: "Email", value: currentMember.email },
                    { label: "Số điện thoại", value: currentMember.phone },
                    {
                      label: "Ngày sinh",
                      value: currentMember.dateOfBirth
                        ? new Date(
                            currentMember.dateOfBirth,
                          ).toLocaleDateString("vi-VN")
                        : "",
                    },
                    {
                      label: "Giới tính",
                      value: getGenderText(currentMember.gender),
                    },
                    { label: "Địa chỉ", value: currentMember.address },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={value}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-700"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="registration-package"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Chọn gói tập
                  </label>
                  <select
                    id="registration-package"
                    value={registrationPackageId}
                    onChange={(event) =>
                      setRegistrationPackageId(event.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn gói tập</option>
                    {visiblePackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {getPackageDisplayName(pkg)} -{" "}
                        {formatCurrency(pkg.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="registration-method"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Hình thức thanh toán
                  </label>
                  <select
                    id="registration-method"
                    value={registrationPaymentMethod}
                    onChange={(event) =>
                      setRegistrationPaymentMethod(
                        event.target.value as "cash" | "transfer",
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="transfer">Chuyển khoản</option>
                  </select>
                </div>
              </div>

              {selectedRegistrationPackage && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {getPackageDisplayName(selectedRegistrationPackage)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedRegistrationPackage.description}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Thời hạn: {selectedRegistrationPackage.duration} ngày
                      </p>
                    </div>
                    <p className="text-xl font-bold text-blue-600 whitespace-nowrap">
                      {formatCurrency(selectedRegistrationPackage.price)}
                    </p>
                  </div>
                </div>
              )}

              {registrationPaymentMethod === "transfer" &&
                selectedRegistrationPackage && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="w-44 h-44 bg-white border border-blue-100 rounded-lg flex items-center justify-center">
                        {transferQrUrl ? (
                          <img
                            src={transferQrUrl}
                            alt="Mã QR chuyển khoản"
                            className="w-40 h-40"
                          />
                        ) : (
                          <QrCode className="text-blue-600" size={96} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">
                          Quét mã QR để thanh toán chuyển khoản
                        </p>
                        <p className="text-sm text-blue-800 mt-2">
                          Nội dung chuyển khoản:
                        </p>
                        <p className="mt-1 break-all rounded bg-white px-3 py-2 text-sm font-mono text-blue-900 border border-blue-100">
                          {transferContent}
                        </p>
                        <p className="text-xs text-blue-700 mt-2">
                          Sau khi chuyển khoản, giao dịch vẫn chờ quản lý xác
                          nhận trước khi gói được kích hoạt.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              <div>
                <label
                  htmlFor="registration-note"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ghi chú
                </label>
                <textarea
                  id="registration-note"
                  value={registrationNote}
                  onChange={(event) => setRegistrationNote(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Ghi chú thêm cho quản lý nếu cần"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!selectedRegistrationPackage || isRegistering}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isRegistering ? "Đang gửi..." : "Gửi Yêu Cầu Đăng Ký"}
                </button>
                <button
                  type="button"
                  onClick={closeRegistrationModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
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
