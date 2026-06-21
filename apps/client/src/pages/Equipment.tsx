import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Plus,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Edit,
  Search,
  Trash2,
} from "lucide-react";
import { Equipment } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { getScopedBranchFilter, getScopedGymRoomId } from "../utils/accessScope";

type EquipmentForm = {
  equipmentCode: string;
  name: string;
  category: string;
  purchaseDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  price: string;
  status: Equipment["status"];
  gymRoomId: string;
};

type EquipmentStatusFilter = "all" | Equipment["status"] | "maintenance_due";

type ApiEquipment = {
  id: number | string;
  equipmentCode?: string;
  equipment_code?: string;
  code?: string;
  name?: string;
  category?: string;
  status?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  lastMaintenanceDate?: string;
  nextMaintenance?: string;
  nextMaintenanceDate?: string;
  cost?: number | string;
  purchasePrice?: number | string;
  needsMaintenanceSoon?: boolean;
  maintenanceState?: Equipment["maintenanceState"];
  gymRoomId?: number | string;
  facilityId?: number | string;
  gymRoomCode?: string;
  gymRoomName?: string;
  gymRoomDisplayName?: string;
};

type BranchOption = {
  id: string;
  code: string;
  name: string;
  displayName: string;
};

const API_BASE_URL = "http://localhost:3000";
const defaultEquipmentCategories = ["Cardio", "Strength", "Free Weights"];

const emptyEquipmentForm: EquipmentForm = {
  equipmentCode: "",
  name: "",
  category: "",
  purchaseDate: "",
  lastMaintenance: "",
  nextMaintenance: "",
  price: "",
  status: "available",
  gymRoomId: "",
};

