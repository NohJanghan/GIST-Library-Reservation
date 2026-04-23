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
DEPLOY_HOST=000.000.000.10
DEPLOY_USER=opc
DEPLOY_TARGET_DIR=/var/www/gist-library-reservation
DEPLOY_TMP_DIR=/tmp/gist-library-reservation
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm test
./deploy.sh
```

## OCI VM Deploy

`deploy.sh` reads deployment settings from `.env`, builds the app, uploads `dist.tar.gz` with `scp`, and unpacks it on the VM.

Required variables:

- `VITE_API_BASE_URL`: backend base URL for the production build
- `DEPLOY_HOST`: public IP or hostname of the OCI VM
- `DEPLOY_USER`: SSH user such as `opc` or `ubuntu`
- `DEPLOY_TARGET_DIR`: nginx document root on the VM
- `DEPLOY_TMP_DIR`: temporary upload directory on the VM
- `DEPLOY_PORT`: optional SSH port, default `22`

Run:

```bash
chmod +x ./deploy.sh
./deploy.sh
```

The remote user must be able to run `sudo mkdir`, `sudo rm`, and `sudo cp` for `DEPLOY_TARGET_DIR`.

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
