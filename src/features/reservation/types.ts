import type { ReservationRange } from "../../shared/types";

export type ReservationStage = "date" | "timeAndFacility" | "success";
export type RangeSelectionMode = "start" | "end";

export type ReservationSuccess = {
  roomId: number;
  date: string;
  fromTime: number;
  toTime: number;
  groupName: string;
};

export type ReserveFlowState = {
  stage: ReservationStage;
  selectedDate: string;
  selectedRange: ReservationRange | null;
  error: string | null;
  success: ReservationSuccess | null;
};
