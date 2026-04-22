import { act, renderHook, waitFor } from "@testing-library/react";
import { useMyReservations } from "../../../../src/features/my-reservations/hooks/useMyReservations";
import { ApiError } from "../../../../src/shared/api/http";
import {
  cancelReservation,
  getReservations,
} from "../../../../src/shared/api/reservations";
import type { AuthState, ReservationItem } from "../../../../src/shared/types";

vi.mock("../../../../src/shared/api/reservations", () => ({
  getReservations: vi.fn(),
  cancelReservation: vi.fn(),
}));

vi.mock("../../../../src/shared/hooks/useKoreaClock", () => ({
  useKoreaClock: () => ({
    now: new Date("2026-04-22T05:00:00Z"),
    today: "20260422",
    currentTime: {
      hour: 14,
      minute: 0,
    },
    nextReservableHour: 15,
  }),
}));

const session: AuthState = {
  userId: "20235059",
  accessToken: "token",
  refreshToken: "refresh",
  type: "Bearer",
  expiredAt: Math.floor(Date.now() / 1000) + 3600,
};

const reservationItems: ReservationItem[] = [
  {
    reservationId: 3,
    roomId: 220,
    date: "20260423",
    fromTime: 9,
    toTime: 9,
    status: 1,
  },
  {
    reservationId: 1,
    roomId: 219,
    date: "20260422",
    fromTime: 14,
    toTime: 14,
    status: 1,
  },
  {
    reservationId: 2,
    roomId: 219,
    date: "20260422",
    fromTime: 15,
    toTime: 15,
    status: 1,
  },
  {
    reservationId: 4,
    roomId: 230,
    date: "20260422",
    fromTime: 16,
    toTime: 16,
    status: 1,
  },
];

describe("useMyReservations", () => {
  it("loads, sorts, and merges slot rows into display items", async () => {
    vi.mocked(getReservations).mockResolvedValue(reservationItems);
    const onUnauthorized = vi.fn();

    const { result } = renderHook(() => useMyReservations(session, onUnauthorized));

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    expect(result.current.displayItems).toHaveLength(3);
    expect(result.current.displayItems[0]).toMatchObject({
      roomId: 219,
      fromTime: 14,
      toTime: 15,
      requiresPartialCancellationWarning: true,
      cancelableRange: {
        fromTime: 15,
        toTime: 15,
      },
    });
    expect(result.current.todayCancelableItems).toHaveLength(2);
    expect(result.current.hasTodayPartialCancellation).toBe(true);
  });

  it("cancels a single item using the computed inclusive cancelable range", async () => {
    vi.mocked(getReservations).mockResolvedValue(reservationItems);
    vi.mocked(cancelReservation).mockResolvedValue({ success: true });
    const onUnauthorized = vi.fn();

    const { result } = renderHook(() => useMyReservations(session, onUnauthorized));

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    await act(async () => {
      await result.current.cancelItem(result.current.displayItems[0]);
    });

    expect(cancelReservation).toHaveBeenCalledWith(session, {
      roomId: 219,
      date: "20260422",
      fromTime: 15,
      toTime: 15,
    });
    expect(getReservations).toHaveBeenCalledTimes(2);
  });

  it("cancels all of today's cancelable items", async () => {
    vi.mocked(getReservations).mockResolvedValue(reservationItems);
    vi.mocked(cancelReservation).mockResolvedValue({ success: true });
    const onUnauthorized = vi.fn();

    const { result } = renderHook(() => useMyReservations(session, onUnauthorized));

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    await act(async () => {
      await result.current.cancelToday();
    });

    expect(cancelReservation).toHaveBeenNthCalledWith(1, session, {
      roomId: 219,
      date: "20260422",
      fromTime: 15,
      toTime: 15,
    });
    expect(cancelReservation).toHaveBeenNthCalledWith(2, session, {
      roomId: 230,
      date: "20260422",
      fromTime: 16,
      toTime: 16,
    });
  });

  it("forwards 401 load failures to the unauthorized handler", async () => {
    vi.mocked(getReservations).mockRejectedValue(new ApiError("Unauthorized", 401));
    const onUnauthorized = vi.fn();

    renderHook(() => useMyReservations(session, onUnauthorized));

    await waitFor(() => {
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });
  });
});
