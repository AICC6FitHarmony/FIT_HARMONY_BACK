const passport = require('passport'); // 인증 미들웨어
const LocalStrategy = require('passport-local').Strategy; // ID + 비밀번호 기반 인증 Passport 플러그인
const crypto = require('crypto');
const {v4:uuidv4} = require('uuid'); // 난수 생성 모듈
const { sendQuery } = require('./database'); 
const { userRegister } = require('../controllers/login/loginControllers');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// SHA-512 해시 함수
function hashPassword(password) {
  return crypto.createHash('sha512').update(password).digest('hex');
}

// 구글 로그인
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://fhback.wa4b.site/auth/google/callback',
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        const { id,displayName, emails, photos } = profile;
        const user = await sendQuery('SELECT USER_ID, USER_NAME,NICK_NAME,EMAIL,STATUS from "USER" where EMAIL = $1', [emails[0].value]);

        const formData = req?.session?.oauthFormData;
        if(user.length==0 && formData !== undefined){//회원가입
            return await userRegister(req, profile, done);
        }
        
        if (user?.length > 0) {
            // console.log(user[0]);
            if(user[0].status == 'DELETED'){
                return done(null,false, {message:"탈퇴한 회원입니다.",status:user[0].status, success:false})
            }
            return done(null, user[0]); // 기존 사용자
        }else{
            console.log("가입되지 않은 회원")
            return done(null,false, {message:"가입되지 않은 회원",status:null, success:false})
        }
    } catch (err) {
        console.log(err);
        return done(err,false, {message : '인증 중 에러가 발생하였습니다.', success:false});
    }
}));

// 세션 저장 시 사용자 ID만 저장
passport.serializeUser((user, done) => {
    // done(error, user, info)는 Passport 내부에서 인증 결과를 전달하는 콜백
    done(null, user?.userId,{message:"serializeUser Error"});
});

// 세션에서 ID로 사용자 정보 복원
passport.deserializeUser(async (userId, done) => {
    try {
        const res = await sendQuery('SELECT USER_ID, USER_NAME,NICK_NAME,EMAIL,ROLE from "USER" where USER_ID = $1', [userId]);
        if(res.length == 0){
            return done(null,false, {message : '인증중 에러가 발생하였습니다.', success:false});
        }
        done(null, res[0]);
    } catch (err) {
        done(err);
    }
});
