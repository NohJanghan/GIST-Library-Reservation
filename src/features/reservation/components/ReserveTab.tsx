import {
  formatDateHeading,
  formatDateLabel,
  formatHourLabel,
  formatRangeLabel,
  getKoreanWeekday,
} from "../../../shared/lib/date";
import { useGridColumnCount } from "../../../shared/hooks/useGridColumnCount";
import {
  findFirstAvailableRoom,
  getVisibleHourOptions,
} from "../../../shared/lib/reservations";
import type { AuthState } from "../../../shared/types";
import { useReserveFlow } from "../hooks/useReserveFlow";

type ReserveTabProps = {
  session: AuthState;
  onUnauthorized: () => void;
  onOpenMyReservations: () => void;
  resetKey: number;
};

export function ReserveTab({
  session,
  onUnauthorized,
  onOpenMyReservations,
  resetKey,
}: ReserveTabProps) {
  const flow = useReserveFlow(session, onUnauthorized, resetKey);
  const { columnCount, gridRef } = useGridColumnCount();
  const normalizedRange = flow.normalizedRange;
  const hourOptions = getVisibleHourOptions({
    start: flow.selectableHourRange.start,
    end: flow.selectableHourRange.end,
    isToday: flow.isSelectedDateToday,
    nextReservableHour: flow.nextReservableHour,
    columnCount,
  });

  if (flow.state.stage === "date") {
    return (
        <section className="section">
          <div className="section-head">
            <div>
              <h2>날짜 선택</h2>
            </div>
          </div>
        <div className="date-grid">
          {flow.dateOptions.map((dateKey) => {
            const disabled = flow.blockedDates.includes(dateKey);
            const selected = flow.state.selectedDate === dateKey;

            return (
              <button
                key={dateKey}
                type="button"
                className={selected ? "date-chip active" : "date-chip"}
                disabled={disabled}
                onClick={() => flow.selectDate(dateKey)}
              >
                <span>{formatDateLabel(dateKey)}</span>
                <strong>{getKoreanWeekday(dateKey)}</strong>
              </button>
            );
          })}
        </div>
        {flow.loading ? <p className="muted">시설 정보를 불러오는 중입니다...</p> : null}
        {flow.loadingError ? <p className="error-text">{flow.loadingError}</p> : null}
        {flow.blockedDates.includes(flow.state.selectedDate) ? (
          <p className="muted">해당 날짜는 예약할 수 없습니다.</p>
        ) : null}
        {flow.state.error ? <p className="error-text">{flow.state.error}</p> : null}
        <button
          className="primary-button"
          type="button"
          onClick={flow.continueFromDate}
          disabled={flow.loading || !flow.facilityResponse || flow.isDateBlocked}
        >
          다음
        </button>
      </section>
    );
  }

  if (flow.state.stage === "timeAndFacility") {
    return (
      <>
        <section className="section">
          <div>
            <h2>{formatDateHeading(flow.state.selectedDate)}</h2>
          </div>

          <div ref={gridRef} className="time-grid">
            {hourOptions.map((hour) => {
              const selected =
                normalizedRange &&
                hour >= normalizedRange[0] &&
                hour <= normalizedRange[1];
              const disabled =
                flow.maxSelectableHours <= 0 ||
                (flow.isSelectedDateToday && hour < flow.nextReservableHour);

              return (
                <button
                  key={hour}
                  type="button"
                  className={selected ? "time-chip active" : "time-chip"}
                  disabled={disabled}
                  onClick={() => flow.selectHour(hour)}
                >
                  {formatHourLabel(hour)}
                </button>
              );
            })}
          </div>

          {normalizedRange ? (
            <>
              <p className="muted selection-status selection-status-desktop">
                선택 시간: {formatRangeLabel(normalizedRange[0], normalizedRange[1])} · 예약
                가능: {flow.maxSelectableHours}시간
              </p>
              <p className="muted selection-status selection-status-mobile">
                선택 시간: {formatRangeLabel(normalizedRange[0], normalizedRange[1])}
              </p>
            </>
          ) : (
            <p className="muted selection-status">예약 가능: {flow.maxSelectableHours}시간</p>
          )}
          {flow.state.error ? <p className="error-text">{flow.state.error}</p> : null}
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <h2 className={!normalizedRange ? "section-title-muted" : undefined}>
                스터디룸 선택
              </h2>
            </div>
          </div>

          {!normalizedRange ? (
            <p className="muted">먼저 예약 시간을 선택해주세요.</p>
          ) : null}

          {normalizedRange &&
          flow.activeGroups.length === 0 &&
          flow.inactiveGroups.length === 0 &&
          !flow.loading ? (
            <p className="muted">예약 가능한 스터디룸이 없습니다.</p>
          ) : null}

          {normalizedRange
            ? [...flow.activeGroups, ...flow.inactiveGroups].map((group) => {
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
                      disabled={disabled || flow.submittingGroupId === group.id}
                      onClick={() => void flow.reserve(group)}
                    >
                      {flow.submittingGroupId === group.id ? "예약 중..." : "예약하기"}
                    </button>
                  </article>
                );
              })
            : null}
        </section>
      </>
    );
  }

  if (!flow.state.success) {
    return null;
  }

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <p className="eyebrow">완료</p>
          <h2>예약이 완료되었습니다.</h2>
        </div>
      </div>
      <div className="info-card">
        <p>{flow.state.success.groupName}</p>
        <strong>{flow.state.success.roomId}호</strong>
        <p>{formatDateHeading(flow.state.success.date)}</p>
        <p>
          {formatRangeLabel(
            flow.state.success.fromTime,
            flow.state.success.toTime,
          )}
        </p>
      </div>
      <div className="button-row">
        <button
          className="secondary-button"
          type="button"
          onClick={flow.startNewReservation}
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
  );
}
