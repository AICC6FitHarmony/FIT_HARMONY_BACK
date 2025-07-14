const passport = require('passport'); // 인증 미들웨어

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 사용자 ID
 *         email:
 *           type: string
 *           description: 사용자 이메일
 *         role:
 *           type: string
 *           enum: [ADMIN, TRAINER, MEMBER]
 *           description: 사용자 역할
 *         name:
 *           type: string
 *           description: 사용자 이름
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: 사용자 이메일
 *         password:
 *           type: string
 *           description: 사용자 비밀번호
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: 응답 메시지
 *         success:
 *           type: boolean
 *           description: 성공 여부
 *         user:
 *           $ref: '#/components/schemas/User'
 */

// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../routes/common_routes'); // 라우트 작성
//  2) 통신 객체 배열 선언
const authControllers = [
    // 1. 로그인 기능
    {
        url : '/auth/login', 
        type : 'post',
        auth : passport.authenticate('local'),
        callback : async ({request, params}) => {
            try {
                // 로그인 동작 테스트 필요
                // params 에서 받아지는지, request에서 받아지는지 확인 필요
                console.log(request.user);
                console.log(params.user);
                return { 
                    message: 'Login Success...',
                    success: true,
                    user: request.user 
                }
            } catch (error) {
                console.log(`/login error : ${error.message}`);
                return {
                    message: 'Login Error...'
                };
            }

        }   
    },

    // 2. 로그아웃 기능
    {
        url : '/auth/logout', 
        type : 'post',
        auth : passport.authenticate('local'),
        callback : async ({request}) => {
            try {
                // 테스트 필요
                request.logout();
                return {
                    message: 'Logout Success...',
                    success: true
                }
            } catch (error) {
                console.log(`authControllers /login error : ${error.message}`);
                return {
                    message: 'Login Error...'
                };
            }

        }   
    },
];

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 사용자 로그인
 *     description: 이메일과 비밀번호를 사용하여 사용자 로그인을 수행합니다.
 *     tags: [인증]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "로그인에 실패했습니다."
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: 사용자 로그아웃
 *     description: 현재 로그인된 사용자를 로그아웃시킵니다.
 *     tags: [인증]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout Success..."
 *                 success:
 *                   type: boolean
 *                   example: true
 */

//  3) 통신 객체 배열 Route 등록
authControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router;