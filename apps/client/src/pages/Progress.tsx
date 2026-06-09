import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { mockWorkoutProgress, mockMembers } from '../data/mockData';
import { TrendingUp, Calendar, Weight, Activity, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const Progress: React.FC = () => {
  const [progress] = useState(mockWorkoutProgress);
  const [selectedMember, setSelectedMember] = useState<string>(mockMembers[0].id);

  const bodyMetricsData = [
    { date: '01/04', weight: 78, bodyFat: 20, muscleMass: 60 },
    { date: '08/04', weight: 77, bodyFat: 19.5, muscleMass: 60.5 },
    { date: '15/04', weight: 76, bodyFat: 19, muscleMass: 61 },
    { date: '22/04', weight: 75.5, bodyFat: 18.5, muscleMass: 61.5 },
    { date: '01/05', weight: 75, bodyFat: 18, muscleMass: 62 },
  ];

  const currentMember = mockMembers.find((m) => m.id === selectedMember);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Tiến Độ Tập Luyện</h1>
            <p className="text-gray-600 mt-1">
              Theo dõi kết quả và tiến độ tập luyện
            </p>
          </div>
          <div className="min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn hội viên
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {mockMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Cân nặng hiện tại</p>
              <Weight className="text-blue-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">75 kg</p>
            <p className="text-sm text-green-600 mt-1">-3 kg so với ban đầu</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">% Mỡ cơ thể</p>
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">18%</p>
            <p className="text-sm text-green-600 mt-1">-2% so với ban đầu</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Khối lượng cơ</p>
              <Activity className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">62 kg</p>
            <p className="text-sm text-green-600 mt-1">+2 kg so với ban đầu</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Số buổi tập</p>
              <Calendar className="text-purple-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">45</p>
            <p className="text-sm text-gray-600 mt-1">Tháng này: 12 buổi</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Biểu Đồ Thay Đổi Cơ Thể
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={bodyMetricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Cân nặng (kg)"
              />
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="#f59e0b"
                strokeWidth={2}
                name="% Mỡ"
              />
              <Line
                type="monotone"
                dataKey="muscleMass"
                stroke="#10b981"
                strokeWidth={2}
                name="Khối lượng cơ (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Lịch Sử Tập Luyện
          </h3>
          <div className="space-y-4">
            {progress.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(session.date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-sm text-gray-600">{session.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Cân nặng</p>
                    <p className="font-bold text-gray-900">{session.weight} kg</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-600">% Mỡ</p>
                    <p className="font-bold text-gray-900">{session.bodyFat}%</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-600">Khối lượng cơ</p>
                    <p className="font-bold text-gray-900">{session.muscleMass} kg</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-600">Số bài tập</p>
                    <p className="font-bold text-gray-900">
                      {session.exercises.length} bài
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Bài tập đã thực hiện:
                  </p>
                  <div className="space-y-2">
                    {session.exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex items-center justify-between bg-blue-50 rounded p-2"
                      >
                        <span className="font-medium text-blue-900">
                          {exercise.name}
                        </span>
                        <span className="text-sm text-blue-700">
                          {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight}kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
