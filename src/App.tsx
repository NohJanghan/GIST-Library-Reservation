import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ApiError,
  cancelReservation,
  clearStoredSession,
  createReservation,
  getConfigurationError,
  getFacility,
  getReservations,
  loadStoredSession,
  login,
  saveStoredSession,
} from "./api";
import type {
  AuthState,
  FacilityGroup,
  FacilityResponse,
  MergedReservation,
  MyReservationsState,
  ReservationSuccess,
  ReserveState,
} from "./types";
import {
  addDaysToDateKey,
  compareDateKeys,
  formatDateHeading,
  formatDateLabel,
  formatHourLabel,
  formatRangeLabel,
  getCurrentKoreaHour,
  getDateOptions,
  getTodayDateKey,
  getKoreanWeekday,
  isDateWithinRange,
  isToday,
} from "./utils/date";
import {
  findFirstAvailableRoom,
  getMaxSelectableHours,
  getSelectableHourRange,
  isRoomAvailableForRange,
  mergeReservationItems,
  normalizeRange,
} from "./utils/reservations";

type TabId = "reserve" | "myReservations";

const DATE_WINDOW_DAYS = 7;
const RESERVATION_LOOKAHEAD_DAYS = 30;

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function extractMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    if (error.status === 409) {
      return "예약 조건이 바뀌었습니다. 다시 선택해주세요.";
    }

    return error.message || fallback;
  }

  return fallback;
}

