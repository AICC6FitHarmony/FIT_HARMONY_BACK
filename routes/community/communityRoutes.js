const express = require('express');
const router = express.Router();
const {getPosts, createPost, getPost, getAllPosts, deletePost, getComments, createComment, deleteComment, updateComment, updatePost, getFilteredPosts, getFindComment} = require('../../controllers/community/communityControllers');
const {getBoardInfo, getBoards, getPermission, updatePermission, getPermissions, createBoard, updateBoard, getFilteredBoards} = require('../../controllers/community/boardControllers');
const upload = require('../login/uploads');

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 게시글 ID
 *         title:
 *           type: string
 *           description: 게시글 제목
 *         content:
 *           type: string
 *           description: 게시글 내용
 *         author_id:
 *           type: integer
 *           description: 작성자 ID
 *         board_id:
 *           type: integer
 *           description: 게시판 ID
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 작성일시
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 수정일시
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 댓글 ID
 *         content:
 *           type: string
 *           description: 댓글 내용
 *         post_id:
 *           type: integer
 *           description: 게시글 ID
 *         author_id:
 *           type: integer
 *           description: 작성자 ID
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 작성일시
 *     Board:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 게시판 ID
 *         name:
 *           type: string
 *           description: 게시판 이름
 *         description:
 *           type: string
 *           description: 게시판 설명
 */

// 미들웨어 - 인증 확인 (필요시 사용)
// const { authenticateToken } = require('../../middleware/auth');

/**
 * @swagger
 * /community/permission/:
 *   get:
 *     summary: 권한 정보 조회
 *     description: 커뮤니티 권한 정보를 조회합니다.
 *     tags: [커뮤니티]
 *     responses:
 *       200:
 *         description: 권한 정보 조회 성공
 */

/**
 * @swagger
 * /community/permissions/{boardId}:
 *   get:
 *     summary: 특정 게시판 권한 조회
 *     description: 특정 게시판의 권한 정보를 조회합니다.
 *     tags: [커뮤니티]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시판 ID
 *     responses:
 *       200:
 *         description: 권한 정보 조회 성공
 */

/**
 * @swagger
 * /community/permission:
 *   post:
 *     summary: 권한 업데이트
 *     description: 커뮤니티 권한을 업데이트합니다.
 *     tags: [커뮤니티]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boardId:
 *                 type: integer
 *               permission:
 *                 type: string
 *     responses:
 *       200:
 *         description: 권한 업데이트 성공
 */

/**
 * @swagger
 * /community/post/{postId}:
 *   get:
 *     summary: 게시글 조회
 *     description: 특정 게시글을 조회합니다.
 *     tags: [커뮤니티]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */

/**
 * @swagger
 * /community/post:
 *   post:
 *     summary: 게시글 작성
 *     description: 새로운 게시글을 작성합니다.
 *     tags: [커뮤니티]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - board_id
 *             properties:
 *               title:
 *                 type: string
 *                 description: 게시글 제목
 *               content:
 *                 type: string
 *                 description: 게시글 내용
 *               board_id:
 *                 type: integer
 *                 description: 게시판 ID
 *     responses:
 *       201:
 *         description: 게시글 작성 성공
 */

/**
 * @swagger
 * /community/post:
 *   put:
 *     summary: 게시글 수정
 *     description: 기존 게시글을 수정합니다.
 *     tags: [커뮤니티]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - title
 *               - content
 *             properties:
 *               id:
 *                 type: integer
 *                 description: 게시글 ID
 *               title:
 *                 type: string
 *                 description: 게시글 제목
 *               content:
 *                 type: string
 *                 description: 게시글 내용
 *     responses:
 *       200:
 *         description: 게시글 수정 성공
 */

/**
 * @swagger
 * /community/delete:
 *   delete:
 *     summary: 게시글 삭제
 *     description: 게시글을 삭제합니다.
 *     tags: [커뮤니티]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: integer
 *                 description: 삭제할 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
 */

/**
 * @swagger
 * /community/comments/{postId}:
 *   get:
 *     summary: 댓글 목록 조회
 *     description: 특정 게시글의 댓글 목록을 조회합니다.
 *     tags: [커뮤니티]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 댓글 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */

/**
 * @swagger
 * /community/comment/create:
 *   post:
 *     summary: 댓글 작성
 *     description: 새로운 댓글을 작성합니다.
 *     tags: [커뮤니티]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - content
 *             properties:
 *               postId:
 *                 type: integer
 *                 description: 게시글 ID
 *               content:
 *                 type: string
 *                 description: 댓글 내용
 *     responses:
 *       201:
 *         description: 댓글 작성 성공
 */

/**
 * @swagger
 * /community/board/list:
 *   get:
 *     summary: 게시판 목록 조회
 *     description: 모든 게시판 목록을 조회합니다.
 *     tags: [커뮤니티]
 *     responses:
 *       200:
 *         description: 게시판 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Board'
 */

/**
 * @swagger
 * /community/{boardId}:
 *   get:
 *     summary: 게시판별 게시글 조회
 *     description: 특정 게시판의 게시글 목록을 조회합니다.
 *     tags: [커뮤니티]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 게시판 ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *     responses:
 *       200:
 *         description: 게시글 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 */

/**
 * @route   GET /community/:boardId?page=:page
 * @desc    커뮤니티 게시글 조회
 * @access  Public (또는 Private - 인증 필요시)
 */
router.get('/permission/', getPermission);
router.get('/permissions/:boardId',getPermissions);
router.post('/permission', updatePermission);


router.get('/post/:postId', getPost);
router.post('/post',upload.none(),createPost);
router.put('/post',upload.none(),updatePost);
router.delete('/delete',deletePost);


router.get('/comments/:postId', getComments);
router.get('/comment/:postId/:commentId', getFindComment);
router.post('/comment/create', createComment);
router.delete('/comment',deleteComment);
router.put('/comment', updateComment);

router.get('/board/list',getBoards);
router.post('/board/:boardId',createBoard);
router.put('/board/',updateBoard);
router.get('/board/:boardId', getBoardInfo);
router.get('/filteredBoards',getFilteredBoards);

router.get('/getPosts/:boardId', getFilteredPosts);
router.get('/:boardId', getPosts);
module.exports = router; 