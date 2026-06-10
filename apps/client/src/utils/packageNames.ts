export type PackageDisplaySource = {
  name?: string;
  duration?: number;
  type?: string;
};

const normalizeText = (value?: string) => (value || "").toLowerCase();

export const getPackageDisplayName = (pkg?: PackageDisplaySource | null) => {
  if (!pkg) return "Chưa có gói tập";

  const name = normalizeText(pkg.name);

  if (pkg.type === "pt" || name.includes("pt")) {
    return "Gói PT";
  }

  if (pkg.duration) {
    if (pkg.duration >= 365) return "Gói 12 tháng";
    if (pkg.duration >= 180) return "Gói 6 tháng";
    if (pkg.duration >= 90) return "Gói 3 tháng";
  }

  if (name.includes("12") || name.includes("năm") || name.includes("vip")) {
    return "Gói 12 tháng";
  }

  if (name.includes("6")) {
    return "Gói 6 tháng";
  }

  if (name.includes("3") || name.includes("quý") || name.includes("premium")) {
    return "Gói 3 tháng";
  }

  return "Gói 3 tháng";
};

export const isValidDisplayPackage = (pkg: PackageDisplaySource) =>
  pkg.type === "pt" || [90, 180, 365].includes(Number(pkg.duration));
