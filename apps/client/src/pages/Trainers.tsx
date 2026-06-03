import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { mockTrainers } from "../data/mockData";
import { Plus, Star, Mail, Phone } from "lucide-react";
import { Trainer } from "../types";

export const Trainers: React.FC = () => {
  const [trainers] = useState<Trainer[]>(mockTrainers);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Huấn Luyện Viên
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý đội ngũ huấn luyện viên
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            Thêm HLV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={trainer.avatar}
                    alt={trainer.name}
                    className="w-20 h-20 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {trainer.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star
                        size={16}
                        className="text-yellow-500 fill-yellow-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {trainer.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({trainer.experience} năm KN)
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">{trainer.bio}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{trainer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{trainer.phone}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Chuyên môn:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trainer.specialization.map((spec, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Xem Chi Tiết
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg border ${
                      trainer.isAvailable
                        ? "border-green-500 text-green-700 bg-green-50"
                        : "border-gray-300 text-gray-500 bg-gray-50"
                    }`}
                  >
                    {trainer.isAvailable ? "Sẵn sàng" : "Bận"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};
