const passport = require('passport'); // 인증 미들웨어
const LocalStrategy = require('passport-local').Strategy; // ID + 비밀번호 기반 인증 Passport 플러그인
const crypto = require('crypto');
const {v4:uuidv4} = require('uuid'); // 난수 생성 모듈
const { sendQuery } = require('./database'); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// SHA-512 해시 함수
function hashPassword(password) {
  return crypto.createHash('sha512').update(password).digest('hex');
}

// 구글 로그인
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log(profile);
        const { id,displayName, emails, photos } = profile;
        const formData = req?.session?.oauthFormData;
        const profile_image = req.session.oauthProfileImage;
        // console.log(profile_image);
        console.log(formData)
        if(formData !== undefined){//회원가입
            const query = `
            INSERT INTO "USER" (
            USER_NAME,NICK_NAME,EMAIL,AGE,HEIGHT,WEIGHT,GENDER,PHONE_NUMBER,ROLE) VALUES (
            $1, $2, $3, $4, $5, $6,$7,$8,$9
            ) RETURNING USER_ID;
        `;

            const values = [
                displayName,
                formData.nick_name,
                emails[0].value,
                formData.age,
                formData.height,
                formData.weight,
                formData.gender,
                "01044444444",
                "MEMBER",
            ];
            console.log(values)
            const user = await sendQuery(query, values);



            return done(null, user);
        }
        // console.log(profile);

        // const user = await sendQuery('select id, username, role, email, profile_image from USER where user_id = $1', [id]);
        const user = await sendQuery('SELECT USER_ID, USER_NAME,NICK_NAME,EMAIL from "USER" where EMAIL = $1', [emails[0].value]);
        
        console.log(user, emails[0].value)
        if (user?.length > 0) {
            return done(null, user[0]); // 기존 사용자
        }else{
            console.log("가입되지 않은 회원")
            return done(null,false, {message:"가입되지 않은 회원", success:false})
        }
    } catch (err) {
        console.log(err);
        return done(null, {message : '인증 중 에러가 발생하였습니다.', success:false});
    }
}));

// 세션 저장 시 사용자 ID만 저장
passport.serializeUser((user, done) => {
    // done(error, user, info)는 Passport 내부에서 인증 결과를 전달하는 콜백
    console.log(user);
    done(null, user?.userId,{message:"serializeUser Error"});
});

// 세션에서 ID로 사용자 정보 복원
passport.deserializeUser(async (userId, done) => {
    try {
        const res = await sendQuery('SELECT USER_ID, USER_NAME,NICK_NAME,EMAIL from "USER" where USER_ID = $1', [userId]);
        done(null, res[0]);
    } catch (err) {
        done(err);
    }
});
