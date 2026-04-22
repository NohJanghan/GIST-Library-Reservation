import type {
  AuthState,
  CreateReservationPayload,
  DeleteReservationPayload,
  ReservationItem,
} from "../types";
import { request } from "./http";

export async function getReservations(
  session: AuthState,
  fromDate: string,
  toDate: string,
) {
  return request<ReservationItem[]>({
    path: "/reservation",
    query: { fromDate, toDate },
    session,
  });
}

export async function createReservation(
  session: AuthState,
  payload: CreateReservationPayload,
) {
  return request<{ success: true }>({
    path: "/reservation",
    method: "POST",
    body: payload,
    session,
  });
}

export async function cancelReservation(
  session: AuthState,
  payload: DeleteReservationPayload,
) {
  return request<{ success: true }>({
    path: "/reservation",
    method: "DELETE",
    body: payload,
    session,
  });
}
