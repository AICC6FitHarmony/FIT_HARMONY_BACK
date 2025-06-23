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

// 일반 로그인
passport.use(new LocalStrategy(async (id, password, done) => {
    try {
        const user = await sendQuery('select * from users where id = $1', [id]);
        if (!user) return done(null, false, { message: 'ID / 비밀번호를 확인해주십시오.' });

        const hashed = hashPassword(password);
        if (user.password !== hashed) {
            // done(error, user, info)는 Passport 내부에서 인증 결과를 전달하는 콜백
            return done(null, false, { message: 'ID / 비밀번호를 확인해주십시오.' });
        }

        return done(null, user); // 성공 시 사용자 반환
    } catch (err) {
        return done(err);
    }
}));


// 구글 로그인
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const { id, displayName, emails, photos } = profile;
        const user = await sendQuery('select id, username, role, email, profile_image from users where google_id = $1', [id]);

        if (user.length > 0) {
            return done(null, user[0]); // 기존 사용자
        }else{
            // 새 사용자 생성
            const insert = await sendQuery(`
                insert into users (google_id, username, email, profile_image, password )
                values ( $1, $2, $3, $4, '' ) returning *`,
                [id, displayName, emails[0].value, photos[0].value]
            );
            return done(null, insert[0]);
        }
    } catch (err) {
        console.log(err);
        return done(null, {message : '인증 중 에러가 발생하였습니다.', success:false});
    }
}));

// 세션 저장 시 사용자 ID만 저장
passport.serializeUser((user, done) => {
    // done(error, user, info)는 Passport 내부에서 인증 결과를 전달하는 콜백
    done(null, user.id);
});

// 세션에서 ID로 사용자 정보 복원
passport.deserializeUser(async (id, done) => {
    try {
        const res = await sendQuery('select id, username, role from users WHERE id = $1', [id]);
        done(null, res[0]);
    } catch (err) {
        done(err);
    }
});
