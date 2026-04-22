import type { AuthState } from "../../../src/shared/types";

const session: AuthState = {
  userId: "20235059",
  accessToken: "token",
  refreshToken: "refresh",
  type: "Bearer",
  expiredAt: Math.floor(Date.now() / 1000) + 3600,
};

describe("shared/api/reservations", () => {
  it("sends inclusive ranges 그대로 when creating a reservation", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "https://example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ),
    );

    const { createReservation } = await import("../../../src/shared/api/reservations");
    const payload = {
      roomId: 221,
      date: "20260422",
      fromTime: 14,
      toTime: 16,
    };

    await createReservation(session, payload);

    const fetchMock = vi.mocked(fetch);
    const [, options] = fetchMock.mock.calls[0];
    const headers = options?.headers as Headers;

    expect(String(fetchMock.mock.calls[0][0])).toContain("/reservation");
    expect(options).toMatchObject({
      method: "POST",
      body: JSON.stringify(payload),
    });
    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("sends inclusive ranges 그대로 when canceling a reservation", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_BASE_URL", "https://example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ),
    );

    const { cancelReservation } = await import("../../../src/shared/api/reservations");
    const payload = {
      roomId: 227,
      date: "20260422",
      fromTime: 14,
      toTime: 15,
    };

    await cancelReservation(session, payload);

    const fetchMock = vi.mocked(fetch);
    const [, options] = fetchMock.mock.calls[0];

    expect(String(fetchMock.mock.calls[0][0])).toContain("/reservation");
    expect(options).toMatchObject({
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  });
});
