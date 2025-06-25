// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
const { spawn } = require('child_process'); // nodejs > python script 동작? 연결?
const path = require('path');
const dotenv = require('dotenv'); // require 메서드로 dotenv 모듈을 불러와서 환경 변수를 로드한다.

//  2) 통신 객체 배열 선언
const schedulerControllers = [
    // AI 스케쥴러 작성 요청
    {
        url : '/requestAiSchdule', 
        type : 'post',
        callback : async ({request, params}) => {
            try {

                // env 에서 파이썬 모듈 경로
                const pythonEnvPath = path.join(process.env.PYTHON_ENV_PATH, 'python');
                // gpt 모델 파일 경로
                const pyScriptPath = path.join(__dirname, 'gptModel.py');

                const aiRequestDiv = "schedule";

                // gpt 3.5 터보 모델명 가져옴
                const model = process.env.GPT_4_o;


                const tempData = {
                    age : 37,
                    height : 175, 
                    weight: 90, 
                    gender : "M"
                }


                let gptResult = await new Promise((resolve, reject) => {
                    // child process 실행 (파라미터 : 모델 파일 경로, 질의 구분 코드, GPT 모델명, 질의(프롬프트), 추가 data: string 형태로 변환해서 전달)
                    // 사용할 모델 정보, 프롬프트를 전달
                    const child = spawn(pythonEnvPath, [pyScriptPath, aiRequestDiv, model, params.prompt, JSON.stringify(tempData)]); 

                    // 결과 수신
                    let result = '';
                    child.stdout.on('data', (data) => {
                        result += data.toString();
                    });

                    // 에러 출력
                    child.stderr.on('data', (data) => {
                        console.error('/schedule/requestAiSchdule', data.toString());
                    });


                    child.on('close', (code) => {
                        if (code !== 0) {
                            reject(`종료 코드 ${code}`);
                        }else{
                            try {
                                console.log(result)  
                                resolve(result);
                                // const json = JSON.parse(result);
                                // console.log('JSON 결과:', json);
                            } catch (err) {
                                // console.error('JSON 파싱 오류:', err);
                                // console.log('원본문자열:', result);
                                reject(`종료 코드 ${err}`);
                            }
                        }
                    });
                });
                
                console.log(gptResult);
                gptResult = JSON.parse(gptResult);
                gptResult.content = JSON.parse(gptResult.content);
                
                return { 
                    message: 'Success...',
                    success: true,
                    prompt: params.prompt,
                    data:gptResult
                }
            } catch (error) {
                console.log(`/schedule/requestAiSchdule error : ${error.message}`);
                return {
                    message: 'Request AI Schdule Error...'
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