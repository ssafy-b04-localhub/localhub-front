# LocalHub Frontend

부산 지역의 관광지, 문화시설, 축제·공연·행사 등 지역 정보를 조회하고, 로그인 없이 게시글을 작성할 수 있는 **Vue 3 기반 SPA 프론트엔드**입니다.

첨부된 LocalHub 디자인 시안을 바탕으로 구현했으며, FastAPI 백엔드와 Axios로 연동합니다.

---

## 1. 주요 기능

### 홈

- 부산 지역 정보 공유 커뮤니티 소개 배너
- 전체 콘텐츠 카테고리 표시
- 카테고리 가로 스크롤
- 카테고리별 이모지 표시
- 카테고리 선택 시 해당 유형의 장소 목록으로 이동
- 최근 게시글 최대 4개 표시
- 게시글 날짜 한국식 표기
- 플로팅 챗봇 버튼

### 장소 목록

- 전체 장소 또는 콘텐츠 유형별 장소 조회
- 키워드 검색
- URL Query Parameter를 이용한 필터 유지
- 장소 이미지, 이름, 카테고리, 주소 표시
- 이미지가 없는 경우 대체 UI 표시
- 장소 상세 페이지 이동
- 로딩·오류·검색 결과 없음 상태 처리

### 장소 상세

- 장소 대표 이미지
- 장소명 및 카테고리 표시
- 주소와 상세 주소
- 소개 및 설명
- 전화번호
- 홈페이지
- 운영 시간
- 휴무일
- 이용 요금
- 주차 정보
- 축제 기간 및 행사 장소
- 값이 존재하는 정보만 조건부 표시
- 원본 JSON 내부 코드값은 화면에 노출하지 않음

### 익명 게시판

- 게시글 목록
- 게시글 검색
- 클라이언트 페이지네이션
- 게시글 상세
- 게시글 작성
- 게시글 수정
- 게시글 삭제
- 수정·삭제 시 비밀번호 입력
- 로그인 및 회원가입 없이 이용 가능

### 챗봇

- 우측 하단 플로팅 버튼
- 데스크톱 패널 UI
- 모바일 전체 화면형 UI
- Enter 전송
- Shift + Enter 줄바꿈
- API 요청 중 중복 전송 방지
- 챗봇 API 연결 실패 시 안내 메시지 표시

### 공통 UI

- 공통 헤더
- 페이지별 뒤로가기 버튼
- Not Found 화면
- 데스크톱·태블릿·모바일 반응형
- 키보드 포커스 스타일
- 접근성을 고려한 버튼 및 `aria-label`

---

## 2. 기술 스택

- Vue.js 3
- Vite
- Vue Router
- Axios
- JavaScript
- Composition API
- `<script setup>`
- CSS

---

## 3. 프로젝트 구조

```text
src/
├─ api/
│  ├─ index.js
│  ├─ content.js
│  ├─ posts.js
│  └─ chat.js
├─ components/
│  ├─ AppHeader.vue
│  ├─ BackButton.vue
│  ├─ PlaceCard.vue
│  ├─ PasswordModal.vue
│  └─ ChatBotWidget.vue
├─ router/
│  └─ index.js
├─ utils/
│  └─ formatDate.js
├─ views/
│  ├─ Home.vue
│  ├─ Places.vue
│  ├─ PlaceDetail.vue
│  ├─ PostsList.vue
│  ├─ PostDetail.vue
│  ├─ PostForm.vue
│  └─ NotFound.vue
├─ App.vue
├─ main.js
└─ style.css
```

---

## 4. 파일 역할

### `src/api`

백엔드 API 요청을 화면 컴포넌트와 분리합니다.

- `index.js`: 공통 Axios 인스턴스 및 기본 URL 설정
- `content.js`: 콘텐츠 유형, 장소 목록, 장소 상세 API
- `posts.js`: 게시글 목록·작성·수정·삭제 API
- `chat.js`: 챗봇 API

### `src/components`

여러 화면에서 재사용하는 공통 UI입니다.

- `AppHeader.vue`: 로고와 상단 내비게이션
- `BackButton.vue`: 공통 뒤로가기 버튼
- `PlaceCard.vue`: 장소 목록 카드
- `PasswordModal.vue`: 게시글 삭제 비밀번호 입력 모달
- `ChatBotWidget.vue`: 플로팅 버튼과 챗봇 대화창

### `src/views`

라우터와 직접 연결되는 페이지 단위 컴포넌트입니다.

