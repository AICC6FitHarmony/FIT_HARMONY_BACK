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
        callback : async () => {
            try {

                const data = {
                    diet: [],
                    community: [],
                    trainer: [],
                }

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

//  3) 통신 객체 배열 Route 등록
introControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router; 