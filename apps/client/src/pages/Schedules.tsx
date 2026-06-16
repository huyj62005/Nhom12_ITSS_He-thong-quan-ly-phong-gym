import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, Plus, User } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { useGymData } from "../contexts/GymDataContext";
import { Schedule } from "../types";

const API_BASE_URL = "http://localhost:3000";

type ApiUser = {
  id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
};

type ApiMember = {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
  user?: ApiUser;
};

type ApiSchedule = {
  id?: number | string;
  memberId?: number | string;
  member_id?: number | string;
  trainerId?: number | string;
  trainer_id?: number | string;
  member?: ApiMember;
  trainer?: ApiUser;
  type?: string;
  date?: string;
  startTime?: string;
  start_time?: string;
  endTime?: string;
  end_time?: string;
  status?: string;
  notes?: string;
};

type ApiTrainerProfile = {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  user?: ApiUser;
};

type ScheduleForm = {
  memberId: string;
  trainerId: string;
  type: Schedule["type"];
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
};

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toDateTimeInputValue = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${toDateInputValue(date)}T${hours}:${minutes}:00`;
};

const addMinutesToDateTimeInput = (
  dateValue: string,
  timeValue: string,
  minutes: number,
) => {
  const date = new Date(`${dateValue}T${timeValue}:00`);
  date.setMinutes(date.getMinutes() + minutes);

  return toDateTimeInputValue(date);
};

const emptyScheduleForm = (): ScheduleForm => ({
  memberId: "",
  trainerId: "",
  type: "pt",
  date: toDateInputValue(new Date()),
  startTime: "",
  endTime: "",
  notes: "",
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

const normalizeScheduleType = (type?: string): Schedule["type"] => {
  const normalized = type?.toLowerCase();
  if (normalized === "personal" || normalized === "pt" || normalized === "class") {
    return normalized;
  }
  return "pt";
};

const normalizeScheduleStatus = (status?: string): Schedule["status"] => {
  if (status === "completed" || status === "cancelled") return status;
  return "scheduled";
};

const getTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(11, 16);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getDate = (value?: string) => {
  if (!value) return "";
  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePart) return datePart;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return toDateInputValue(date);
};

const getMemberName = (member?: ApiMember) =>
  member?.fullName ??
  member?.full_name ??
  member?.name ??
  member?.user?.fullName ??
  member?.user?.full_name ??
  member?.user?.name ??
  "";

const getUserName = (user?: ApiUser) =>
  user?.fullName ?? user?.full_name ?? user?.name ?? "";

const getTrainerUserId = (trainer?: ApiTrainerProfile) =>
  trainer?.userId !== undefined
    ? String(trainer.userId)
    : trainer?.user_id !== undefined
      ? String(trainer.user_id)
      : trainer?.user?.id !== undefined
        ? String(trainer.user.id)
        : "";

const mapApiSchedule = (schedule: ApiSchedule): Schedule => {
  const trainerId =
    schedule.trainerId !== undefined
      ? String(schedule.trainerId)
      : schedule.trainer_id !== undefined
        ? String(schedule.trainer_id)
      : schedule.trainer?.id !== undefined
        ? String(schedule.trainer.id)
        : "";

  const mappedSchedule: Schedule = {
    id: String(schedule.id ?? ""),
    memberId: String(schedule.memberId ?? schedule.member_id ?? schedule.member?.id ?? ""),
    memberName: getMemberName(schedule.member),
    trainerName: getUserName(schedule.trainer),
    date: getDate(schedule.startTime ?? schedule.start_time ?? schedule.date),
    startTime: getTime(schedule.startTime ?? schedule.start_time),
    endTime: getTime(schedule.endTime ?? schedule.end_time),
    type: normalizeScheduleType(schedule.type),
    status: normalizeScheduleStatus(schedule.status),
  };

  if (trainerId) {
    mappedSchedule.trainerId = trainerId;
  }

  if (schedule.notes) {
    mappedSchedule.notes = schedule.notes;
  }

  return mappedSchedule;
};

export const Schedules: React.FC = () => {
  const { user } = useAuth();
  const { members } = useGymData();
  const isManager = user?.role === "manager";
  const isTrainer = user?.role === "trainer";
  const isMember = user?.role === "member";
  const isReadOnlySchedule = isManager || isTrainer;
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [trainers, setTrainers] = useState<ApiTrainerProfile[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    toDateInputValue(new Date()),
  );
  const [showModal, setShowModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(
    emptyScheduleForm,
  );
  const currentMember = user
    ? members.find((member) => member.userId === user.id) ??
      members.find((member) => member.email === user.email) ??
      members.find(
        (member) =>
          !member.userId &&
          !member.email &&
          member.name === user.name,
      )
    : undefined;
  const currentTrainer = user
    ? trainers.find(
        (trainer) =>
          getTrainerUserId(trainer) === user.id ||
          trainer.user?.email === user.email,
      )
    : undefined;
  const currentTrainerIds = [
    user?.id,
    getTrainerUserId(currentTrainer),
  ].filter(Boolean);
  const currentMemberIds = [
    currentMember?.id,
    currentMember?.userId,
  ].filter(Boolean);
  const memberHasAssignedPt =
    currentMember?.hasActivePtPackage === true &&
    Boolean(currentMember.trainerId);
  const selectableMembers = isMember && currentMember ? [currentMember] : members;
  const assignedTrainer = currentMember?.trainerId
    ? {
        id: currentMember.trainerId,
        name: currentMember.trainerName || currentMember.trainerId,
      }
    : null;
  const availableTrainers =
    isMember && scheduleForm.type === "pt"
      ? assignedTrainer
        ? [
            {
              id: assignedTrainer.id,
              userId: assignedTrainer.id,
              user: { id: assignedTrainer.id, fullName: assignedTrainer.name },
            },
          ]
        : []
      : trainers;

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      requestJson<unknown>("/training-schedules"),
      requestJson<unknown>("/trainer-profiles"),
    ]).then(([scheduleResult, trainerResult]) => {
      if (!isMounted) return;

      if (scheduleResult.status === "fulfilled" && Array.isArray(scheduleResult.value)) {
        setSchedules(scheduleResult.value.map((item) => mapApiSchedule(item as ApiSchedule)));
      } else {
        setSchedules([]);
      }

      if (trainerResult.status === "fulfilled" && Array.isArray(trainerResult.value)) {
        setTrainers(trainerResult.value as ApiTrainerProfile[]);
      } else {
        setTrainers([]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isMember && currentMember && scheduleForm.memberId !== currentMember.id) {
      setScheduleForm((current) => ({ ...current, memberId: currentMember.id }));
      return;
    }

    const firstSelectableMember = selectableMembers[0];

    if (!scheduleForm.memberId && firstSelectableMember) {
      setScheduleForm((current) => ({
        ...current,
        memberId: firstSelectableMember.id,
      }));
    }
  }, [currentMember, isMember, scheduleForm.memberId, selectableMembers]);

  useEffect(() => {
    if (isMember && scheduleForm.type === "pt" && currentMember?.trainerId) {
      setScheduleForm((current) => ({
        ...current,
        trainerId: currentMember.trainerId ?? "",
      }));
    }
  }, [currentMember?.trainerId, isMember, scheduleForm.type]);

  const visibleSchedules = isTrainer
    ? schedules.filter(
        (schedule) =>
          schedule.trainerId
            ? currentTrainerIds.includes(schedule.trainerId)
            : schedule.trainerName === user?.name,
      )
    : isMember
      ? schedules.filter((schedule) =>
          currentMemberIds.includes(schedule.memberId),
        )
    : schedules;
  const filteredSchedules = visibleSchedules.filter(
    (schedule) => schedule.date === selectedDate,
  );

  const handleCreateSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    const scheduleType: Schedule["type"] = isMember ? "pt" : scheduleForm.type;
    const trainerId =
      isMember && scheduleType === "pt"
        ? currentMember?.trainerId
        : scheduleForm.trainerId;

    if (isMember && !currentMember) {
      window.alert("Khong tim thay thong tin hoi vien cua tai khoan hien tai.");
      return;
    }

    if (isMember && scheduleType === "pt" && !memberHasAssignedPt) {
      window.alert(
        "Bạn chưa được phân công PT. Vui lòng đăng ký gói PT hoặc liên hệ quản lý.",
      );
      return;
    }

    const startTime = `${scheduleForm.date}T${scheduleForm.startTime}:00`;
    const endTime = isMember
      ? addMinutesToDateTimeInput(scheduleForm.date, scheduleForm.startTime, 60)
      : `${scheduleForm.date}T${scheduleForm.endTime}:00`;

    try {
      const apiSchedule = await requestJson<unknown>("/training-schedules", {
        method: "POST",
        body: JSON.stringify({
          memberId: Number(isMember ? currentMember?.id : scheduleForm.memberId),
          trainerId:
            scheduleType === "pt" && trainerId
              ? Number(trainerId)
              : undefined,
          type: scheduleType,
          startTime,
          endTime,
          notes: scheduleForm.notes,
          status: "scheduled",
        }),
      });

      if (typeof apiSchedule !== "object" || apiSchedule === null) {
        throw new Error("API /training-schedules khong tra ve du lieu hop le");
      }

      setSchedules((current) => [mapApiSchedule(apiSchedule as ApiSchedule), ...current]);
      setShowModal(false);
      setScheduleForm({
        ...emptyScheduleForm(),
        memberId: selectableMembers[0]?.id ?? "",
        date: selectedDate,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Khong the dat lich!");
    }
  };

  const updateScheduleStatus = async (
    schedule: Schedule,
    status: Schedule["status"],
  ) => {
    const apiSchedule = await requestJson<unknown>(`/training-schedules/${schedule.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    const updatedSchedule =
      typeof apiSchedule === "object" && apiSchedule !== null
        ? mapApiSchedule(apiSchedule as ApiSchedule)
        : { ...schedule, status };

    setSchedules((current) =>
      current.map((item) => (item.id === schedule.id ? updatedSchedule : item)),
    );
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-800";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  const getStatusText = (status: string) => {
    if (status === "completed") return "Hoàn thành";
    if (status === "cancelled") return "Đã hủy";
    return "Đã lên lịch";
  };

  const getTypeText = (type: string) => {
    if (type === "personal") return "Cá nhân";
    if (type === "class") return "Lớp học";
    return "PT";
  };

  const getTypeColor = (type: string) => {
    if (type === "personal") return "bg-purple-100 text-purple-800";
    if (type === "class") return "bg-indigo-100 text-indigo-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch tập</h1>
            <p className="text-gray-600 mt-1">
              Quản lý lịch tập luyện và đặt lịch từ dữ liệu hệ thống
            </p>
          </div>
          {!isReadOnlySchedule && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Đặt lịch mới
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4 mb-6">
            <CalendarIcon size={20} className="text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Chọn ngày:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Không có lịch tập nào cho ngày này</p>
              </div>
            ) : (
              filteredSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
                            schedule.type,
                          )}`}
                        >
                          {getTypeText(schedule.type)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            schedule.status,
                          )}`}
                        >
                          {getStatusText(schedule.status)}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {schedule.memberName}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>
                            {schedule.startTime} - {schedule.endTime}
                          </span>
                        </div>
                        {schedule.trainerName && (
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            <span>PT: {schedule.trainerName}</span>
                          </div>
                        )}
                        {schedule.notes && <span>{schedule.notes}</span>}
                      </div>
                    </div>
                    {!isReadOnlySchedule && schedule.status === "scheduled" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateScheduleStatus(schedule, "completed")}
                          className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
                        >
                          Hoàn thành
                        </button>
                        <button
                          onClick={() => updateScheduleStatus(schedule, "cancelled")}
                          className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && !isReadOnlySchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Đặt lịch tập mới</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                x
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              {!isMember && (
              <FormField label="Chọn hội viên">
                <select
                  required
                  value={scheduleForm.memberId}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      memberId: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  {selectableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </FormField>
              )}

              {!isMember && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Loại lịch tập">
                  <select
                    value={scheduleForm.type}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        type: event.target.value as Schedule["type"],
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="personal">Tập cá nhân</option>
                    <option value="pt">Tập với PT</option>
                    <option value="class">Lớp học</option>
                  </select>
                </FormField>
                {!(isMember && scheduleForm.type === "pt" && !memberHasAssignedPt) && (
                  <FormField label="Huấn luyện viên">
                  <select
                    value={
                      isMember && scheduleForm.type === "pt"
                        ? assignedTrainer?.id ?? ""
                        : scheduleForm.trainerId
                    }
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        trainerId: event.target.value,
                      }))
                    }
                    className={inputClass}
                    required={isMember && scheduleForm.type === "pt"}
                  >
                    {!(isMember && scheduleForm.type === "pt") && (
                      <option value="">Không chọn</option>
                    )}
                    {availableTrainers.map((trainer) => (
                      <option
                        key={trainer.id}
                        value={trainer.userId ?? trainer.user?.id ?? ""}
                      >
                        {getUserName(trainer.user) || trainer.userId || trainer.id}
                      </option>
                    ))}
                  </select>
                  </FormField>
                )}
              </div>
              )}

              <div
                className={`grid grid-cols-1 gap-4 ${
                  isMember ? "md:grid-cols-2" : "md:grid-cols-3"
                }`}
              >
                <FormField label="Ngày tập">
                  <input
                    required
                    type="date"
                    value={scheduleForm.date}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Giờ bắt đầu">
                  <input
                    required
                    type="time"
                    value={scheduleForm.startTime}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
                {!isMember && (
                <FormField label="Giờ kết thúc">
                  <input
                    required
                    type="time"
                    value={scheduleForm.endTime}
                    onChange={(event) =>
                      setScheduleForm((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </FormField>
                )}
              </div>

              <FormField label="Ghi chú">
                <textarea
                  value={scheduleForm.notes}
                  onChange={(event) =>
                    setScheduleForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className={inputClass}
                  rows={3}
                />
              </FormField>

              {isMember && !memberHasAssignedPt && (
                <p className="text-sm text-gray-500">
                  Bạn chưa được phân công PT. Vui lòng đăng ký gói PT hoặc liên hệ quản lý.
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isMember && !memberHasAssignedPt}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Đặt lịch
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
    </DashboardLayout>
  );
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {children}
  </label>
);
