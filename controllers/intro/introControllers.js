/**
 * @swagger
 * components:
 *   schemas:
 *     IntroDiet:
 *       type: object
 *       properties:
 *         diet_main_menu_name:
 *           type: string
 *           description: 식단 메인 메뉴명
 *         diet_count:
 *           type: integer
 *           description: 해당 메뉴의 등록된 식단 수
 *         file_id:
 *           type: integer
 *           description: 대표 이미지 파일 ID
 *     IntroCommunityPost:
 *       type: object
 *       properties:
 *         post_id:
 *           type: integer
 *           description: 게시글 ID
 *         title:
 *           type: string
 *           description: 게시글 제목
 *         comment_count:
 *           type: integer
 *           description: 댓글 수
 *     IntroTrainer:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: 트레이너 ID
 *         file_id:
 *           type: integer
 *           description: 프로필 이미지 파일 ID
 *         nick_name:
 *           type: string
 *           description: 트레이너 닉네임
 *         fit_goal:
 *           type: string
 *           description: 피트니스 목표
 *         product_count:
 *           type: integer
 *           description: 등록된 상품 수
 *     IntroData:
 *       type: object
 *       properties:
 *         diet:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IntroDiet'
 *           description: 인기 식단 TOP 10
 *         communityLatest:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IntroCommunityPost'
 *           description: 최신 커뮤니티 게시글 TOP 5
 *         communityHot:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IntroCommunityPost'
 *           description: 인기 커뮤니티 게시글 TOP 5
 *         trainer:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/IntroTrainer'
 *           description: 인기 트레이너 TOP 10
 */

// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
const { sendQuery } = require('../../config/database');

//  2) 통신 객체 배열 선언
const introControllers = [
    // 
    {
        url : '/',
        type : 'get',
        callback : async ({request, params}) => {
            try {

                const data = {
                    diet: [],
                    communityLatest: [],
                    communityHot: [],
                    trainer: [],
                }
                const introDietQuery = `SELECT diet_main_menu_name, 
                                               COUNT(*) AS diet_count,
                                              (SELECT file_id
                                               FROM diet AS d2 
                                               WHERE d2.diet_main_menu_name = d1.diet_main_menu_name
                                               LIMIT 1) AS file_id
                                        FROM diet AS d1
                                        GROUP BY diet_main_menu_name
                                        ORDER BY diet_count DESC
                                        LIMIT 10
                                        `

                const introCommunityLatestQuery = ` SELECT post_id, 
                                                           title,
                                                          (SELECT COUNT(*)
                                                           FROM comment c 
                                                    WHERE p.post_id = c.post_id) AS comment_count 
                                                    FROM post p 
                                                    ORDER BY created_time DESC 
                                                    LIMIT 5
                                                    `
                const introCommunityHotQuery = `SELECT post_id, 
                                                       title,
                                                      (SELECT COUNT(*)
                                                       FROM comment c 
                                                       WHERE p.post_id = c.post_id) AS comment_count
                                                FROM post p
                                                ORDER BY comment_count DESC 
                                                LIMIT 5
                                                `
                const introTrainerQuery =  `SELECT u.user_id, 
                                                   u.file_id, 
                                                   u.nick_name, 
                                                   u.fit_goal, 
                                                   COUNT(p.product_id) AS product_count
                                            FROM "USER" u
                                            LEFT JOIN PRODUCTS p ON u.user_id = p.user_id
                                            WHERE u.role = 'TRAINER'
                                            AND u.status = 'ACTIVE'
                                            GROUP BY u.user_id, u.file_id, u.nick_name, u.fit_goal
                                            ORDER BY product_count DESC
                                            LIMIT 10
                                            `

                data.diet = await sendQuery(introDietQuery)
                data.communityLatest = await sendQuery(introCommunityLatestQuery)
                data.communityHot = await sendQuery(introCommunityHotQuery)
                data.trainer = await sendQuery(introTrainerQuery)

                    return { 
                        message: 'success',
                        success: true,
                        data: data || []
                    }
            } catch (error) {
                console.log(`/intro error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }
        }
    },
];

/**
 * @swagger
 * /:
 *   get:
 *     summary: 메인 페이지 데이터 조회
 *     description: 메인 페이지에 표시할 인기 식단, 최신/인기 커뮤니티 게시글, 인기 트레이너 정보를 조회합니다.
 *     tags: [INTRO]
 *     responses:
 *       200:
 *         description: 메인 페이지 데이터 조회 성공
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
 *                   $ref: '#/components/schemas/IntroData'
 *       500:
 *         description: 서버 오류
 *         $ref: '#/components/responses/ValidationError'
 */

//  3) 통신 객체 배열 Route 등록
introControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router; 