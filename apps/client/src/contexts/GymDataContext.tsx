import React, { createContext, useContext, useEffect, useState } from "react";
import { Member, Payment, MembershipPackage } from "../types";
import { getPackageDisplayName } from "../utils/packageNames";

interface GymDataContextType {
  members: Member[];
  payments: Payment[];
  packages: MembershipPackage[];
  addPackage: (membershipPackage: MembershipPackage) => Promise<MembershipPackage>;
  updatePackage: (
    id: string,
    membershipPackage: MembershipPackage,
  ) => Promise<MembershipPackage>;
  deletePackage: (id: string) => Promise<void>;
  addMember: (member: Member) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  addPayment: (payment: Payment, trainerId?: string) => Promise<Payment>;
  confirmPayment: (paymentId: string) => Promise<void>;
  cancelPayment: (paymentId: string) => Promise<void>;
}

const GymDataContext = createContext<GymDataContextType | undefined>(undefined);
const API_BASE_URL = "http://localhost:3000";

type ApiGymPackage = {
  id: number | string;
  name?: string;
  description?: string;
  duration?: number | string;
  durationDays?: number | string;
  price?: number | string;
  type?: string;
  features?: string[];
  benefits?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
};

type ApiUser = {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
  avatar?: string;
  avatarUrl?: string;
};

type ApiMemberPackage = {
  id?: number | string;
  memberId?: number | string;
  member_id?: number | string;
  packageId?: number | string;
  package_id?: number | string;
  package?: ApiGymPackage;
  currentPackage?: ApiGymPackage | null;
  packageTypeSnapshot?: string;
  package_type_snapshot?: string;
  packageNameSnapshot?: string;
  package_name_snapshot?: string;
  packagePriceSnapshot?: number | string;
  package_price_snapshot?: number | string;
  packageDurationDaysSnapshot?: number | string;
  package_duration_days_snapshot?: number | string;
  packageDescriptionSnapshot?: string;
  package_description_snapshot?: string;
  packageBenefitsSnapshot?: string;
  package_benefits_snapshot?: string;
  trainerId?: number | string;
  trainer_id?: number | string;
  trainerName?: string;
  trainer_name?: string;
  trainer?: ApiUser;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  status?: string;
};

type ApiMember = {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  user?: ApiUser;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  avatar?: string;
  avatarUrl?: string;
  avatar_url?: string;
  membershipStatus?: string;
  membership_status?: string;
  status?: string;
  joinDate?: string;
  join_date?: string;
  memberPackages?: ApiMemberPackage[];
};

type ApiPayment = {
  id?: number | string;
  memberId?: number | string;
  member_id?: number | string;
  member?: ApiMember;
  memberPackageId?: number | string;
  member_package_id?: number | string;
  memberPackage?: ApiMemberPackage;
  amount?: number | string;
  method?: string;
  status?: string;
  paidAt?: string;
  paid_at?: string;
  paymentDate?: string;
  packageId?: number | string;
  packageName?: string;
  processedBy?: string;
  notes?: string;
};

const packageTypes: MembershipPackage["type"][] = [
  "monthly",
  "quarterly",
  "yearly",
  "vip",
  "pt",
];

