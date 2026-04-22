import { useCallback, useEffect, useMemo, useState } from "react";
import { cancelReservation, getReservations } from "../../../shared/api/reservations";
import { useKoreaClock } from "../../../shared/hooks/useKoreaClock";
import { addDaysToDateKey } from "../../../shared/lib/date";
import { getRequestErrorMessage, isApiError } from "../../../shared/lib/errors";
import {
  buildReservationDisplayItems,
  sortReservationItems,
} from "../../../shared/lib/reservations";
import type { AuthState, ReservationDisplayItem } from "../../../shared/types";
import type { MyReservationsState } from "../types";

const RESERVATION_LOOKAHEAD_DAYS = 30;

export function useMyReservations(
  session: AuthState,
  onUnauthorized: () => void,
) {
  const clock = useKoreaClock();
  const toDate = addDaysToDateKey(clock.today, RESERVATION_LOOKAHEAD_DAYS);
  const [state, setState] = useState<MyReservationsState>({
    items: [],
    loading: true,
    error: null,
  });
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const items = await getReservations(session, clock.today, toDate);
      setState({
        items: sortReservationItems(items),
        loading: false,
        error: null,
      });
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        onUnauthorized();
        return;
      }

      setState({
        items: [],
        loading: false,
        error: getRequestErrorMessage(error, "예약 목록을 불러오지 못했습니다."),
      });
    }
  }, [clock.today, onUnauthorized, session, toDate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reservationItems = useMemo(
    () =>
      buildReservationDisplayItems(
        state.items,
        clock.today,
        clock.currentTime.hour,
      ),
    [clock.currentTime.hour, clock.today, state.items],
  );
  const displayItems = useMemo(
    () => reservationItems.filter((item) => item.isVisible),
    [reservationItems],
  );
  const todayItems = useMemo(
    () => reservationItems.filter((item) => item.date === clock.today),
    [clock.today, reservationItems],
  );
  const todayCancelableItems = useMemo(
    () => todayItems.filter((item) => item.cancelableRange !== null),
    [todayItems],
  );
  const hasTodayPartialCancellation = todayItems.some(
    (item) => item.cancelableRange === null || item.requiresPartialCancellationWarning,
  );

  const cancelItem = async (item: ReservationDisplayItem) => {
    if (!item.cancelableRange) {
      return;
    }

    setSubmittingKey(item.key);

    try {
      await cancelReservation(session, {
        roomId: item.roomId,
        date: item.date,
        fromTime: item.cancelableRange.fromTime,
        toTime: item.cancelableRange.toTime,
      });
      await reload();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        onUnauthorized();
        return;
      }

      setState((current) => ({
        ...current,
        error: getRequestErrorMessage(error, "예약 취소에 실패했습니다."),
      }));
    } finally {
      setSubmittingKey(null);
    }
  };

  const cancelToday = async () => {
    if (todayCancelableItems.length === 0) {
      return;
    }

    setSubmittingKey("today-all");

    try {
      for (const item of todayCancelableItems) {
        if (!item.cancelableRange) {
          continue;
        }

        await cancelReservation(session, {
          roomId: item.roomId,
          date: item.date,
          fromTime: item.cancelableRange.fromTime,
          toTime: item.cancelableRange.toTime,
        });
      }

      await reload();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        onUnauthorized();
        return;
      }

      setState((current) => ({
        ...current,
        error: getRequestErrorMessage(error, "오늘 예약 전체 취소에 실패했습니다."),
      }));
    } finally {
      setSubmittingKey(null);
    }
  };

  return {
    state,
    submittingKey,
    today: clock.today,
    displayItems,
    todayCancelableItems,
    hasTodayPartialCancellation,
    cancelItem,
    cancelToday,
    reload,
  };
}
