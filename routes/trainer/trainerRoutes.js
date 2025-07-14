/**
 * @swagger
 * components:
 *   schemas:
 *     Trainer:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: 트레이너 ID
 *         user_name:
 *           type: string
 *           description: 트레이너 이름
 *         nick_name:
 *           type: string
 *           description: 닉네임
 *         introduction:
 *           type: string
 *           description: 자기소개
 *         fit_history:
 *           type: string
 *           description: 피트니스 경력
 *         fit_goal:
 *           type: string
 *           description: 피트니스 목표
 *         gym:
 *           type: string
 *           description: 소속 헬스장
 *         file_id:
 *           type: integer
 *           description: 프로필 이미지 파일 ID
 *         avg_rating:
 *           type: number
 *           format: float
 *           description: 평균 평점
 *         review_count:
 *           type: integer
 *           description: 리뷰 수
 *     TrainerProduct:
 *       type: object
 *       properties:
 *         product_id:
 *           type: integer
 *           description: 상품 ID
 *         name:
 *           type: string
 *           description: 상품명
 *         description:
 *           type: string
 *           description: 상품 설명
 *         price:
 *           type: number
 *           format: float
 *           description: 가격
 *         category:
 *           type: string
 *           description: 카테고리
 *         created_time:
 *           type: string
 *           format: date-time
 *           description: 생성 시간
 *     TrainerReview:
 *       type: object
 *       properties:
 *         review_id:
 *           type: integer
 *           description: 리뷰 ID
 *         user_id:
 *           type: integer
 *           description: 작성자 ID
 *         trainer_id:
 *           type: integer
 *           description: 트레이너 ID
 *         rating:
 *           type: integer
 *           description: 평점 (1-5)
 *         content:
 *           type: string
 *           description: 리뷰 내용
 *         created_time:
 *           type: string
 *           format: date-time
 *           description: 작성 시간
 *         user_name:
 *           type: string
 *           description: 작성자 이름
 *         nick_name:
 *           type: string
 *           description: 작성자 닉네임
 *     ReviewCreateRequest:
 *       type: object
 *       required:
 *         - trainerId
 *         - rating
 *         - content
 *       properties:
 *         trainerId:
 *           type: integer
 *           description: 트레이너 ID
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: 평점 (1-5)
 *         content:
 *           type: string
 *           description: 리뷰 내용
 *     ProductBuyRequest:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: integer
 *           description: 구매할 상품 ID
 */

const express = require('express');
const router = express.Router();
const {
  getTrainerList,
  getTrainerDetail,
  getTrainerReview,
  getAllTrainerReviews, // 새로 추가
  getTrainerProduct,
  createTrainerReview,
} = require('../../controllers/trainer/trainer');

const {
  createTrainerBuy,
  getUserPurchasedProducts,
} = require('../../controllers/trainer/createBuyController');

/**
 * @swagger
 * /trainer:
 *   get:
 *     summary: 트레이너 목록 조회
 *     description: 등록된 트레이너 목록을 조회합니다.
 *     tags: [트레이너]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어 (트레이너명, 닉네임)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 트레이너 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Trainer'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 */

/**
 * @swagger
 * /trainer/{id}:
 *   get:
 *     summary: 트레이너 상세 정보 조회
 *     description: 특정 트레이너의 상세 정보를 조회합니다.
 *     tags: [트레이너]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 트레이너 ID
 *     responses:
 *       200:
 *         description: 트레이너 상세 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Trainer'
 *       404:
 *         description: 트레이너를 찾을 수 없음
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /trainer/{id}/product:
 *   get:
 *     summary: 트레이너 상품 목록 조회
 *     description: 특정 트레이너가 등록한 상품 목록을 조회합니다.
 *     tags: [트레이너]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 트레이너 ID
 *     responses:
 *       200:
 *         description: 상품 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrainerProduct'
 *       404:
 *         description: 트레이너를 찾을 수 없음
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /trainer/{id}/review:
 *   get:
 *     summary: 트레이너 리뷰 조회 (상세페이지용)
 *     description: 특정 트레이너의 최근 리뷰 3개를 조회합니다.
 *     tags: [트레이너]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 트레이너 ID
 *     responses:
 *       200:
 *         description: 리뷰 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrainerReview'
 *       404:
 *         description: 트레이너를 찾을 수 없음
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /trainer/{id}/reviews/all:
 *   get:
 *     summary: 트레이너 전체 리뷰 조회
 *     description: 특정 트레이너의 모든 리뷰를 조회합니다.
 *     tags: [트레이너]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 트레이너 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *     responses:
 *       200:
 *         description: 전체 리뷰 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrainerReview'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *       404:
 *         description: 트레이너를 찾을 수 없음
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /trainer/review:
 *   post:
 *     summary: 트레이너 리뷰 작성
 *     description: 트레이너에 대한 리뷰를 작성합니다.
 *     tags: [트레이너]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewCreateRequest'
 *     responses:
 *       201:
 *         description: 리뷰 작성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 잘못된 요청
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /trainer/product/buy:
 *   post:
 *     summary: 트레이너 상품 구매
 *     description: 트레이너의 상품을 구매합니다.
 *     tags: [트레이너]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductBuyRequest'
 *     responses:
 *       201:
 *         description: 상품 구매 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: 잘못된 요청
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /trainer/purchased-products:
 *   get:
 *     summary: 사용자 구매 상품 조회
 *     description: 로그인한 사용자가 구매한 상품 목록을 조회합니다.
 *     tags: [트레이너]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: 구매 상품 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         $ref: '#/components/schemas/TrainerProduct'
 *                       status:
 *                         type: string
 *                         description: 구매 상태
 *                       purchase_date:
 *                         type: string
 *                         format: date-time
 *                         description: 구매 날짜
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 */

router.get('/', getTrainerList);

// 사용자가 구매한 상품 조회 - /:id 보다 먼저 배치
router.get('/purchased-products', getUserPurchasedProducts);

router.get('/:id/product', getTrainerProduct);
// 더 구체적인 라우트를 먼저 배치
router.get('/:id/reviews/all', getAllTrainerReviews); // 전체 리뷰
router.get('/:id/review', getTrainerReview); // 상세페이지 3개 리뷰
router.get('/:id', getTrainerDetail);
router.post('/review', createTrainerReview); //리뷰 등록
router.post('/product/buy', createTrainerBuy); //상품 구매

module.exports = router;