const parseBenefits = (benefits?: string) => {
  if (!benefits) return [];

  try {
    const parsed = JSON.parse(benefits);
    return Array.isArray(parsed)
      ? parsed.filter((feature): feature is string => typeof feature === "string")
      : [];
  } catch {
    return benefits
      .split(/\r?\n/)
      .map((feature) => feature.trim())
      .filter(Boolean);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertArrayResponse = <T,>(value: unknown, endpoint: string): T[] => {
  if (!Array.isArray(value)) {
    throw new Error(`API ${endpoint} không trả về danh sách hợp lệ`);
  }

  return value as T[];
};

const assertObjectResponse = <T,>(value: unknown, endpoint: string): T => {
  if (!isRecord(value)) {
    throw new Error(`API ${endpoint} không trả về dữ liệu hợp lệ`);
  }

  return value as T;
};

const toDateString = (value?: string | Date) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
};

const normalizePackageType = (type?: string): MembershipPackage["type"] => {
  return packageTypes.includes(type as MembershipPackage["type"])
    ? (type as MembershipPackage["type"])
    : "monthly";
};

const mapApiPackage = (apiPackage: ApiGymPackage): MembershipPackage => {
  const duration = Number(apiPackage.duration ?? apiPackage.durationDays ?? 0);
  const displaySource = {
    name: apiPackage.name ?? "",
    duration,
    ...(apiPackage.type !== undefined ? { type: apiPackage.type } : {}),
  };

  return {
    id: String(apiPackage.id),
    name: getPackageDisplayName(displaySource),
    description: apiPackage.description ?? "",
    duration,
    price: Number(apiPackage.price ?? 0),
    type: normalizePackageType(apiPackage.type),
    features: Array.isArray(apiPackage.features)
      ? apiPackage.features
      : parseBenefits(apiPackage.benefits),
    isActive: apiPackage.isActive ?? apiPackage.status !== "inactive",
    createdAt:
      typeof apiPackage.createdAt === "string"
        ? apiPackage.createdAt.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
  };
};

const normalizeGender = (gender?: string): Member["gender"] => {
  if (gender === "male" || gender === "female" || gender === "other") {
    return gender;
  }

  return "other";
};

const normalizeMemberStatus = (status?: string): Member["membershipStatus"] => {
  if (status === "active" || status === "expired" || status === "suspended") {
    return status;
  }

  return "expired";
};

const normalizePaymentMethod = (method?: string): Payment["method"] => {
  if (method === "bank_transfer" || method === "transfer") return "transfer";
  if (method === "card") return "card";
  return "cash";
};

const normalizePaymentStatus = (status?: string): Payment["status"] => {
  if (status === "paid" || status === "completed") return "completed";
  if (status === "failed" || status === "cancelled") return "failed";
  return "pending";
};

const getCurrentMemberPackage = (
  memberId: string,
  memberPackages: ApiMemberPackage[],
) => {
  const today = new Date().toISOString().slice(0, 10);
  const packagesForMember = memberPackages
    .filter(
      (memberPackage) =>
        String(memberPackage.memberId ?? memberPackage.member_id ?? "") === memberId,
    )
    .sort((a, b) =>
      String(b.endDate ?? b.end_date ?? "").localeCompare(
        String(a.endDate ?? a.end_date ?? ""),
      ),
    );

  return (
    packagesForMember.find(
      (memberPackage) =>
        memberPackage.status === "active" &&
        (!(memberPackage.endDate ?? memberPackage.end_date) ||
          String(memberPackage.endDate ?? memberPackage.end_date).slice(0, 10) >=
            today),
    ) ?? packagesForMember[0]
  );
};

const isActiveMemberPackage = (memberPackage: ApiMemberPackage) => {
  const endDate = memberPackage.endDate ?? memberPackage.end_date;

  return (
    memberPackage.status === "active" &&
    (!endDate || String(endDate).slice(0, 10) >= new Date().toISOString().slice(0, 10))
  );
};

const isPtMemberPackage = (memberPackage: ApiMemberPackage) => {
  const packageType =
    memberPackage.packageTypeSnapshot ??
    memberPackage.package_type_snapshot ??
    memberPackage.package?.type ??
    memberPackage.currentPackage?.type;

  return packageType === "pt";
};

const getActivePtMemberPackage = (memberPackages: ApiMemberPackage[]) =>
  memberPackages
    .filter(
      (memberPackage) =>
        isActiveMemberPackage(memberPackage) && isPtMemberPackage(memberPackage),
    )
    .sort((a, b) =>
      String(b.endDate ?? b.end_date ?? "").localeCompare(
        String(a.endDate ?? a.end_date ?? ""),
      ),
    )[0];

const normalizeMemberPackage = (
  memberPackage: ApiMemberPackage,
  fallbackMemberId?: string,
): ApiMemberPackage => {
  const normalized: ApiMemberPackage = { ...memberPackage };
  const memberId =
    memberPackage.memberId ?? memberPackage.member_id ?? fallbackMemberId;
  const packageId = memberPackage.packageId ?? memberPackage.package_id;
  const startDate = memberPackage.startDate ?? memberPackage.start_date;
  const endDate = memberPackage.endDate ?? memberPackage.end_date;
  const trainerId =
    memberPackage.trainerId ?? memberPackage.trainer_id ?? memberPackage.trainer?.id;
  const trainerName =
    memberPackage.trainerName ??
    memberPackage.trainer_name ??
    memberPackage.trainer?.fullName ??
    memberPackage.trainer?.full_name ??
    memberPackage.trainer?.name;

  if (memberId !== undefined) normalized.memberId = memberId;
  if (packageId !== undefined) normalized.packageId = packageId;
  if (startDate !== undefined) normalized.startDate = startDate;
  if (endDate !== undefined) normalized.endDate = endDate;
  if (trainerId !== undefined) normalized.trainerId = trainerId;
  if (trainerName !== undefined) normalized.trainerName = trainerName;

  return normalized;
};

const hasMemberPackagePackageInfo = (memberPackage: ApiMemberPackage) =>
  Boolean(
    memberPackage.package ??
      memberPackage.currentPackage ??
      memberPackage.packageNameSnapshot ??
      memberPackage.package_name_snapshot,
  );

const mergeMemberPackages = (
  embeddedMemberPackages: ApiMemberPackage[],
  globalMemberPackages: ApiMemberPackage[],
) => {
  const byId = new Map<string, ApiMemberPackage>();

  [...embeddedMemberPackages, ...globalMemberPackages].forEach((memberPackage) => {
    const key = String(memberPackage.id ?? `${memberPackage.memberId ?? ""}-${memberPackage.packageId ?? ""}-${memberPackage.endDate ?? ""}`);
    const existing = byId.get(key);

    if (!existing || (!hasMemberPackagePackageInfo(existing) && hasMemberPackagePackageInfo(memberPackage))) {
      byId.set(key, memberPackage);
    }
  });

  return Array.from(byId.values());
};

const getSnapshotPackage = (
  memberPackage: ApiMemberPackage,
): ApiGymPackage | undefined => {
  const name =
    memberPackage.packageNameSnapshot ?? memberPackage.package_name_snapshot;
  const packageId = memberPackage.packageId ?? memberPackage.package_id;

  if (!name && packageId === undefined) {
    return undefined;
  }

  const snapshotPackage: ApiGymPackage = {
    id: packageId ?? "",
    name: name ?? "",
  };
  const type =
    memberPackage.packageTypeSnapshot ?? memberPackage.package_type_snapshot;
  const price =
    memberPackage.packagePriceSnapshot ?? memberPackage.package_price_snapshot;
  const durationDays =
    memberPackage.packageDurationDaysSnapshot ??
    memberPackage.package_duration_days_snapshot;
  const description =
    memberPackage.packageDescriptionSnapshot ??
    memberPackage.package_description_snapshot;
  const benefits =
    memberPackage.packageBenefitsSnapshot ?? memberPackage.package_benefits_snapshot;

  if (type !== undefined) snapshotPackage.type = type;
  if (price !== undefined) snapshotPackage.price = price;
  if (durationDays !== undefined) snapshotPackage.durationDays = durationDays;
  if (description !== undefined) snapshotPackage.description = description;
  if (benefits !== undefined) snapshotPackage.benefits = benefits;

  return snapshotPackage;
};

const resolveMemberPackagePackage = (
  memberPackage: ApiMemberPackage | undefined,
  packages: ApiGymPackage[],
) => {
  if (!memberPackage) {
    return undefined;
  }

  if (memberPackage.package) {
    return memberPackage.package;
  }

  if (memberPackage.currentPackage) {
    return memberPackage.currentPackage;
  }

  const snapshotPackage = getSnapshotPackage(memberPackage);
  if (snapshotPackage?.name) {
    return snapshotPackage;
  }

  const packageId = String(
    memberPackage.packageId ?? memberPackage.package_id ?? "",
  );

  return packages.find((gymPackage) => String(gymPackage.id) === packageId);
};

const mapApiMember = (
  apiMember: ApiMember,
  memberPackages: ApiMemberPackage[] = [],
  packages: ApiGymPackage[] = [],
): Member => {
  const id = String(apiMember.id ?? "");
  const globalMemberPackages = memberPackages
    .map((memberPackage) => normalizeMemberPackage(memberPackage))
    .filter((memberPackage) => String(memberPackage.memberId ?? "") === id);
  const embeddedMemberPackages = (apiMember.memberPackages ?? []).map(
    (memberPackage) => normalizeMemberPackage(memberPackage, id),
  );
  const ownMemberPackages = mergeMemberPackages(
    embeddedMemberPackages,
    globalMemberPackages,
  );
  const currentMemberPackage = getCurrentMemberPackage(id, ownMemberPackages);
  const activePtMemberPackage = getActivePtMemberPackage(ownMemberPackages);
  const apiPackage = resolveMemberPackagePackage(currentMemberPackage, packages);
  const currentPackage = apiPackage ? mapApiPackage(apiPackage) : undefined;

  const mappedMember: Member = {
    id,
    userId: String(apiMember.userId ?? apiMember.user_id ?? apiMember.user?.id ?? ""),
    name:
      apiMember.fullName ??
      apiMember.full_name ??
      apiMember.name ??
      apiMember.user?.fullName ??
      apiMember.user?.full_name ??
      apiMember.user?.name ??
      "",
    email: apiMember.email ?? apiMember.user?.email ?? "",
    phone: apiMember.phone ?? "",
    dateOfBirth: toDateString(apiMember.dateOfBirth ?? apiMember.date_of_birth),
    gender: normalizeGender(apiMember.gender),
    address: apiMember.address ?? "",
    membershipStatus: currentPackage
      ? normalizeMemberStatus(
          currentMemberPackage?.status ??
            apiMember.membershipStatus ??
            apiMember.membership_status ??
            apiMember.status,
        )
      : "expired",
    joinDate: toDateString(apiMember.joinDate ?? apiMember.join_date),
    packageExpiry: toDateString(
      currentMemberPackage?.endDate ?? currentMemberPackage?.end_date,
    ),
  };
  const avatar =
    apiMember.avatar ??
    apiMember.avatarUrl ??
    apiMember.avatar_url ??
    apiMember.user?.avatar ??
    apiMember.user?.avatarUrl;

  if (currentPackage !== undefined) mappedMember.currentPackage = currentPackage;
  if (activePtMemberPackage !== undefined) {
    mappedMember.hasActivePtPackage = true;
  }
  const trainerSource = activePtMemberPackage ?? currentMemberPackage;
  if (trainerSource?.trainerId !== undefined) {
    mappedMember.trainerId = String(trainerSource.trainerId);
  }
  if (trainerSource?.trainerName !== undefined) {
    mappedMember.trainerName = trainerSource.trainerName;
  }
  if (avatar !== undefined) mappedMember.avatar = avatar;

  return mappedMember;
};

const mapApiPayment = (apiPayment: ApiPayment): Payment => {
  const member = apiPayment.member;
  const memberPackage = apiPayment.memberPackage;
  const apiPackage = memberPackage?.package ?? memberPackage?.currentPackage;
  const packageId =
    apiPayment.packageId ?? memberPackage?.packageId ?? apiPackage?.id ?? "";
  const packageName =
    apiPayment.packageName ??
    (apiPackage ? getPackageDisplayName(mapApiPackage(apiPackage)) : "");

  const mappedPayment: Payment = {
    id: String(apiPayment.id ?? ""),
    memberId: String(apiPayment.memberId ?? apiPayment.member_id ?? member?.id ?? ""),
    memberName:
      member?.fullName ??
      member?.full_name ??
      member?.name ??
      member?.user?.fullName ??
      member?.user?.full_name ??
      member?.user?.name ??
      "",
    amount: Number(apiPayment.amount ?? 0),
    method: normalizePaymentMethod(apiPayment.method),
    status: normalizePaymentStatus(apiPayment.status),
    packageId: String(packageId),
    packageName,
    paymentDate: toDateString(
      apiPayment.paymentDate ?? apiPayment.paidAt ?? apiPayment.paid_at,
    ),
  };

  if (apiPayment.processedBy !== undefined) {
    mappedPayment.processedBy = apiPayment.processedBy;
  }
  if (apiPayment.notes !== undefined) {
    mappedPayment.notes = apiPayment.notes;
  }

  return mappedPayment;
};

const toApiPackagePayload = (membershipPackage: MembershipPackage) => ({
  name: membershipPackage.name,
  description: membershipPackage.description,
  durationDays: membershipPackage.duration,
  price: membershipPackage.price,
  type: membershipPackage.type,
  features: membershipPackage.features,
  isActive: membershipPackage.isActive,
});

const toApiMemberPayload = (member: Member | Partial<Member>) => ({
  userId: Number(member.userId) || undefined,
  fullName: member.name,
  name: member.name,
  email: member.email,
  phone: member.phone,
  dateOfBirth: member.dateOfBirth,
  gender: member.gender,
  address: member.address,
  avatarUrl: member.avatar,
  status: member.membershipStatus,
  memberType: "standard",
});

const toApiPaymentPayload = (
  payment: Payment,
  memberPackageId?: string | number,
) => ({
  memberId: Number(payment.memberId),
  memberPackageId:
    memberPackageId === undefined ? undefined : Number(memberPackageId),
  amount: payment.amount,
  method: payment.method === "transfer" ? "bank_transfer" : payment.method,
  status: "paid",
  notes: payment.notes,
});

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

export const GymDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<MembershipPackage[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const [packagesResult, membersResult, memberPackagesResult, paymentsResult] =
        await Promise.allSettled([
          requestJson<unknown>("/gym-packages"),
          requestJson<unknown>("/members"),
          requestJson<unknown>("/member-packages"),
          requestJson<unknown>("/payments"),
        ]);

      if (!isMounted) return;

      let apiPackages: ApiGymPackage[] = [];
      try {
        apiPackages =
          packagesResult.status === "fulfilled"
            ? assertArrayResponse<ApiGymPackage>(
                packagesResult.value,
                "/gym-packages",
              )
            : [];
        setPackages(apiPackages.map(mapApiPackage));
      } catch (error) {
        console.error(error);
        setPackages([]);
      }

      let apiMemberPackages: ApiMemberPackage[] = [];
      try {
        apiMemberPackages =
          memberPackagesResult.status === "fulfilled"
            ? assertArrayResponse<ApiMemberPackage>(
                memberPackagesResult.value,
                "/member-packages",
              )
            : [];
      } catch (error) {
        console.error(error);
        apiMemberPackages = [];
      }

      try {
        const apiMembers =
          membersResult.status === "fulfilled"
            ? assertArrayResponse<ApiMember>(membersResult.value, "/members")
            : [];
        setMembers(
          apiMembers.map((member) =>
            mapApiMember(member, apiMemberPackages, apiPackages),
          ),
        );
      } catch (error) {
        console.error(error);
        setMembers([]);
      }

      try {
        const apiPayments =
          paymentsResult.status === "fulfilled"
            ? assertArrayResponse<ApiPayment>(paymentsResult.value, "/payments")
            : [];
        setPayments(apiPayments.map(mapApiPayment));
      } catch (error) {
        console.error(error);
        setPayments([]);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const addPackage = async (membershipPackage: MembershipPackage) => {
    const apiPackage = await requestJson<ApiGymPackage>("/gym-packages", {
      method: "POST",
      body: JSON.stringify(toApiPackagePayload(membershipPackage)),
    });
    const savedPackage = mapApiPackage(apiPackage);

    setPackages((prev) => [...prev, savedPackage]);
    return savedPackage;
  };

  const updatePackage = async (
    id: string,
    membershipPackage: MembershipPackage,
  ) => {
    const apiPackage = await requestJson<ApiGymPackage>(`/gym-packages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toApiPackagePayload(membershipPackage)),
    });
    const savedPackage = mapApiPackage(apiPackage);

    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? savedPackage : pkg)),
    );
    return savedPackage;
  };

  const deletePackage = async (id: string) => {
    await requestJson<{ deleted: boolean }>(`/gym-packages/${id}`, {
      method: "DELETE",
    });
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
  };

  const addMember = async (member: Member) => {
    const apiMember = await requestJson<unknown>("/members", {
      method: "POST",
      body: JSON.stringify(toApiMemberPayload(member)),
    });
    const savedMember = mapApiMember(
      assertObjectResponse<ApiMember>(apiMember, "/members"),
    );

    setMembers((prev) => [...prev, savedMember]);
    return savedMember;
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const apiMember = await requestJson<unknown>(`/members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toApiMemberPayload(updates)),
    });
    const savedMember = mapApiMember(
      assertObjectResponse<ApiMember>(apiMember, `/members/${id}`),
    );

    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...savedMember } : m)),
    );
    return savedMember;
  };

  const deleteMember = async (id: string) => {
    await requestJson<unknown>(`/members/${id}`, {
      method: "DELETE",
    });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // When a payment is confirmed (completed), update the member's package
  const confirmPayment = async (paymentId: string) => {
    await requestJson<unknown>(`/payments/${paymentId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "paid" }),
    });
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "completed" } : p)),
    );

    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    const pkg = packages.find((p) => p.id === payment.packageId);
    if (!pkg) return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + pkg.duration);

    setMembers((prev) =>
      prev.map((m) =>
        m.id === payment.memberId
          ? {
              ...m,
              currentPackage: pkg,
              packageExpiry: expiryDate.toISOString().slice(0, 10),
              membershipStatus: "active",
            }
          : m,
      ),
    );
  };

  const cancelPayment = async (paymentId: string) => {
    await requestJson<unknown>(`/payments/${paymentId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "failed" } : p)),
    );
  };

  // When a new payment is added with status=completed, immediately update member
  const addPaymentAndActivate = async (payment: Payment, trainerId?: string) => {
    const pkg = packages.find((p) => p.id === payment.packageId);
    if (!pkg) {
      throw new Error("Không tìm thấy gói tập");
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pkg.duration);

    const apiMemberPackage = await requestJson<unknown>("/member-packages", {
      method: "POST",
      body: JSON.stringify({
        memberId: Number(payment.memberId),
        packageId: Number(payment.packageId),
        trainerId: trainerId ? Number(trainerId) : undefined,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        status: "active",
      }),
    });
    const savedMemberPackage = assertObjectResponse<ApiMemberPackage>(
      apiMemberPackage,
      "/member-packages",
    );
    const apiPayment = await requestJson<unknown>("/payments", {
      method: "POST",
      body: JSON.stringify(toApiPaymentPayload(payment, savedMemberPackage.id)),
    });
    const savedPayment = mapApiPayment(
      assertObjectResponse<ApiPayment>(apiPayment, "/payments"),
    );

    setPayments((prev) => [...prev, savedPayment]);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === payment.memberId
          ? {
              ...m,
              currentPackage: pkg,
              packageExpiry:
                toDateString(savedMemberPackage.endDate) ||
                endDate.toISOString().slice(0, 10),
              membershipStatus: "active",
              ...(savedMemberPackage.trainerId !== undefined
                ? { trainerId: String(savedMemberPackage.trainerId) }
                : {}),
              ...(savedMemberPackage.trainerName !== undefined
                ? { trainerName: savedMemberPackage.trainerName }
                : {}),
              ...(pkg.type === "pt" ? { hasActivePtPackage: true } : {}),
            }
          : m,
      ),
    );

    return savedPayment;
  };

  return (
    <GymDataContext.Provider
      value={{
        members,
        payments,
        packages,
        addPackage,
        updatePackage,
        deletePackage,
        addMember,
        updateMember,
        deleteMember,
        addPayment: addPaymentAndActivate,
        confirmPayment,
        cancelPayment,
      }}
    >
      {children}
    </GymDataContext.Provider>
  );
};

export const useGymData = () => {
  const ctx = useContext(GymDataContext);
  if (!ctx) throw new Error("useGymData must be used within GymDataProvider");
  return ctx;
};
