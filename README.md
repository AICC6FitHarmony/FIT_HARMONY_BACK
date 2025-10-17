# FIT_HARMONY 백엔드

FIT_HARMONY는 헬스장 운영 및 회원 관리를 위한 통합 플랫폼의 백엔드 서버입니다. 트레이너와 회원 간의 소통, 인바디 분석, 일정 관리, 상품 판매 등의 기능을 제공합니다.

## 📚 기술 스택

### 핵심 프레임워크 및 런타임
- **Node.js** - JavaScript 런타임
- **Express.js** `v5.1.0` - 웹 애플리케이션 프레임워크
- **PostgreSQL** `v8.16.0` - 관계형 데이터베이스

### 인증 및 보안
- **Passport.js** `v0.7.0` - 인증 미들웨어
  - `passport-local` `v1.0.0` - 로컬 인증 전략
  - `passport-google-oauth20` `v2.0.0` - 구글 OAuth 2.0 인증
- **express-session** `v1.18.1` - 세션 관리
- **connect-pg-simple** `v10.0.0` - PostgreSQL 기반 세션 스토어
- **crypto** - 비밀번호 해싱 (SHA-512)
- **helmet** `v8.1.0` - HTTP 보안 헤더 설정

### 파일 처리 및 AI/OCR
- **multer** `v2.0.1` - 파일 업로드 처리
- **tesseract.js** `v6.0.1` - OCR (광학 문자 인식)
- **Python 3.x** - AI 모델 실행
  - `paddlepaddle` - 딥러닝 프레임워크
  - `paddleocr` - OCR 엔진
  - `openai` - GPT 모델 연동

### 기타 유틸리티
- **cors** `v2.8.5` - Cross-Origin Resource Sharing 설정
- **dotenv** `v16.5.0` - 환경 변수 관리
- **uuid** `v11.1.0` - 고유 식별자 생성
- **camelcase-keys** `v9.1.3` - 데이터베이스 결과 카멜케이스 변환
- **nodemon** `v3.1.10` - 개발 서버 자동 재시작

## 🔐 인증 관련 처리 방식

### 1. 인증 전략
FIT_HARMONY는 **Passport.js**를 활용한 다중 인증 전략을 지원합니다:

#### 로컬 인증 (Local Strategy)
- ID/비밀번호 기반 인증
- SHA-512 해시 알고리즘으로 비밀번호 암호화
- 데이터베이스에서 사용자 정보 검증

#### 소셜 로그인 (Google OAuth 2.0)
- 구글 계정을 통한 간편 로그인
- 회원가입 시 프로필 정보 자동 연동
- 탈퇴 회원 상태 체크

### 2. 세션 관리
```javascript
// PostgreSQL 기반 세션 저장소
session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,        // XSS 공격 방지
    secure: IS_LIVE,       // HTTPS에서만 전송
    maxAge: 1800000        // 30분 유효
  },
  store: pgSession         // PostgreSQL에 세션 저장
})
```

### 3. 역할 기반 접근 제어 (RBAC)
사용자 역할에 따른 API 접근 권한 관리:

| 역할 | 설명 | 접근 권한 |
|------|------|-----------|
| `ADMIN` | 관리자 | 전체 관리 기능 |
| `TRAINER` | 트레이너 | 회원 관리, 일정, 상품 판매 |
| `MEMBER` | 일반 회원 | 개인 정보, 일정, 인바디 조회 |

### 4. 인증 플로우
```
1. 사용자 로그인 요청
   ↓
2. Passport 인증 전략 실행
   - Local: ID/PW 검증
   - Google: OAuth 토큰 검증
   ↓
3. 인증 성공 → serializeUser()
   - 세션에 user_id 저장
   ↓
4. 이후 요청마다 deserializeUser()
   - 세션에서 user_id로 사용자 정보 복원
   ↓
5. authorizeRole() 미들웨어
   - 라우트별 권한 검증
   ↓
6. API 접근 허용/거부
```

## 📁 소스 구조

