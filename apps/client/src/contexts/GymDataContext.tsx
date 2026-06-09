import React, { createContext, useContext, useEffect, useState } from "react";
import { Member, Payment, MembershipPackage } from "../types";
import { mockMembers, mockPayments, mockPackages } from "../data/mockData";

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
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addPayment: (payment: Payment) => void;
  confirmPayment: (paymentId: string) => void;
  cancelPayment: (paymentId: string) => void;
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

const normalizePackageType = (type?: string): MembershipPackage["type"] => {
  return packageTypes.includes(type as MembershipPackage["type"])
    ? (type as MembershipPackage["type"])
    : "monthly";
};

const mapApiPackage = (apiPackage: ApiGymPackage): MembershipPackage => ({
  id: String(apiPackage.id),
  name: apiPackage.name ?? "",
  description: apiPackage.description ?? "",
  duration: Number(apiPackage.duration ?? apiPackage.durationDays ?? 0),
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
});

const toApiPackagePayload = (membershipPackage: MembershipPackage) => ({
  name: membershipPackage.name,
  description: membershipPackage.description,
  durationDays: membershipPackage.duration,
  price: membershipPackage.price,
  type: membershipPackage.type,
  features: membershipPackage.features,
  isActive: membershipPackage.isActive,
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

// Reset mock members: keep personal info only; package will come from payments
const initialMembers: Member[] = mockMembers.map((m) => ({
  ...m,
  // keep existing package data from mock so demo looks populated
}));

export const GymDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [packages, setPackages] = useState<MembershipPackage[]>(mockPackages);

  useEffect(() => {
    let isMounted = true;

    requestJson<ApiGymPackage[]>("/gym-packages")
      .then((apiPackages) => {
        if (isMounted) {
          setPackages(apiPackages.map(mapApiPackage));
        }
      })
      .catch(() => undefined);

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

  const addMember = (member: Member) => {
    setMembers((prev) => [...prev, member]);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    );
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // const addPayment = (payment: Payment) => {
  //   setPayments((prev) => [...prev, payment]);
  // };

  // When a payment is confirmed (completed), update the member's package
  const confirmPayment = (paymentId: string) => {
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

  const cancelPayment = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "failed" } : p)),
    );
  };

  // When a new payment is added with status=completed, immediately update member
  const addPaymentAndActivate = (payment: Payment) => {
    setPayments((prev) => [...prev, payment]);

    if (payment.status === "completed") {
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
    }
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
