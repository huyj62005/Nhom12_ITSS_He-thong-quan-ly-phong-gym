import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import { Feedback } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useGymData } from '../contexts/GymDataContext';

const API_BASE_URL = 'http://localhost:3000';

type ApiUser = {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
};

type ApiMember = {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
  user?: ApiUser;
};

type ApiFeedback = {
  id?: number | string;
  memberId?: number | string;
  member_id?: number | string;
  member?: ApiMember;
  title?: string;
  subject?: string;
  content?: string;
  message?: string;
  priority?: string;
  status?: string;
  adminReply?: string;
  admin_reply?: string;
  response?: string;
  resolvedBy?: string;
  resolved_by?: string;
  createdAt?: string;
  created_at?: string;
  resolvedAt?: string;
  resolved_at?: string;
};

const requestJson = async <T,>(
  path: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Request failed with ${response.status}`);
  }

  return responseText ? (JSON.parse(responseText) as T) : (undefined as T);
};

const normalizeFeedbackStatus = (status?: string): Feedback['status'] => {
  if (status === 'resolved') return 'resolved';
  if (status === 'in_progress' || status === 'in-progress') return 'in-progress';
  return 'pending';
};

const normalizePriority = (priority?: string): Feedback['priority'] => {
  if (priority === 'low' || priority === 'high') return priority;
  return 'medium';
};

const mapApiFeedback = (feedback: ApiFeedback): Feedback => {
  const mappedFeedback: Feedback = {
    id: String(feedback.id ?? ''),
    memberId: String(feedback.memberId ?? feedback.member_id ?? feedback.member?.id ?? ''),
    memberName:
      feedback.member?.fullName ??
      feedback.member?.full_name ??
      feedback.member?.name ??
      feedback.member?.user?.fullName ??
      feedback.member?.user?.full_name ??
      feedback.member?.user?.name ??
      '',
    subject: feedback.subject ?? feedback.title ?? '',
    message: feedback.message ?? feedback.content ?? '',
    status: normalizeFeedbackStatus(feedback.status),
    priority: normalizePriority(feedback.priority),
    createdAt: feedback.createdAt ?? feedback.created_at ?? new Date().toISOString(),
  };

  const resolvedBy = feedback.resolvedBy ?? feedback.resolved_by;
  const resolvedAt = feedback.resolvedAt ?? feedback.resolved_at;
  const response = feedback.response ?? feedback.adminReply ?? feedback.admin_reply;

  if (resolvedBy !== undefined) mappedFeedback.resolvedBy = resolvedBy;
  if (resolvedAt !== undefined) mappedFeedback.resolvedAt = resolvedAt;
  if (response !== undefined) mappedFeedback.response = response;

  return mappedFeedback;
};

export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const { members } = useGymData();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<Feedback | null>(null);
  const [confirmResolveFeedback, setConfirmResolveFeedback] =
    useState<Feedback | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newFeedback, setNewFeedback] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const currentMember = user
    ? members.find(
        (member) =>
          member.userId === user.id ||
          (!member.userId && member.email === user.email),
      )
    : undefined;

  useEffect(() => {
    let isMounted = true;

    requestJson<unknown>('/feedbacks')
      .then((apiFeedbacks) => {
        if (isMounted) {
          setFeedbacks(
            Array.isArray(apiFeedbacks)
              ? apiFeedbacks.map(mapApiFeedback)
              : [],
          );
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setFeedbacks([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Member chỉ nhìn thấy phản hồi của chính họ
  // Admin/Manager nhìn thấy tất cả
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesStatus = filterStatus === 'all' || fb.status === filterStatus;

    if (user?.role === 'member') {
      return matchesStatus && fb.memberId === currentMember?.id;
    }

    // Admin và Manager nhìn thấy tất cả
    return matchesStatus;
  });

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMember) {
      alert('Không tìm thấy hồ sơ hội viên của tài khoản hiện tại.');
      return;
    }

    try {
      const apiFeedback = await requestJson<unknown>('/feedbacks', {
        method: 'POST',
        body: JSON.stringify({
          memberId: Number(currentMember.id),
          title: newFeedback.subject,
          content: newFeedback.message,
          priority: newFeedback.priority,
          status: 'pending',
        }),
      });

      if (typeof apiFeedback !== 'object' || apiFeedback === null) {
        throw new Error('API /feedbacks khong tra ve du lieu hop le');
      }

      setFeedbacks((current) => [
        mapApiFeedback(apiFeedback as ApiFeedback),
        ...current,
      ]);
      setNewFeedback({
        subject: '',
        message: '',
        priority: 'medium',
      });
      setShowModal(false);
      alert('Phan hoi cua ban da duoc gui den quan tri vien!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Khong the gui phan hoi!');
    }
  };
  const openReplyModal = (feedback: Feedback) => {
    setReplyFeedback(feedback);
    setReplyContent(feedback.response || '');
  };

  const closeReplyModal = () => {
    setReplyFeedback(null);
    setReplyContent('');
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyFeedback || !replyContent.trim()) return;

    try {
      const apiFeedback = await requestJson<unknown>(
        `/feedbacks/${replyFeedback.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            adminReply: replyContent.trim(),
            response: replyContent.trim(),
            status: 'in_progress',
          }),
        },
      );
      const updatedFeedback =
        typeof apiFeedback === 'object' && apiFeedback !== null
          ? mapApiFeedback(apiFeedback as ApiFeedback)
          : {
              ...replyFeedback,
              status: 'in-progress' as const,
              response: replyContent.trim(),
            };

      setFeedbacks((current) =>
        current.map((feedback) =>
          feedback.id === replyFeedback.id ? updatedFeedback : feedback,
        ),
      );
      closeReplyModal();
      setSuccessMessage('Gửi phản hồi thành công. Yêu cầu đang được xử lý.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Khong the gui phan hoi!');
    }
  };

  const handleConfirmResolve = async () => {
    if (!confirmResolveFeedback) return;

    try {
      const resolvedAt = new Date().toISOString();
      const apiFeedback = await requestJson<unknown>(
        `/feedbacks/${confirmResolveFeedback.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'resolved',
            resolvedAt,
          }),
        },
      );
      const updatedFeedback =
        typeof apiFeedback === 'object' && apiFeedback !== null
          ? mapApiFeedback(apiFeedback as ApiFeedback)
          : {
              ...confirmResolveFeedback,
              status: 'resolved' as const,
              resolvedAt,
            };

      setFeedbacks((current) =>
        current.map((feedback) =>
          feedback.id === confirmResolveFeedback.id ? updatedFeedback : feedback,
        ),
      );
      setConfirmResolveFeedback(null);
      setSuccessMessage('Yêu cầu đã được xác nhận là đã giải quyết.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Khong the xac nhan yeu cau da giai quyet!',
      );
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Đã giải quyết';
      case 'in-progress':
        return 'Đang xử lý';
      case 'pending':
        return 'Chờ xử lý';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return priority;
    }
  };

  const pendingCount = filteredFeedbacks.filter((f) => f.status === 'pending').length;
  const inProgressCount = filteredFeedbacks.filter((f) => f.status === 'in-progress').length;
  const resolvedCount = filteredFeedbacks.filter((f) => f.status === 'resolved').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {successMessage && (
          <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white bg-green-600 max-w-sm">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Phản Hồi</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'member'
                ? 'Gửi phản hồi và theo dõi trạng thái'
                : 'Quản lý phản hồi và yêu cầu từ hội viên'}
            </p>
          </div>
          {user?.role === 'member' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Tạo Phản Hồi
            </button>
          )}
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
            <p className="text-3xl font-bold text-gray-900">{inProgressCount}</p>
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
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Chờ xử lý
              </button>
              <button
                onClick={() => setFilterStatus('in-progress')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'in-progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Đang xử lý
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'resolved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
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
                          feedback.priority
                        )}`}
                      >
                        {getPriorityText(feedback.priority)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          feedback.status
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
                    {(feedback.resolvedBy || feedback.resolvedAt) && (
                      <p className="text-xs text-blue-600 mt-2">
                        {feedback.resolvedBy ? `Bởi ${feedback.resolvedBy}` : ''}
                        {feedback.resolvedBy && feedback.resolvedAt ? ' - ' : ''}
                        {feedback.resolvedAt &&
                          new Date(feedback.resolvedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {new Date(feedback.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  {user?.role !== 'member' && feedback.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openReplyModal(feedback)}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        Phản hồi
                      </button>
                    </div>
                  )}
                  {user?.role !== 'member' &&
                    feedback.status === 'in-progress' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmResolveFeedback(feedback)}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                        >
                          Xác nhận
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gửi Phản Hồi</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFeedback.subject}
                  onChange={(e) =>
                    setNewFeedback({ ...newFeedback, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tiêu đề phản hồi..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mức độ ưu tiên
                </label>
                <select
                  value={newFeedback.priority}
                  onChange={(e) =>
                    setNewFeedback({
                      ...newFeedback,
                      priority: e.target.value as 'low' | 'medium' | 'high',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newFeedback.message}
                  onChange={(e) =>
                    setNewFeedback({ ...newFeedback, message: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={5}
                  placeholder="Nhập nội dung phản hồi của bạn..."
                  required
                ></textarea>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Phản hồi của bạn sẽ được gửi đến quản trị
                  viên. Chúng tôi sẽ phản hồi lại trong thời gian sớm nhất.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gửi Phản Hồi
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {replyFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Phản hồi yêu cầu</h2>
              <button
                onClick={closeReplyModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmitReply} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tiêu đề phản hồi</p>
                <p className="font-semibold text-gray-900">{replyFeedback.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Người gửi</p>
                <p className="font-medium text-gray-900">{replyFeedback.memberName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Nội dung yêu cầu</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                  {replyFeedback.message}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung trả lời <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nhập nội dung phản hồi..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Gửi phản hồi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmResolveFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">Xác nhận đã giải quyết</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Bạn có chắc chắn muốn xác nhận yêu cầu này đã được giải quyết không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmResolveFeedback(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmResolve}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                Có
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