```
back/
├── config/                     # 설정 파일
│   ├── cmmn.js                # 공통 유틸리티 함수
│   ├── database.js            # PostgreSQL 연결 및 쿼리 함수
│   ├── passport.js            # Passport 인증 전략 설정
│   ├── ROLE.js                # 사용자 역할 상수 정의
│   └── upload.js              # 파일 업로드 설정
│
├── controllers/               # 비즈니스 로직 처리
│   ├── authControllers.js    # 로그인/로그아웃
│   ├── userControllers.js    # 사용자 관리
│   ├── common/               # 공통 기능
│   │   ├── commonControllers.js
│   │   └── fileControllers.js
│   ├── login/                # 로그인 관련
│   │   ├── loginControllers.js
│   │   └── gymControllers.js
│   ├── inbody/               # 인바디 분석
│   │   ├── inbodyControllers.js
│   │   ├── inbodyOcrModel.py     # OCR 처리
│   │   ├── inbodyGptModel.py     # GPT 분석
│   │   └── requirements.txt      # Python 의존성
│   ├── schedule/             # 일정 관리
│   │   ├── scheduleControllers.js
│   │   └── gptModel.py
│   ├── mypage/               # 마이페이지
│   │   └── mypageControllers.js
│   ├── trainer/              # 트레이너 기능
│   │   ├── trainer.js
│   │   ├── productController.js
│   │   ├── buyController.js
│   │   └── createBuyController.js
│   ├── community/            # 커뮤니티
│   │   ├── communityControllers.js
│   │   └── boardControllers.js
│   └── intro/                # 메인/소개
│       └── introControllers.js
│
├── routes/                    # 라우팅 설정
│   ├── common_routes.js      # 공통 라우트 초기화
│   ├── login/
│   │   ├── loginRoutes.js
│   │   └── uploads.js
│   ├── inbody/
│   │   └── inbodyRoutes.js
│   ├── trainer/
│   │   └── trainerRoutes.js
│   └── community/
│       └── communityRoutes.js
│
├── utils/                     # 유틸리티 함수
│   └── util.js
│
├── public/                    # 정적 파일 (업로드된 이미지 등)
│
├── index.js                   # 애플리케이션 진입점
├── package.json              # Node.js 의존성 관리
└── .env                      # 환경 변수 (git 제외)
```

### 주요 디렉토리 설명

#### `config/`
- **database.js**: PostgreSQL 연결 풀 설정 및 쿼리 실행 함수 (`sendQuery`)
- **passport.js**: Local 및 Google OAuth 인증 전략 구현
- **ROLE.js**: 역할 상수 정의 (ADMIN, TRAINER, MEMBER)
- **upload.js**: Multer 파일 업로드 설정

#### `controllers/`
- 각 도메인별 비즈니스 로직을 처리하는 컨트롤러
- Python 스크립트를 통한 AI/OCR 기능 연동

#### `routes/`
- Express Router를 사용한 API 엔드포인트 정의
- `common_routes.js`를 통한 일관된 라우트 초기화 패턴

## 🔄 기본적인 소스 플로우

### 1. 애플리케이션 시작
```
index.js
  ├── 환경 변수 로드 (dotenv)
  ├── Express 앱 초기화
  ├── 미들웨어 설정
  │   ├── helmet (보안 헤더)
  │   ├── cors (CORS 정책)
  │   ├── express.json() (JSON 파싱)
  │   ├── express-session (세션 관리)
  │   └── passport (인증)
  ├── 권한 미들웨어 설정 (authorizeRole)
  ├── 라우트 등록
  └── 서버 리스닝 (PORT 8000)
```

### 2. 일반적인 API 요청 플로우
```
클라이언트 요청
    ↓
[CORS 검증]
    ↓
[세션 복원] - deserializeUser()
    ↓
[권한 확인] - authorizeRole() 미들웨어
    ↓
[라우터] - routes/*.js
    ↓
[컨트롤러] - controllers/*.js
    ↓
[데이터베이스] - sendQuery()
    ↓
[응답 반환] - JSON 형식
```

### 3. 인증이 필요한 API 플로우
```
POST /auth/login
    ↓
passport.authenticate('local' | 'google')
    ↓
데이터베이스 사용자 검증
    ↓
serializeUser() - 세션에 userId 저장
    ↓
응답: { success: true, user: {...} }
    ↓
이후 요청마다 자동으로 deserializeUser() 실행
```

### 4. 파일 업로드 플로우
```
클라이언트 파일 업로드
    ↓
multer 미들웨어
    ↓
public/ 디렉토리에 저장
    ↓
파일 경로 데이터베이스 저장
    ↓
/upload/* URL로 정적 접근 가능
```

### 5. Python AI/OCR 통합 플로우
```
클라이언트 이미지 업로드
    ↓
Node.js 컨트롤러
    ↓
child_process로 Python 스크립트 실행
    ↓
Python: OCR/GPT 처리
    ↓
결과 JSON 반환
    ↓
데이터베이스 저장 및 클라이언트 응답
```

## 🚀 동작 방법

### 1. 환경 설정

#### 필수 요구사항
- **Node.js** v18 이상
- **PostgreSQL** v12 이상
- **Python** v3.8 이상 (AI/OCR 기능 사용 시)

