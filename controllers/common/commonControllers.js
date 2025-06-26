// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
const { sendQuery } = require('../../config/database');

//  2) 통신 객체 배열 선언
const commonControllers = [
    // 코드 리스트 조회
    {
        url : '/code/:codeClass', 
        type : 'get',
        callback : async ({request, params}) => {
           try {
                const result = await sendQuery("select * from code_detail where code_class = $1", [params.codeClass]);
                return { 
                    message: 'success',
                    success: true,
                    data : result // 코드 리스트 조회 데이터
                }
           } catch (error) {
                console.log(`/common/code error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
           }
        }
    }
];



//  3) 통신 객체 배열 Route 등록
commonControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router;