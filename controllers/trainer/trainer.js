const { sendQuery } = require('../../config/database');
const getTrainerList = async (req, res) => {
  try {
    const trainerquery = `
      SELECT * FROM "USER"
      WHERE role = 'TRAINER'
      ORDER BY USER_NAME
      LIMIT 10
      OFFSET 0;
    `;

    const gymquery = `
    SELECT * FROM "gym"`;

    const productsquery = `
    SELECT * FROM "products"`;

    //프론트에 total 값 전달 페이징 처리를 목적으로 둠
    const countQuery = `
      SELECT COUNT(*) AS total FROM "USER"
      WHERE role = 'TRAINER';
    `;

    const trainerresult = await sendQuery(trainerquery);
    console.log(trainerresult);
    const countResult = await sendQuery(countQuery);
    const gymresult = await sendQuery(gymquery);
    console.log(gymresult);
    const productsresult = await sendQuery(productsquery);

    const total = countResult[0]?.total || 0; //현재 sendQuery 가 배열값이기 때문에(이유는 모름) 숫자로 변환. 즉 total 값에 0
    console.log(total);

    res.status(200).json({
      success: true,
      data: trainerresult,
      gym: gymresult,
      products: productsresult,
      total: total,
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
