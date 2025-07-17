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
    },

    // 관리자용 - 모든 회원 목록 조회
    {
        url : '/admin/members',
        type : 'get',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const role = request.user.role;
                    if(role !== 'ADMIN'){
                        return {
                            message: 'noAuth',
                            success: false
                        }
                    }

                    const page = parseInt(params.page) || 1;
                    const limit = parseInt(params.limit) || 10;
                    const search = params.search || '';
                    const status = params.status || '';
                    const roleFilter = params.role || '';
                    
                    const offset = (page - 1) * limit;

                    let whereConditions = [];
                    let queryParams = [];
                    let paramIndex = 1;

                    if(search) {
                        whereConditions.push(`(u.user_name ILIKE $${paramIndex} OR u.nick_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
                        queryParams.push(`%${search}%`);
                        paramIndex++;
                    }

                    if(status) {
                        whereConditions.push(`u.status = $${paramIndex}`);
                        queryParams.push(status);
                        paramIndex++;
                    }

                    if(roleFilter) {
                        whereConditions.push(`u.role = $${paramIndex}`);
                        queryParams.push(roleFilter);
                        paramIndex++;
                    }

                    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

                    // 전체 개수 조회
                    const countQuery = `
                        SELECT COUNT(*) as total
                        FROM "USER" u
                        ${whereClause}
                    `;
                    const countResult = await sendQuery(countQuery, queryParams);
                    const total = parseInt(countResult[0].total);

                    // 회원 목록 조회
                    const membersQuery = `
                        SELECT 
                            u.user_id,
                            u.user_name,
                            u.nick_name,
                            u.email,
                            u.phone_number,
                            u.age,
                            u.gender,
                            u.status,
                            u.role,
                            u.created_time,
                            g.gym,
                            (SELECT COUNT(*) FROM buy b WHERE b.user_id = u.user_id) as purchase_count
                        FROM "USER" u
                        LEFT JOIN gym g ON u.gym_id = g.gym_id
                        ${whereClause}
                        ORDER BY u.created_time DESC
                        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
                    `;
                    
                    queryParams.push(limit, offset);
                    const membersResult = await sendQuery(membersQuery, queryParams);

                    return {
                        message: 'success',
                        success: true,
                        data: {
                            members: membersResult,
                            pagination: {
                                current: page,
                                total: total,
                                limit: limit,
                                totalPages: Math.ceil(total / limit)
                            }
                        }
                    }
                } else {
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/admin/members error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }
        }
    },

    // 관리자용 - 회원 상태 변경
    {
        url : '/admin/member/status',
        type : 'put',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const role = request.user.role;
                    if(role !== 'ADMIN'){
                        return {
                            message: 'noAuth',
                            success: false
                        }
                    }

                    const { userId, status, reason } = params;

                    if(!userId || !status) {
                        return {
                            message: 'noParam',
                            success: false
                        }
                    }

                    let updateQuery;
                    let queryParams;

                    if(status === 'DELETED' && reason) {
                        updateQuery = `
                            UPDATE "USER" SET
                                status = $1,
                                introduction = $2
                            WHERE user_id = $3
                        `;
                        queryParams = [status, reason, userId];
                    } else {
                        updateQuery = `
                            UPDATE "USER" SET
                                status = $1
                            WHERE user_id = $2
                        `;
                        queryParams = [status, userId];
                    }

                    await sendQuery(updateQuery, queryParams);

                    return {
                        message: 'success',
                        success: true
                    }
                } else {
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/admin/member/status error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }
        }
    },

    // 관리자용 - 회원 상세 정보 조회
    {
        url : '/admin/member/:userId',
        type : 'get',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    const role = request.user.role;
                    if(role !== 'ADMIN'){
                        return {
                            message: 'noAuth',
                            success: false
                        }
                    }

                    const userId = params.userId;

                    const memberQuery = `
                        SELECT 
                            u.user_id,
                            u.user_name,
                            u.nick_name,
                            u.email,
                            u.phone_number,
                            u.age,
                            u.height,
                            u.weight,
                            u.gender,
                            u.fit_history,
                            u.fit_goal,
                            u.introduction,
                            u.status,
                            u.role,
                            u.created_time,
                            g.gym,
                            g.gym_address,
                            (SELECT COUNT(*) FROM buy b WHERE b.user_id = u.user_id) as purchase_count,
                            (SELECT COUNT(*) FROM inbody i WHERE i.user_id = u.user_id) as inbody_count
                        FROM "USER" u
                        LEFT JOIN gym g ON u.gym_id = g.gym_id
                        WHERE u.user_id = $1
                    `;

                    const memberResult = await sendQuery(memberQuery, [userId]);

                    if(memberResult && memberResult.length > 0) {
                        return {
                            message: 'success',
                            success: true,
                            data: memberResult[0]
                        }
                    } else {
                        return {
                            message: 'notFound',
                            success: false
                        }
                    }
                } else {
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/mypage/admin/member/:userId error : ${error.message}`);
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


//  3) 통신 객체 배열 Route 등록
mypageControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router; 