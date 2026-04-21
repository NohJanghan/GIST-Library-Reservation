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

