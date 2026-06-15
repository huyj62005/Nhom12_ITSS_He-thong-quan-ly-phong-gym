import { MembershipPackage } from "@/types";

export type PackageDisplaySource = {
  name?: string;
  duration?: number;
  type?: string;
};

export const normalizePackageDisplayName = (name?: string, type?: string) => {
  const trimmedName = name?.trim();
  if (!trimmedName) return "";

  const searchableName = trimmedName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/\bpt\b.*\b1\s*thang\b/.test(searchableName)) {
    return "Gói PT";
  }

  if (type === "pt" && /\bpt\b.*\b1\b/.test(searchableName)) {
    return "Gói PT";
  }

  return trimmedName;
};

export const getPackageDisplayName = (pkg?: PackageDisplaySource | null) => {
  if (!pkg) return "Chưa có gói tập";

  const name = normalizePackageDisplayName(pkg.name, pkg.type);

  if (name) {
    return name;
  }

  if (pkg.type === "pt") {
    return "Gói PT";
  }

  if (pkg.duration) {
    if (pkg.duration >= 365) return "Gói 12 tháng";
    if (pkg.duration >= 180) return "Gói 6 tháng";
    if (pkg.duration >= 90) return "Gói 3 tháng";
  }

  return "Gói tập";
};

export const isValidDisplayPackage = (pkg: MembershipPackage) =>
  pkg.isActive && Number(pkg.duration) > 0;
