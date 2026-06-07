import React, { createContext, useContext, useState } from "react";
import { Member, Payment, MembershipPackage } from "../types";
import { mockMembers, mockPayments, mockPackages } from "../data/mockData";

interface GymDataContextType {
  members: Member[];
  payments: Payment[];
  packages: MembershipPackage[];
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addPayment: (payment: Payment) => void;
  confirmPayment: (paymentId: string) => void;
  cancelPayment: (paymentId: string) => void;
}

const GymDataContext = createContext<GymDataContextType | undefined>(undefined);

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
  const packages = mockPackages;

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
