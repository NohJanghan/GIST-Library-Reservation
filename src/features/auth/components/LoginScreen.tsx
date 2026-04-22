import { useState, type FormEvent } from "react";

type LoginScreenProps = {
  submitting: boolean;
  error: string | null;
  onSubmit: (userId: string, userPwd: string) => Promise<void>;
};

export function LoginScreen({
  submitting,
  error,
  onSubmit,
}: LoginScreenProps) {
  const [userId, setUserId] = useState("");
  const [userPwd, setUserPwd] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(userId.trim(), userPwd);
  };

  return (
    <section className="panel narrow-panel">
      <h1>GIST 도서관 계정으로 로그인</h1>
      <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>아이디</span>
          <input
            autoComplete="username"
            inputMode="numeric"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="학번"
            required
          />
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input
            autoComplete="current-password"
            type="password"
            value={userPwd}
            onChange={(event) => setUserPwd(event.target.value)}
            placeholder="비밀번호"
            required
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </section>
  );
}
