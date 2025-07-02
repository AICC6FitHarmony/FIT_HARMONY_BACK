const { sendQuery } = require('../../config/database');
const getTrainerList = async (req, res) => {
  try {
    const trainerlistquery = `
     SELECT COUNT(*) AS total
      FROM "USER"
      WHERE role = 'TRAINER'
    
    `;

    const trainerquery = `select
	    u.user_id,
	    u.user_name,
	    g.gym,
	    g.gym_address,
	    round(AVG(r.rating),2) AS rating,
	    count(r.review_id) as review_count
      from "USER" u
        
      left outer JOIN products p
      on u.user_id = p.user_id
      LEFT outer JOIN gym g 
      ON u.gym_id = g.gym_id
      left outer JOIN review r 
      ON p.product_id = r.product_id
        
      where u.role = 'TRAINER'
      GROUP BY u.user_id , u.user_name, g.gym, g.gym_address
      `;

    const trainerresult = await sendQuery(trainerquery);
    const trainerlistresult = await sendQuery(trainerlistquery);
    // console.log(trainerresult);

    res.status(200).json({
      success: true,
      data: trainerresult,
      total: trainerlistresult,
      message: '트레이너 목록 조회 성공',
    });
  } catch (error) {
    console.error('트레이너 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
    });
  }
};

module.exports = {
  getTrainerList,
};
