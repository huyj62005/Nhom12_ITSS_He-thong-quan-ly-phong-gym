import React, { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { mockFeedback } from "../data/mockData";
import { MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Feedback } from "../types";

export const FeedbackPage: React.FC = () => {
  const [feedbacks] = useState<Feedback[]>(mockFeedback);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredFeedbacks = feedbacks.filter(
    (fb) => filterStatus === "all" || fb.status === filterStatus,
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "resolved":
        return "Đã giải quyết";
      case "in-progress":
        return "Đang xử lý";
      case "pending":
        return "Chờ xử lý";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Cao";
      case "medium":
        return "Trung bình";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  const pendingCount = feedbacks.filter((f) => f.status === "pending").length;
  const inProgressCount = feedbacks.filter(
    (f) => f.status === "in-progress",
  ).length;
  const resolvedCount = feedbacks.filter((f) => f.status === "resolved").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phản Hồi</h1>
          <p className="text-gray-600 mt-1">
            Quản lý phản hồi và yêu cầu từ hội viên
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Chờ xử lý</p>
              <Clock className="text-yellow-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Đang xử lý</p>
              <AlertCircle className="text-blue-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {inProgressCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Đã giải quyết</p>
              <CheckCircle2 className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{resolvedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === "pending"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Chờ xử lý
              </button>
              <button
                onClick={() => setFilterStatus("in-progress")}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === "in-progress"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Đang xử lý
              </button>
              <button
                onClick={() => setFilterStatus("resolved")}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === "resolved"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Đã giải quyết
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          feedback.priority,
                        )}`}
                      >
                        {getPriorityText(feedback.priority)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          feedback.status,
                        )}`}
                      >
                        {getStatusText(feedback.status)}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {feedback.subject}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Từ: {feedback.memberName}
                    </p>
                  </div>
                  <MessageSquare className="text-gray-400" size={20} />
                </div>

                <p className="text-gray-700 mb-3">{feedback.message}</p>

                {feedback.response && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Phản hồi:
                    </p>
                    <p className="text-sm text-blue-800">{feedback.response}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      Bởi {feedback.resolvedBy} -{" "}
                      {feedback.resolvedAt &&
                        new Date(feedback.resolvedAt).toLocaleDateString(
                          "vi-VN",
                        )}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {new Date(feedback.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  {feedback.status !== "resolved" && (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                        Phản hồi
                      </button>
                      <button className="px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">
                        Đánh dấu đã giải quyết
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