export const EquipmentPage: React.FC = () => {
  const { user } = useAuth();
  const scopedGymRoomId = getScopedGymRoomId(user);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"add" | "edit">("add");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [equipmentForm, setEquipmentForm] =
    useState<EquipmentForm>(emptyEquipmentForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<EquipmentStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);

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

  const normalizeStatus = (status?: string): Equipment["status"] => {
    return status === "maintenance" || status === "broken"
      ? status
      : "available";
  };

  const mapApiEquipment = (item: ApiEquipment): Equipment => {
    const mappedEquipment: Equipment = {
      id: String(item.id),
      equipmentCode: String(
        item.equipmentCode ?? item.equipment_code ?? item.code ?? "",
      ),
      name: item.name ?? "",
      category: item.category ?? "",
      status: normalizeStatus(item.status),
      purchaseDate: item.purchaseDate ?? "",
      cost: Number(item.cost ?? item.purchasePrice ?? 0),
      gymRoomId: String(item.gymRoomId ?? item.facilityId ?? ""),
      gymRoomCode: item.gymRoomCode ?? "",
      gymRoomName: item.gymRoomName ?? "",
      gymRoomDisplayName: item.gymRoomDisplayName ?? "",
    };
    const lastMaintenance = item.lastMaintenance ?? item.lastMaintenanceDate;
    const nextMaintenance = item.nextMaintenance ?? item.nextMaintenanceDate;

    if (lastMaintenance !== undefined) {
      mappedEquipment.lastMaintenance = lastMaintenance;
    }
    if (nextMaintenance !== undefined) {
      mappedEquipment.nextMaintenance = nextMaintenance;
    }
    if (item.needsMaintenanceSoon !== undefined) {
      mappedEquipment.needsMaintenanceSoon = item.needsMaintenanceSoon;
    }
    if (item.maintenanceState !== undefined) {
      mappedEquipment.maintenanceState = item.maintenanceState;
    }

    return mappedEquipment;
  };

  const toApiEquipmentPayload = (item: Equipment) => {
    const payload: {
      name: string;
      category: string;
      purchaseDate: string;
      lastMaintenance?: string;
      nextMaintenance?: string;
      purchasePrice: number;
      status: Equipment["status"];
      equipmentCode?: string;
      code?: string;
      gymRoomId?: number;
      facilityId?: number;
    } = {
      name: item.name,
      category: item.category,
      purchaseDate: item.purchaseDate,
      purchasePrice: item.cost,
      status: item.status,
      ...(item.gymRoomId
        ? {
            gymRoomId: Number(item.gymRoomId),
            facilityId: Number(item.gymRoomId),
          }
        : {}),
    };

    if (item.equipmentCode !== undefined) {
      payload.equipmentCode = item.equipmentCode;
      payload.code = item.equipmentCode;
    }

    if (item.lastMaintenance !== undefined) {
      payload.lastMaintenance = item.lastMaintenance;
    }
    if (item.nextMaintenance !== undefined) {
      payload.nextMaintenance = item.nextMaintenance;
    }

    return payload;
  };

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      requestJson<unknown>("/equipments"),
      requestJson<unknown>("/gym-branches"),
    ])
      .then(([equipmentResult, branchResult]) => {
        if (isMounted) {
          const apiEquipment =
            equipmentResult.status === "fulfilled" ? equipmentResult.value : [];
          setEquipment(
            Array.isArray(apiEquipment)
              ? apiEquipment.map(mapApiEquipment)
              : [],
          );
          const apiBranches =
            branchResult.status === "fulfilled" ? branchResult.value : [];
          setBranches(
            Array.isArray(apiBranches)
              ? apiBranches
                  .map((branch: any) => ({
                    id: String(branch.id ?? ""),
                    code: branch.code ?? "",
                    name: branch.name ?? "",
                    displayName: branch.code
                      ? `${branch.code} - ${branch.name ?? ""}`
                      : (branch.name ?? ""),
                  }))
                  .filter((branch) => branch.id && branch.code)
              : [],
          );
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setEquipment([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getEquipmentCodePrefix = (category: string) => {
    const normalized = category
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    return (normalized.slice(0, 2) || "EQ").padEnd(2, "X");
  };

  const getNextEquipmentCode = (category: string) => {
    if (!category) return "";

    const prefix = getEquipmentCodePrefix(category);
    const maxSequence = equipment.reduce((max, item) => {
      if (action === "edit" && item.id === selectedEquipment?.id) return max;

      const match = item.equipmentCode?.match(
        new RegExp(`^${prefix}(\\d{3})$`),
      );
      if (!match) return max;

      return Math.max(max, Number(match[1]));
    }, 0);

    return `${prefix}${String(maxSequence + 1).padStart(3, "0")}`;
  };

  const isMaintenanceDueSoon = (item: Equipment) => {
    if (item.status !== "available") return false;
    if (item.needsMaintenanceSoon) return true;
    if (!item.nextMaintenance) return false;

    const today = new Date(new Date().toISOString().slice(0, 10));
    const nextMaintenance = new Date(item.nextMaintenance);
    const daysUntilMaintenance = Math.ceil(
      (nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysUntilMaintenance >= 0 && daysUntilMaintenance <= 7;
  };

  const getStatusColor = (item: Equipment) => {
    if (isMaintenanceDueSoon(item)) {
      return "bg-yellow-100 text-yellow-800";
    }

    switch (item.status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "broken":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (item: Equipment) => {
    if (isMaintenanceDueSoon(item)) {
      return "Cần bảo trì";
    }

    switch (item.status) {
      case "available":
        return "Sẵn sàng";
      case "maintenance":
        return "Bảo trì";
      case "broken":
        return "Hỏng";
      default:
        return item.status;
    }
  };

  const getStatusIcon = (item: Equipment) => {
    if (isMaintenanceDueSoon(item)) {
      return <AlertTriangle size={20} className="text-yellow-600" />;
    }

    switch (item.status) {
      case "available":
        return <CheckCircle size={20} className="text-green-600" />;
      case "maintenance":
        return <Wrench size={20} className="text-yellow-600" />;
      case "broken":
        return <AlertTriangle size={20} className="text-red-600" />;
      default:
        return null;
    }
  };

  const openAddModal = () => {
    setAction("add");
    setSelectedEquipment(null);
    setEquipmentForm({ ...emptyEquipmentForm, gymRoomId: scopedGymRoomId ?? "" });
    setShowModal(true);
  };

  const openEditModal = (item: Equipment) => {
    setAction("edit");
    setSelectedEquipment(item);
    setEquipmentForm({
      equipmentCode: item.equipmentCode ?? "",
      name: item.name,
      category: item.category,
      purchaseDate: item.purchaseDate,
      lastMaintenance: item.lastMaintenance ?? "",
      nextMaintenance: item.nextMaintenance ?? "",
      price: String(item.cost),
      status: item.status,
      gymRoomId: scopedGymRoomId ?? item.gymRoomId ?? "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEquipment(null);
    setEquipmentForm(emptyEquipmentForm);
  };

  const buildEquipmentPayload = (id: string): Equipment => {
    const payload: Equipment = {
      id,
      equipmentCode:
        action === "add"
          ? getNextEquipmentCode(equipmentForm.category.trim())
          : equipmentForm.equipmentCode.trim(),
      name: equipmentForm.name.trim(),
      category: equipmentForm.category.trim(),
      purchaseDate: equipmentForm.purchaseDate,
      cost: Number(equipmentForm.price),
      status: equipmentForm.status,
      gymRoomId: scopedGymRoomId ?? equipmentForm.gymRoomId,
    };

    if (equipmentForm.lastMaintenance) {
      payload.lastMaintenance = equipmentForm.lastMaintenance;
    }

    if (equipmentForm.nextMaintenance) {
      payload.nextMaintenance = equipmentForm.nextMaintenance;
    }

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!(scopedGymRoomId ?? equipmentForm.gymRoomId)) {
      window.alert("Vui lòng chọn cơ sở cho thiết bị!");
      return;
    }
    setIsSubmitting(true);

    try {
      if (action === "edit" && selectedEquipment) {
        const updatedEquipment = buildEquipmentPayload(selectedEquipment.id);
        const apiEquipment = await requestJson<ApiEquipment>(
          `/equipments/${selectedEquipment.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(toApiEquipmentPayload(updatedEquipment)),
          },
        );

        const savedEquipment = mapApiEquipment(apiEquipment);
        setEquipment((prev) =>
          prev.map((item) =>
            item.id === selectedEquipment.id ? savedEquipment : item,
          ),
        );
        closeModal();
        return;
      }

      const newEquipment = buildEquipmentPayload(`eq-${Date.now()}`);
      const apiEquipment = await requestJson<ApiEquipment>("/equipments", {
        method: "POST",
        body: JSON.stringify(toApiEquipmentPayload(newEquipment)),
      });

      setEquipment((prev) => [...prev, mapApiEquipment(apiEquipment)]);
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`Không thể lưu thiết bị: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa thiết bị này?")) {
      return;
    }

    try {
      await requestJson<{ deleted: boolean }>(`/equipments/${id}`, {
        method: "DELETE",
      });
      setEquipment((prev) =>
        prev.filter((equipmentItem) => equipmentItem.id !== id),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`Không thể xóa thiết bị: ${message}`);
    }
  };

  const scopedEquipment = equipment.filter(
    (item) => !scopedGymRoomId || item.gymRoomId === scopedGymRoomId,
  );
  const visibleBranches = scopedGymRoomId
    ? branches.filter((branch) => branch.id === scopedGymRoomId)
    : branches;
  const availableCount = scopedEquipment.filter(
    (e) => e.status === "available" && !isMaintenanceDueSoon(e),
  ).length;
  const maintenanceCount = scopedEquipment.filter(
    (e) => e.status === "maintenance" || isMaintenanceDueSoon(e),
  ).length;
  const brokenCount = scopedEquipment.filter((e) => e.status === "broken").length;
  const categoryOptions = Array.from(
    new Set(equipment.map((item) => item.category).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const equipmentCategoryOptions = Array.from(
    new Set([...defaultEquipmentCategories, ...categoryOptions]),
  ).sort((a, b) => a.localeCompare(b));
  const hasActiveFilters =
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    branchFilter !== "all" ||
    Boolean(searchTerm.trim());
  const filteredEquipment = equipment.filter((item) => {
    const effectiveBranchFilter = getScopedBranchFilter(
      branchFilter,
      scopedGymRoomId,
    );
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "maintenance_due"
          ? isMaintenanceDueSoon(item)
          : item.status === statusFilter;
    const matchesBranch =
      effectiveBranchFilter === "all" || item.gymRoomId === effectiveBranchFilter;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      (item.equipmentCode ?? "").toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesStatus && matchesBranch && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Thiết Bị</h1>
            <p className="text-gray-600 mt-1">
              Quản lý thiết bị và lịch bảo trì
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Thêm Thiết Bị
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Sẵn sàng</p>
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{availableCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-yellow-600">Đang/cần bảo trì</p>
              <Wrench className="text-yellow-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {maintenanceCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Hỏng hóc</p>
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{brokenCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Danh Sách Thiết Bị
            </h3>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setBranchFilter("all");
                    setSearchTerm("");
                  }}
                  disabled={!hasActiveFilters}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Xóa bộ lọc
                </button>
                <select
                  value={scopedGymRoomId ?? branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                  className="min-w-[190px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {!scopedGymRoomId && <option value="all">Tất cả cơ sở</option>}
                  {visibleBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.displayName}
                    </option>
                  ))}
                </select>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="min-w-[190px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as EquipmentStatusFilter)
                  }
                  className="min-w-[190px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="available">Sẵn sàng</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="maintenance_due">Cần bảo trì</option>
                  <option value="broken">Hỏng</option>
                </select>
              </div>
              <div className="relative w-full lg:max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo tên hoặc mã số máy..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã Số Máy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tên Thiết Bị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cơ sở
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Danh Mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày Mua
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bảo Trì Lần Cuối
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bảo Trì Tiếp Theo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Giá Trị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hành Động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {item.equipmentCode || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item)}
                        <span className="font-medium text-gray-900">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700">
                      {item.gymRoomCode || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item)}`}
                      >
                        {isMaintenanceDueSoon(item) && (
                          <AlertTriangle
                            size={12}
                            className="text-yellow-600"
                          />
                        )}
                        {getStatusText(item)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.purchaseDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.lastMaintenance
                        ? new Date(item.lastMaintenance).toLocaleDateString(
                            "vi-VN",
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nextMaintenance
                        ? new Date(item.nextMaintenance).toLocaleDateString(
                            "vi-VN",
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          aria-label={`Chỉnh sửa ${item.name}`}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEquipment(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label={`Xóa ${item.name}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEquipment.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      Không có thiết bị phù hợp với trạng thái đã chọn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {action === "add" ? "Thêm Thiết Bị" : "Chỉnh Sửa Thiết Bị"}
              </h2>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="equipment-code"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mã số máy
                </label>
                <input
                  id="equipment-code"
                  type="text"
                  value={
                    equipmentForm.equipmentCode ||
                    getNextEquipmentCode(equipmentForm.category)
                  }
                  readOnly
                  placeholder="Tự động sinh sau khi chọn danh mục"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="equipment-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tên thiết bị
                </label>
                <input
                  id="equipment-name"
                  type="text"
                  value={equipmentForm.name}
                  onChange={(event) =>
                    setEquipmentForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="equipment-category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Danh mục
                  </label>
                  <select
                    id="equipment-category"
                    value={equipmentForm.category}
                    onChange={(event) =>
                      setEquipmentForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                        equipmentCode:
                          action === "add"
                            ? getNextEquipmentCode(event.target.value)
                            : "",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {equipmentCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="equipment-status"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Trạng thái
                  </label>
                  <select
                    id="equipment-status"
                    value={equipmentForm.status}
                    onChange={(event) =>
                      setEquipmentForm((prev) => ({
                        ...prev,
                        status: event.target.value as Equipment["status"],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="available">Sẵn sàng</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="broken">Hỏng</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="equipment-branch"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cơ sở
                  </label>
                  <select
                    id="equipment-branch"
                    value={scopedGymRoomId ?? equipmentForm.gymRoomId}
                    onChange={(event) =>
                      setEquipmentForm((prev) => ({
                        ...prev,
                        gymRoomId: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {!scopedGymRoomId && <option value="">Chọn cơ sở</option>}
                    {visibleBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="equipment-purchase-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ngày mua
                  </label>
                  <input
                    id="equipment-purchase-date"
                    type="date"
                    value={equipmentForm.purchaseDate}
                    onChange={(event) =>
                      setEquipmentForm((prev) => ({
                        ...prev,
                        purchaseDate: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="equipment-last-maintenance"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bảo trì lần cuối
                  </label>
                  <input
                    id="equipment-last-maintenance"
                    type="date"
                    value={equipmentForm.lastMaintenance}
                    onChange={(event) =>
                      setEquipmentForm((prev) => ({
                        ...prev,
                        lastMaintenance: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="equipment-next-maintenance"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bảo trì tiếp theo
                  </label>
                  <input
                    id="equipment-next-maintenance"
                    type="date"
                    value={equipmentForm.nextMaintenance}
                    onChange={(event) =>
                      setEquipmentForm((prev) => ({
                        ...prev,
                        nextMaintenance: event.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="equipment-price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Giá trị
                </label>
                <input
                  id="equipment-price"
                  type="number"
                  min={0}
                  value={equipmentForm.price}
                  onChange={(event) =>
                    setEquipmentForm((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : action === "add"
                      ? "Thêm Thiết Bị"
                      : "Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
