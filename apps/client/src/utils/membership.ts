import type { Member } from "../types";

const toLocalDateStart = (value: string) => {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
};

export const isMemberPackageStillValid = (
  member?: Pick<Member, "currentPackage" | "membershipStatus" | "packageExpiry"> | null,
) => {
  if (!member?.currentPackage || member.membershipStatus !== "active") {
    return false;
  }

  if (!member.packageExpiry) {
    return true;
  }

  const expiryDate = toLocalDateStart(member.packageExpiry);
  if (!expiryDate) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return expiryDate >= today;
};
