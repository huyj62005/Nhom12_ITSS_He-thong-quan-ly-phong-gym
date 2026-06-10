import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  TrendingUp,
  User,
  Weight,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";
import { useGymData } from "../contexts/GymDataContext";

const API_BASE_URL = "http://localhost:3000";

type ApiProgress = {
  id?: number | string;
  memberId?: number | string;
  date?: string;
  recordedAt?: string;
  weight?: number | string;
  bodyWeight?: number | string;
  bodyFat?: number | string;
  bodyFatPercent?: number | string;
  muscleMass?: number | string;
  notes?: string;
  evaluation?: string;
  exercises?: Array<{
    id?: number | string;
    name?: string;
    sets?: number;
    reps?: number;
    weight?: number;
  }>;
};

type ProgressItem = {
  id: string;
  memberId: string;
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
  notes: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
};

const requestJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Request failed with ${response.status}`);
  }

  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
};

const toDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value.slice(0, 10)
    : date.toISOString().slice(0, 10);
};

const mapApiProgress = (item: ApiProgress): ProgressItem => ({
  id: String(item.id ?? ""),
  memberId: String(item.memberId ?? ""),
  date: toDate(item.date ?? item.recordedAt),
  weight: Number(item.weight ?? item.bodyWeight ?? 0),
  bodyFat: Number(item.bodyFat ?? item.bodyFatPercent ?? 0),
  muscleMass: Number(item.muscleMass ?? 0),
  notes: item.notes ?? item.evaluation ?? "",
  exercises: (item.exercises ?? []).map((exercise) => ({
    id: String(exercise.id ?? ""),
    name: exercise.name ?? "",
    sets: Number(exercise.sets ?? 0),
    reps: Number(exercise.reps ?? 0),
    weight: Number(exercise.weight ?? 0),
  })),
});

export const Progress: React.FC = () => {
  const { members } = useGymData();
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [selectedMember, setSelectedMember] = useState("");

  useEffect(() => {
    if (!selectedMember && members[0]) {
      setSelectedMember(members[0].id);
    }
  }, [members, selectedMember]);

  useEffect(() => {
    let isMounted = true;

    requestJson<unknown>("/training-progress")
      .then((apiProgress) => {
        if (isMounted) {
          setProgress(
            Array.isArray(apiProgress)
              ? apiProgress.map((item) => mapApiProgress(item as ApiProgress))
              : [],
          );
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) setProgress([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const memberProgress = progress
    .filter((item) => item.memberId === selectedMember)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestProgress = memberProgress.at(-1);
  const firstProgress = memberProgress[0];
  const chartData = useMemo(
    () =>
      memberProgress.map((item) => ({
        date: item.date ? new Date(item.date).toLocaleDateString("vi-VN") : "",
        weight: item.weight,
        bodyFat: item.bodyFat,
        muscleMass: item.muscleMass,
      })),
    [memberProgress],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Tiến độ tập luyện
            </h1>
            <p className="text-gray-600 mt-1">
              Theo dõi kết quả và tiến độ tập luyện từ dữ liệu hệ thống
            </p>
          </div>
          <div className="min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn hội viên
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Cân nặng hiện tại"
            value={`${latestProgress?.weight ?? 0} kg`}
            hint={
              firstProgress && latestProgress
                ? `${latestProgress.weight - firstProgress.weight} kg so với ban đầu`
                : "Chưa có dữ liệu"
            }
            icon={<Weight className="text-blue-600" size={24} />}
          />
          <StatCard
            label="% mỡ cơ thể"
            value={`${latestProgress?.bodyFat ?? 0}%`}
            hint="Theo bản ghi mới nhất"
            icon={<TrendingUp className="text-orange-600" size={24} />}
          />
          <StatCard
            label="Khối lượng cơ"
            value={`${latestProgress?.muscleMass ?? 0} kg`}
            hint="Theo bản ghi mới nhất"
            icon={<Activity className="text-green-600" size={24} />}
          />
          <StatCard
            label="Số bản ghi"
            value={memberProgress.length}
            hint="Từ database"
            icon={<Calendar className="text-purple-600" size={24} />}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Biểu đồ thay đổi cơ thể
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" name="Cân nặng (kg)" />
              <Line type="monotone" dataKey="bodyFat" stroke="#f59e0b" name="% mỡ" />
              <Line type="monotone" dataKey="muscleMass" stroke="#10b981" name="Khối lượng cơ (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Lịch sử tập luyện
          </h3>
          <div className="space-y-4">
            {memberProgress.length === 0 ? (
              <p className="text-sm text-gray-500">
                Chưa có dữ liệu tiến độ cho hội viên này.
              </p>
            ) : (
              memberProgress.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(session.date).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="text-sm text-gray-600">{session.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Cân nặng</p>
                      <p className="font-bold text-gray-900">{session.weight} kg</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-2">
      <p className="text-gray-600 text-sm">{label}</p>
      {icon}
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600 mt-1">{hint}</p>
  </div>
);
