const express = require('express');
const router = express.Router();
const {getPosts, createPost, getPost} = require('../../controllers/community/communityControllers');

// 미들웨어 - 인증 확인 (필요시 사용)
// const { authenticateToken } = require('../../middleware/auth');

router.get('/', getPosts);
router.get('/post/:postID', getPost);
router.post('/post',createPost);

module.exports = router; 