#### 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 정보를 입력합니다:

```bash
# 서버 설정
PORT=8000
IS_LIVE=false                    # 배포 환경: true, 개발 환경: false
FRONT_DOMAIN=http://localhost:3000

# 데이터베이스 설정
DB_USER=your_db_username
DB_HOST=localhost
DB_NAME=fit_harmony
DB_PASS=your_db_password
DB_PORT=5432

# 세션 설정
SESSION_SECRET=your_session_secret_key

# Google OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=/auth/google/callback

# OpenAI API (GPT 기능 사용 시)
OPENAI_API_KEY=your_openai_api_key
```

### 2. 설치 및 실행

#### Node.js 의존성 설치
```bash
npm install
```

#### Python 의존성 설치 (AI/OCR 기능 사용 시)
```bash
cd controllers/inbody
pip install -r requirements.txt
cd ../..
```

#### 개발 서버 실행
```bash
npm start
```
또는
```bash
nodemon index.js
```

서버가 정상적으로 시작되면 다음 메시지가 출력됩니다:
```
Online Customer Service Start - PORT : 8000
```

### 3. 데이터베이스 설정

PostgreSQL에서 다음 테이블을 생성해야 합니다:
- `USER` - 사용자 정보
- `session` - 세션 저장소
- 기타 도메인별 테이블 (inbody, schedule, product 등)

세션 테이블은 `connect-pg-simple`이 자동으로 생성합니다.

### 4. API 테스트

#### 로그인 테스트
```bash
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "username": "test@example.com",
  "password": "your_password"
}
```

#### 인증 확인
```bash
GET http://localhost:8000/login/check-auth
```

#### 로그아웃
```bash
POST http://localhost:8000/login/logout
```

### 5. 정적 파일 접근

업로드된 파일은 다음 경로로 접근 가능합니다:
```
http://localhost:8000/upload/{파일명}
```

## 🔧 주요 API 엔드포인트

### 인증
- `POST /auth/login` - 로컬 로그인
- `POST /auth/logout` - 로그아웃
- `GET /auth/google` - 구글 로그인 시작
- `GET /auth/google/callback` - 구글 로그인 콜백
- `GET /login/check-auth` - 로그인 상태 확인

### 사용자
- `GET /login/exist-nick` - 닉네임 중복 확인
- `GET /login/gym` - 헬스장 목록 조회
- `POST /login/gym` - 헬스장 등록
- `DELETE /login/gym/:gymId` - 헬스장 삭제

### 인바디 (권한: ADMIN, TRAINER, MEMBER)
- `/inbody/*` - 인바디 데이터 관리 및 분석

### 일정 (권한: ADMIN, TRAINER, MEMBER)
- `/schedule/*` - 일정 관리

### 트레이너 (권한: ADMIN, TRAINER, MEMBER)
- `/trainer/*` - 트레이너 관련 기능

### 상품 (권한: ADMIN, TRAINER, MEMBER)
- `/product/*` - 상품 관리
- `/buy/*` - 구매 관리

### 커뮤니티
- `/community/*` - 게시판 및 커뮤니티 기능

## 📝 개발 가이드

### 새로운 API 추가하기

1. **컨트롤러 작성** (`controllers/`)
```javascript
const router = require('express').Router();

router.get('/example', async (req, res) => {
  try {
    // 비즈니스 로직
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

2. **라우트 등록** (`index.js`)
```javascript
app.use('/api/example', require('./controllers/example'));
```

3. **권한이 필요한 경우**
```javascript
app.use('/api/example', authorizeRole([ROLE.ADMIN]));
```

### 데이터베이스 쿼리 실행
```javascript
const { sendQuery } = require('./config/database');

const users = await sendQuery(
  'SELECT * FROM "USER" WHERE email = $1',
  [email]
);
// 결과는 자동으로 카멜케이스로 변환됨 (user_id → userId)
```

## 🛡️ 보안 고려사항

- ✅ Helmet을 통한 HTTP 보안 헤더 설정
- ✅ CORS 정책으로 허용된 도메인만 접근 가능
- ✅ httpOnly 쿠키로 XSS 공격 방지
- ✅ HTTPS 환경에서 secure 쿠키 사용
- ✅ 비밀번호 SHA-512 해싱
- ✅ 세션 기반 인증으로 토큰 노출 방지
- ✅ 역할 기반 접근 제어 (RBAC)

## 📄 라이선스

ISC

## 👥 기여자

FIT_HARMONY 개발팀

---

**FIT_HARMONY** - 헬스장과 트레이너, 회원을 하나로 연결하는 플랫폼

