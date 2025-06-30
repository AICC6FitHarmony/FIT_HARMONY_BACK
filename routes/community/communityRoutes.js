const express = require('express');
const router = express.Router();
const {getPosts, createPost, getPost, getAllPosts, deletePost, getComments, createComment, deleteComment} = require('../../controllers/community/communityControllers');
const upload = require('../login/uploads');

// 미들웨어 - 인증 확인 (필요시 사용)
// const { authenticateToken } = require('../../middleware/auth');

router.get('/:boardId', getPosts);
router.get('/post/:postId', getPost);
router.post('/post',upload.none(),createPost);
router.delete('/delete',deletePost);

router.get('/comments/:postId', getComments);
router.post('/comment/create', createComment);
router.delete('/comment',deleteComment);

module.exports = router; 