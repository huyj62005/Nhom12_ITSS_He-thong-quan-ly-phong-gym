import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Activity,
  Building2,
  Dumbbell,
  Edit,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

type GymRoomStatus = "active" | "inactive";

interface GymRoom {
  id: string;
  code: string;
  name: string;
  roomType: string;
  address: string;
  managerId: string;
  managerStaffId: string;
  managerName: string;
  status: GymRoomStatus;
  equipmentCount: number;
  memberCount: number;
  trainerCount: number;
}

type GymRoomForm = Pick<GymRoom, "name" | "roomType" | "address" | "status"> & {
  managerStaffId: string;
  managerName: string;
};

type ApiGymRoom = {
  id?: number | string;
  code?: string;
  name?: string;
  roomType?: string;
  type?: string;
  address?: string;
  managerId?: number | string;
  managerStaffId?: number | string;
  managerName?: string;
  status?: string;
  equipmentCount?: number | string;
  memberCount?: number | string;
  trainerCount?: number | string;
};

type ApiStaff = {
  id?: number | string;
  user?: {
    fullName?: string;
    full_name?: string;
    name?: string;
    role?: string;
  };
  status?: string;
};

type ManagerOption = {
  id: string;
  name: string;
};

const API_BASE_URL = "http://localhost:3000";
const roomTypes = ["gym", "fitness"];

