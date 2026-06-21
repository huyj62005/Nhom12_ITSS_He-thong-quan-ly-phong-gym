import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { normalizePackageDisplayName } from "../utils/packageNames";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getScopedGymRoomId } from "../utils/accessScope";

const API_BASE_URL = "http://localhost:3000";

type ReportMember = {
  id?: number | string;
  gymRoomId?: number | string;
  facilityId?: number | string;
  joinDate?: string;
  join_date?: string;
  status?: string;
  membershipStatus?: string;
};

type ReportGymPackage = {
  id?: number | string;
  name?: string;
  duration?: number | string;
  durationDays?: number | string;
  type?: string;
  status?: string;
  isActive?: boolean;
};

type ReportPayment = {
  gymRoomId?: number | string;
  facilityId?: number | string;
  amount?: number | string;
  status?: string;
  paidAt?: string;
  paid_at?: string;
  paymentDate?: string;
};

type ReportSchedule = {
  gymRoomId?: number | string;
  facilityId?: number | string;
  startTime?: string;
  start_time?: string;
  date?: string;
  status?: string;
};

type ReportEquipment = {
  gymRoomId?: number | string;
  facilityId?: number | string;
  status?: string;
  needsMaintenanceSoon?: boolean;
  maintenanceState?: {
    overdue?: boolean;
    dueSoon?: boolean;
  };
};

type ReportMemberPackage = {
  memberId?: number | string;
  member_id?: number | string;
  packageId?: number | string;
  package_id?: number | string;
  packageNameSnapshot?: string;
  package_name_snapshot?: string;
  package?: ReportGymPackage;
  currentPackage?: ReportGymPackage | null;
  endDate?: string;
  end_date?: string;
  status?: string;
};

type ReportStats = {
  totalRevenue: number;
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  revenueThisMonth: number;
  scheduledSessions: number;
  equipmentMaintenance: number;
};

type RevenueRow = {
  month: string;
  revenue: number;
  members: number;
};

const emptyStats: ReportStats = {
  totalRevenue: 0,
  totalMembers: 0,
  activeMembers: 0,
  newMembersThisMonth: 0,
  revenueThisMonth: 0,
  scheduledSessions: 0,
  equipmentMaintenance: 0,
};

const requestJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Request failed with ${response.status}`);
  }

  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
};

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);

const getDateString = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toISOString().slice(0, 10);
};

const getPaymentDate = (payment: ReportPayment) =>
  getDateString(payment.paymentDate ?? payment.paidAt ?? payment.paid_at);

const isPaidPayment = (payment: ReportPayment) =>
  payment.status === "paid" || payment.status === "completed";

const toLocalDateStart = (value?: string) => {
  if (!value) return null;
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
};

const isActivePackage = (memberPackage: ReportMemberPackage) => {
  if (memberPackage.status !== "active") return false;

  const endDate = toLocalDateStart(
    memberPackage.endDate ?? memberPackage.end_date,
  );
  if (!endDate) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return endDate >= today;
};

const getMemberPackageId = (memberPackage: ReportMemberPackage) =>
  String(
    memberPackage.packageId ??
      memberPackage.package_id ??
      memberPackage.currentPackage?.id ??
      memberPackage.package?.id ??
      "",
  );

const getPackageName = (
  memberPackage: ReportMemberPackage,
  packagesById: Map<string, ReportGymPackage>,
) => {
  const packageId = getMemberPackageId(memberPackage);
  const pkg =
    (packageId ? packagesById.get(packageId) : undefined) ??
    memberPackage.currentPackage ??
    memberPackage.package;
  const name = normalizePackageDisplayName(
    pkg?.name ??
      memberPackage.packageNameSnapshot ??
      memberPackage.package_name_snapshot ??
      "",
    pkg?.type,
  );
  const duration = Number(pkg?.duration ?? pkg?.durationDays ?? 0);

  if (name.trim()) return name.trim();
  if (pkg?.type === "pt") return "Gói PT";
  if (duration >= 360) return "Gói 12 tháng";
  if (duration >= 180) return "Gói 6 tháng";
  if (duration >= 80) return "Gói 3 tháng";
  return "Gói tập";
};

const encoder = new TextEncoder();

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

const getCrc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  data.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
};

const pushUint16 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff);
};

const pushUint32 = (target: number[], value: number) => {
  target.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
};

const getDosDateTime = (date: Date) => {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { dosDate, time };
};

const createZipBlob = (files: { name: string; content: string }[]) => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const { dosDate, time } = getDosDateTime(now);

  files.forEach((file) => {
    const fileName = encoder.encode(file.name);
    const content = encoder.encode(file.content);
    const crc = getCrc32(content);
    const localHeader: number[] = [];

    pushUint32(localHeader, 0x04034b50);
    pushUint16(localHeader, 20);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, time);
    pushUint16(localHeader, dosDate);
    pushUint32(localHeader, crc);
    pushUint32(localHeader, content.length);
    pushUint32(localHeader, content.length);
    pushUint16(localHeader, fileName.length);
    pushUint16(localHeader, 0);

    localParts.push(new Uint8Array(localHeader), fileName, content);

    const centralHeader: number[] = [];
    pushUint32(centralHeader, 0x02014b50);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, time);
    pushUint16(centralHeader, dosDate);
    pushUint32(centralHeader, crc);
    pushUint32(centralHeader, content.length);
    pushUint32(centralHeader, content.length);
    pushUint16(centralHeader, fileName.length);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, 0);
    pushUint32(centralHeader, offset);

    centralParts.push(new Uint8Array(centralHeader), fileName);
    offset += localHeader.length + fileName.length + content.length;
  });

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord: number[] = [];
  pushUint32(endRecord, 0x06054b50);
  pushUint16(endRecord, 0);
  pushUint16(endRecord, 0);
  pushUint16(endRecord, files.length);
  pushUint16(endRecord, files.length);
  pushUint32(endRecord, centralSize);
  pushUint32(endRecord, offset);
  pushUint16(endRecord, 0);

  const toArrayBuffer = (part: Uint8Array) =>
    part.buffer.slice(
      part.byteOffset,
      part.byteOffset + part.byteLength,
    ) as ArrayBuffer;
  const blobParts: BlobPart[] = [
    ...localParts.map(toArrayBuffer),
    ...centralParts.map(toArrayBuffer),
    toArrayBuffer(new Uint8Array(endRecord)),
  ];

  return new Blob(blobParts, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

const escapeXml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const createReportWorkbook = (rows: [string, string | number][]) => {
  const sheetRows = rows
    .map(
      ([label, value], rowIndex) => `
        <row r="${rowIndex + 1}">
          <c r="A${rowIndex + 1}" t="inlineStr"><is><t>${escapeXml(label)}</t></is></c>
          <c r="B${rowIndex + 1}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>
        </row>`,
    )
    .join("");

  return createZipBlob([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
          <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
        </Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
        </Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sheets>
            <sheet name="Bao cao" sheetId="1" r:id="rId1"/>
          </sheets>
        </workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
        </Relationships>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?>
        <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
          <sheetData>${sheetRows}</sheetData>
        </worksheet>`,
    },
  ]);
};

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const scopedGymRoomId = getScopedGymRoomId(user);
  const [stats, setStats] = useState<ReportStats>(emptyStats);
  const [revenueData, setRevenueData] = useState<RevenueRow[]>([]);
  const [memberPackages, setMemberPackages] = useState<ReportMemberPackage[]>([]);
  const [gymPackages, setGymPackages] = useState<ReportGymPackage[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchReportData = async () => {
      const [
        paymentsResult,
        membersResult,
        schedulesResult,
        equipmentResult,
        memberPackagesResult,
        gymPackagesResult,
      ] =
        await Promise.allSettled([
          requestJson<unknown>("/payments"),
          requestJson<unknown>("/members"),
          requestJson<unknown>("/training-schedules"),
          requestJson<unknown>("/equipments"),
          requestJson<unknown>("/member-packages"),
          requestJson<unknown>("/gym-packages"),
        ]);

      if (!isMounted) return;

      const rawPayments =
        paymentsResult.status === "fulfilled"
          ? toArray<ReportPayment>(paymentsResult.value)
          : [];
      const rawMembers =
        membersResult.status === "fulfilled"
          ? toArray<ReportMember>(membersResult.value)
          : [];
      const rawSchedules =
        schedulesResult.status === "fulfilled"
          ? toArray<ReportSchedule>(schedulesResult.value)
          : [];
      const rawEquipment =
        equipmentResult.status === "fulfilled"
          ? toArray<ReportEquipment>(equipmentResult.value)
          : [];
      const rawPackageRows =
        memberPackagesResult.status === "fulfilled"
          ? toArray<ReportMemberPackage>(memberPackagesResult.value)
          : [];
      const gymPackageRows =
        gymPackagesResult.status === "fulfilled"
          ? toArray<ReportGymPackage>(gymPackagesResult.value)
          : [];
      const matchesScope = (item: { gymRoomId?: number | string; facilityId?: number | string }) =>
        !scopedGymRoomId ||
        String(item.gymRoomId ?? item.facilityId ?? "") === scopedGymRoomId;
      const members = rawMembers.filter(matchesScope);
      const scopedMemberIds = new Set(
        members.map((member) => String(member.id ?? "")).filter(Boolean),
      );
      const payments = rawPayments.filter(matchesScope);
      const schedules = rawSchedules.filter(matchesScope);
      const equipment = rawEquipment.filter(matchesScope);
      const packageRows = scopedGymRoomId
        ? rawPackageRows.filter((memberPackage) =>
            scopedMemberIds.has(
              String(memberPackage.memberId ?? memberPackage.member_id ?? ""),
            ),
          )
        : rawPackageRows;

      const today = new Date().toISOString().slice(0, 10);
      const currentMonth = today.slice(0, 7);
      const paidPayments = payments.filter(isPaidPayment);
      const activeMemberIds = new Set(
        packageRows
          .filter(isActivePackage)
          .map((memberPackage) =>
            String(memberPackage.memberId ?? memberPackage.member_id ?? ""),
          )
          .filter(Boolean),
      );

      setStats({
        totalRevenue: paidPayments.reduce(
          (sum, payment) => sum + Number(payment.amount ?? 0),
          0,
        ),
        totalMembers: members.length,
        activeMembers: members.filter((member) =>
          activeMemberIds.has(String(member.id ?? "")),
        ).length,
        newMembersThisMonth: members.filter((member) =>
          getDateString(member.joinDate ?? member.join_date).startsWith(
            currentMonth,
          ),
        ).length,
        revenueThisMonth: paidPayments
          .filter((payment) => getPaymentDate(payment).startsWith(currentMonth))
          .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
        scheduledSessions: schedules.filter(
          (schedule) =>
            getDateString(schedule.date ?? schedule.startTime ?? schedule.start_time) ===
              today &&
            (schedule.status === undefined || schedule.status === "scheduled"),
        ).length,
        equipmentMaintenance: equipment.filter(
          (item) =>
            item.status === "maintenance" ||
            item.needsMaintenanceSoon === true ||
            item.maintenanceState?.overdue === true ||
            item.maintenanceState?.dueSoon === true,
        ).length,
      });

      setRevenueData(
        Array.from({ length: 7 }, (_, index) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (6 - index));
          const key = date.toISOString().slice(0, 7);
          return {
            month: `T${date.getMonth() + 1}`,
            revenue: paidPayments
              .filter((payment) => getPaymentDate(payment).startsWith(key))
              .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
            members: members.filter((member) =>
              getDateString(member.joinDate ?? member.join_date).startsWith(key),
            ).length,
          };
        }),
      );
      setMemberPackages(packageRows);
      setGymPackages(gymPackageRows);
    };

    fetchReportData().catch((error) => {
      console.error(error);
      if (isMounted) {
        setStats(emptyStats);
        setRevenueData([]);
        setMemberPackages([]);
        setGymPackages([]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [scopedGymRoomId]);

  const handleExportReport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const workbook = createReportWorkbook([
      ["Tổng doanh thu", formatCurrency(stats.totalRevenue)],
      ["Tổng hội viên", stats.totalMembers],
      ["Doanh thu tháng", formatCurrency(stats.revenueThisMonth)],
      ["Hội viên mới tháng này", stats.newMembersThisMonth],
    ]);
    const url = URL.createObjectURL(workbook);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-gym-${today}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const membershipData = [
    { name: "Hoạt động", value: stats.activeMembers, color: "#10b981" },
    {
      name: "Hết hạn",
      value: stats.totalMembers - stats.activeMembers,
      color: "#ef4444",
    },
  ];

  const packageData = useMemo(() => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#8b5cf6",
      "#f59e0b",
      "#ef4444",
      "#06b6d4",
      "#84cc16",
    ];
    const packagesById = new Map(
      gymPackages
        .filter((pkg) => pkg.id !== undefined)
        .map((pkg) => [String(pkg.id), pkg]),
    );
    const counts = memberPackages
      .filter(isActivePackage)
      .reduce<Record<string, number>>(
      (result, memberPackage) => {
        const name = getPackageName(memberPackage, packagesById);
        result[name] = (result[name] ?? 0) + 1;
        return result;
      },
      {},
    );

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length] ?? "#3b82f6",
    }));
  }, [memberPackages, gymPackages]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Báo Cáo & Thống Kê
            </h1>
            <p className="text-gray-600 mt-1">
              Tổng quan hiệu suất và phân tích dữ liệu
            </p>
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            Xuất Báo Cáo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp size={32} />
            </div>
            <p className="text-blue-100 text-sm">Tổng Doanh Thu</p>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Users size={32} />
            </div>
            <p className="text-green-100 text-sm">Tổng Hội Viên</p>
            <p className="text-3xl font-bold mt-2">{stats.totalMembers}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign size={32} />
            </div>
            <p className="text-purple-100 text-sm">Doanh Thu Tháng</p>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(stats.revenueThisMonth)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Calendar size={32} />
            </div>
            <p className="text-orange-100 text-sm">HV Mới Tháng Này</p>
            <p className="text-3xl font-bold mt-2">
              {stats.newMembersThisMonth}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Doanh Thu 7 Tháng Gần Nhất
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
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
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="#10b981"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Trạng Thái Hội Viên
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {membershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Phân Bố Gói Tập
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={packageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {packageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Bảng Dữ Liệu Chi Tiết
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tháng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Doanh Thu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số Hội Viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tăng Trưởng
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenueData.map((data, index) => {
                  const prevRevenue =
                    index > 0
                      ? (revenueData[index - 1]?.revenue ?? data.revenue)
                      : data.revenue;
                  const growth =
                    prevRevenue === 0
                      ? data.revenue > 0
                        ? 100
                        : 0
                      : ((data.revenue - prevRevenue) / prevRevenue) * 100;
                  return (
                    <tr key={data.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {data.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatCurrency(data.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {data.members}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`${
                            growth >= 0 ? "text-green-600" : "text-red-600"
                          } font-medium`}
                        >
                          {growth >= 0 ? "+" : ""}
                          {growth.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

