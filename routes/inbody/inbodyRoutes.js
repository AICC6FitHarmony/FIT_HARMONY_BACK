const express = require('express');
const router = express.Router();
const { getUserInbodyData } = require('../../controllers/inbody/inbodyControllers');

// 미들웨어 - 인증 확인 (필요시 사용)
// const { authenticateToken } = require('../../middleware/auth');

/**
 * @route   GET /inbody/:userId
 * @desc    특정 사용자의 Inbody 데이터 조회
 * @access  Public (또는 Private - 인증 필요시)
 */
router.get('/:userId', getUserInbodyData);

module.exports = router; 