function App() {
  const [session, setSession] = useState<AuthState | null>(() => loadStoredSession());
  const [activeTab, setActiveTab] = useState<TabId>("reserve");
  const configurationError = getConfigurationError();

  useEffect(() => {
    if (!session) {
      clearStoredSession();
    }
  }, [session]);

  const handleUnauthorized = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setActiveTab("reserve");
  }, []);

  if (configurationError) {
    return (
      <div className="app-shell">
        <section className="panel narrow-panel">
          <h1>환경 설정이 필요합니다.</h1>
          <p>{configurationError}</p>
          <p>
            <code>.env</code> 파일에 <code>VITE_API_BASE_URL</code>을 설정하세요.
          </p>
        </section>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <LoginScreen
          onLogin={(nextSession) => {
            saveStoredSession(nextSession);
            setSession(nextSession);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="panel app-panel">
        <header className="top-bar">
          <div>
            <p className="eyebrow">GIST Library Reservation</p>
            <h1>스터디룸 예약</h1>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={handleUnauthorized}
          >
            로그아웃
          </button>
        </header>

        <nav className="tab-bar" aria-label="주요 탭">
          <button
            type="button"
            className={activeTab === "reserve" ? "tab active" : "tab"}
            onClick={() => setActiveTab("reserve")}
          >
            예약
          </button>
          <button
            type="button"
            className={activeTab === "myReservations" ? "tab active" : "tab"}
            onClick={() => setActiveTab("myReservations")}
          >
            내 예약
          </button>
        </nav>

        {activeTab === "reserve" ? (
          <ReserveTab
            session={session}
            onUnauthorized={handleUnauthorized}
            onOpenMyReservations={() => setActiveTab("myReservations")}
          />
        ) : (
          <MyReservationsTab
            session={session}
            onUnauthorized={handleUnauthorized}
          />
        )}
      </div>
    </div>
  );
}

function LoginScreen({
  onLogin,
}: {
  onLogin: (session: AuthState) => void;
}) {
  const [userId, setUserId] = useState("");
  const [userPwd, setUserPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await login(userId.trim(), userPwd);
      onLogin({ ...response, userId: userId.trim() });
    } catch (requestError) {
      if (isApiError(requestError) && requestError.status === 401) {
        setError("아이디 또는 비밀번호를 확인해주세요.");
      } else {
        setError(extractMessage(requestError, "로그인에 실패했습니다."));
        console.error(requestError)
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel narrow-panel">
      <p className="eyebrow">최초 1회 로그인</p>
      <h1>GIST 도서관 계정으로 로그인</h1>
      <p className="muted">
        로그인 후에는 같은 브라우저에서 세션이 유지됩니다.
      </p>
      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>아이디</span>
          <input
            autoComplete="username"
            inputMode="numeric"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="학번"
            required
          />
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input
            autoComplete="current-password"
            type="password"
            value={userPwd}
            onChange={(event) => setUserPwd(event.target.value)}
            placeholder="비밀번호"
            required
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </section>
  );
}

function ReserveTab({
  session,
  onUnauthorized,
  onOpenMyReservations,
}: {
  session: AuthState;
  onUnauthorized: () => void;
  onOpenMyReservations: () => void;
}) {
  const dateOptions = useMemo(() => getDateOptions(DATE_WINDOW_DAYS), []);
  const [facilityResponse, setFacilityResponse] = useState<FacilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [submittingGroupId, setSubmittingGroupId] = useState<number | null>(null);
  const [rangeSelectionMode, setRangeSelectionMode] = useState<"start" | "end">("start");
  const [reserveState, setReserveState] = useState<ReserveState>({
    stage: "date",
    selectedDate: dateOptions[0],
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
        const next = await getFacility(session, reserveState.selectedDate);

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
          extractMessage(error, "시설 정보를 불러오지 못했습니다. 다시 시도해주세요."),
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
  }, [onUnauthorized, reserveState.selectedDate, session]);

  const blockedDates = facilityResponse?.commonFacilityInfo.notAvailableDays ?? [];
  const lastDate = dateOptions[dateOptions.length - 1] ?? reserveState.selectedDate;
  const isDateBlocked =
    !isDateWithinRange(reserveState.selectedDate, dateOptions[0], lastDate) ||
    blockedDates.includes(reserveState.selectedDate);
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
  const currentKoreaHour = getCurrentKoreaHour();
  const normalizedRange = reserveState.selectedRange
    ? normalizeRange(reserveState.selectedRange)
    : null;

  const activeGroups = useMemo(() => {
    if (!facilityResponse || !normalizedRange) {
      return [];
    }

    return facilityResponse.facilityGroup.filter((group) =>
      group.facilities.some((room) =>
        isRoomAvailableForRange(room, group, normalizedRange),
      ),
    );
  }, [facilityResponse, normalizedRange]);

  const inactiveGroups = useMemo(() => {
    if (!facilityResponse || !normalizedRange) {
      return [];
    }

    return facilityResponse.facilityGroup.filter((group) =>
      group.facilities.every((room) =>
        !isRoomAvailableForRange(room, group, normalizedRange),
      ),
    );
  }, [facilityResponse, normalizedRange]);

  const handleDateContinue = () => {
    if (isDateBlocked) {
      setReserveState((current) => ({
        ...current,
        error: "선택할 수 없는 날짜입니다.",
      }));
      return;
    }

    setReserveState((current) => ({
      ...current,
      stage: "timeAndFacility",
      selectedRange: null,
      error: null,
    }));
    setRangeSelectionMode("start");
  };

  const handleTimeClick = (hour: number) => {
    const isPastHour = isToday(reserveState.selectedDate) && hour < currentKoreaHour;

    if (isPastHour || maxSelectableHours <= 0) {
      return;
    }

    if (!reserveState.selectedRange || rangeSelectionMode === "start") {
      setReserveState((current) => ({
        ...current,
        selectedRange: [hour, hour] as [number, number],
        error: null,
      }));
      setRangeSelectionMode("end");
      return;
    }

    const nextRange = normalizeRange([
      reserveState.selectedRange[0],
      hour,
    ] as [number, number]);
    const length = nextRange[1] - nextRange[0] + 1;

    if (length > maxSelectableHours) {
      setReserveState((current) => ({
        ...current,
        selectedRange: [hour, hour] as [number, number],
        error: `최대 ${maxSelectableHours}시간까지만 선택할 수 있습니다.`,
      }));
      setRangeSelectionMode("end");
      return;
    }

    setReserveState((current) => ({
      ...current,
      selectedRange: nextRange,
      error: null,
    }));
    setRangeSelectionMode("start");
  };

  const handleReservation = async (group: FacilityGroup) => {
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
        date: reserveState.selectedDate,
        fromTime: normalizedRange[0],
        toTime: normalizedRange[1],
      });

      const success: ReservationSuccess = {
        roomId: room.id,
        date: reserveState.selectedDate,
        fromTime: normalizedRange[0],
        toTime: normalizedRange[1],
        groupName: group.name,
      };

      setReserveState((current) => ({
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

      setReserveState((current) => ({
        ...current,
        stage: "date",
        selectedRange: null,
        success: null,
        error: extractMessage(error, "예약에 실패했습니다. 다시 시도해주세요."),
      }));
      setRangeSelectionMode("start");
    } finally {
      setSubmittingGroupId(null);
    }
  };

  const renderDateStage = (
    <>
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">예약</p>
            <h2>날짜 선택</h2>
          </div>
          <span className="muted">최대 7일</span>
        </div>
        <div className="date-grid">
          {dateOptions.map((dateKey) => {
            const disabled = blockedDates.includes(dateKey);
            const selected = reserveState.selectedDate === dateKey;

            return (
              <button
                key={dateKey}
                type="button"
                className={selected ? "date-chip active" : "date-chip"}
                disabled={disabled}
                onClick={() =>
                  setReserveState((current) => ({
                    ...current,
                    selectedDate: dateKey,
                    error: null,
                  }))
                }
              >
                <span>{formatDateLabel(dateKey)}</span>
                <strong>{getKoreanWeekday(dateKey)}</strong>
              </button>
            );
          })}
        </div>
        {loading ? <p className="muted">시설 정보를 불러오는 중입니다...</p> : null}
        {loadingError ? <p className="error-text">{loadingError}</p> : null}
        {blockedDates.includes(reserveState.selectedDate) ? (
          <p className="muted">해당 날짜는 예약할 수 없습니다.</p>
        ) : null}
        {reserveState.error ? <p className="error-text">{reserveState.error}</p> : null}
        <button
          className="primary-button"
          type="button"
          onClick={handleDateContinue}
          disabled={loading || !facilityResponse || isDateBlocked}
        >
          다음
        </button>
      </section>
    </>
  );

  const renderTimeAndFacilityStage = (
    <>
      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">예약</p>
            <h2>{formatDateHeading(reserveState.selectedDate)}</h2>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              setReserveState((current) => ({
                ...current,
                stage: "date",
                selectedRange: null,
                error: null,
              }))
            }
          >
            날짜 변경
          </button>
        </div>

        <div className="info-card">
          <p>남은 예약 가능 시간</p>
          <strong>{maxSelectableHours}시간</strong>
        </div>

        <div className="time-grid">
          {Array.from(
            {
              length: selectableHourRange.end - selectableHourRange.start + 1,
            },
            (_, index) => selectableHourRange.start + index,
          ).map((hour) => {
            const selected =
              normalizedRange &&
              hour >= normalizedRange[0] &&
              hour <= normalizedRange[1];
            const disabled =
              maxSelectableHours <= 0 ||
              (isToday(reserveState.selectedDate) && hour < currentKoreaHour);

            return (
              <button
                key={hour}
                type="button"
                className={selected ? "time-chip active" : "time-chip"}
                disabled={disabled}
                onClick={() => handleTimeClick(hour)}
              >
                {formatHourLabel(hour)}
              </button>
            );
          })}
        </div>

        {normalizedRange ? (
          <p className="muted">
            선택 시간: {formatRangeLabel(normalizedRange[0], normalizedRange[1])}
          </p>
        ) : (
          <p className="muted">첫 클릭은 시작 시간, 두 번째 클릭은 종료 시간입니다.</p>
        )}
        {reserveState.error ? <p className="error-text">{reserveState.error}</p> : null}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">예약</p>
            <h2>스터디룸 선택</h2>
          </div>
        </div>

        {!normalizedRange ? (
          <p className="muted">먼저 예약 시간을 선택해주세요.</p>
        ) : null}

        {normalizedRange &&
        activeGroups.length === 0 &&
        inactiveGroups.length === 0 &&
        !loading ? (
          <p className="muted">예약 가능한 스터디룸이 없습니다.</p>
        ) : null}

        {normalizedRange
          ? [...activeGroups, ...inactiveGroups].map((group) => {
              const availableRoom = findFirstAvailableRoom(group, normalizedRange);
              const disabled = !availableRoom;

              return (
                <article
                  key={group.id}
                  className={disabled ? "room-card room-card-disabled" : "room-card"}
                >
                  <div>
                    <p className="room-name">{group.name}</p>
                    <p className="muted">
                      {group.floor}F · 운영 시간 {formatHourLabel(group.fromTime)} -{" "}
                      {formatHourLabel(group.toTime + 1)}
                    </p>
                    <p className="muted">
                      {group.facilities.length}개 호실
                      {disabled ? " · 현재 선택 시간에는 예약 불가" : ""}
                    </p>
                  </div>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={disabled || submittingGroupId === group.id}
                    onClick={() => void handleReservation(group)}
                  >
                    {submittingGroupId === group.id ? "예약 중..." : "예약하기"}
                  </button>
                </article>
              );
            })
          : null}
      </section>
    </>
  );

  const renderSuccessStage = reserveState.success ? (
    <section className="section">
      <div className="section-head">
        <div>
          <p className="eyebrow">완료</p>
          <h2>예약이 완료되었습니다.</h2>
        </div>
      </div>
      <div className="info-card">
        <p>{reserveState.success.groupName}</p>
        <strong>{reserveState.success.roomId}호</strong>
        <p>{formatDateHeading(reserveState.success.date)}</p>
        <p>
          {formatRangeLabel(
            reserveState.success.fromTime,
            reserveState.success.toTime,
          )}
        </p>
      </div>
      <div className="button-row">
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setReserveState({
              stage: "date",
              selectedDate: getTodayDateKey(),
              selectedRange: null,
              error: null,
              success: null,
            });
            setRangeSelectionMode("start");
          }}
        >
          새 예약
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={onOpenMyReservations}
        >
          내 예약 보기
        </button>
      </div>
    </section>
  ) : null;

  if (reserveState.stage === "date") {
    return renderDateStage;
  }

  if (reserveState.stage === "timeAndFacility") {
    return renderTimeAndFacilityStage;
  }

  return renderSuccessStage;
}

