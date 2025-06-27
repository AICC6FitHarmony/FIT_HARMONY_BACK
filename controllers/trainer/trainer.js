const { sendQuery } = require('../../config/database');
const getTrainerList = async (req, res) => {
  try {
    const query = `
      SELECT * FROM "USER"
      WHERE role = 'TRAINER'
    `;

    const result = await sendQuery(query);
    console.log(result);

    res.status(200).json({
      success: true,
      data: result,
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
