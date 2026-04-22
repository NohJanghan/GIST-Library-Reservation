# AGENTS.md

## 개요

- 이 저장소는 GIST 도서관 스터디룸 예약 백엔드를 사용하는 단일 페이지 프론트엔드다.
- 스택은 `React 18 + Vite + TypeScript`다.
- 백엔드 코드는 이 저장소에 없고, 프론트엔드는 `VITE_API_BASE_URL`을 통해 API에 연결된다.
- UI 문구는 한국어를 유지하고, 타입/함수명은 현재처럼 영어 기반으로 유지한다.

## 실행과 검증

- 의존성 설치: `npm install`
- 개발 서버: `npm run dev`
- 테스트: `npm test`
- 프로덕션 빌드: `npm run build`
- 이 개발 환경에서는 `nvm`이 lazy-load되어 에이전트/비대화형 셸에서 `npm`이 바로 잡히지 않을 수 있다.
- `npm: command not found`가 나오면 먼저 `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`로 `nvm`을 명시적으로 로드한 뒤 다시 실행한다.
- 또는 이미 설치된 로컬 바이너리를 직접 호출한다. 예: `./node_modules/.bin/vitest run`, `./node_modules/.bin/vite build`, `./node_modules/.bin/tsc -b`
- 개발 모드에서는 Vite 프록시가 `/api/*`를 `VITE_API_BASE_URL`로 전달한다.
- 프로덕션 빌드에서는 `src/shared/api/config.ts`가 `VITE_API_BASE_URL`을 직접 사용한다.

## 현재 구조

- `src/main.tsx`: 앱 엔트리와 전역 스타일 로드
- `src/App.tsx`: 설정 확인, 인증 게이트, 탭 전환
- `src/features/auth`: 로그인 UI, 세션 훅, `localStorage` 연동
- `src/features/reservation`: 날짜/시간/스터디룸 선택과 예약 생성
- `src/features/my-reservations`: 예약 목록, 개별 취소, 오늘 전체 취소
- `src/shared/api`: fetch 래퍼, 인증/시설/예약 API, 응답 정규화
- `src/shared/lib`: 날짜 계산, 예약 계산, 에러 메시지 변환
- `src/shared/hooks`: 여러 기능에서 재사용하는 시간 관련 훅
- `src/shared/types`: 공용 타입
- `src/styles.css`: 전체 스타일
- `tests/shared`, `tests/features`: Vitest 테스트

## 아키텍처 규칙

- 비동기 요청, 세션 처리, 화면 상태 전이는 가능한 한 feature hook에 둔다.
- 재사용 가능한 순수 계산은 `src/shared/lib`에 둔다.
- API별 fetch 호출과 응답 정규화는 `src/shared/api`에 둔다.
- 컴포넌트는 화면 조합과 이벤트 연결에 집중하고, 비즈니스 로직을 직접 품지 않도록 유지한다.
- 새 기능을 추가할 때는 먼저 `feature`와 `shared` 중 어디에 속하는지 분리해서 설계한다.

## 도메인 규칙

- 로그인은 `POST /auth`를 사용한다.
- 예약 화면은 `GET /facility`와 `POST /reservation`를 사용한다.
- 내 예약 화면은 `GET /reservation`와 `DELETE /reservation`를 사용한다.
- 세션은 `localStorage`의 `gist-library-reservation.auth` 키에 저장한다.
- 저장된 세션이 만료됐거나 백엔드가 `401`을 반환하면 세션을 즉시 제거하고 로그인 화면으로 돌린다.
- refresh token 갱신 플로우는 아직 구현하지 않는다.
- 모든 날짜/시간 계산은 `Asia/Seoul` 기준이어야 한다.
- 예약 시간 범위는 항상 inclusive다. 즉 `fromTime=14`, `toTime=16`은 14시, 15시, 16시 슬롯을 뜻한다.
- 화면 표시용 시간 범위는 종료 시각을 `toTime + 1`로 보여준다.
- 오늘 예약 취소는 이미 지난 시간대를 제외한 미래 구간만 취소할 수 있다.
- 오늘 예약 전체 취소는 각 예약의 `cancelableRange`를 순회하며 부분 취소를 수행한다.
- 예약 가능 날짜 창은 현재 7일, 내 예약 조회 범위는 현재 30일이다.
- 시설 휴무일 데이터는 문자열, timestamp, 객체 등 여러 형태로 올 수 있으므로 `src/shared/api/facility.ts`에서 정규화한다.
- `409` 응답은 일반 에러가 아니라 "예약 조건이 바뀌었습니다. 다시 선택해주세요."로 매핑한다.

## 시간 관련 주의사항

- 시간 계산은 `src/shared/lib/date.ts`와 `src/shared/hooks/useKoreaClock.ts`에 집중돼 있다.
- `useReserveFlow`와 `useMyReservations`는 현재 시각에 따라 예약 가능 여부와 취소 가능 범위를 바꾼다.
- 이 영역을 수정할 때는 정각 경계, 자정 경계, 백그라운드 탭 복귀 상황을 반드시 검증한다.
- 현재 리뷰 기준으로 `useKoreaClock`의 `CLOCK_TICK_MS` 단위 tick 때문에 시간 경계 직후 stale 값이 잠깐 보일 수 있다는 우려가 있다. 이 부분을 건드리면 회귀 여부를 꼭 확인한다.

## 테스트 원칙

- 순수 함수 변경은 `tests/shared/lib`에 테스트를 추가하거나 갱신한다.
- API payload, 헤더, 에러 매핑 변경은 `tests/shared/api`에 테스트를 추가하거나 갱신한다.
- feature hook의 상태 전이, 로딩, 성공/실패, `401` 처리 변경은 `tests/features`에 테스트를 추가하거나 갱신한다.
- 예약 시간 범위, 부분 취소, 날짜 계산, 세션 영속성은 이 프로젝트에서 회귀가 나기 쉬운 영역이므로 테스트 없이 바꾸지 않는다.
- 변경 후에는 최소한 `npm test`와 `npm run build`를 모두 통과시키는 것을 기준으로 삼는다.

## 변경 시 선호 사항

- 기존 feature 기반 폴더 구조를 유지한다.
- 새로운 전역 상태 라이브러리나 라우터는 실제 필요가 생기기 전까지 추가하지 않는다.
- 스타일은 현재처럼 `src/styles.css` 중심으로 유지하고, 작은 UI 변경 때문에 과도한 CSS 구조 분해를 하지 않는다.
- `dist/`는 빌드 산출물이다. 명시적 요청이 없으면 수동 수정하지 않는다.
- `node_modules/`는 문서나 코드 수정 대상이 아니다.
- 의존성을 추가했다면 이유가 명확해야 하고, 관련 테스트 또는 개발 생산성 개선이 함께 설명돼야 한다.
