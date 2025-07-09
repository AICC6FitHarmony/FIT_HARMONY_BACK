const { sendQuery } = require('../../config/database');
const createTrainerBuy = async (req, res) => {
  // 사용자 인증 확인
  if (req.isAuthenticated() == false) {
    return res.json({ msg: '회원이 아닙니다.', success: false });
  }

  try {
    //프론트 정보 받아옴
    const { productId } = req.body;
    const { user } = req;
    const { userId } = user;

    //상품 정보 조회
    const productInfoQuery = `
    SELECT price, session_cnt
    FROM products 
    WHERE product_id = $1
    `;
    const productInfoResult = await sendQuery(productInfoQuery, [productId]);
    const totalPrice = productInfoResult[0].price;
    const sessionLeft = productInfoResult[0].session_cnt;

    // 데이터 베이스에 저장
    const insertBuyQuery = `
      INSERT INTO buy (user_id, product_id, total_price, session_left,)
    VALUES ($1, $2, $3, $4, )
    RETURNING buy_id
`;

    const buyResult = await sendQuery(insertBuyQuery, [
      userId,
      productId,
      totalPrice,
      sessionLeft,
    ]);

    res.json({
      msg: '상품 구매 완료',
      buyId: buyResult[0].buy_id,
      success: true,
    });
  } catch (error) {
    console.error('상품 구매 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
    });
  }
};

module.exports = {
  createTrainerBuy,
};
