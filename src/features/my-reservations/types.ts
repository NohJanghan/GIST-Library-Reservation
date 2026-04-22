import type { ReservationItem } from "../../shared/types";

export type MyReservationsState = {
  items: ReservationItem[];
  loading: boolean;
  error: string | null;
};
