/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: 사용자 ID
 *         user_name:
 *           type: string
 *           description: 사용자 이름
 *         nick_name:
 *           type: string
 *           description: 닉네임
 *         email:
 *           type: string
 *           format: email
 *           description: 이메일
 *         phone_number:
 *           type: string
 *           description: 전화번호
 *         height:
 *           type: number
 *           format: float
 *           description: 키 (cm)
 *         weight:
 *           type: number
 *           format: float
 *           description: 체중 (kg)
 *         age:
 *           type: integer
 *           description: 나이
 *         gender:
 *           type: string
 *           enum: [M, F]
 *           description: 성별 M 남성 F 여성
 *         fit_history:
 *           type: string
 *           description: 피트니스 경력
 *         fit_goal:
 *           type: string
 *           description: 피트니스 목표
 *         introduction:
 *           type: string
 *           description: 자기소개
 *         gym:
 *           type: string
 *           description: 소속 헬스장
 *         file_id:
 *           type: integer
 *           description: 프로필 이미지 파일 ID
 *         role:
 *           type: string
 *           enum: [ADMIN, TRAINER, MEMBER]
 *           description: 사용자 역할
 *     UserUpdateRequest:
 *       type: object
 *       required:
 *         - userName
 *         - nickName
 *       properties:
 *         userName:
 *           type: string
 *           description: 사용자 이름
 *         nickName:
 *           type: string
 *           description: 닉네임
 *         phoneNumber:
 *           type: string
 *           description: 전화번호
 *         height:
 *           type: number
 *           format: float
 *           description: 키 (cm)
 *         weight:
 *           type: number
 *           format: float
 *           description: 체중 (kg)
 *         age:
 *           type: integer
 *           description: 나이
 *         fitHistory:
 *           type: string
 *           description: 피트니스 경력
 *         fitGoal:
 *           type: string
 *           description: 피트니스 목표
 *         introduction:
 *           type: string
 *           description: 자기소개
 *         gym:
 *           type: string
 *           description: 소속 헬스장
 *         fileId:
 *           type: integer
 *           description: 프로필 이미지 파일 ID
 *     NicknameCheckRequest:
 *       type: object
 *       required:
 *         - nickname
 *       properties:
 *         nickname:
 *           type: string
 *           description: 확인할 닉네임
 *     NicknameCheckResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         isDuplicate:
 *           type: boolean
 *           description: 중복 여부
 */

// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
const { sendQuery } = require('../../config/database');

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
                        nickName,
                        phoneNumber,
                        height,
                        weight,
                        age,
                        fitHistory,
                        fitGoal,
                        introduction,
                        gym,
                        fileId
                    } = params;
                    
                    // 빈 값들을 null로 초기화
                    const cleanHeight = height != '' ? height : null;
                    const cleanWeight = weight != '' ? weight : null;
                    const cleanAge = age != '' ? age : null;
                    const cleanFitHistory = fitHistory != '' ? fitHistory : null;
                    const cleanFitGoal = fitGoal != '' ? fitGoal : null;
                    const cleanIntroduction = introduction != '' ? introduction : null;
                    const cleanFileId = fileId != '' ? fileId : 1;
                
                    // 필수 필드 검증
                    if(!userName || !nickName){
                        return {
                            message: 'noParam',
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
                    
                    // 이전 이미지 파일 삭제 - 1( 기본이미지 )일 경우 제외
                    const deleteFile = await sendQuery(
                        'DELETE FROM file WHERE file_id = (SELECT file_id FROM "USER" WHERE user_id = $1)AND (SELECT file_id FROM "USER" WHERE user_id = $1) IS DISTINCT FROM 1',
                        [userId]
                        );
                    
                    // 사용자 데이터 업데이트
                    const updateQuery = `
                        UPDATE "USER" SET
                            user_name = $1,
                            nick_name = $2,
                            phone_number = $3,
                            height = CAST($4 AS NUMERIC),
                            weight = CAST($5 AS NUMERIC),
                            age = CAST($6 AS INTEGER),
                            fit_history = $7,
                            fit_goal = $8,
                            introduction = $9,
                            gym_id = (SELECT gym_id FROM gym WHERE gym = $10 LIMIT 1),
                            file_id = CAST($11 AS INTEGER)
                        WHERE user_id = $12
                    `;

                    await sendQuery(updateQuery, [
                        userName,
                        nickName,
                        phoneNumber,
                        cleanHeight,
                        cleanWeight,
                        cleanAge,
                        cleanFitHistory,
                        cleanFitGoal,
                        cleanIntroduction,
                        gym,
                        cleanFileId,
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
                        message: 'success',
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

    // Gym 검색
    {
        url : '/search-gym',
        type : 'post',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const { search } = params;
                    
                    if(!search || search.trim() === ''){
                        return {
                            message: 'noParam',
                            success: false
                        }
                    }

                    const replaceSearch = search.replace(/ /g, '');

                    // Gym 검색 (LIKE 검색)
                    const gymSearch = await sendQuery(
                        `SELECT * FROM gym WHERE REPLACE(gym, ' ', '') ILIKE $1 ORDER BY gym LIMIT 10`,
                        [`%${replaceSearch}%`]
                    );

                    return { 
                        message: 'success',
                        success: true,
                        gyms: gymSearch || []
                    }
                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/search-gym error : ${error.message}`);
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
                            COUNT(CASE WHEN status = 'F' THEN 1 END) as missed_schedules,
                            COUNT(CASE WHEN status = 'N' THEN 1 END) as not_started_schedules
                        FROM schedule 
                        WHERE user_id = $1 AND status IN ('C', 'F', 'N')
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
    },

    // 사용자 계정 비활성화
    {
        url : '/active/:userId',
        type : 'put',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const userId = params.userId;
                    const type = params.type;
                    const reason = params.reason;

                    if (request.user.userId != userId) {
                        return {
                            message: 'noAuth',
                            success: false
                        }
                    }

                    if (type == "INACTIVE") { 
                        const updateQuery = `
                        UPDATE "USER" SET
                            status = $1
                        WHERE user_id = $2
                    `;
                        await sendQuery(updateQuery, [type, userId]);
                        return {
                            message: 'success',
                            success: true,
                        }
                    }

                    if (type == "DELETED") { 
                        const updateQuery = `
                        UPDATE "USER" SET
                            status = $1,
                            introduction = $2
                        WHERE user_id = $3
                    `;
                        await sendQuery(updateQuery, [type, reason, userId]);
                        return {
                            message: 'success',
                            success: true,
                        }
                    }

                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/active/:userId error : ${error.message}`);
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
            file_id,
            nick_name,
            phone_number,
            age,
            height,
            weight,
            fit_history,
            fit_goal,
            introduction,
			g.gym,
            role
        FROM "USER" u
        LEFT OUTER JOIN gym g ON u.gym_id = g.gym_id
        WHERE user_id = $1
    `;

    return await sendQuery(userQuery, [userId]);
}


/**
 * @swagger
 * /mypage/{userId}:
 *   get:
 *     summary: 사용자 프로필 조회
 *     description: 특정 사용자의 프로필 정보를 조회합니다.
 *     tags: [마이페이지]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 userResult:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 권한 없음
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /mypage/{userId}:
 *   put:
 *     summary: 사용자 프로필 수정
 *     description: 사용자의 프로필 정보를 수정합니다.
 *     tags: [마이페이지]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 잘못된 요청
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 권한 없음
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /mypage/check-nickname:
 *   post:
 *     summary: 닉네임 중복 확인
 *     description: 닉네임의 중복 여부를 확인합니다.
 *     tags: [마이페이지]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NicknameCheckRequest'
 *     responses:
 *       200:
 *         description: 닉네임 확인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NicknameCheckResponse'
 *       400:
 *         description: 잘못된 요청
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /mypage/activity/{userId}:
 *   get:
 *     summary: 사용자 활동 내역 조회
 *     description: 사용자의 스케줄, 식단, 커뮤니티 활동 내역을 조회합니다.
 *     tags: [마이페이지]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 활동 내역 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     scheduleActivity:
 *                       type: object
 *                       properties:
 *                         total_schedules:
 *                           type: integer
 *                           description: 전체 스케줄 수
 *                         completed_schedules:
 *                           type: integer
 *                           description: 완료된 스케줄 수
 *                         missed_schedules:
 *                           type: integer
 *                           description: 놓친 스케줄 수
 *                         not_started_schedules:
 *                           type: integer
 *                           description: 시작하지 않은 스케줄 수
 *                     dietActivity:
 *                       type: object
 *                       properties:
 *                         total_diets:
 *                           type: integer
 *                           description: 전체 식단 수
 *                         avg_calorie:
 *                           type: number
 *                           format: float
 *                           description: 평균 칼로리
 *                     recentPostActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [post, comment]
 *                             description: 활동 유형
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             description: 활동 날짜
 *                           activity:
 *                             type: string
 *                             description: 활동 내용
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 권한 없음
 *         $ref: '#/components/responses/ForbiddenError'
 */

//  3) 통신 객체 배열 Route 등록
mypageControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router; 