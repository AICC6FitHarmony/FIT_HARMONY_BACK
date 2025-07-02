// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
const { sendQuery } = require('../../config/database');
const ROLE = require("../../config/ROLE"); // ROLE 구분 정보 객체

//  2) 통신 객체 배열 선언
const mypageControllers = [
    // 특정 사용자의 user 데이터 조회
    {
        url : '/:userId',
        type : 'get',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    let userId = params.userId; // 요청된 사용자 ID
                    console.log("userId", userId);
                    console.log(request.user.userId)
                    // 본인 데이터만 조회 가능하도록 제한
                    if(request.user.userId != userId){
                        return {
                            message: 'noAuth',
                            success: false
                        }
                    }

                    const userResult = await selectUserData(userId);

                    return { 
                        message: 'success',
                        success: true,
                        userResult: userResult || []
                    }
                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/:userId error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }
        }
    },

    // 사용자 데이터 수정
    {
        url : '/:userId',
        type : 'put',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const userId = params.userId;
                    
                    // 본인 데이터만 수정 가능하도록 제한
                    if(request.user.userId !== userId){
                        return {
                            message: 'noAuth',
                            success: false
                        }
                    }

                    const {
                        userName,
                        email,
                        nickName,
                        phoneNumber,
                        height,
                        weight,
                        age,
                        fitHistory,
                        fitGoal,
                        introduction,
                        GYM
                    } = params;

                    // 필수 필드 검증
                    if(!userName || !email || !nickName){
                        return {
                            message: 'noParam',
                            success: false
                        }
                    }

                    // 이메일 중복 체크 (본인 이메일 제외)
                    const emailCheck = await sendQuery(
                        'SELECT user_id FROM "USER" WHERE email = $1 AND user_id != $2',
                        [email, userId]
                    );
                    
                    if(emailCheck && emailCheck.length > 0){
                        return {
                            message: 'duplicateEmail',
                            success: false
                        }
                    }

                    // 닉네임 중복 체크 (본인 닉네임 제외)
                    const nicknameCheck = await sendQuery(
                        'SELECT user_id FROM "USER" WHERE nick_name = $1 AND user_id != $2',
                        [nickName, userId]
                    );
                    
                    if(nicknameCheck && nicknameCheck.length > 0){
                        return {
                            message: 'duplicateNickname',
                            success: false
                        }
                    }

                    // 사용자 데이터 업데이트
                    const updateQuery = `
                        UPDATE "USER" SET
                            user_name = $1,
                            email = $2,
                            nick_name = $3,
                            phone_number = $4,
                            height = $5,
                            weight = $6,
                            age = $7,
                            fit_history = $8,
                            fit_goal = $9,
                            introduction = $10,
                            gym_id = $11
                        WHERE user_id = $12
                    `;

                    await sendQuery(updateQuery, [
                        userName,
                        email,
                        nickName,
                        phoneNumber,
                        height,
                        weight,
                        age,
                        fitHistory,
                        fitGoal,
                        introduction,
                        GYM,
                        userId
                    ]);

                    return { 
                        message: 'success',
                        success: true
                    }
                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/:userId PUT error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }
        }
    },

    // 이메일 중복 체크
    {
        url : '/check-email',
        type : 'post',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const { email } = params;
                    
                    if(!email){
                        return {
                            message: 'noParam',
                            success: false
                        }
                    }

                    // 이메일 형식 검증
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if(!emailRegex.test(email)){
                        return {
                            message: 'invalidEmail',
                            success: false
                        }
                    }

                    // 이메일 중복 체크
                    const emailCheck = await sendQuery(
                        'SELECT user_id FROM "USER" WHERE email = $1',
                        [email]
                    );
                    
                    const isDuplicate = emailCheck && emailCheck.length > 0;

                    return { 
                        message: isDuplicate ? '이미 사용 중인 이메일입니다.' : '사용 가능한 이메일입니다.',
                        success: true,
                        isDuplicate: isDuplicate
                    }
                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/check-email error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }
        }
    },

    // 닉네임 중복 체크
    {
        url : '/check-nickname',
        type : 'post',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const { nickname } = params;
                    
                    if(!nickname){
                        return {
                            message: 'noParam',
                            success: false
                        }
                    }

                    // 닉네임 형식 검증
                    const nicknameRegex = /^[a-zA-Z0-9가-힣_]+$/;
                    if(!nicknameRegex.test(nickname)){
                        return {
                            message: 'invalidNickname',
                            success: false
                        }
                    }

                    // 닉네임 중복 체크
                    const nicknameCheck = await sendQuery(
                        'SELECT user_id FROM "USER" WHERE nick_name = $1',
                        [nickname]
                    );
                    
                    const isDuplicate = nicknameCheck && nicknameCheck.length > 0;

                    return { 
                        message: isDuplicate ? '이미 사용 중인 닉네임입니다.' : '사용 가능한 닉네임입니다.',
                        success: true,
                        isDuplicate: isDuplicate
                    }
                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/check-nickname error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }
        }
    },

    // 사용자 활동 내역 조회
    {
        url : '/activity/:userId',
        type : 'get',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const userId = params.userId;
                    
                    // 본인 데이터만 조회 가능하도록 제한
                    if(request.user.userId != userId){
                        return {
                            message: 'noAuth',
                            success: false
                        }
                    }

                    // 스케쥴 활동 내역 조회
                    const scheduleActivity = await sendQuery(`
                        SELECT 
                            COUNT(*) as total_schedules,
                            COUNT(CASE WHEN status = 'C' THEN 1 END) as completed_schedules,
                            COUNT(CASE WHEN status = 'F' THEN 1 END) as missed_schedules
                        FROM schedule 
                        WHERE user_id = $1 AND status IN ('C', 'F')
                    `, [userId]);

                    // 식단 활동 내역 조회
                    const dietActivity = await sendQuery(`
                        SELECT 
                            COUNT(*) as total_diets,
                            AVG(total_calorie) as avg_calorie
                        FROM diet 
                        WHERE user_id = $1
                    `, [userId]);

                    // 최근 활동 내역 조회
                    const recentPostActivity = await sendQuery(`
                        (SELECT 
                            'post' as type,
                            created_time as date,
                            title as activity
                        FROM post
                        WHERE user_id = $1
                        ORDER BY created_time DESC
                        LIMIT 10
                        )
                        UNION ALL
                        (SELECT
                    	    'comment' as type,
                     	    created_time as date,
                     	    content as activity
                        FROM comment
                        WHERE user_id = $1
                        ORDER BY created_time DESC
                        LIMIT 10
                        )
                        ORDER BY date DESC
                    `, [userId]);

                    return { 
                        message: 'success',
                        success: true,
                        data: {
                            scheduleActivity: scheduleActivity[0] || {},
                            dietActivity: dietActivity[0] || {},
                            recentPostActivity: recentPostActivity || []
                        }
                    }
                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/activity/:userId error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }
        }
    }
];

// 사용자 데이터 조회 함수
const selectUserData = async (userId) => {
    const userQuery = `
        SELECT
            user_id,
            user_name,
            email,
            nick_name,
            phone_number,
            age,
            height,
            weight,
            fit_history,
            fit_goal,
            introduction,
			gym_id,
            role
        FROM "USER"
        WHERE user_id = $1
    `;

    return await sendQuery(userQuery, [userId]);
}

//  3) 통신 객체 배열 Route 등록
mypageControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router; 