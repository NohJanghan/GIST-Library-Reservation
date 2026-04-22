# GIST Library Reservation Frontend

Minimal React frontend for the GIST Library Reservation backend documented in Notion.

## Stack

- Vite
- React
- TypeScript

## Environment

Create `.env` from `.env.example`.

```bash
VITE_API_BASE_URL=https://your-backend-host.example.com
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm test
```

## Implemented Scope

- Login with `POST /auth`
- Reservation flow with `GET /facility` and `POST /reservation`
- My reservations with `GET /reservation` and `DELETE /reservation`
- Session persistence in `localStorage`

## Notes

- Session is cleared when the token expires or the backend returns `401`.
- Date and time handling is normalized to `Asia/Seoul`.
- Refresh token flow is intentionally not implemented yet.

## Structure

- `src/features/auth`: 로그인과 세션 관리
- `src/features/reservation`: 예약 플로우
- `src/features/my-reservations`: 예약 목록과 취소
- `src/shared`: API, 공용 타입, 날짜/예약 유틸