function MyReservationsTab({
  session,
  onUnauthorized,
}: {
  session: AuthState;
  onUnauthorized: () => void;
}) {
  const [state, setState] = useState<MyReservationsState>({
    items: [],
    loading: true,
    error: null,
  });
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const today = getTodayDateKey();
  const toDate = addDaysToDateKey(today, RESERVATION_LOOKAHEAD_DAYS);

  const loadItems = async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const items = await getReservations(session, today, toDate);
      setState({
        items: items.sort((left, right) => {
          const dateCompare = compareDateKeys(left.date, right.date);

          if (dateCompare !== 0) {
            return dateCompare;
          }

          if (left.roomId !== right.roomId) {
            return left.roomId - right.roomId;
          }

          return left.fromTime - right.fromTime;
        }),
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
        error: extractMessage(error, "예약 목록을 불러오지 못했습니다."),
      });
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const mergedItems = useMemo(() => mergeReservationItems(state.items), [state.items]);
  const todayItems = mergedItems.filter((item) => item.date === today);

  const handleCancel = async (item: MergedReservation) => {
    setSubmittingKey(item.key);

    try {
      await cancelReservation(session, {
        roomId: item.roomId,
        date: item.date,
        fromTime: item.fromTime,
        toTime: item.toTime,
      });
      await loadItems();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        onUnauthorized();
        return;
      }

      setState((current) => ({
        ...current,
        error: extractMessage(error, "예약 취소에 실패했습니다."),
      }));
    } finally {
      setSubmittingKey(null);
    }
  };

  const handleCancelToday = async () => {
    if (todayItems.length === 0) {
      return;
    }

    if (!window.confirm("오늘의 예약을 모두 취소할까요?")) {
      return;
    }

    setSubmittingKey("today-all");

    try {
      for (const item of todayItems) {
        await cancelReservation(session, {
          roomId: item.roomId,
          date: item.date,
          fromTime: item.fromTime,
          toTime: item.toTime,
        });
      }

      await loadItems();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        onUnauthorized();
        return;
      }

      setState((current) => ({
        ...current,
        error: extractMessage(error, "오늘 예약 전체 취소에 실패했습니다."),
      }));
    } finally {
      setSubmittingKey(null);
    }
  };

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <p className="eyebrow">내 예약</p>
          <h2>예정된 예약</h2>
        </div>
        <button
          className="secondary-button"
          type="button"
          disabled={todayItems.length === 0 || submittingKey === "today-all"}
          onClick={() => void handleCancelToday()}
        >
          {submittingKey === "today-all" ? "취소 중..." : "오늘 예약 전체 취소"}
        </button>
      </div>

      {state.loading ? <p className="muted">예약 목록을 불러오는 중입니다...</p> : null}
      {state.error ? <p className="error-text">{state.error}</p> : null}
      {!state.loading && mergedItems.length === 0 ? (
        <p className="muted">예정된 예약이 없습니다.</p>
      ) : null}

      <div className="list-stack">
        {mergedItems.map((item) => (
          <article key={item.key} className="reservation-card">
            <div>
              <p className="room-name">{item.roomId}호</p>
              <p className="muted">{formatDateHeading(item.date)}</p>
              <p>{formatRangeLabel(item.fromTime, item.toTime)}</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              disabled={submittingKey === item.key}
              onClick={() => void handleCancel(item)}
            >
              {submittingKey === item.key ? "취소 중..." : "취소"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default App;
