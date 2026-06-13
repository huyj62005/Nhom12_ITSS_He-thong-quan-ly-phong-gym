import { MembershipPackage } from "@/types";

export type PackageDisplaySource = {
  name?: string;
  duration?: number;
  type?: string;
};

export const getPackageDisplayName = (pkg?: PackageDisplaySource | null) => {
  if (!pkg) return "Chưa có gói tập";

  const name = pkg.name?.trim();

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
