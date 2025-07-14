/**
 * @swagger
 * components:
 *   schemas:
 *     BuyUser:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: 사용자 ID
 *         user_name:
 *           type: string
 *           description: 사용자 이름
 *         nick_name:
 *           type: string
 *           description: 닉네임
 *         phone_number:
 *           type: string
 *           description: 전화번호
 *         email:
 *           type: string
 *           format: email
 *           description: 이메일
 *         age:
 *           type: integer
 *           description: 나이
 *         height:
 *           type: number
 *           format: float
 *           description: 키 (cm)
 *         weight:
 *           type: number
 *           format: float
 *           description: 체중 (kg)
 *         gender:
 *           type: string
 *           enum: [M, F]
 *           description: 성별 M 남성 F 여성
 *         fit_history:
 *           type: string
 *           description: 피트니스 경력
 *         fit_goal:
 *           type: string
 *           description: 피트니스 목표
 *         status:
 *           type: string
 *           description: 구매 상태 코드
 *         status_name:
 *           type: string
 *           description: 구매 상태명
 *     Product:
 *       type: object
 *       properties:
 *         product_id:
 *           type: integer
 *           description: 상품 ID
 *         user_id:
 *           type: integer
 *           description: 트레이너 ID
 *         name:
 *           type: string
 *           description: 상품명
 *         description:
 *           type: string
 *           description: 상품 설명
 *         price:
 *           type: number
 *           format: float
 *           description: 가격
 *         category:
 *           type: string
 *           description: 카테고리
 *         is_deleted:
 *           type: boolean
 *           description: 삭제 여부
 *         created_time:
 *           type: string
 *           format: date-time
 *           description: 생성 시간
 *         buyUserList:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BuyUser'
 *           description: 구매한 사용자 목록
 *     BuyStatusUpdateRequest:
 *       type: object
 *       required:
 *         - buyId
 *         - status
 *       properties:
 *         buyId:
 *           type: integer
 *           description: 구매 ID
 *         status:
 *           type: string
 *           enum: [P, A, R, C]
 *           description: 상태 P 대기 A 승인 R 거절 C 완료
 */

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
                        group by u.user_id, u.user_name, u.nick_name
                    `;
                    let queryParam = [userId];
                    if(params && !(params.status == undefined || params.status == '')){
                        queryParam.push(params.status);
                    }
                    const result = await sendQuery(query, queryParam);

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



    {
        url : '/myproducts', 
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


                    // 로그인 사용자 기준 상품 조회 with 페이징 + 검색 처리
                    const userId = request.user.userId;
                    const pagePerCount = 9;

                    // 기본 파라미터
                    let productQueryParams = [userId];
                    let productTotalPageQueryParams = [userId];

                    // 쿼리 파트 조립용
                    let whereSearchClause = '';
                    let limitOffsetClause = '';
                    let paramIndex = 2; // 현재 $1 = userId

                    //  검색어가 있을 경우 처리
                    if (params?.search && params.search !== '') {
                        whereSearchClause = ` AND (name ILIKE '%' || $${paramIndex} || '%' OR description ILIKE '%' || $${paramIndex} || '%')`;
                        productQueryParams.push(params.search);
                        productTotalPageQueryParams.push(params.search);
                        paramIndex++;
                    }

                    // 페이징이 존재할 경우 처리
                    let offset = 0;
                    if (params?.currentPage && params.currentPage !== '') {
                        const currentPage = Number(params.currentPage);
                        offset = (currentPage - 1) * pagePerCount;
                        productQueryParams.push(pagePerCount, offset); // $N, $N+1
                        limitOffsetClause = ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
                    }

                    // 상품 리스트 조회 쿼리
                    const myProductListQuery = `
                        select *
                        from products
                        where user_id = $1
                        ${whereSearchClause}
                        order by is_deleted, product_id desc, created_time desc
                        ${limitOffsetClause}
                    `;

                    const myProductList = await sendQuery(myProductListQuery, productQueryParams);

                    // 전체 페이지 수 조회 쿼리
                    let totalPageClause = '';
                    let totalPageParamIndex = 3;
                    if (params?.search && params.search !== '') {
                        totalPageClause = ` AND (name ILIKE '%' || $${totalPageParamIndex} || '%' OR description ILIKE '%' || $${totalPageParamIndex} || '%')`;
                        productTotalPageQueryParams.splice(1, 0, pagePerCount); // $2 = limit
                    } else {
                        productTotalPageQueryParams.push(pagePerCount); // only $2 = limit
                    }

                    const myProductListTotalPageQuery = `
                        select ceil(count(product_id) / $2::int)::int as total_page
                        from products
                        WHERE user_id = $1
                        ${totalPageClause}
                    `;

                    const myProductListTotalPage = await sendQuery(
                        myProductListTotalPageQuery,
                        productTotalPageQueryParams
                    );

                    // ✅ 상품별 구매 유저 목록 조회 및 매핑
                    const productIds = myProductList.map(item => item.productId);
                    let myProductUserList = [];

                    if (productIds.length > 0) {
                        const productIdsQuery = productIds.map((_, i) => `$${i + 1}`).join(',');
                        myProductUserList = await sendQuery(
                            `
                            select 
                                b.*, 
                                u.user_name, 
                                u.nick_name, 
                                u.phone_number, 
                                u.email,
                                u.age, 
                                u.height, 
                                u.weight, 
                                u.gender, 
                                u.fit_history,
                                u.fit_goal,
                                c.code_name as status_name
                            from buy b
                            join "USER" u 
                            on b.user_id = u.user_id
                            join (
                                select * 
                                from code_detail 
                                where code_class = 'C003'
                            ) c
                            on b.status = c.code_id
                            where b.product_id in (${productIdsQuery})
                            `,
                            productIds
                        );

                        // 매핑
                        myProductList.forEach((product) => {
                            product.buyUserList = myProductUserList.filter(u => u.productId === product.productId);
                        });
                    }

                    return { 
                        message: 'success',
                        success: true,
                        data : myProductList,
                        page : {
                            currentPage : Number(params.currentPage),
                            totalPages : myProductListTotalPage[0].totalPage
                        }
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

    {
        url : '/changeStatus', 
        type : 'patch',
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

                    const result = await sendQuery(`
                        update buy
                        set status = $3
                        where user_id = $1 
                        and product_id = $2   
                    `, [params.userId, params.productId, params.status])
                    
                    
                    let product = await sendQuery(`
                        select *
                        from products
                        where product_id = $1 
                    `, [params.productId]);

                    const productUserList = await sendQuery(
                        `
                        select 
                            b.*, 
                            u.user_name, 
                            u.nick_name, 
                            u.phone_number, 
                            u.email,
                            u.age, 
                            u.height, 
                            u.weight, 
                            u.gender, 
                            u.fit_history,
                            u.fit_goal,
                            c.code_name as status_name
                        from buy b
                        join "USER" u 
                        on b.user_id = u.user_id
                        join (
                            select * 
                            from code_detail 
                            where code_class = 'C003'
                        ) c
                        on b.status = c.code_id
                        where b.product_id = $1 
                        `,
                    [params.productId]);

                    product[0].buyUserList = productUserList;

                    return { 
                        message: 'success',
                        success: true,
                        data:product[0]
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
    }
]


/**
 * @swagger
 * /buy/matchMember:
 *   get:
 *     summary: 트레이너 매칭 회원 조회
 *     description: 트레이너가 자신의 상품을 구매한 회원 목록을 조회합니다.
 *     tags: [구매]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [P, A, R, C]
 *         description: 구매 상태 필터 P 대기 A 승인 R 거절 C 완료
 *     responses:
 *       200:
 *         description: 매칭 회원 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                       user_name:
 *                         type: string
 *                       nick_name:
 *                         type: string
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 권한 없음
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /buy/myproducts:
 *   get:
 *     summary: 트레이너 상품 목록 조회
 *     description: 트레이너가 등록한 상품 목록과 구매한 회원 정보를 조회합니다.
 *     tags: [구매]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어 (상품명, 설명)
 *       - in: query
 *         name: currentPage
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 현재 페이지 번호
 *     responses:
 *       200:
 *         description: 상품 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 page:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       description: 현재 페이지
 *                     totalPages:
 *                       type: integer
 *                       description: 전체 페이지 수
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 권한 없음
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /buy/changeStatus:
 *   patch:
 *     summary: 구매 상태 변경
 *     description: 트레이너가 회원의 구매 요청 상태를 변경합니다.
 *     tags: [구매]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - status
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 구매한 사용자 ID
 *               productId:
 *                 type: integer
 *                 description: 상품 ID
 *               status:
 *                 type: string
 *                 enum: [P, A, R, C]
 *                 description: 변경할 상태 P 대기 A 승인 R 거절 C 완료
 *     responses:
 *       200:
 *         description: 상태 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: 잘못된 요청
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: 인증 실패
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 권한 없음
 *         $ref: '#/components/responses/ForbiddenError'
 */

//  3) 통신 객체 배열 Route 등록
buyControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router;