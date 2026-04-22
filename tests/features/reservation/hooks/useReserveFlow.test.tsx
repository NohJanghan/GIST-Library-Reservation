import { act, renderHook, waitFor } from "@testing-library/react";
import { useReserveFlow } from "../../../../src/features/reservation/hooks/useReserveFlow";
import { ApiError } from "../../../../src/shared/api/http";
import { createReservation } from "../../../../src/shared/api/reservations";
import { getFacility } from "../../../../src/shared/api/facility";
import type { AuthState, FacilityResponse } from "../../../../src/shared/types";

vi.mock("../../../../src/shared/api/facility", () => ({
  getFacility: vi.fn(),
}));

vi.mock("../../../../src/shared/api/reservations", () => ({
  createReservation: vi.fn(),
}));

vi.mock("../../../../src/shared/hooks/useKoreaClock", () => ({
  useKoreaClock: () => ({
    now: new Date("2026-04-22T01:00:00Z"),
    today: "20260422",
    currentTime: {
      hour: 10,
      minute: 0,
    },
    nextReservableHour: 11,
  }),
}));

const session: AuthState = {
  userId: "20235059",
  accessToken: "token",
  refreshToken: "refresh",
  type: "Bearer",
  expiredAt: Math.floor(Date.now() / 1000) + 3600,
};

const facilityResponse: FacilityResponse = {
  facilityGroup: [
    {
      id: 5,
      name: "Available Group",
      floor: 2,
      fromTime: 8,
      toTime: 23,
      facilities: [
        {
          id: 219,
          groupId: 5,
          reservationByOthers: [],
          reservationByMe: [],
        },
      ],
    },
    {
      id: 6,
      name: "Busy Group",
      floor: 2,
      fromTime: 8,
      toTime: 23,
      facilities: [
        {
          id: 220,
          groupId: 6,
          reservationByOthers: [14, 15],
          reservationByMe: [],
        },
      ],
    },
  ],
  commonFacilityInfo: {
    notAvailableDays: [],
    reservationCountInDay: 1,
    reservationCountInMonth: 1,
    reservationLimitInDay: 4,
    reservationLimitInMonth: 80,
  },
};

describe("useReserveFlow", () => {
  it("loads facility data, supports date changes, and updates time selection state", async () => {
    vi.mocked(getFacility).mockResolvedValue(facilityResponse);
    const onUnauthorized = vi.fn();

    const { result } = renderHook(() => useReserveFlow(session, onUnauthorized));

    await waitFor(() => {
      expect(result.current.facilityResponse).toEqual(facilityResponse);
    });
    expect(getFacility).toHaveBeenCalledWith(session, "20260422");

    act(() => {
      result.current.selectDate("20260423");
    });

    await waitFor(() => {
      expect(getFacility).toHaveBeenLastCalledWith(session, "20260423");
    });

    act(() => {
      result.current.continueFromDate();
    });
    act(() => {
      result.current.selectHour(14);
    });
    act(() => {
      result.current.selectHour(15);
    });

    expect(result.current.state.stage).toBe("timeAndFacility");
    expect(result.current.normalizedRange).toEqual([14, 15]);
    expect(result.current.activeGroups).toHaveLength(1);
    expect(result.current.inactiveGroups).toHaveLength(1);
  });

  it("creates a reservation with the inclusive range and moves to success", async () => {
    vi.mocked(getFacility).mockResolvedValue(facilityResponse);
    vi.mocked(createReservation).mockResolvedValue({ success: true });
    const onUnauthorized = vi.fn();

    const { result } = renderHook(() => useReserveFlow(session, onUnauthorized));

    await waitFor(() => {
      expect(result.current.facilityResponse).not.toBeNull();
    });

    act(() => {
      result.current.continueFromDate();
    });
    act(() => {
      result.current.selectHour(14);
    });
    act(() => {
      result.current.selectHour(16);
    });

    await act(async () => {
      await result.current.reserve(facilityResponse.facilityGroup[0]);
    });

    expect(createReservation).toHaveBeenCalledWith(session, {
      roomId: 219,
      date: "20260422",
      fromTime: 14,
      toTime: 16,
    });
    expect(result.current.state.stage).toBe("success");
    expect(result.current.state.success).toMatchObject({
      groupName: "Available Group",
      roomId: 219,
    });
  });

  it("maps 409 conflicts back to the date stage", async () => {
    vi.mocked(getFacility).mockResolvedValue(facilityResponse);
    vi.mocked(createReservation).mockRejectedValue(new ApiError("Conflict", 409));
    const onUnauthorized = vi.fn();

    const { result } = renderHook(() => useReserveFlow(session, onUnauthorized));

    await waitFor(() => {
      expect(result.current.facilityResponse).not.toBeNull();
    });

    act(() => {
      result.current.continueFromDate();
    });
    act(() => {
      result.current.selectHour(14);
    });
    act(() => {
      result.current.selectHour(15);
    });

    await act(async () => {
      await result.current.reserve(facilityResponse.facilityGroup[0]);
    });

    expect(result.current.state.stage).toBe("date");
    expect(result.current.state.error).toBe("예약 조건이 바뀌었습니다. 다시 선택해주세요.");
  });

  it("forwards 401 responses to the unauthorized handler", async () => {
    vi.mocked(getFacility).mockResolvedValue(facilityResponse);
    vi.mocked(createReservation).mockRejectedValue(new ApiError("Unauthorized", 401));
    const onUnauthorized = vi.fn();

    const { result } = renderHook(() => useReserveFlow(session, onUnauthorized));

    await waitFor(() => {
      expect(result.current.facilityResponse).not.toBeNull();
    });

    act(() => {
      result.current.continueFromDate();
    });
    act(() => {
      result.current.selectHour(14);
    });
    act(() => {
      result.current.selectHour(15);
    });

    await act(async () => {
      await result.current.reserve(facilityResponse.facilityGroup[0]);
    });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
