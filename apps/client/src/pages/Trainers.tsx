import React, { useEffect, useRef, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Briefcase,
  Edit,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type StaffType = "manager" | "trainer";
type StaffStatus = "active" | "inactive";
type StaffFilter = "all" | StaffType;
type StaffGender = "male" | "female" | "other";

interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: StaffGender;
  address: string;
  staffType: StaffType;
  specialization: string;
  experience: number;
  description: string;
  status: StaffStatus;
  gymRoomId: string;
  gymRoomName: string;
  avatar?: string;
}

type StaffFormData = Omit<StaffMember, "id" | "userId"> & {
  avatarUrl: string;
};

const emptyForm: StaffFormData = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "male",
  address: "",
  staffType: "trainer",
  specialization: "",
  experience: 0,
  description: "",
  status: "active",
  gymRoomId: "",
  gymRoomName: "",
  avatar: "",
  avatarUrl: "",
};

const API_BASE_URL = "http://localhost:3000";

type ApiUser = {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  avatar?: string;
  avatarUrl?: string;
};

type ApiGymRoom = {
  id?: number | string;
  code?: string;
  name?: string;
  status?: string;
};

type ApiTrainerProfile = {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  user?: ApiUser;
  bio?: string;
  experienceYears?: number | string;
  experience_years?: number | string;
  specialties?: string;
  specialization?: string[] | string;
  status?: string;
  avatar?: string;
  gymRoomId?: number | string;
  gymRoomCode?: string;
  gymRoomName?: string;
  gymRoomDisplayName?: string;
  gymRoom?: ApiGymRoom;
};

