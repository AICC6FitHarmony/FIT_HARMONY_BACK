// 기능 모듈 로드
const express = require('express'); // 기본 웹 프레임워크
const session = require('express-session'); // 서버 메모리(혹은 외부 저장소)에 세션을 저장해서 로그인 상태를 유지
const passport = require('passport'); // 인증 미들웨어.(세션 연동)
const cors = require('cors'); // Cross-Origin Resource Sharing 설정 미들웨어. 다른 도메인에서 API 요청 허용/제한 설정
const helmet = require('helmet'); // Express 앱에 보안 관련 HTTP 헤더를 자동 설정해주는 미들웨어
const path = require('path'); // 경로 관련 모듈
const cmmn = require('./config/cmmn'); // 공통 활용 기능 로드
const upload = require('./routes/login/uploads');
require('./config/passport'); // Passport 설정 불러오기
require('dotenv').config(); // 환경변수 불러오기


// 포트 선언
const PORT = process.env.PORT || 8000;

const app = express();

// 보안 헤더 설정
app.use(helmet());

// CORS 설정
// cors() : 제한 없음.
app.use(cors({
    origin: 'http://localhost:5173', // React 도메인
    credentials: true
}));

// JSON 요청 본문 파싱
app.use(express.json());

// 세션 설정: 메모리 기반 세션
app.use(session({
  secret: process.env.SESSION_SECRET, // .env에서 비밀키 사용
  resave: false, // 매 요청마다 세션 저장 안함
//   saveUninitialized: false, // 초기화되지 않은 세션 저장 안함
  saveUninitialized: true, // 회원가입시 form 저장
  cookie: {
    httpOnly: true, // JS에서 쿠키 접근 차단
    secure: (process.env.IS_LIVE === 'true'),  // HTTPS 사용 시 true
    maxAge: 1000 * 60 * 30 // 세션 30분 유효
  }
}));

// Passport 초기화 및 세션 연동
app.use(passport.initialize());
app.use(passport.session());


// 권한 선언
const ROLE = { 
    ADMIN : 'ADMIN',
    USER : 'USER'
}
// 로그인 여부 및 역할 권한 확인
const authorizeRole = (roles) => {
    return (request, response, next) => {
        if (!request.isAuthenticated || !request.isAuthenticated()) {
            response.status(401).json({ message: '로그인이 필요합니다.' });
        }

        if (roles.contains(req.user.role)) {
            return response.status(403).json({ message: `권한이 없습니다.` });
        }
        return next();
    };
}

// 공통 모든 접근은 선언 X
// 모든 /admin/* 경로에 ADMIN 권한 필수
app.use('/admin', authorizeRole([ROLE.ADMIN]));

// 모든 /ru/* 경로에 ADMIN 권한 필수
app.use('/ru', authorizeRole([ROLE.ADMIN, ROLE.USER]));



// 정적 경로 적용. : 
// route로 인하여 선언된 URL PATH로만 접근이 가능하기 때문에
// 업로드한 FILE 등 기타 정적으로 접근이 필요한 경우 다음과 같이 선언
app.use('/upload', cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
}),express.static(path.join(__dirname, 'public'))); 


// Controllers 모음
// 1. 인증 관련 라우팅
app.use(require('./controllers/authControllers')); // authController 라우터 연결
app.use("/login" , require('./routes/login/loginRoutes'));
// 2. Inbody 관련 라우팅
app.use('/inbody', require('./routes/inbody/inbodyRoutes')); // inbody 라우터 연결

// 3. Schedule 관련 라우팅
app.use('/schedule', require('./controllers/schedule/scheduleControllers')); // inbody 라우터 연결


// 2. 구글 인증
app.post('/auth/google/register',upload.single("profile_image"), (req, res) => {
    // form 데이터 세션에 저장
    req.session.oauthFormData = req.body;
    req.session.oauthProfileImage = req.file;
    console.log(req?.body);
    res.json({ redirectUrl: `http://localhost:8000/auth/google` });
});
app.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: true,
    state: Math.random().toString(36).substring(7) // CSRF 방지용
}));
app.get(process.env.GOOGLE_CALLBACK_URL,
    passport.authenticate('google', { failureRedirect: '/login-fail' }), (request, response) => {
        // 세션 저장 후 프론트에서 인증 확인 가능
        response.redirect(`${process.env.FRONT_DOMAIN}`) //  동작 테스트 확인 필요
    }
);

app.get("/login-fail",(req,res)=>{
    res.redirect(`${process.env.FRONT_DOMAIN}/login/fail`) //  동작 테스트 확인 필요
})


app.get('/', (request, response) => { 
    response.send('Hello World');
})


// 서버 시작
app.listen(PORT, () => {
    console.log(`Online Customer Service Start - PORT : ${PORT}`);
});
