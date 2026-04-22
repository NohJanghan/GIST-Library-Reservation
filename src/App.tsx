import { useCallback, useState } from "react";
import { LoginScreen } from "./features/auth/components/LoginScreen";
import { useSession } from "./features/auth/hooks/useSession";
import { MyReservationsTab } from "./features/my-reservations/components/MyReservationsTab";
import { ReserveTab } from "./features/reservation/components/ReserveTab";
import { getConfigurationError } from "./shared/api/config";

type TabId = "reserve" | "myReservations";

function App() {
  const { session, loginState, loginWithCredentials, logout } = useSession();
  const [activeTab, setActiveTab] = useState<TabId>("reserve");
  const [reserveResetKey, setReserveResetKey] = useState(0);
  const configurationError = getConfigurationError();

  const handleUnauthorized = useCallback(() => {
    logout();
    setActiveTab("reserve");
  }, [logout]);

  const handleSelectReserveTab = useCallback(() => {
    setActiveTab((current) => {
      if (current === "reserve") {
        setReserveResetKey((value) => value + 1);
      }

      return "reserve";
    });
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
          submitting={loginState.submitting}
          error={loginState.error}
          onSubmit={loginWithCredentials}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="panel app-panel">
        <header className="top-bar">
          <p className="eyebrow">GIST Library Reservation</p>
          <button
            className="top-bar-action"
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
            onClick={handleSelectReserveTab}
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
            resetKey={reserveResetKey}
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

export default App;
