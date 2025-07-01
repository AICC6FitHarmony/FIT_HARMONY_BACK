const { sendQuery } = require('../../config/database');

// 특정 사용자의 user 데이터 조회
const getUserData = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("userId", userId);

        const userQuery = `
            SELECT 
                user_name,
                email,
                nick_name,
                phone_number,
                age,
                height,
                weight,
                fit_history,
                fit_goal,
                introduction
            FROM "USER"
            WHERE u.user_id = $1
        `;

        const userResult = await sendQuery(userQuery, [userId]);
        
        // inbodyResult가 비어있어도 200 상태로 응답
        res.status(200).json({
            success: true,
            credentials: 'include',
            userResult: userResult || [],
            message: userResult && userResult.length > 0 ? 'success' : 'fail'
        });
    } catch (error) {
        console.error('사용자 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
};

const getUserInbodyMonthData = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        const inbodyTimeQuery = `
            SELECT TO_CHAR(inbody_time, 'YYYY-MM-dd') as inbody_time
            FROM inbody
            WHERE user_id = $1
            AND inbody_time >= TO_DATE($2, 'YYYY-MM-dd')
  			AND inbody_time < TO_DATE($3, 'YYYY-MM-dd')
            ORDER BY INBODY_TIME DESC
        `;
        //  = $2 나중에 추가
        const inbodyTimeResult = await sendQuery(inbodyTimeQuery, [userId,startDate, endDate]);
        
        if (inbodyTimeResult && inbodyTimeResult.length > 0) {
            console.log("inbodyTimeResult : ", inbodyTimeResult);
            res.status(200).json({
                inbodyTimeResult: inbodyTimeResult
            });
        } else {
            res.status(400).json({
                success: false,
                message: '해당 사용자의 Inbody 데이터가 없습니다'
            });
        }
    } catch (error) {
        console.error('사용자 Inbody 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
};

// 인바디 데이터 등록
const insertInbodyData = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            weight,
            bodyWater,
            inbodyScore,
            protein,
            bodyMineral,
            bodyFat,
            bodyFatPercent,
            bmi,
            skeletalMuscle,
            trunkMuscle,
            leftArmMuscle,
            rightArmMuscle,
            leftLegMuscle,
            rightLegMuscle,
            trunkFat,
            leftArmFat,
            rightArmFat,
            leftLegFat,
            rightLegFat,
            inbodyTime
        } = req.body;

        const insertQuery = `
            INSERT INTO inbody (
                user_id,
                weight,
                body_water,
                inbody_score,
                protein,
                body_mineral,
                body_fat,
                body_fat_percent,
                bmi,
                skeletal_muscle,
                trunk_muscle,
                left_arm_muscle,
                right_arm_muscle,
                left_leg_muscle,
                right_leg_muscle,
                trunk_fat,
                left_arm_fat,
                right_arm_fat,
                left_leg_fat,
                right_leg_fat,
                inbody_time
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            ) RETURNING inbody_id
        `;

        // 사용자 몸무게 수정
        const updateUserQuery = `
        UPDATE "USER" u
        SET weight = $1
        WHERE u.user_id = $2
        RETURNING u.user_id
        `;

        const values = [
            userId,
            weight,
            bodyWater,
            inbodyScore,
            protein,
            bodyMineral,
            bodyFat,
            bodyFatPercent,
            bmi,
            skeletalMuscle,
            trunkMuscle,
            leftArmMuscle,
            rightArmMuscle,
            leftLegMuscle,
            rightLegMuscle,
            trunkFat,
            leftArmFat,
            rightArmFat,
            leftLegFat,
            rightLegFat,
            inbodyTime
        ];

        const userValues = [weight, userId];

        const result = await sendQuery(insertQuery, values);
        const userResult = await sendQuery(updateUserQuery, userValues);

        if (result && result.length > 0 && userResult && userResult.length > 0) {
            res.status(201).json({
                success: true,
                message: '인바디 데이터가 성공적으로 등록되었습니다',
            });
        } else {
            res.status(500).json({
                success: false,
                message: '데이터 등록에 실패했습니다'
            });
        }
    } catch (error) {
        console.error('인바디 데이터 등록 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
};

// 인바디 데이터 수정
const updateInbodyData = async (req, res) => {
    try {
        const {
            inbodyId,
            weight,
            bodyWater,
            inbodyScore,
            protein,
            bodyMineral,
            bodyFat,
            bodyFatPercent,
            bmi,
            skeletalMuscle,
            trunkMuscle,
            leftArmMuscle,
            rightArmMuscle,
            leftLegMuscle,
            rightLegMuscle,
            trunkFat,
            leftArmFat,
            rightArmFat,
            leftLegFat,
            rightLegFat,
            inbodyTime
        } = req.body;

        const updateInbodyQuery = `
            UPDATE inbody SET (
                weight,
                body_water,
                inbody_score,
                protein,
                body_mineral,
                body_fat,
                body_fat_percent,
                bmi,
                skeletal_muscle,
                trunk_muscle,
                left_arm_muscle,
                right_arm_muscle,
                left_leg_muscle,
                right_leg_muscle,
                trunk_fat,
                left_arm_fat,
                right_arm_fat,
                left_leg_fat,
                right_leg_fat,
                inbody_time
            ) = (
                $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            ) WHERE inbody_id = $1
            RETURNING inbody_id
        `;

        // 사용자 몸무게 수정
        const updateUserQuery = `
        UPDATE "USER" u
        SET weight = (
            SELECT weight
            FROM INBODY i
            WHERE i.user_id = u.user_id
        	AND i.inbody_id = $1
        	ORDER BY inbody_time desc
        	LIMIT 1
            ) RETURNING u.user_id`;

        const inbodyValues = [
            inbodyId,
            weight,
            bodyWater,
            inbodyScore,
            protein,
            bodyMineral,
            bodyFat,
            bodyFatPercent,
            bmi,
            skeletalMuscle,
            trunkMuscle,
            leftArmMuscle,
            rightArmMuscle,
            leftLegMuscle,
            rightLegMuscle,
            trunkFat,
            leftArmFat,
            rightArmFat,
            leftLegFat,
            rightLegFat,
            inbodyTime
        ];

        const userValues = [inbodyId];

        const result = await sendQuery(updateInbodyQuery, inbodyValues);
        const userResult = await sendQuery(updateUserQuery, userValues);

        if (result && result.length > 0 && userResult && userResult.length > 0) {
            res.status(201).json({
                success: true,
                message: '인바디 데이터가 성공적으로 수정되었습니다',
            });
        } else {
            res.status(500).json({
                success: false,
                message: '데이터 수정에 실패했습니다'
            });
        }
    } catch (error) {
        console.error('인바디 데이터 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다'
        });
    }
};

module.exports = {
    getUserInbodyDayData,
    getUserInbodyMonthData,
    insertInbodyData,
    updateInbodyData
}; 