- `Home.vue`: 홈
- `Places.vue`: 장소 목록
- `PlaceDetail.vue`: 장소 상세
- `PostsList.vue`: 게시글 목록
- `PostDetail.vue`: 게시글 상세
- `PostForm.vue`: 게시글 작성·수정
- `NotFound.vue`: 존재하지 않는 경로 안내

### `src/utils`

- `formatDate.js`: 게시글 날짜를 `2026년 7월 14일` 형식으로 변환

---

## 5. 라우트

| 경로 | 화면 |
|---|---|
| `/` | 홈 |
| `/places` | 장소 목록 |
| `/places/:id` | 장소 상세 |
| `/posts` | 게시글 목록 |
| `/posts/new` | 게시글 작성 |
| `/posts/:id` | 게시글 상세 |
| `/posts/:id/edit` | 게시글 수정 |
| `/:pathMatch(.*)*` | Not Found |

---

## 6. 실행 방법

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

기본 접속 주소:

```text
http://localhost:5173
```

### 빌드 확인

```bash
npm run build
```

### 빌드 결과 미리보기

```bash
npm run preview
```

---

## 7. 환경변수

프로젝트 루트에 `.env` 또는 `.env.local` 파일을 생성합니다.

```env
VITE_API_BASE_URL=http://localhost:8000
```

배포 환경에서는 Render 백엔드 주소를 등록합니다.

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

> Vite 환경변수는 반드시 `VITE_` 접두사를 사용해야 합니다.

---

## 8. 연동 API

### 콘텐츠

```http
GET /api/content-types
GET /api/places
GET /api/places/{contentid}
```

장소 목록 요청 예시:

```http
GET /api/places?content_type=관광지&keyword=해운대&limit=10
```

### 게시판

```http
GET /posts
POST /posts
PUT /posts/{post_id}
DELETE /posts/{post_id}?password=비밀번호
```

게시글 작성·수정 요청 예시:

```json
{
  "title": "제목",
  "content": "내용",
  "password": "비밀번호"
}
```

### 챗봇

```http
POST /api/chat
```

> 현재 백엔드에 `/api/chat`이 구현되지 않은 경우 프론트에서는 연결 실패 안내 메시지를 표시합니다.

---

## 9. 구현 참고사항

### 게시글 상세 조회

현재 백엔드에 `GET /posts/{id}`가 없다면 프론트의 `getPost(id)`가 전체 게시글 목록을 조회한 뒤 ID가 일치하는 게시글을 찾습니다.

단건 조회 API가 추가되면 `src/api/posts.js`의 `getPost` 함수만 수정하면 됩니다.

### 게시글 검색과 페이지네이션

백엔드에 검색·페이지네이션 API가 없다면 프론트에서 다음과 같이 처리합니다.

- 제목 기준 클라이언트 검색
- 최신순 정렬
- 페이지당 7개 표시

### 게시글 비밀번호

- 비밀번호는 화면에 표시하지 않습니다.
- `localStorage`와 `sessionStorage`에 저장하지 않습니다.
- 프론트에서 비밀번호를 직접 비교하지 않습니다.
- 수정·삭제 성공 여부는 백엔드 응답으로 판단합니다.

### 장소 상세 정보

장소마다 JSON 구조가 다를 수 있으므로 실제 값이 존재하는 항목만 화면에 표시합니다.

내부 코드나 관리용 필드는 표시하지 않습니다.

---

## 10. 반응형 기준

- 데스크톱: 넓은 콘텐츠 영역과 카드형 레이아웃
- 태블릿: 카드와 폼 너비 자동 조정
- 모바일:
  - 가로 스크롤 카테고리
  - 장소 카드 세로 배치
  - 상세 정보 1열 배치
  - 챗봇 화면 확대
  - 입력 폼과 버튼 전체 너비 적용

---

## 11. 배포

### Netlify

1. 저장소 연결
2. Build command 설정

```text
npm run build
```

3. Publish directory 설정

```text
dist
```

4. 환경변수 등록

```text
VITE_API_BASE_URL=https://your-backend.onrender.com
```

Vue Router의 새로고침 오류를 방지하려면 `public/_redirects` 파일을 추가할 수 있습니다.

```text
/* /index.html 200
```

---

## 12. 향후 개선 사항

- 챗봇 백엔드 API 연동
- 장소 지도 시각화
- 게시글 단건 조회 API 연동
- 서버 검색 및 서버 페이지네이션
- 카테고리별 대표 이미지 개선
- 로딩 스켈레톤 UI
- Toast 알림
- 접근성 추가 개선
- E2E 테스트
