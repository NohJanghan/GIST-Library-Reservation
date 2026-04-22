import { useCallback, useEffect, useState } from "react";
import { login } from "../../../shared/api/auth";
import { getRequestErrorMessage, isApiError } from "../../../shared/lib/errors";
import type { AuthState } from "../../../shared/types";
import { clearStoredSession, loadStoredSession, saveStoredSession } from "../storage";

type LoginState = {
  submitting: boolean;
  error: string | null;
};

const INITIAL_LOGIN_STATE: LoginState = {
  submitting: false,
  error: null,
};

export function useSession() {
  const [session, setSession] = useState<AuthState | null>(() => loadStoredSession());
  const [loginState, setLoginState] = useState<LoginState>(INITIAL_LOGIN_STATE);

  useEffect(() => {
    if (!session) {
      clearStoredSession();
    }
  }, [session]);

  const loginWithCredentials = useCallback(async (userId: string, userPwd: string) => {
    setLoginState({
      submitting: true,
      error: null,
    });

    try {
      const trimmedUserId = userId.trim();
      const response = await login(trimmedUserId, userPwd);
      const nextSession = { ...response, userId: trimmedUserId };

      saveStoredSession(nextSession);
      setSession(nextSession);
      setLoginState(INITIAL_LOGIN_STATE);
    } catch (error) {
      setLoginState({
        submitting: false,
        error:
          isApiError(error) && error.status === 401
            ? "아이디 또는 비밀번호를 확인해주세요."
            : getRequestErrorMessage(error, "로그인에 실패했습니다."),
      });
    } finally {
      setLoginState((current) => ({
        ...current,
        submitting: false,
      }));
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setSession(null);
    setLoginState(INITIAL_LOGIN_STATE);
  }, []);

  return {
    session,
    loginState,
    loginWithCredentials,
    logout,
  };
}
