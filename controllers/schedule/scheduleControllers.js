// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
const { spawn } = require('child_process'); // nodejs > python script 동작? 연결?
const path = require('path');
const dotenv = require('dotenv'); // require 메서드로 dotenv 모듈을 불러와서 환경 변수를 로드한다.
const { sendQuery } = require('../../config/database');
const ROLE = require("../../config/ROLE"); // ROLE 구분 정보 객체

//  2) 통신 객체 배열 선언
const schedulerControllers = [
    // 캘린더용 스케쥴 데이터 조회( FullCalendar에서 요구하는 형태로 조회 )
    {
        url : '/calendar/:startTime/:endTime', 
        type : 'get',
        callback : async ({request, params}) => {
           try {
                if(request.isAuthenticated()){
                    let userId = request.user.userId; // 디폴트는 로그인한 사람 데이터 조회
                    
                    if(request.user.role == ROLE.TRAINER){ // 강사인 경우만 회원 데이터 조회 가능
                        // /trainer 로 접근 했고, querystring 으로 던짐( 강사가 > 회원 데이터 조회할 때 )
                        if(request.originalUrl.startsWith('/trainer') && params.userId){ 
                            userId = params.userId;

                            // 매칭이 성사된 사용자(승인) 데이터만 조회 할 수 있도록 제한
                            // 승인 코드 확인 할 것...
                            const buyUser = await sendQuery("select user_id from buy where user_id = $1 and status = 'C'", [userId]);
                            if(buyUser == undefined || buyUser.length < 1){
                                return {
                                    message: 'noBuyer',
                                    success: false
                                }
                            }
                        }
                    }

                    // where 절 조건 배열
                    const selectSchedulewheres = [
                        "user_id =", 
                        "and to_char(start_time, 'YYYY-MM-DD') >=", 
                        "and to_char(end_time, 'YYYY-MM-DD') <",
                        "and status in"
                    ];
                    
                    // where 절 조건 파라미터 배열
                    const selectScheduleWhereParams = [
                        userId, 
                        params.startTime, 
                        params.endTime,
                        params.status
                    ];

                    const result = await selectCalendaSchedule(selectSchedulewheres, selectScheduleWhereParams);

                    return { 
                        message: 'success',
                        success: true,
                        data : result // 데이터가 신규 적용되었으므로 일단 전달...(단, 현재 캘릭더 조건(월, 주, 현재 시간)에 맞추어 노출)
                    }
                }else{
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
           } catch (error) {
                console.log(`/schedule/calendar error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
           }
        }
    },

    // AI 스케쥴러 작성 요청
    {
        url : '/requestAiSchdule', 
        type : 'post',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    if(!params.prompt || params.prompt.replace(/\s+/g, '') == ""){
                        return {
                            message: 'noMessage',
                            success: false
                        }
                    }

                    const userId = request.user.userId; 

                    // 사용자 프로필 정보 조회
                    const userProfile = await sendQuery('select age, height, weight, gender from "USER" where user_id = $1', [userId]);

                    // env 에서 파이썬 모듈 경로
                    const pythonEnvPath = path.join(process.env.PYTHON_ENV_PATH, 'python');
                    // gpt 모델 파일 경로
                    const pyScriptPath = path.join(__dirname, 'gptModel.py');
                    // AI 요청 구분
                    const aiRequestDiv = "schedule";
                    // gpt 3.5 터보 모델명 가져옴
                    const model = process.env.GPT_4_o;

                    const gptResult = await new Promise((resolve, reject) => {
                        // child process 실행 (파라미터 : 모델 파일 경로, 질의 구분 코드, GPT 모델명, 질의(프롬프트), 추가 data: string 형태로 변환해서 전달)
                        // 사용할 모델 정보, 프롬프트를 전달
                        const child = spawn(pythonEnvPath, [pyScriptPath, aiRequestDiv, model, params.prompt, JSON.stringify(userProfile[0])]); 

                        // 결과 수신
                        let result = '';
                        child.stdout.on('data', (data) => {
                            result += data.toString();
                        });

                        // 에러 출력
                        child.stderr.on('data', (data) => {
                            console.error('/schedule/requestAiSchdule', data.toString());
                        });


                        child.on('close', async (code) => {
                            if (code !== 0) {
                                reject(`종료 코드 ${code}`);
                            }else{
                                try {
                                    const gptResult = JSON.parse(result);
                                    if(gptResult.success == 'true'){
                                        const scheduleList = gptResult.content; // 스케쥴 내용

                                        const deleteQuery = "delete from schedule where user_id = $1 and to_char(start_time, 'YYYY-MM-DD') >= to_char($2::timestamp, 'YYYY-MM-DD') and status <> 'D'";
                                        // 데이터 인서트 전 현재 + 미래데이터 제거(scheduleList[0] 의 starttime 보다 미래 starttime 데이터 제거)
                                        const deleteSchedule = await sendQuery(deleteQuery, [userId, scheduleList[0].startTime]);


                                        // 데이터 인서트
                                        let scheduleInsertQuery = "insert into schedule ( user_id, start_time, end_time, excersise_division, excersize_cnt ) values "
                                        let scheduleInsertItems = [];
                                        if(scheduleList.length > 0){
                                            scheduleList.forEach((schedule, idx) => {
                                                const { startTime, endTime, excersiseDivision, excersiseCnt } = schedule;
                                                scheduleInsertItems.push(`( '${userId}', '${startTime}',  '${endTime}', '${excersiseDivision}', ${excersiseCnt})`);
                                            })
                                            scheduleInsertQuery += scheduleInsertItems.join();
                                            await sendQuery(scheduleInsertQuery);
                                        }

                                    }
                                    resolve(true);
                                } catch (err) {
                                    reject(false);
                                }
                            }
                        });
                    });
                    

                    if(gptResult){ // 정상 동작 > 프론트로 정상 동작 여부 전달
                        return { 
                            message: 'success',
                            success: true
                        }
                    }else{ // 에러 발생 > 프론트로 에러 발생 전달
                        return { 
                            message: 'error',
                            success: false
                        }
                    }
                }else{ // 비인증 접근 > 프론트로 비인증 여부 전달
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/schedule/requestAiSchdule error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }

        }   
    },


    // AI 스케쥴러 작성 요청
    {
        url : '/updateSchedule', 
        type : 'patch',
        callback : async ({request, params}) => {
            try {
                if(request.isAuthenticated()){
                    if(!params.scheduleId || !params.status){
                        return {
                            message: 'noParam',
                            success: false
                        }
                    }

                    const userId = request.user.userId;
                    const result = await sendQuery("update schedule set status = $3 where user_id = $1 and schedule_id = $2", [userId, params.scheduleId, params.status])
                    
                    return { 
                        message: 'success',
                        success: true
                    }
                }else{ // 비인증 접근 > 프론트로 비인증 여부 전달
                    return {
                        message: 'noAuth',
                        success: false
                    }
                }
            } catch (error) {
                console.log(`/schedule/requestAiSchdule error : ${error.message}`);
                return {
                    message: 'error',
                    success: false
                }
            }

        }   
    },
];

const selectCalendaSchedule = async (wheres, whereParams) => {
    let selectScheduleQuery = `
            select
                schedule_id,
                c_ex.code_name as title,
                s.start_time as start,
                s.end_time as end,
                c_s.description as background_color,
                '#fff' as color,
                s.status
            from schedule s
            join (
                select *
                from code_detail
                where code_class = 'C001'
            ) c_ex
            on s.excersise_division = c_ex.code_id
            join (
                select * 
                from code_detail
                where code_class = 'C002'
            ) c_s
            on s.status = c_s.code_id
    `;

    let totalParam = [];
    if(wheres && wheres.length > 0){ // wheres가 존재하며, 길이가 1이상 일때 조건이 있다고 판단
        selectScheduleQuery += "where"
        let whereCnt = 1;
        wheres.forEach((where, idx) => {
            // 조건절( ex1] " and user_id = " ex2] "or start_time >= ") 분리를 위해 앞에 공백 처리 + 파라미터 전달을 위한 ${1} 작성
            if(where.indexOf(' in') == -1){ // in 조건절 제외
                selectScheduleQuery += ` ${where} $${(whereCnt)}`;
                totalParam.push(whereParams[idx]); // 파라미터 전달을 위해 담아줌
                whereCnt ++;
            }else{

                if(idx <= whereParams.length - 1){
                    if(!(whereParams[idx] == undefined || whereParams[idx] == "" || whereParams[idx].length == 0)){
                        selectScheduleQuery += ` ${where} (`;
                        let inParams = [];
                        if(typeof whereParams[idx] == "string"){
                            inParams = whereParams[idx].split(",");
                        }else{
                            inParams = whereParams[idx];
                        }
    
                        inParams.forEach((item, idx) => {
                            selectScheduleQuery += (`${idx == 0 ? '' : ','} $${whereCnt}`);
                            whereCnt ++;
                            totalParam.push(item); // 파라미터 전달을 위해 담아줌
                        })
    
    
                        selectScheduleQuery += ` )`;
                    }
                }
            }


        })
    }

    // order by 추가
    selectScheduleQuery += `
                    order by start`

    if(whereParams && whereParams.length > 0){
        return await sendQuery(selectScheduleQuery, totalParam);
    }else{
        return await sendQuery(selectScheduleQuery);
    }
}


//  3) 통신 객체 배열 Route 등록
schedulerControllers.forEach(route => {
    initRoute(router, route);
});

module.exports = router;