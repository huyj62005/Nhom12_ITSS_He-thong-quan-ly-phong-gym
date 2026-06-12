import React, { useState, useRef } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useGymData } from "../contexts/GymDataContext";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Package,
} from "lucide-react";
import { Member } from "../types";
import { getPackageDisplayName } from "../utils/packageNames";

type StatusFilter = "all" | "active" | "expired";

interface MemberFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  avatarUrl: string;
}

const emptyForm: MemberFormData = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "male",
  address: "",
  avatarUrl: "",
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "expired":
      return "bg-red-100 text-red-800";
    case "suspended":
      return "bg-yellow-100 text-yellow-800";
    case "no_package":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Hoạt động";
    case "expired":
      return "Hết hạn";
    case "suspended":
      return "Tạm ngưng";
    case "no_package":
      return "Chưa có gói";
    default:
      return status;
  }
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

interface ToastState {
  message: string;
  type: "success" | "error";
}

export const Members: React.FC = () => {
  const { members, addMember, updateMember, deleteMember } = useGymData();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<MemberFormData>(emptyForm);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [editFormData, setEditFormData] = useState<
    MemberFormData & { membershipStatus: Member["membershipStatus"] }
  >({
    ...emptyForm,
    membershipStatus: "active",
  });
  const [editAvatarPreview, setEditAvatarPreview] = useState("");

  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      m.membershipStatus === statusFilter ||
      (statusFilter === "expired" && !m.currentPackage);
    return matchesSearch && matchesStatus;
  });

  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    formSetter: (fn: (prev: any) => any) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setter(url);
      formSetter((f: any) => ({ ...f, avatarUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setFormData(emptyForm);
    setAvatarPreview("");
    setShowAddModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditMember(member);
    setEditFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      address: member.address,
      avatarUrl: member.avatar || "",
      membershipStatus: member.membershipStatus,
    });
    setEditAvatarPreview(member.avatar || "");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      showToast("Vui lòng điền đầy đủ thông tin bắt buộc!", "error");
      return;
    }
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      userId: `usr-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      address: formData.address,
      membershipStatus: "expired",
      joinDate: new Date().toISOString().slice(0, 10),
      avatar:
        formData.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
    };
    try {
      await addMember(newMember);
    setShowAddModal(false);
    showToast(
      "Thêm hội viên thành công! Vui lòng tạo thanh toán để kích hoạt gói tập.",
      "success",
    );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Khong the them hoi vien!",
        "error",
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    if (!editFormData.name || !editFormData.email || !editFormData.phone) {
      showToast("Vui lòng điền đầy đủ thông tin bắt buộc!", "error");
      return;
    }

    const avatar =
      editFormData.avatarUrl ||
      (editMember.avatar
        ? editMember.avatar
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${editFormData.name}`);

    await updateMember(editMember.id, {
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      dateOfBirth: editFormData.dateOfBirth,
      gender: editFormData.gender,
      address: editFormData.address,
      membershipStatus: editFormData.membershipStatus,
      ...(avatar ? { avatar } : {}),
    });
    setEditMember(null);
    showToast("Cập nhật hội viên thành công!", "success");
  };

  const handleDelete = async (id: string) => {
    await deleteMember(id);
    setDeleteConfirmId(null);
    showToast("Đã xóa hội viên!", "success");
  };

  const AvatarUpload = ({
    preview,
    inputRef,
    onChange,
    onClear,
  }: {
    preview: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Ảnh đại diện
      </label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <Upload size={22} className="text-gray-400" />
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Chọn ảnh
          </button>
          {preview && (
            <button
              type="button"
              onClick={onClear}
              className="ml-2 text-sm text-red-500 hover:text-red-700"
            >
              Xóa
            </button>
          )}
          <p className="text-xs text-gray-400 mt-1">PNG, JPG tối đa 5MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />
      </div>
    </div>
  );

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

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
            <h1 className="text-3xl font-bold text-gray-900">
              Quản Lý Hội Viên
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý thông tin và trạng thái hội viên
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Thêm Hội Viên
          </button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Package size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Để đăng ký gói tập cho hội viên, vui lòng sử dụng chức năng{" "}
            <strong>Tạo Thanh Toán</strong> trong màn hình Thanh Toán. Gói tập
            sẽ được kích hoạt tự động sau khi thanh toán thành công.
          </p>
        </div>

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
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-w-[160px]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="expired">Hết hạn / Chưa có gói</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mã Hội Viên
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hội Viên
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Liên Hệ
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Gói Tập
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hết Hạn
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-gray-400 text-sm"
                    >
                      Không tìm thấy hội viên phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {member.id}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              member.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`
                            }
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200"
                          />
                          <span className="font-medium text-gray-900 text-sm">
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {member.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.phone}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {member.currentPackage ? (
                          getPackageDisplayName(member.currentPackage)
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            Chưa có gói tập
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(member.currentPackage ? member.membershipStatus : "no_package")}`}
                        >
                          {member.currentPackage
                            ? getStatusText(member.membershipStatus)
                            : "Chưa có gói"}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                        {member.packageExpiry ? (
                          new Date(member.packageExpiry).toLocaleDateString(
                            "vi-VN",
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewMember(member)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={17} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(member.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={17} />
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
                {filteredMembers.length}
              </span>{" "}
              / {members.length} hội viên
            </p>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Thêm Hội Viên Mới
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thông tin cá nhân · Gói tập đăng ký qua Thanh Toán
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, name: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, email: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, phone: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="0901234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        dateOfBirth: e.target.value,
                      }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        gender: e.target.value as any,
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, address: e.target.value }))
                  }
                  className={inputCls}
                  rows={2}
                  placeholder="Địa chỉ đầy đủ"
                />
              </div>
              <AvatarUpload
                preview={avatarPreview}
                inputRef={fileInputRef}
                onChange={(e) =>
                  handleAvatarChange(e, setAvatarPreview, setFormData)
                }
                onClear={() => {
                  setAvatarPreview("");
                  setFormData((f) => ({ ...f, avatarUrl: "" }));
                }}
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Thêm Hội Viên
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Chỉnh Sửa Hội Viên
              </h2>
              <button
                onClick={() => setEditMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData((f) => ({ ...f, name: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData((f) => ({ ...f, email: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData((f) => ({ ...f, phone: e.target.value }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) =>
                      setEditFormData((f) => ({
                        ...f,
                        dateOfBirth: e.target.value,
                      }))
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) =>
                      setEditFormData((f) => ({
                        ...f,
                        gender: e.target.value as any,
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editFormData.membershipStatus}
                    onChange={(e) =>
                      setEditFormData((f) => ({
                        ...f,
                        membershipStatus: e.target.value as any,
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="expired">Hết hạn</option>
                    <option value="suspended">Tạm ngưng</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  value={editFormData.address}
                  onChange={(e) =>
                    setEditFormData((f) => ({ ...f, address: e.target.value }))
                  }
                  className={inputCls}
                  rows={2}
                />
              </div>
              <AvatarUpload
                preview={editAvatarPreview}
                inputRef={editFileInputRef}
                onChange={(e) =>
                  handleAvatarChange(e, setEditAvatarPreview, setEditFormData)
                }
                onClear={() => {
                  setEditAvatarPreview("");
                  setEditFormData((f) => ({ ...f, avatarUrl: "" }));
                }}
              />
              {editMember.currentPackage && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Gói tập hiện tại (quản lý qua Thanh Toán)
                  </p>
                  <p className="text-sm text-blue-900 font-semibold">
                    {getPackageDisplayName(editMember.currentPackage)}
                  </p>
                  {editMember.packageExpiry && (
                    <p className="text-xs text-blue-700 mt-0.5">
                      Hết hạn:{" "}
                      {new Date(editMember.packageExpiry).toLocaleDateString(
                        "vi-VN",
                      )}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditMember(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Chi Tiết Hội Viên
              </h2>
              <button
                onClick={() => setViewMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-5 mb-6 pb-5 border-b border-gray-100">
                <img
                  src={
                    viewMember.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewMember.name}`
                  }
                  alt={viewMember.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {viewMember.name}
                  </h3>
                  <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {viewMember.id}
                  </span>
                  <div className="mt-1.5">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewMember.currentPackage ? viewMember.membershipStatus : "no_package")}`}
                    >
                      {viewMember.currentPackage
                        ? getStatusText(viewMember.membershipStatus)
                        : "Chưa có gói"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Email" value={viewMember.email} />
                <InfoRow label="Số điện thoại" value={viewMember.phone} />
                <InfoRow
                  label="Giới tính"
                  value={getGenderText(viewMember.gender)}
                />
                <InfoRow
                  label="Ngày tham gia"
                  value={new Date(viewMember.joinDate).toLocaleDateString(
                    "vi-VN",
                  )}
                />
                <InfoRow label="Địa chỉ" value={viewMember.address} colSpan />
                <InfoRow
                  label="Gói tập hiện tại"
                  value={getPackageDisplayName(viewMember.currentPackage)}
                />
                <InfoRow
                  label="Loại gói"
                  value={
                    viewMember.currentPackage
                      ? getPackageDisplayName(viewMember.currentPackage)
                      : "-"
                  }
                />
                <InfoRow
                  label="Ngày hết hạn gói"
                  value={
                    viewMember.packageExpiry
                      ? new Date(viewMember.packageExpiry).toLocaleDateString(
                          "vi-VN",
                        )
                      : "-"
                  }
                />
                <InfoRow
                  label="HLV phụ trách"
                  value={
                    viewMember.currentPackage?.type === "pt"
                      ? viewMember.trainerName || "Không có"
                      : "Không áp dụng"
                  }
                />
              </div>
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={() => setViewMember(null)}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc chắn muốn xóa hội viên{" "}
              <strong>
                {members.find((m) => m.id === deleteConfirmId)?.name}
              </strong>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Xóa
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const InfoRow = ({
  label,
  value,
  colSpan,
}: {
  label: string;
  value: string;
  colSpan?: boolean;
}) => (
  <div className={colSpan ? "col-span-2" : ""}>
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value || "-"}</p>
  </div>
);