type ActiveGymRoom = {
  id: string;
  code: string;
  name: string;
  displayName: string;
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

const mapApiTrainerToStaff = (trainer: ApiTrainerProfile): StaffMember => {
  const user = trainer.user;
  const specialties = Array.isArray(trainer.specialization)
    ? trainer.specialization.join(", ")
    : (trainer.specialization ?? trainer.specialties ?? "");
  const staffType: StaffType = user?.role === "trainer" ? "trainer" : "manager";

  return {
    id: String(trainer.id ?? ""),
    userId: String(trainer.userId ?? trainer.user_id ?? user?.id ?? ""),
    name: user?.fullName ?? user?.full_name ?? user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    dateOfBirth: "",
    gender: "male",
    address: "",
    staffType,
    specialization: specialties,
    experience: Number(
      trainer.experienceYears ?? trainer.experience_years ?? 0,
    ),
    description: trainer.bio ?? "",
    status:
      trainer.status === "inactive" || user?.status === "inactive"
        ? "inactive"
        : "active",
    gymRoomId: String(trainer.gymRoomId ?? trainer.gymRoom?.id ?? ""),
    gymRoomName:
      trainer.gymRoomDisplayName ??
      (trainer.gymRoomCode || trainer.gymRoom?.code
        ? `${trainer.gymRoomCode ?? trainer.gymRoom?.code} - ${
            trainer.gymRoomName ?? trainer.gymRoom?.name ?? ""
          }`
        : (trainer.gymRoomName ?? trainer.gymRoom?.name ?? "")),
    avatar:
      trainer.avatar ||
      user?.avatar ||
      user?.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        user?.fullName ?? user?.name ?? "trainer",
      )}`,
  };
};

const toApiTrainerPayload = (staff: StaffFormData & { userId?: string }) => ({
  userId: Number(staff.userId) || undefined,
  name: staff.name,
  fullName: staff.name,
  email: staff.email,
  phone: staff.phone,
  staffType: staff.staffType,
  bio: staff.description,
  experienceYears: Number(staff.experience) || 0,
  specialties: staff.specialization,
  status: staff.status,
  gymRoomId: staff.gymRoomId ? Number(staff.gymRoomId) : null,
});

const getStaffTypeText = (type: StaffType) =>
  type === "manager" ? "Nhân viên quản lý" : "PT/HLV";

const getStatusText = (status: StaffStatus) =>
  status === "active" ? "Đang làm việc" : "Tạm ngưng";

const getStatusColor = (status: StaffStatus) =>
  status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-700";

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

export const Trainers: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [staffFilter, setStaffFilter] = useState<StaffFilter>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(emptyForm);
  const [activeGymRooms, setActiveGymRooms] = useState<ActiveGymRoom[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      requestJson<unknown>("/trainer-profiles"),
      requestJson<unknown>("/gym-branches"),
    ])
      .then(([trainersResult, roomsResult]) => {
        if (isMounted) {
          const apiTrainers =
            trainersResult.status === "fulfilled" ? trainersResult.value : [];
          setStaff(
            Array.isArray(apiTrainers)
              ? apiTrainers.map(mapApiTrainerToStaff)
              : [],
          );
          const apiRooms =
            roomsResult.status === "fulfilled" ? roomsResult.value : [];
          setActiveGymRooms(
            Array.isArray(apiRooms)
              ? apiRooms
                  .filter(
                    (room): room is ApiGymRoom =>
                      typeof room === "object" &&
                      room !== null &&
                      (room as ApiGymRoom).status !== "inactive",
                  )
                  .map((room) => ({
                    id: String(room.id ?? ""),
                    code: room.code ?? "",
                    name: room.name ?? "",
                    displayName: room.code
                      ? `${room.code} - ${room.name ?? ""}`
                      : (room.name ?? ""),
                  }))
                  .filter((room) => room.id && room.name)
              : [],
          );
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setStaff([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStaff = staff.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesType = staffFilter === "all" || item.staffType === staffFilter;
    const matchesBranch =
      branchFilter === "all" || item.gymRoomId === branchFilter;

    return matchesSearch && matchesType && matchesBranch;
  });

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({ ...emptyForm, staffType: "trainer" });
    setShowFormModal(true);
  };

  const openEditModal = (item: StaffMember) => {
    if (isManager && item.staffType !== "trainer") return;
    setEditingStaff(item);
    setFormData({
      name: item.name,
      email: item.email,
      phone: item.phone,
      dateOfBirth: item.dateOfBirth,
      gender: item.gender,
      address: item.address,
      staffType: item.staffType,
      specialization: item.specialization,
      experience: item.experience,
      description: item.description,
      status: item.status,
      gymRoomId: item.gymRoomId,
      gymRoomName: item.gymRoomName,
      avatar: item.avatar || "",
      avatarUrl: item.avatar || "",
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingStaff(null);
    setFormData(emptyForm);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const url = readerEvent.target?.result as string;
      setFormData((current) => ({
        ...current,
        avatar: url,
        avatarUrl: url,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const avatar =
      formData.avatarUrl ||
      formData.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        formData.name || "staff",
      )}`;
    const staffType: StaffType = isManager ? "trainer" : formData.staffType;
    if (!formData.gymRoomId) {
      window.alert("Vui lòng chọn cơ sở làm việc cho nhân sự!");
      return;
    }

    try {
      if (editingStaff) {
        const apiStaff = await requestJson<unknown>(
          `/trainer-profiles/${editingStaff.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(
              toApiTrainerPayload({
                ...formData,
                staffType,
                userId: editingStaff.userId,
              }),
            ),
          },
        );
        const savedStaff =
          typeof apiStaff === "object" && apiStaff !== null
            ? mapApiTrainerToStaff(apiStaff as ApiTrainerProfile)
            : {
                ...editingStaff,
                ...formData,
                staffType,
                experience: Number(formData.experience) || 0,
                avatar,
              };

        setStaff((current) =>
          current.map((item) =>
            item.id === editingStaff.id ? savedStaff : item,
          ),
        );
      } else {
        const apiStaff = await requestJson<unknown>("/trainer-profiles", {
          method: "POST",
          body: JSON.stringify(toApiTrainerPayload({ ...formData, staffType })),
        });
        if (typeof apiStaff !== "object" || apiStaff === null) {
          throw new Error("API /trainer-profiles không trả về dữ liệu hợp lệ");
        }
        setStaff((current) => [
          mapApiTrainerToStaff(apiStaff as ApiTrainerProfile),
          ...current,
        ]);
      }

      closeFormModal();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Khong the luu nhan su!",
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteStaff) return;
    if (isManager && deleteStaff.staffType !== "trainer") {
      setDeleteStaff(null);
      return;
    }
    try {
      await requestJson<unknown>(`/trainer-profiles/${deleteStaff.id}`, {
        method: "DELETE",
      });
      setStaff((current) =>
        current.filter((item) => item.id !== deleteStaff.id),
      );
      setDeleteStaff(null);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Khong the xoa nhan su!",
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản Lý Nhân Sự
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý nhân viên quản lý và PT/HLV
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Thêm Nhân Sự
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm kiếm theo tên nhân sự..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={staffFilter}
              onChange={(event) =>
                setStaffFilter(event.target.value as StaffFilter)
              }
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-w-[210px]"
            >
              <option value="all">Tất cả</option>
              <option value="manager">Nhân viên quản lý</option>
              <option value="trainer">PT/HLV</option>
            </select>
            <select
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white min-w-[190px]"
            >
              <option value="all">Tất cả cơ sở</option>
              {activeGymRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-20 h-20 rounded-full object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 break-words">
                        {item.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                        <Briefcase size={14} />
                        {getStaffTypeText(item.staffType)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {(!isManager || item.staffType === "trainer") && (
                      <>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa nhân sự"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteStaff(item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa nhân sự"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                    <Mail size={16} className="flex-shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{item.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase size={16} />
                    <span>{item.gymRoomName || "Chưa gán cơ sở"}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Chuyên môn / kinh nghiệm
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {item.specialization || "Chưa cập nhật"}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {item.experience} năm kinh nghiệm
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {item.description || "Chưa có mô tả nghiệp vụ"}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      item.status,
                    )}`}
                  >
                    {getStatusText(item.status)}
                  </span>
                  <span className="text-xs text-gray-400">{item.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
            Không tìm thấy nhân sự phù hợp
          </div>
        )}
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStaff ? "Chỉnh Sửa Nhân Sự" : "Thêm Nhân Sự"}
              </h2>
              <button
                onClick={closeFormModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh đại diện
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                    {formData.avatarUrl || formData.avatar ? (
                      <img
                        src={formData.avatarUrl || formData.avatar}
                        alt="Ảnh đại diện"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload size={22} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Chọn ảnh
                    </button>
                    {(formData.avatarUrl || formData.avatar) && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((current) => ({
                            ...current,
                            avatar: "",
                            avatarUrl: "",
                          }))
                        }
                        className="ml-2 text-sm text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Họ tên" required>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Email" required>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Số điện thoại" required>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Ngày sinh">
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        dateOfBirth: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Giới tính">
                  <select
                    value={formData.gender}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        gender: event.target.value as StaffGender,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </FormField>
                <FormField label="Loại nhân sự">
                  <select
                    value={formData.staffType}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        staffType: isManager
                          ? "trainer"
                          : (event.target.value as StaffType),
                      }))
                    }
                    disabled={isManager}
                    className={inputClass}
                  >
                    {!isManager && (
                      <option value="manager">Nhân viên quản lý</option>
                    )}
                    <option value="trainer">PT/HLV</option>
                  </select>
                </FormField>
                <FormField label="Cơ sở" required>
                  <select
                    required
                    value={formData.gymRoomId}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        gymRoomId: event.target.value,
                        gymRoomName:
                          activeGymRooms.find(
                            (room) => room.id === event.target.value,
                          )?.displayName ?? "",
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Chưa gán cơ sở</option>
                    {activeGymRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.displayName}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Chuyên môn">
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        specialization: event.target.value,
                      }))
                    }
                    className={inputClass}
                    placeholder="Quan ly van hanh, Yoga, Cardio..."
                  />
                </FormField>
                <FormField label="Số năm kinh nghiệm">
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        experience: Number(event.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Trạng thái">
                  <select
                    value={formData.status}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        status: event.target.value as StaffStatus,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="active">Đang làm việc</option>
                    <option value="inactive">Tạm ngưng</option>
                  </select>
                </FormField>
                <FormField label="Địa chỉ">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Mô tả/nghiệp vụ">
                <textarea
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={inputClass}
                  rows={3}
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  {editingStaff ? "Lưu thay đổi" : "Thêm Nhân Sự"}
                </button>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Xác nhận xóa</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc chắn muốn xóa nhân sự này không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteStaff(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

const FormField = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);
