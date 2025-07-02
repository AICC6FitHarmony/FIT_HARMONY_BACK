const express = require('express');
const router = express.Router();
const { getUserData } = require('../../controllers/mypage/mypageControllers');

// 미들웨어 - 인증 확인 (필요시 사용)
// const { authenticateToken } = require('../../middleware/auth');

/**
 * @route   GET /mypage/:userId
 * @desc    특정 사용자의 데이터 조회
 * @access  Public (또는 Private - 인증 필요시)
 */
router.get('/:userId', getUserData);

// /**
//  * @route   GET /inbody/:userId/month?inbodyMonthTime=:inbodyMonthTime
//  * @desc    특정 사용자의 Inbody 월간 데이터 조회
//  * @access  Public (또는 Private - 인증 필요시)
//  */
// router.get('/:userId/month', getUserData);

// /**
//  * @route   POST /inbody/:userId
//  * @desc    특정 사용자의 Inbody 데이터 등록
//  * @access  Public (또는 Private - 인증 필요시)
//  */
// router.post('/:userId', getUserData);

// /**
//  * @route   PUT /inbody/update
//  * @desc    특정 사용자의 Inbody 데이터 수정
//  * @access  Public (또는 Private - 인증 필요시)
//  */
// router.put('/update', getUserData);

module.exports = router; 