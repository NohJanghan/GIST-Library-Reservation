import { useEffect, useState } from "react";
import { getFacility } from "../../../shared/api/facility";
import { createReservation } from "../../../shared/api/reservations";
import { useKoreaClock } from "../../../shared/hooks/useKoreaClock";
import {
  getDateOptions,
  isDateWithinRange,
  isToday,
} from "../../../shared/lib/date";
import { getRequestErrorMessage, isApiError } from "../../../shared/lib/errors";
import {
  findFirstAvailableRoom,
  getMaxSelectableHours,
  getRangeLength,
  getSelectableHourRange,
  normalizeRange,
  splitFacilityGroupsByAvailability,
} from "../../../shared/lib/reservations";
import type { AuthState, FacilityGroup, FacilityResponse, ReservationRange } from "../../../shared/types";
import type { RangeSelectionMode, ReservationSuccess, ReserveFlowState } from "../types";

const DATE_WINDOW_DAYS = 7;

export function useReserveFlow(
  session: AuthState,
  onUnauthorized: () => void,
) {
  const clock = useKoreaClock();
  const dateOptions = getDateOptions(DATE_WINDOW_DAYS, clock.now);
  const firstDate = dateOptions[0] ?? clock.today;
  const [facilityResponse, setFacilityResponse] = useState<FacilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [submittingGroupId, setSubmittingGroupId] = useState<number | null>(null);
  const [rangeSelectionMode, setRangeSelectionMode] = useState<RangeSelectionMode>("start");
  const [state, setState] = useState<ReserveFlowState>({
    stage: "date",
    selectedDate: firstDate,
    selectedRange: null,
    error: null,
    success: null,
  });

  useEffect(() => {
    let active = true;

    async function loadFacility() {
      setLoading(true);
      setLoadingError(null);

      try {
        const next = await getFacility(session, state.selectedDate);

        if (!active) {
          return;
        }

        setFacilityResponse(next);
      } catch (error) {
        if (!active) {
          return;
        }

        if (isApiError(error) && error.status === 401) {
          onUnauthorized();
          return;
        }

        setFacilityResponse(null);
        setLoadingError(
          getRequestErrorMessage(error, "시설 정보를 불러오지 못했습니다. 다시 시도해주세요."),
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFacility();

    return () => {
      active = false;
    };
  }, [onUnauthorized, session, state.selectedDate]);

  const blockedDates = facilityResponse?.commonFacilityInfo.notAvailableDays ?? [];
  const lastDate = dateOptions[dateOptions.length - 1] ?? state.selectedDate;
  const isDateBlocked =
    !isDateWithinRange(state.selectedDate, firstDate, lastDate) ||
    blockedDates.includes(state.selectedDate);
  const isSelectedDateToday = isToday(state.selectedDate, clock.now);
  const selectableHourRange = getSelectableHourRange(
    facilityResponse?.facilityGroup ?? [],
  );
  const maxSelectableHours = facilityResponse
    ? getMaxSelectableHours(
        facilityResponse.commonFacilityInfo.reservationCountInDay,
        facilityResponse.commonFacilityInfo.reservationCountInMonth,
        facilityResponse.commonFacilityInfo.reservationLimitInDay,
        facilityResponse.commonFacilityInfo.reservationLimitInMonth,
      )
    : 0;
  const normalizedRange = state.selectedRange
    ? normalizeRange(state.selectedRange)
    : null;
  const { activeGroups, inactiveGroups } =
    facilityResponse && normalizedRange
      ? splitFacilityGroupsByAvailability(
          facilityResponse.facilityGroup,
          normalizedRange,
        )
      : { activeGroups: [], inactiveGroups: [] as FacilityGroup[] };

  const selectDate = (dateKey: string) => {
    setState((current) => ({
      ...current,
      selectedDate: dateKey,
      error: null,
    }));
  };

  const continueFromDate = () => {
    if (isDateBlocked) {
      setState((current) => ({
        ...current,
        error: "선택할 수 없는 날짜입니다.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      stage: "timeAndFacility",
      selectedRange: null,
      error: null,
    }));
    setRangeSelectionMode("start");
  };

  const goBackToDateSelection = () => {
    setState((current) => ({
      ...current,
      stage: "date",
      selectedRange: null,
      error: null,
    }));
    setRangeSelectionMode("start");
  };

  const selectHour = (hour: number) => {
    const isPastHour =
      isSelectedDateToday && hour < clock.nextReservableHour;

    if (isPastHour || maxSelectableHours <= 0) {
      return;
    }

    if (!state.selectedRange || rangeSelectionMode === "start") {
      setState((current) => ({
        ...current,
        selectedRange: [hour, hour],
        error: null,
      }));
      setRangeSelectionMode("end");
      return;
    }

    const nextRange = normalizeRange([
      state.selectedRange[0],
      hour,
    ] satisfies ReservationRange);

    if (getRangeLength(nextRange) > maxSelectableHours) {
      setState((current) => ({
        ...current,
        selectedRange: [hour, hour],
        error: `최대 ${maxSelectableHours}시간까지만 선택할 수 있습니다.`,
      }));
      setRangeSelectionMode("end");
      return;
    }

    setState((current) => ({
      ...current,
      selectedRange: nextRange,
      error: null,
    }));
    setRangeSelectionMode("start");
  };

  const reserve = async (group: FacilityGroup) => {
    if (!normalizedRange) {
      return;
    }

    const room = findFirstAvailableRoom(group, normalizedRange);

    if (!room) {
      return;
    }

    setSubmittingGroupId(group.id);

    try {
      await createReservation(session, {
        roomId: room.id,
        date: state.selectedDate,
        fromTime: normalizedRange[0],
        toTime: normalizedRange[1],
      });

      const success: ReservationSuccess = {
        roomId: room.id,
        date: state.selectedDate,
        fromTime: normalizedRange[0],
        toTime: normalizedRange[1],
        groupName: group.name,
      };

      setState((current) => ({
        ...current,
        stage: "success",
        success,
        error: null,
      }));
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        onUnauthorized();
        return;
      }

      setState((current) => ({
        ...current,
        stage: "date",
        selectedRange: null,
        success: null,
        error: getRequestErrorMessage(error, "예약에 실패했습니다. 다시 시도해주세요."),
      }));
      setRangeSelectionMode("start");
    } finally {
      setSubmittingGroupId(null);
    }
  };

  const startNewReservation = () => {
    setState({
      stage: "date",
      selectedDate: clock.today,
      selectedRange: null,
      error: null,
      success: null,
    });
    setRangeSelectionMode("start");
  };

  return {
    dateOptions,
    facilityResponse,
    loading,
    loadingError,
    submittingGroupId,
    rangeSelectionMode,
    state,
    blockedDates,
    isDateBlocked,
    isSelectedDateToday,
    selectableHourRange,
    maxSelectableHours,
    nextReservableHour: clock.nextReservableHour,
    normalizedRange,
    activeGroups,
    inactiveGroups,
    selectDate,
    continueFromDate,
    goBackToDateSelection,
    selectHour,
    reserve,
    startNewReservation,
  };
}
