import { User } from "../types";

export const NO_GYM_ROOM_SCOPE = "__NO_GYM_ROOM__";

export const getScopedGymRoomId = (user?: User | null) => {
  if (!user || user.role === "owner") return undefined;
  if (user.role === "manager") return user.gymRoomId || NO_GYM_ROOM_SCOPE;
  return user.gymRoomId || undefined;
};

export const isInScopedGymRoom = (
  gymRoomId: string | undefined,
  scopedGymRoomId?: string,
) => !scopedGymRoomId || gymRoomId === scopedGymRoomId;

export const getScopedBranchFilter = (
  requestedFilter: string,
  scopedGymRoomId?: string,
) => scopedGymRoomId || requestedFilter;
