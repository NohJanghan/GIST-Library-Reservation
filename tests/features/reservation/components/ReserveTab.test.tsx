import { render, screen } from "@testing-library/react";
import { ReserveTab } from "../../../../src/features/reservation/components/ReserveTab";

const mockUseReserveFlow = vi.fn();

vi.mock("../../../../src/features/reservation/hooks/useReserveFlow", () => ({
  useReserveFlow: (...args: unknown[]) => mockUseReserveFlow(...args),
}));

vi.mock("../../../../src/shared/hooks/useGridColumnCount", () => ({
  useGridColumnCount: () => ({
    columnCount: 3,
    gridRef: vi.fn(),
  }),
}));

vi.mock("../../../../src/shared/lib/reservations", async () => {
  const actual = await vi.importActual<
    typeof import("../../../../src/shared/lib/reservations")
  >("../../../../src/shared/lib/reservations");

  return {
    ...actual,
    getVisibleHourOptions: () => [21, 22, 23],
    findFirstAvailableRoom: vi.fn(),
  };
});

const session = {
  userId: "20235059",
  accessToken: "token",
  refreshToken: "refresh",
  type: "Bearer" as const,
  expiredAt: Math.floor(Date.now() / 1000) + 3600,
};

function createFlowState(selectedRange: [number, number] | null) {
  return {
    dateOptions: ["20260422"],
    facilityResponse: {
      facilityGroup: [],
      commonFacilityInfo: {
        notAvailableDays: [],
        reservationCountInDay: 0,
        reservationCountInMonth: 0,
        reservationLimitInDay: 4,
        reservationLimitInMonth: 80,
      },
    },
    loading: false,
    loadingError: null,
    submittingGroupId: null,
    rangeSelectionMode: "start" as const,
    state: {
      stage: "timeAndFacility" as const,
      selectedDate: "20260422",
      selectedRange,
      error: null,
      success: null,
    },
    blockedDates: [],
    isDateBlocked: false,
    isSelectedDateToday: true,
    selectableHourRange: { start: 21, end: 23 },
    maxSelectableHours: 4,
    nextReservableHour: 21,
    normalizedRange: selectedRange,
    activeGroups: [],
    inactiveGroups: [],
    selectDate: vi.fn(),
    continueFromDate: vi.fn(),
    goBackToDateSelection: vi.fn(),
    selectHour: vi.fn(),
    reserve: vi.fn(),
    startNewReservation: vi.fn(),
  };
}

describe("ReserveTab", () => {
  it("shows only the remaining reservation status when no time is selected", () => {
    mockUseReserveFlow.mockReturnValue(createFlowState(null));

    render(
      <ReserveTab
        session={session}
        onUnauthorized={vi.fn()}
        onOpenMyReservations={vi.fn()}
        resetKey={0}
      />,
    );

    expect(screen.getByText("예약 가능: 4시간")).not.toBeNull();
    expect(screen.queryByText(/첫 클릭은 시작 시간/)).toBeNull();
  });

  it("renders compact and expanded selected-time status variants", () => {
    mockUseReserveFlow.mockReturnValue(createFlowState([23, 23]));

    render(
      <ReserveTab
        session={session}
        onUnauthorized={vi.fn()}
        onOpenMyReservations={vi.fn()}
        resetKey={0}
      />,
    );

    expect(screen.getByText("선택 시간: 23:00 - 24:00 · 예약 가능: 4시간")).not.toBeNull();
    expect(screen.getByText("선택 시간: 23:00 - 24:00")).not.toBeNull();
  });
});
