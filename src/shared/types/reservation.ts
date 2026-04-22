export type ReservationRange = [number, number];

export type ReservationItem = {
  reservationId: number;
  roomId: number;
  date: string;
  fromTime: number;
  toTime: number;
  status: number;
};

export type CreateReservationPayload = {
  roomId: number;
  date: string;
  fromTime: number;
  toTime: number;
};

export type DeleteReservationPayload = CreateReservationPayload;

export type MergedReservation = {
  key: string;
  roomId: number;
  date: string;
  fromTime: number;
  toTime: number;
  status: number;
};

export type CancelableReservationRange = {
  fromTime: number;
  toTime: number;
};

export type ReservationDisplayItem = MergedReservation & {
  isVisible: boolean;
  cancelableRange: CancelableReservationRange | null;
  requiresPartialCancellationWarning: boolean;
};
