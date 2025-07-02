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



module.exports = {
    getUserData,
}; 