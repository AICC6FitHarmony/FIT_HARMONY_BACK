const { sendQuery } = require('../../config/database');
const getTrainerList = async (req, res) => {
  try {
    const trainerlistquery = `
     SELECT COUNT(*) AS total
      FROM "USER"
      WHERE role = 'TRAINER'
    
    `;

    const trainerquery = `
      SELECT
        u.user_id,
        u.user_name,
        u.gender,
        g.gym,
        g.gym_address,
        MIN(p.price) AS min_price,
        ROUND(AVG(r.rating), 2) AS rating,
        COUNT(r.review_id) AS review_count
      FROM "USER" u

      LEFT OUTER JOIN products p 
      ON u.user_id = p.user_id

      LEFT OUTER JOIN gym g 
      ON u.gym_id = g.gym_id

      LEFT OUTER JOIN review r 
      ON p.product_id = r.product_id

      WHERE u.role = 'TRAINER' and u.status = 'ACTIVE'

      GROUP BY u.user_id, u.user_name, u.gender, g.gym, g.gym_address
      `;

    const trainerresult = await sendQuery(trainerquery);
    const trainerlistresult = await sendQuery(trainerlistquery);

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

const getTrainerDetail = async (req, res) => {
  const userId = req.params.id;

  const trainerDetailQuery = `
    SELECT
      u.user_id,
      u.user_name,
      u.fit_history,
      u.introduction,
      u.file_id,
      g.gym,
      g.gym_address,
      ROUND(AVG(r.rating), 2) AS rating,
      COUNT(r.review_id) AS review_count
    FROM "USER" u
    LEFT OUTER JOIN gym g ON u.gym_id = g.gym_id
    LEFT OUTER JOIN products p ON u.user_id = p.user_id
    LEFT OUTER JOIN review r ON p.product_id = r.product_id
    WHERE u.user_id = $1
    GROUP BY u.user_id, u.user_name, u.fit_history, u.introduction, u.file_id, g.gym, g.gym_address
  `;

  try {
    const result = await sendQuery(trainerDetailQuery, [userId]); //★★★★★★
    res.status(200).json({
      success: true,
      data: result[0],
      message: '트레이너 상세 조회 성공',
    });
  } catch (error) {
    console.error('트레이너 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
    });
  }
};

const getTrainerProduct = async (req, res) => {
  const userId = req.params.id;

  const trainerProductQuery = `

      select
      u.user_id,
      p.name,
      p.description, p.price,
      p.type,
      p. session_cnt

    FROM "USER" u
  	LEFT OUTER JOIN products p ON u.user_id = p.user_id

    WHERE u.user_id = $1
   `;

  try {
    const productresult = await sendQuery(trainerProductQuery, [userId]);
    res.status(200).json({
      success: true,
      data: productresult,
      message: '트레이너 상세 조회 성공',
    });
  } catch (error) {
    console.error('트레이너 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
    });
  }
};

const getTrainerReview = async (req, res) => {
  const userId = req.params.id;

  const trainerReviewQuery = `
  SELECT
    r.user_id,
    u.user_name,
    r.rating,
    r.content,
    TO_CHAR(r.updated_time, 'YYYY-MM-DD') AS formatted_date
  FROM "USER" u
  LEFT OUTER JOIN review r ON r.user_id = u.user_id
  WHERE r.product_id IN (
  SELECT product_id FROM products
  WHERE user_id = $1
  )
    ORDER BY RANDOM()
    LIMIT 3;

  `;
  try {
    const reiviewresult = await sendQuery(trainerReviewQuery, [userId]);
    res.status(200).json({
      success: true,
      data: reiviewresult,
      message: '트레이너 상세 조회 성공',
    });
  } catch (error) {
    console.error('트레이너 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
    });
  }
};

const createTrainerReview = async (req, res) => {
  if (req.isAuthenticated() == false) {
    return res.json({ msg: '회원이 아닙니다.', success: false });
  }

  try {
    const { trainerId, rating, content } = req.body;
    const { user } = req;
    const { userId } = user;

    // 트레이너의 첫 번째 상품 ID 가져오기 (리뷰는 상품에 연결됨)
    const getProductQuery = `
      SELECT product_id 
      FROM products 
      WHERE user_id = $1 
      LIMIT 1
    `;

    const productResult = await sendQuery(getProductQuery, [trainerId]);

    if (!productResult || productResult.length === 0) {
      return res.json({
        msg: '해당 트레이너의 상품을 찾을 수 없습니다.',
        success: false,
      });
    }

    const productId = productResult[0].product_id;

    // 리뷰 저장 쿼리
    const insertReviewQuery = `
      INSERT INTO review (user_id, product_id, rating, content, created_time, updated_time)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING review_id
    `;

    const reviewResult = await sendQuery(insertReviewQuery, [
      userId,
      productId,
      rating,
      content,
    ]);

    if (reviewResult && reviewResult.length > 0) {
      res.json({
        msg: '리뷰가 성공적으로 등록되었습니다.',
        reviewId: reviewResult[0].review_id,
        success: true,
      });
    } else {
      res.json({
        msg: '리뷰 등록에 실패했습니다.',
        success: false,
      });
    }
  } catch (error) {
    console.error('리뷰 등록 오류:', error);
    res.json({
      msg: '리뷰 등록 실패',
      success: false,
    });
  }
};

module.exports = {
  getTrainerList,
  getTrainerDetail,
  getTrainerProduct,
  getTrainerReview,
  createTrainerReview,
};