const emptyForm: GymRoomForm = {
  name: "",
  roomType: "gym",
  address: "",
  managerStaffId: "",
  managerName: "",
  status: "active",
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

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

const normalizeStatus = (status?: string): GymRoomStatus =>
  status === "inactive" ? "inactive" : "active";

const mapApiGymRoom = (room: ApiGymRoom): GymRoom => ({
  id: String(room.id ?? ""),
  code: room.code ?? "",
  name: room.name ?? "",
  roomType: (room.roomType ?? room.type ?? "gym").toLowerCase(),
  address: room.address ?? "",
  managerId: String(room.managerId ?? ""),
  managerStaffId: String(room.managerStaffId ?? room.managerId ?? ""),
  managerName: room.managerName ?? "",
  status: normalizeStatus(room.status),
  equipmentCount: Number(room.equipmentCount ?? 0),
  memberCount: Number(room.memberCount ?? 0),
  trainerCount: Number(room.trainerCount ?? 0),
});

const toApiGymRoomPayload = (room: GymRoomForm) => ({
  name: room.name.trim(),
  roomType: room.roomType.trim().toLowerCase(),
  type: room.roomType.trim().toLowerCase(),
  managerStaffId: room.managerStaffId ? Number(room.managerStaffId) : null,
  address: room.address.trim(),
  status: room.status,
});

const getStatusText = (status: GymRoomStatus) =>
  status === "active" ? "Hoạt động" : "Tạm nghỉ";

const getStatusColor = (status: GymRoomStatus) =>
  status === "active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-gray-100 text-gray-700 border-gray-200";

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case "yoga":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "fitness":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "gym":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "boxing":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

export const GymRooms: React.FC = () => {
  const [rooms, setRooms] = useState<GymRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | GymRoomStatus>(
    "all",
  );
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<GymRoom | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<GymRoom | null>(null);
  const [formData, setFormData] = useState<GymRoomForm>(emptyForm);
  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      requestJson<unknown>("/gym-branches"),
      requestJson<unknown>("/trainer-profiles"),
    ])
      .then(([roomsResult, staffResult]) => {
        if (isMounted) {
          const apiRooms =
            roomsResult.status === "fulfilled" ? roomsResult.value : [];
          setRooms(Array.isArray(apiRooms) ? apiRooms.map(mapApiGymRoom) : []);
          const apiStaff =
            staffResult.status === "fulfilled" ? staffResult.value : [];
          setManagerOptions(
            Array.isArray(apiStaff)
              ? apiStaff
                  .filter((staff): staff is ApiStaff => {
                    const item = staff as ApiStaff;
                    return (
                      typeof staff === "object" &&
                      staff !== null &&
                      item.user?.role === "manager" &&
                      item.status !== "inactive"
                    );
                  })
                  .map((staff) => ({
                    id: String(staff.id ?? ""),
                    name:
                      staff.user?.fullName ??
                      staff.user?.full_name ??
                      staff.user?.name ??
                      "",
                  }))
                  .filter((staff) => staff.id && staff.name)
              : [],
          );
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) setRooms([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const availableTypes = useMemo(
    () =>
      Array.from(
        new Set([...roomTypes, ...rooms.map((room) => room.roomType)]),
      ).sort((a, b) => a.localeCompare(b)),
    [rooms],
  );

  const filteredRooms = rooms.filter((room) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      room.name.toLowerCase().includes(normalizedSearch) ||
      room.code.toLowerCase().includes(normalizedSearch) ||
      room.id.toLowerCase().includes(normalizedSearch);
    const matchesType = typeFilter === "all" || room.roomType === typeFilter;
    const matchesStatus =
      statusFilter === "all" || room.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const activeCount = rooms.filter((room) => room.status === "active").length;
  const totalEquipment = rooms.reduce(
    (sum, room) => sum + room.equipmentCount,
    0,
  );

  const openAddModal = () => {
    setEditingRoom(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (room: GymRoom) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      roomType: room.roomType,
      address: room.address,
      status: room.status,
      managerStaffId: room.managerStaffId,
      managerName: room.managerName,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
    setFormData(emptyForm);
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingRoom) {
        const apiRoom = await requestJson<ApiGymRoom>(
          `/gym-branches/${editingRoom.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(toApiGymRoomPayload(formData)),
          },
        );
        const savedRoom = mapApiGymRoom(apiRoom);
        setRooms((current) =>
          current.map((room) =>
            room.id === editingRoom.id ? savedRoom : room,
          ),
        );
      } else {
        const apiRoom = await requestJson<ApiGymRoom>("/gym-branches", {
          method: "POST",
          body: JSON.stringify(toApiGymRoomPayload(formData)),
        });
        setRooms((current) => [...current, mapApiGymRoom(apiRoom)]);
      }
      closeModal();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Không thể lưu phòng tập!",
      );
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRoom) return;

    try {
      await requestJson<unknown>(`/gym-branches/${deleteRoom.id}`, {
        method: "DELETE",
      });
      setRooms((current) =>
        current.filter((room) => room.id !== deleteRoom.id),
      );
      setDeleteRoom(null);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Không thể xóa phòng tập!",
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý phòng tập
            </h1>
            <p className="text-gray-600 mt-1">
              {activeCount} cơ sở hoạt động, tổng {totalEquipment} thiết bị đang
              vận hành
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={20} />
            Thêm phòng tập
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo tên hoặc mã phòng"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={inputClass}
            >
              <option value="all">Tất cả loại phòng</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | GymRoomStatus)
              }
              className={inputClass}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm nghỉ</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 lg:grid-cols-2">
          {filteredRooms.map((room) => (
            <article
              key={room.id}
              className="relative bg-white rounded-lg shadow-sm border border-gray-100 p-6 min-h-[300px] flex flex-col"
            >
              <span
                className={`absolute right-5 top-5 px-3 py-1 rounded-full border text-xs font-semibold ${getTypeColor(
                  room.roomType,
                )}`}
              >
                {room.roomType.toUpperCase()}
              </span>

              <div className="flex items-start gap-4 pr-24">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Building2 size={23} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-400">
                    {room.code || `CS${room.id}`}
                  </p>
                  <h3 className="text-xl font-extrabold text-gray-950 uppercase break-words">
                    {room.name}
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <InfoLine
                  icon={<MapPin size={17} />}
                  label="Địa chỉ"
                  value={room.address}
                />
                <InfoLine
                  icon={<UserRound size={17} />}
                  label="Nhân viên quản lý"
                  value={room.managerName || "Chưa phân công"}
                />
                <InfoLine
                  icon={<Activity size={17} />}
                  label="Trạng thái"
                  value={getStatusText(room.status)}
                  valueClassName={`inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${getStatusColor(
                    room.status,
                  )}`}
                />
                <InfoLine
                  icon={<Dumbbell size={17} />}
                  label="Số lượng thiết bị"
                  value={`${room.equipmentCount}`}
                />
                <InfoLine
                  icon={<Users size={17} />}
                  label="Số hội viên"
                  value={`${room.memberCount}`}
                />
                <InfoLine
                  icon={<Users size={17} />}
                  label="Số PT"
                  value={`${room.trainerCount}`}
                />
              </div>

              <div className="mt-auto pt-5 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(room)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit size={17} />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteRoom(room)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={17} />
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center text-gray-500">
            Không tìm thấy phòng tập phù hợp.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRoom ? "Chỉnh sửa phòng tập" : "Thêm mới phòng tập"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Tên phòng tập" required>
                  <input
                    required
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
                <FormField label="Loại phòng tập" required>
                  <select
                    required
                    value={formData.roomType}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        roomType: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    {roomTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Nhân viên quản lý">
                  <select
                    value={formData.managerStaffId}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        managerStaffId: event.target.value,
                        managerName:
                          managerOptions.find(
                            (manager) => manager.id === event.target.value,
                          )?.name ?? "",
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Chưa phân công</option>
                    {managerOptions.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Trạng thái">
                  <select
                    value={formData.status}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        status: event.target.value as GymRoomStatus,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Tạm nghỉ</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Địa chỉ" required>
                <textarea
                  required
                  value={formData.address}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  rows={3}
                  className={inputClass}
                />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors font-medium text-sm"
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : editingRoom
                      ? "Lưu thay đổi"
                      : "Thêm phòng tập"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">Xác nhận xóa</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc chắn muốn xóa phòng tập{" "}
              <strong>{deleteRoom.name}</strong> không?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteRoom(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Hủy
              </button>
              <button
                type="button"
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

const InfoLine = ({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) => (
  <div className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
    <span className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p
        className={`text-sm font-medium text-gray-900 break-words ${valueClassName ?? ""}`}
      >
        {value}
      </p>
    </div>
  </div>
);

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
