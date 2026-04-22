import { fireEvent, render, screen } from "@testing-library/react";
import App from "../src/App";

const mockUseSession = vi.fn();
const reserveTabSpy = vi.fn();

vi.mock("../src/features/auth/hooks/useSession", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("../src/shared/api/config", () => ({
  getConfigurationError: () => null,
}));

vi.mock("../src/features/auth/components/LoginScreen", () => ({
  LoginScreen: () => <div>login</div>,
}));

vi.mock("../src/features/my-reservations/components/MyReservationsTab", () => ({
  MyReservationsTab: () => <div>my reservations</div>,
}));

vi.mock("../src/features/reservation/components/ReserveTab", () => ({
  ReserveTab: (props: { resetKey: number }) => {
    reserveTabSpy(props);

    return <div>reserve {props.resetKey}</div>;
  },
}));

describe("App", () => {
  it("resets the reservation flow when the active reserve tab is clicked again", () => {
    mockUseSession.mockReturnValue({
      session: {
        userId: "20235059",
        accessToken: "token",
        refreshToken: "refresh",
        type: "Bearer",
        expiredAt: Math.floor(Date.now() / 1000) + 3600,
      },
      loginState: {
        submitting: false,
        error: null,
      },
      loginWithCredentials: vi.fn(),
      logout: vi.fn(),
    });

    render(<App />);

    expect(screen.getByText("reserve 0")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "예약" }));

    expect(screen.getByText("reserve 1")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "내 예약" }));
    expect(screen.getByText("my reservations")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "예약" }));

    expect(screen.getByText("reserve 1")).not.toBeNull();
    expect(reserveTabSpy.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({ resetKey: 1 }),
    );
  });
});
