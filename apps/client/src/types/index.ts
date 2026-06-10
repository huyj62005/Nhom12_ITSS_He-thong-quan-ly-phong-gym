// User and Authentication Types
export type UserRole = "admin" | "manager" | "cashier" | "trainer" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Member Types
export interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  membershipStatus: "active" | "expired" | "suspended";
  joinDate: string;
  currentPackage?: MembershipPackage;
  packageExpiry?: string;
  avatar?: string;
}

// Membership Package Types
export interface MembershipPackage {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  price: number;
  type: "monthly" | "quarterly" | "yearly" | "vip" | "pt";
  features: string[];
  isActive: boolean;
  createdAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  method: "cash" | "transfer" | "card";
  status: "pending" | "completed" | "failed";
  packageId: string;
  packageName: string;
  paymentDate: string;
  processedBy?: string;
  notes?: string;
}

// Trainer Types
export interface Trainer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  experience: number; // years
  rating: number;
  avatar?: string;
  bio: string;
  isAvailable: boolean;
}

// Schedule Types
export interface Schedule {
  id: string;
  memberId: string;
  memberName: string;
  trainerId?: string;
  trainerName?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "personal" | "pt" | "class";
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
}

// Workout Progress Types
export interface WorkoutProgress {
  id: string;
  memberId: string;
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  notes: string;
  exercises: Exercise[];
  trainerId?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

// Equipment Types
export interface Equipment {
  id: string;
  name: string;
  category: string;
  status: "available" | "maintenance" | "broken";
  purchaseDate: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  cost: number;
  needsMaintenanceSoon?: boolean;
  maintenanceState?: {
    overdue: boolean;
    dueSoon: boolean;
    daysUntilMaintenance: number | null;
  };
}

// Feedback Types
export interface Feedback {
  id: string;
  memberId: string;
  memberName: string;
  subject: string;
  message: string;
  status: "pending" | "in-progress" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  response?: string;
}

// Statistics Types
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  pendingPayments: number;
  scheduledSessions: number;
  equipmentMaintenance: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  members: number;
}
