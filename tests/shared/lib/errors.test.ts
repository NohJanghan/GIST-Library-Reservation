import { ApiError } from "../../../src/shared/api/http";
import {
  getPartialCancellationMessage,
  getRequestErrorMessage,
} from "../../../src/shared/lib/errors";

describe("shared/lib/errors", () => {
  it("maps 409 errors to the reservation conflict message", () => {
    expect(getRequestErrorMessage(new ApiError("occupied", 409), "fallback")).toBe(
      "예약 조건이 바뀌었습니다. 다시 선택해주세요.",
    );
  });

  it("falls back to the api message or fallback for non-conflicts", () => {
    expect(getRequestErrorMessage(new ApiError("bad request", 400), "fallback")).toBe(
      "bad request",
    );
    expect(getRequestErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
  });

  it("returns the partial cancellation prompts", () => {
    expect(getPartialCancellationMessage("single")).toContain("아직 시작되지 않은 시간");
    expect(getPartialCancellationMessage("all")).toContain("오늘 예약만 취소");
  });
});
