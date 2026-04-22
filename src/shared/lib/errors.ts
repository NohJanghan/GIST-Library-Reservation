import { ApiError } from "../api/http";

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getRequestErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    if (error.status === 409) {
      return "예약 조건이 바뀌었습니다. 다시 선택해주세요.";
    }

    return error.message || fallback;
  }

  return fallback;
}

export function getPartialCancellationMessage(scope: "single" | "all") {
  if (scope === "all") {
    return "이미 지난 시간과 사용 중인 시간은 제외하고, 아직 시작되지 않은 오늘 예약만 취소합니다. 계속할까요?";
  }

  return "이미 지난 시간과 사용 중인 시간은 제외하고, 아직 시작되지 않은 시간만 취소합니다. 계속할까요?";
}
