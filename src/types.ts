export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  type: string;
  expiredAt: number;
};

export type AuthState = AuthResponse & {
  userId: string;
};

export type FacilityRoom = {
  id: number;
  groupId: number;
  reservationByOthers: number[];
  reservationByMe: number[];
};

export type FacilityGroup = {
  id: number;
  name: string;
  floor: number;
  facilities: FacilityRoom[];
  fromTime: number;
  toTime: number;
};

export type CommonFacilityInfo = {
  notAvailableDays: string[];
  reservationCountInDay: number;
  reservationCountInMonth: number;
  reservationLimitInDay: number;
  reservationLimitInMonth: number;
};

export type FacilityResponse = {
  facilityGroup: FacilityGroup[];
  commonFacilityInfo: CommonFacilityInfo;
};

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

export type ReservationSuccess = {
  roomId: number;
  date: string;
  fromTime: number;
  toTime: number;
  groupName: string;
};

export type ReserveState = {
  stage: "date" | "timeAndFacility" | "success";
  selectedDate: string;
  selectedRange: [number, number] | null;
  error: string | null;
  success: ReservationSuccess | null;
};

export type MyReservationsState = {
  items: ReservationItem[];
  loading: boolean;
  error: string | null;
};

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
