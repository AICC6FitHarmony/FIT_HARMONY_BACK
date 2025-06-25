const { sendQuery } = require('../../config/database');

// 특정 사용자의 Inbody 데이터 조회
const getUserInbodyData = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const query = `
            SELECT 
                *
            FROM inbody i
            --WHERE i.user_id = $1
        `;
        
        // const result = await sendQuery(query, [userId]);
        const result = await sendQuery(query);
        
        if (result && result.length > 0) {
            res.status(200).json({
                success: true,
                data: result,
                message: '사용자 Inbody 데이터 조회 성공'
            });
        } else {
            res.status(404).json({
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