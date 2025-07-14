# Fit Harmony Backend API

Fit Harmony 피트니스 플랫폼의 백엔드 API 서버입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js (v14 이상)
- PostgreSQL
- Python 3.8+ (AI 기능용)

### 설치 및 실행

1. 의존성 설치

```bash
npm install
```

2. 환경변수 설정
   `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
PORT=8000
FRONT_DOMAIN=http://localhost:3000
SESSION_SECRET=your_session_secret
PYTHON_ENV_PATH=path_to_your_python_env
GPT_4_o=your_gpt_model_name
```

3. 서버 실행

```bash
npm start
```

## 📚 API 문서

### Swagger UI

API 문서는 Swagger UI를 통해 제공됩니다:

- **URL**: `http://localhost:8000/api-docs`
- **설명**: 모든 API 엔드포인트의 상세한 문서와 테스트 기능을 제공합니다.

### 주요 API 카테고리

#### 🔐 인증 (Authentication)

- `POST /auth/login` - 사용자 로그인
- `POST /auth/logout` - 사용자 로그아웃
- `GET /auth/google` - Google OAuth 로그인
- `POST /auth/google/register` - Google OAuth 회원가입

#### 👥 커뮤니티 (Community)

- `GET /community/{boardId}` - 게시판별 게시글 조회
- `GET /community/post/{postId}` - 게시글 상세 조회
- `POST /community/post` - 게시글 작성
- `PUT /community/post` - 게시글 수정
- `DELETE /community/delete` - 게시글 삭제
- `GET /community/comments/{postId}` - 댓글 목록 조회
- `POST /community/comment/create` - 댓글 작성

#### 📅 스케줄 (Schedule)

- `GET /schedule/calendar/{startTime}/{endTime}` - 캘린더 스케줄 조회
- `POST /schedule/requestAiSchdule` - AI 스케줄 생성 요청
- `PATCH /schedule/updateSchedule` - 스케줄 상태 업데이트

#### 💪 인바디 (Inbody)

- `GET /inbody/` - 인바디 데이터 조회
- `POST /inbody/register` - 인바디 데이터 등록
- `PUT /inbody/update` - 인바디 데이터 수정

#### 👨‍💼 트레이너 (Trainer)

- `GET /trainer/` - 트레이너 목록 조회
- `GET /trainer/{trainerId}` - 트레이너 상세 정보
- `POST /trainer/request` - 트레이너 매칭 요청

#### 🛒 구매 (Purchase)

- `GET /buy/` - 구매 내역 조회
- `POST /buy/` - 상품 구매
- `PUT /buy/status` - 구매 상태 업데이트

## 🔧 개발 가이드

### API 문서화 가이드

새로운 API 엔드포인트를 추가할 때는 Swagger 주석을 포함해야 합니다:

```javascript
/**
 * @swagger
 * /api/endpoint:
 *   get:
 *     summary: API 요약
 *     description: API 상세 설명
 *     tags: [태그명]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 성공 응답
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResponseModel'
 */
```

### 스키마 정의

공통으로 사용되는 데이터 모델은 `components/schemas`에 정의합니다:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 */
```

## 🛡️ 보안

- 세션 기반 인증 사용
- CORS 설정으로 프론트엔드 도메인만 허용
- Helmet.js를 통한 보안 헤더 설정
- 역할 기반 접근 제어 (RBAC)

## 📁 프로젝트 구조

```
BACK/
├── config/           # 설정 파일들
├── controllers/      # 컨트롤러 (비즈니스 로직)
├── routes/          # 라우터 정의
├── uploads/         # 업로드된 파일들
├── utils/           # 유틸리티 함수들
├── index.js         # 메인 서버 파일
└── package.json     # 프로젝트 의존성
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

- 이메일: support@fitharmony.com
- 프로젝트 링크: [https://github.com/your-username/fit-harmony](https://github.com/your-username/fit-harmony)
