import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Home } from "lucide-react";

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
          <ShieldAlert className="text-red-600" size={48} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Không Có Quyền Truy Cập
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Bạn không có quyền truy cập vào trang này.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home size={20} />
          Về Trang Chủ
        </Link>
      </div>
    </div>
  );
};
