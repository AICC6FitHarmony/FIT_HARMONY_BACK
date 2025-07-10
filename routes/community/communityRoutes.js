const express = require('express');
const router = express.Router();
const {getPosts, createPost, getPost, getAllPosts, deletePost, getComments, createComment, deleteComment, updateComment, updatePost} = require('../../controllers/community/communityControllers');
const {getBoardInfo, getBoards, getPermission, updatePermission, getPermissions, createBoard, updateBoard} = require('../../controllers/community/boardControllers');
const upload = require('../login/uploads');

// 미들웨어 - 인증 확인 (필요시 사용)
// const { authenticateToken } = require('../../middleware/auth');

/**
 * @route   GET /community/:boardId?page=:page
 * @desc    커뮤니티 게시글 조회
 * @access  Public (또는 Private - 인증 필요시)
 */
router.get('/permission/', getPermission);
router.get('/permissions/:boardId',getPermissions);
router.post('/permission', updatePermission);

router.get('/:boardId', getPosts);

router.get('/post/:postId', getPost);
router.post('/post',upload.none(),createPost);
router.put('/post',upload.none(),updatePost);
router.delete('/delete',deletePost);


router.get('/comments/:postId', getComments);
router.post('/comment/create', createComment);
router.delete('/comment',deleteComment);
router.put('/comment', updateComment);

router.get('/board/list',getBoards);
router.post('/board/:boardId',createBoard);
router.put('/board/',updateBoard);
router.get('/board/:boardId', getBoardInfo);


module.exports = router; 