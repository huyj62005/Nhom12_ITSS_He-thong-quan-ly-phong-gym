import React, { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useGymData } from "../contexts/GymDataContext";
import {
  Plus,
  Search,
  Eye,
  CheckCircle,
  X,
  CreditCard,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  User,
} from "lucide-react";
import { Payment, Member } from "../types";
import { useAuth } from "../contexts/AuthContext";
import {
  getPackageDisplayName,
  isValidDisplayPackage,
  normalizePackageDisplayName,
} from "../utils/packageNames";
import { isMemberPackageStillValid } from "../utils/membership";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount,
  );

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "Đã hoàn thành";
    case "failed":
      return "Đã từ chối";
    default:
      return "Chờ duyệt";
  }
};

const getMethodText = (method: string) => {
  switch (method) {
    case "cash":
      return "Tiền mặt";
    case "transfer":
      return "Chuyển khoản";
    case "card":
      return "Thẻ";
    default:
      return method;
  }
};

const getPaymentPackageName = (packageName?: string) =>
  normalizePackageDisplayName(packageName) || "Chưa có gói tập";

const formatPaymentDate = (date: string) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "-";

type PaymentAction = "new" | "renew" | "change";

interface ToastState {
  message: string;
  type: "success" | "error";
}

const API_BASE_URL = "http://localhost:3000";

type ApiUser = {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
};

type ApiTrainerProfile = {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  user?: ApiUser;
};

type TrainerOption = {
  id: string;
  name: string;
  email: string;
};

const requestJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Request failed with ${response.status}`);
  }

  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
};

const mapTrainerOption = (trainer: ApiTrainerProfile): TrainerOption => ({
  id: String(trainer.userId ?? trainer.user_id ?? trainer.user?.id ?? ""),
  name:
    trainer.user?.fullName ??
    trainer.user?.full_name ??
    trainer.user?.name ??
    "PT",
  email: trainer.user?.email ?? "",
});

export const Payments: React.FC = () => {
  const { user } = useAuth();
  const {
    members,
    payments,
    packages,
    addPayment,
    confirmPayment,
    cancelPayment,
  } = useGymData();

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(
    null,
  );

  // Payment form state
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [paymentAction, setPaymentAction] = useState<PaymentAction>("new");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const [note, setNote] = useState("");

  const memberSearchRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        memberSearchRef.current &&
        !memberSearchRef.current.contains(e.target as Node)
      ) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let isMounted = true;

    requestJson<unknown>("/trainer-profiles")
      .then((apiTrainers) => {
        if (!isMounted) return;
        setTrainers(
          Array.isArray(apiTrainers)
            ? apiTrainers
                .map((trainer) =>
                  mapTrainerOption(trainer as ApiTrainerProfile),
                )
                .filter((trainer) => trainer.id)
            : [],
        );
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) setTrainers([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMembers = members.filter((m) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.includes(q)
    );
  });

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPaymentPackageName(p.packageName)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);
  const completedPaymentCount = payments.filter(
    (p) => p.status === "completed",
  ).length;
  const pendingPaymentCount = payments.filter(
    (p) => p.status === "pending",
  ).length;
  const failedPaymentCount = payments.filter(
    (p) => p.status === "failed",
  ).length;
  const canApprovePayment = user?.role === "admin" || user?.role === "manager";

  const selectMember = (member: Member) => {
    setSelectedMember(member);
    setMemberSearch(member.name);
    setShowMemberDropdown(false);

    if (isMemberPackageStillValid(member)) {
      setPaymentAction("renew");
      setSelectedPackageId(member.currentPackage?.id ?? "");
    } else {
      setPaymentAction("new");
      setSelectedPackageId("");
    }
    setSelectedTrainerId("");
  };

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const requiresTrainer = selectedPackage?.type === "pt";
  const hasCurrentPackage = Boolean(selectedMember?.currentPackage);
  const isCurrentPackageStillValid = isMemberPackageStillValid(selectedMember);

  const resetModal = () => {
    setShowModal(false);
    setMemberSearch("");
    setSelectedMember(null);
    setPaymentAction("new");
    setSelectedPackageId("");
    setSelectedTrainerId("");
    setPaymentMethod("cash");
    setNote("");
    setShowMemberDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      showToast("Vui lòng chọn hội viên!", "error");
      return;
    }
    if (!selectedPackageId) {
      showToast("Vui lòng chọn gói tập!", "error");
      return;
    }
    if (
      paymentAction === "change" &&
      isMemberPackageStillValid(selectedMember)
    ) {
      showToast(
        "Hội viên vẫn còn gói tập đang hiệu lực. Chỉ có thể đổi gói sau khi gói hiện tại hết hạn.",
        "error",
      );
      return;
    }
    const pkg = packages.find((p) => p.id === selectedPackageId)!;
    if (pkg.type === "pt" && !selectedTrainerId) {
      showToast("Vui long chon PT cho goi PT!", "error");
      return;
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      amount: pkg.price,
      method: paymentMethod,
      status: "completed",
      packageId: pkg.id,
      packageName: pkg.name,
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: note,
    };

    if (user?.name) {
      newPayment.processedBy = user.name;
    }

    try {
      await addPayment(
        newPayment,
        pkg.type === "pt" ? selectedTrainerId : undefined,
      );
      resetModal();
      showToast(
        `Thanh toán thành công! Gói "${getPackageDisplayName(pkg)}" đã được kích hoạt cho ${selectedMember.name}.`,
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Khong the tao thanh toan!",
        "error",
      );
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    setUpdatingPaymentId(paymentId);

    try {
      await confirmPayment(paymentId);
      setViewPayment((prev) =>
        prev?.id === paymentId ? { ...prev, status: "completed" } : prev,
      );
      showToast(
        "Giao dịch đã được duyệt và gói tập đã được kích hoạt.",
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Không thể duyệt giao dịch!",
        "error",
      );
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    if (!window.confirm("Bạn chắc chắn muốn từ chối giao dịch này?")) {
      return;
    }

    setUpdatingPaymentId(paymentId);

    try {
      await cancelPayment(paymentId);
      setViewPayment((prev) =>
        prev?.id === paymentId ? { ...prev, status: "failed" } : prev,
      );
      showToast("Giao dịch đã được từ chối.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Không thể từ chối giao dịch!",
        "error",
      );
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

  const availablePaymentPackages = packages.filter(isValidDisplayPackage);

  const changePackages = selectedMember?.currentPackage
    ? availablePaymentPackages.filter(
        (pkg) => pkg.id !== selectedMember.currentPackage?.id,
      )
    : availablePaymentPackages;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white max-w-sm ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thanh Toán</h1>
            <p className="text-gray-600 mt-1">
              Quản lý giao dịch và kích hoạt gói tập
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Tạo Thanh Toán
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Tổng doanh thu",
              value: formatCurrency(totalRevenue),
              color: "text-gray-900",
            },
            {
              label: "Chờ duyệt",
              value: pendingPaymentCount.toString(),
              color: "text-amber-600",
            },
            {
              label: "Đã hoàn thành",
              value: completedPaymentCount.toString(),
              color: "text-green-600",
            },
            {
              label: "Đã từ chối",
              value: failedPaymentCount.toString(),
              color: "text-red-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <p className="text-gray-500 text-sm">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên hội viên, gói tập..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Mã GD",
                    "Hội Viên",
                    "Gói Tập",
                    "Số Tiền",
                    "Phương Thức",
                    "Trạng Thái",
                    "Ngày Thanh Toán",
                    "Thao Tác",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${h === "Thao Tác" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-gray-400 text-sm"
                    >
                      Không tìm thấy giao dịch phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {payment.id}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {payment.memberName}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getPaymentPackageName(payment.packageName)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getMethodText(payment.method)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}
                        >
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatPaymentDate(payment.paymentDate)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {payment.status === "pending" &&
                            canApprovePayment && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApprovePayment(payment.id)
                                  }
                                  disabled={updatingPaymentId === payment.id}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                                  title="Duyệt giao dịch"
                                >
                                  <CheckCircle size={17} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRejectPayment(payment.id)
                                  }
                                  disabled={updatingPaymentId === payment.id}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                  title="Từ chối giao dịch"
                                >
                                  <X size={17} />
                                </button>
                              </>
                            )}
                          <button
                            type="button"
                            onClick={() => setViewPayment(payment)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Hiển thị{" "}
              <span className="font-medium text-gray-900">
                {filteredPayments.length}
              </span>{" "}
              / {payments.length} giao dịch
            </p>
          </div>
        </div>
      </div>

      {/* Create Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Tạo Thanh Toán Mới
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Chọn hội viên → Chọn gói → Xác nhận thanh toán
                </p>
              </div>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Step 1: Member search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full mr-2">
                    1
                  </span>
                  Chọn hội viên <span className="text-red-500">*</span>
                </label>
                <div ref={memberSearchRef} className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setShowMemberDropdown(true);
                      if (!e.target.value) setSelectedMember(null);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    placeholder="Nhập tên, email hoặc số điện thoại..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />

                  {showMemberDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-52 overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-400">
                          Không tìm thấy hội viên
                        </p>
                      ) : (
                        filteredMembers.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => selectMember(m)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left"
                          >
                            <img
                              src={
                                m.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`
                              }
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {m.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {m.email} · {m.phone}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${m.currentPackage && m.membershipStatus === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {m.currentPackage &&
                              m.membershipStatus === "active"
                                ? "Đang hoạt động"
                                : "Chưa có gói"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected member info */}
              {selectedMember && (
                <div
                  className={`rounded-xl border p-4 ${isCurrentPackageStillValid ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={
                        selectedMember.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.name}`
                      }
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedMember.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedMember.email}
                      </p>
                    </div>
                  </div>

                  {hasCurrentPackage ? (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard
                          size={14}
                          className={
                            isCurrentPackageStillValid
                              ? "text-green-600"
                              : "text-amber-600"
                          }
                        />
                        <p
                          className={`text-xs font-semibold ${
                            isCurrentPackageStillValid
                              ? "text-green-700"
                              : "text-amber-700"
                          }`}
                        >
                          {isCurrentPackageStillValid
                            ? "Gói hiện tại đang hoạt động"
                            : "Gói hiện tại đã hết hạn"}
                        </p>
                      </div>
                      <div
                        className={`bg-white rounded-lg px-3 py-2.5 border ${
                          isCurrentPackageStillValid
                            ? "border-green-200"
                            : "border-amber-200"
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {getPackageDisplayName(selectedMember.currentPackage)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Hết hạn:{" "}
                          {selectedMember.packageExpiry
                            ? new Date(
                                selectedMember.packageExpiry,
                              ).toLocaleDateString("vi-VN")
                            : "Không xác định"}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentAction("renew");
                            setSelectedPackageId(
                              selectedMember.currentPackage!.id,
                            );
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors ${paymentAction === "renew" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                        >
                          <RefreshCw size={13} /> Gia hạn gói
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isCurrentPackageStillValid) {
                              showToast(
                                "Hội viên vẫn còn gói tập đang hiệu lực. Chỉ có thể đổi gói sau khi gói hiện tại hết hạn.",
                                "error",
                              );
                              return;
                            }
                            setPaymentAction("change");
                            setSelectedPackageId("");
                          }}
                          aria-disabled={isCurrentPackageStillValid}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                            isCurrentPackageStillValid
                              ? "border-amber-300 bg-amber-50 text-amber-700 cursor-not-allowed"
                              : paymentAction === "change"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "border-gray-300 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <RefreshCw size={13} /> Đổi gói
                        </button>
                      </div>
                      {isCurrentPackageStillValid && (
                        <p className="mt-2 text-xs text-amber-700">
                          Chỉ có thể đổi gói sau khi gói hiện tại hết hạn.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle
                        size={14}
                        className="text-amber-600 flex-shrink-0"
                      />
                      <p className="text-xs text-amber-700">
                        Hội viên chưa có gói tập. Vui lòng chọn gói mới để đăng
                        ký.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Package selection */}
              {selectedMember && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full mr-2">
                      2
                    </span>
                    {paymentAction === "renew"
                      ? "Gia hạn gói"
                      : paymentAction === "change"
                        ? "Đổi gói"
                        : "Chọn gói tập"}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  {paymentAction === "renew" ? (
                    // Renew = same package, just show it
                    <div
                      className="border-2 border-blue-500 rounded-xl p-4 bg-blue-50 cursor-pointer"
                      onClick={() =>
                        setSelectedPackageId(selectedMember.currentPackage!.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {getPackageDisplayName(
                              selectedMember.currentPackage,
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {selectedMember.currentPackage!.description}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(selectedMember.currentPackage!.price)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {paymentAction === "change" &&
                      isCurrentPackageStillValid ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-sm font-medium text-amber-800">
                            Không thể đổi gói khi gói hiện tại vẫn còn hiệu lực.
                          </p>
                          <p className="mt-1 text-xs text-amber-700">
                            Hãy gia hạn gói hiện tại hoặc đổi gói sau ngày hết
                            hạn.
                          </p>
                        </div>
                      ) : (
                        (paymentAction === "change"
                          ? changePackages
                          : availablePaymentPackages
                        ).map((pkg) => (
                          <div
                            key={pkg.id}
                            onClick={() => {
                              setSelectedPackageId(pkg.id);
                              if (pkg.type !== "pt") setSelectedTrainerId("");
                            }}
                            className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedPackageId === pkg.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {getPackageDisplayName(pkg)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {pkg.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {pkg.features.slice(0, 3).map((f) => (
                                    <span
                                      key={f}
                                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                    >
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-blue-600">
                                  {formatCurrency(pkg.price)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {pkg.duration} ngày
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {paymentAction === "change" &&
                        !isCurrentPackageStillValid &&
                        changePackages.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">
                            Không có gói khác để đổi.
                          </p>
                        )}
                    </div>
                  )}
                </div>
              )}

              {selectedMember && selectedPackageId && requiresTrainer && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chọn PT phụ trách <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTrainerId}
                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                    className={inputCls}
                    required
                  >
                    <option value="">Chọn PT cho hội viên</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name}
                        {trainer.email ? ` - ${trainer.email}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Gói PT yêu cầu chọn đúng 1 PT. PT này sẽ được lưu vào gói
                    tập của hội viên.
                  </p>
                </div>
              )}

              {/* Step 3: Payment details */}
              {selectedMember && selectedPackageId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full mr-2">
                      3
                    </span>
                    Thông tin thanh toán
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Phương thức
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(e.target.value as any)
                        }
                        className={inputCls}
                      >
                        <option value="cash">Tiền mặt</option>
                        <option value="transfer">Chuyển khoản</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={inputCls}
                      rows={2}
                      placeholder="Ghi chú thêm (nếu có)"
                    />
                  </div>

                  {/* Summary */}
                  {selectedPackage && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                        Tóm tắt giao dịch
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hội viên</span>
                          <span className="font-medium">
                            {selectedMember.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gói tập</span>
                          <span className="font-medium">
                            {getPackageDisplayName(selectedPackage)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phương thức</span>
                          <span className="font-medium">
                            {getMethodText(paymentMethod)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trạng thái</span>
                          <span className="font-medium text-green-600">
                            Đã thu tiền
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">
                            Tổng tiền
                          </span>
                          <span className="font-bold text-blue-600 text-base">
                            {formatCurrency(selectedPackage.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={
                    !selectedMember ||
                    !selectedPackageId ||
                    (requiresTrainer && !selectedTrainerId)
                  }
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Xác nhận & Kích hoạt gói
                </button>
                <button
                  type="button"
                  onClick={resetModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {viewPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Chi Tiết Giao Dịch
              </h2>
              <button
                onClick={() => setViewPayment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: "Mã giao dịch", value: viewPayment.id },
                { label: "Hội viên", value: viewPayment.memberName },
                {
                  label: "Gói tập",
                  value: getPaymentPackageName(viewPayment.packageName),
                },
                { label: "Số tiền", value: formatCurrency(viewPayment.amount) },
                {
                  label: "Phương thức",
                  value: getMethodText(viewPayment.method),
                },
                {
                  label:
                    viewPayment.status === "completed"
                      ? "Ngày thanh toán"
                      : "Ngày tạo",
                  value: formatPaymentDate(viewPayment.paymentDate),
                },
                { label: "Người xử lý", value: viewPayment.processedBy || "-" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Trạng thái</span>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewPayment.status)}`}
                >
                  {getStatusText(viewPayment.status)}
                </span>
              </div>
            </div>
            <div className="p-6 pt-0 space-y-3">
              {viewPayment.status === "pending" && canApprovePayment && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleApprovePayment(viewPayment.id)}
                    disabled={updatingPaymentId === viewPayment.id}
                    className="py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors font-medium text-sm"
                  >
                    Duyệt giao dịch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectPayment(viewPayment.id)}
                    disabled={updatingPaymentId === viewPayment.id}
                    className="py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors font-medium text-sm"
                  >
                    Từ chối
                  </button>
                </div>
              )}
              <button
                onClick={() => setViewPayment(null)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
