import { formatDateHeading, formatRangeLabel } from "../../../shared/lib/date";
import { getPartialCancellationMessage } from "../../../shared/lib/errors";
import type { AuthState, ReservationDisplayItem } from "../../../shared/types";
import { useMyReservations } from "../hooks/useMyReservations";

type MyReservationsTabProps = {
  session: AuthState;
  onUnauthorized: () => void;
};

export function MyReservationsTab({
  session,
  onUnauthorized,
}: MyReservationsTabProps) {
  const reservations = useMyReservations(session, onUnauthorized);

  const handleCancel = async (item: ReservationDisplayItem) => {
    if (
      item.requiresPartialCancellationWarning &&
      !window.confirm(getPartialCancellationMessage("single"))
    ) {
      return;
    }

    await reservations.cancelItem(item);
  };

  const handleCancelToday = async () => {
    if (reservations.todayCancelableItems.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      reservations.hasTodayPartialCancellation
        ? getPartialCancellationMessage("all")
        : "오늘의 예약을 모두 취소할까요?",
    );

    if (!confirmed) {
      return;
    }

    await reservations.cancelToday();
  };

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>예정된 예약</h2>
        </div>
        <button
          className="danger-button"
          type="button"
          disabled={
            reservations.todayCancelableItems.length === 0 ||
            reservations.submittingKey === "today-all"
          }
          onClick={() => void handleCancelToday()}
        >
          {reservations.submittingKey === "today-all"
            ? "취소 중..."
            : "오늘 예약 전체 취소"}
        </button>
      </div>

      {reservations.state.loading ? (
        <p className="muted">예약 목록을 불러오는 중입니다...</p>
      ) : null}
      {reservations.state.error ? (
        <p className="error-text">{reservations.state.error}</p>
      ) : null}
      {!reservations.state.loading && reservations.displayItems.length === 0 ? (
        <p className="muted">예정된 예약이 없습니다.</p>
      ) : null}

      <div className="list-stack">
        {reservations.displayItems.map((item) => (
          <article key={item.key} className="reservation-card">
            <div>
              <p className="room-name">{item.roomId}호</p>
              <p className="muted">{formatDateHeading(item.date)}</p>
              <p>{formatRangeLabel(item.fromTime, item.toTime)}</p>
              {item.cancelableRange === null && item.date === reservations.today ? (
                <p className="muted">이미 시작된 예약은 취소할 수 없습니다.</p>
              ) : null}
              {item.requiresPartialCancellationWarning ? (
                <p className="muted">
                  취소 시 아직 시작되지 않은 시간만 취소됩니다.
                </p>
              ) : null}
            </div>
            {item.cancelableRange ? (
              <button
                className="secondary-button"
                type="button"
                disabled={reservations.submittingKey === item.key}
                onClick={() => void handleCancel(item)}
              >
                {reservations.submittingKey === item.key ? "취소 중..." : "취소"}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
