import { useEffect, useState } from "react";
import { getCurrentKoreaTimeParts, getNextReservableHour, getTodayDateKey } from "../lib/date";

const CLOCK_TICK_MS = 10_000;

export function useKoreaClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, CLOCK_TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return {
    now,
    today: getTodayDateKey(now),
    currentTime: getCurrentKoreaTimeParts(now),
    nextReservableHour: getNextReservableHour(now),
  };
}
