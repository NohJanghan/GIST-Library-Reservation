import { act, renderHook, waitFor } from "@testing-library/react";
import { ApiError } from "../../../../src/shared/api/http";
import { useSession } from "../../../../src/features/auth/hooks/useSession";
import { login } from "../../../../src/shared/api/auth";

vi.mock("../../../../src/shared/api/auth", () => ({
  login: vi.fn(),
}));

const STORAGE_KEY = "gist-library-reservation.auth";

describe("useSession", () => {
  it("loads an existing session and clears expired sessions", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        userId: "20235059",
        accessToken: "token",
        refreshToken: "refresh",
        type: "Bearer",
        expiredAt: 1,
      }),
    );

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.session).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  it("logs in, persists the session, and logs out", async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: "token",
      refreshToken: "refresh",
      type: "Bearer",
      expiredAt: Math.floor(Date.now() / 1000) + 3600,
    });

    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.loginWithCredentials("20235059", "pw");
    });

    expect(result.current.session).toMatchObject({
      userId: "20235059",
      accessToken: "token",
    });
    expect(localStorage.getItem(STORAGE_KEY)).toContain("20235059");

    act(() => {
      result.current.logout();
    });

    expect(result.current.session).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("maps a 401 login error to the credential message", async () => {
    vi.mocked(login).mockRejectedValue(new ApiError("Unauthorized", 401));

    const { result } = renderHook(() => useSession());

    await act(async () => {
      await result.current.loginWithCredentials("20235059", "wrong");
    });

    expect(result.current.session).toBeNull();
    expect(result.current.loginState.error).toBe(
      "아이디 또는 비밀번호를 확인해주세요.",
    );
  });
});
