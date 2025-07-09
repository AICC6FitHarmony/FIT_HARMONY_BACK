
// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
const { sendQuery } = require('../../config/database');
const ROLE = require('../../config/ROLE');

//  2) 통신 객체 배열 선언
const buyControllers = [
    {
        url : '/matchMember', 
        type : 'get',
        callback : async ({request, params}) => {
           try {
               if(request.isAuthenticated()){ // 트레이너만 조회 가능
                    const role = request.user.role;
                    if(role != ROLE.TRAINER){
                        return {
                            message: 'noAuth',
                            success: false
                        }
                    }
                    const userId = request.user.userId; // 디폴트는 로그인한 사람 데이터 조회

                    
                    // 실 소스
                    let query = `
                        select 
                            u.user_id, 
                            u.user_name, 
                            u.nick_name
                        from "USER" u
                        join (
                            select b.user_id 
                            from buy b 
                            join products p
                            on b.product_id = p.product_id
                            where p.user_id = $1
                            ${params && !(params.status == undefined || params.status == '') ? `and b.status = $2`: ''}
                        ) bp
                        on u. user_id = bp.user_id
                    `;
                    let queryParam = [userId];
                    if(params && !(params.status == undefined || params.status == '')){
                        queryParam.push(params.status);
                    }
                    const result = await sendQuery(query, queryParam);




                    // 테스트
                    // const result = await sendQuery(`
                    //     select user_id, user_name, nick_name
                    //     from "USER" u
                    //     where role <> 'TRAINER'
                    //     and user_id <> ${userId}
                    //     and user_id in (
                    //         select user_id
                    //         from schedule
                    //         where user_id <> ${userId}
                    //         group by user_id
                    //     )
                    // `);


                    return { 
                        message: 'success',
                        success: true,
                        data : result
                    }
                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
           } catch (error) {
                console.log(`/buy/matchMember error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
           }
        }
    },
]


//  3) 통신 객체 배열 Route 등록
buyControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router;