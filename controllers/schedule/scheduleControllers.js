// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
//  2) 통신 객체 배열 선언
const schedulerControllers = [
    // AI 스케쥴러 작성 요청
    {
        url : '/requestAiSchdule', 
        type : 'post',
        callback : async ({request, params}) => {
            try {
<<<<<<< HEAD
                        
=======

                
>>>>>>> 0c3a95e705701243f855ce69865d03d3084e49f9


                return { 
                    message: 'Login Success...',
                    success: true,
                    prompt: params.prompt
                }
            } catch (error) {
                console.log(`/schedule/requestAiSchdule error : ${error.message}`);
                return {
                    message: 'Login Error...'
                };
            }

        }   
    },
];
//  3) 통신 객체 배열 Route 등록
schedulerControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router;