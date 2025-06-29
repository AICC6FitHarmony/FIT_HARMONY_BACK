const { sendQuery } = require('../../config/database');

// 특정 사용자의 Inbody 데이터 조회
const getUserInbodyData = async (req, res) => {
    try {
        const { userId } = req.params;
        const { inbodyTime } = req.query;
        console.log("req.query : ", req.query);
        console.log("inbodyTime : ", inbodyTime);
        // 최근 인바디 데이터 조회
        const inbodyQuery = `
            SELECT 
                INBODY_ID,
                WEIGHT,
                BODY_WATER,
                INBODY_SCORE,
                PROTEIN,
                BODY_MINERAL,
                BODY_FAT,
                BMI,
                SKELETAL_MUSCLE,
                TRUNK_MUSCLE,
                LEFT_ARM_MUSCLE,
                RIGHT_ARM_MUSCLE,
                LEFT_LEG_MUSCLE,
                RIGHT_LEG_MUSCLE,
                TRUNK_FAT,
                LEFT_ARM_FAT,
                RIGHT_ARM_FAT,
                LEFT_LEG_FAT,
                RIGHT_LEG_FAT,
                INBODY_TIME
            FROM inbody i
            WHERE i.user_id = $1
            AND (CAST($2 AS date) = '1000-01-01' OR i.inbody_time = CAST($2 AS date))
            ORDER BY INBODY_TIME DESC
            LIMIT 1
        `;
      
        const inbodyStandardQuery = `
            SELECT i.item_name, i.min_value, i.max_value
            FROM inbody_standard i
            JOIN "USER" u ON
	            u.age BETWEEN 
                    CAST(split_part(i.age_group, '_', 1) AS INTEGER)
                    AND
                    CAST(split_part(i.age_group, '_', 2) AS INTEGER)
	            AND
                u.gender = i.gender
            WHERE u.user_id = $1
        `;
        
        const inbodyResult = await sendQuery(inbodyQuery, [userId, inbodyTime]);
        const inbodyStandardResult = await sendQuery(inbodyStandardQuery, [userId]);
        
        if (inbodyResult && inbodyResult.length > 0) {
            res.status(200).json({
                success: true,
                inbodyResult: inbodyResult,
                standardData: inbodyStandardResult,
                message: '사용자 Inbody 데이터 조회 성공'
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

module.exports = {
    getUserInbodyData
}; 