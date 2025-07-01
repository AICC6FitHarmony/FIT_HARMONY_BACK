// * Controllers 기본 구조
//  1) router 및 initRoute repuire
const router = require('express').Router(); // express의 Router 객체 생성(모듈 로드)
const { initRoute } = require('../../routes/common_routes'); // 라우트 작성
const { sendQuery } = require('../../config/database');

const path = require('path'); // path 관련 기능 모듈
const fs = require('fs'); // File system 모듈
const upload = require("../../config/upload"); // multer 관련 설정

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
    },

    {
        url : '/file/upload', 
        // 업로드 파일이 있는 경우 이와 같은 형태로 선언
        // 파일이 1개 일 때 : upload: upload.single(''), 
        // params의 file에서 받을 수 있도록 처리 key 로 받을 수 있게 할지는 좀 생각해보고...
        // 파일이 다수 일 때 : upload: upload.array([]]),  이거 일듯 ? 
        // upload: upload.array([]),
        upload: upload.single('file'), 
        type : 'post',
        callback : async ({request, params}) => {
           try {
                const { fileId, file } = params;


                if(!file){
                    return {
                        message: 'noFile',
                        success: false
                    }
                }

                console.log(file);

                const timestamp = Date.now(); // 밀리세컨드 타임스탬프 조회 : ex) 1720084512345
                const ext = path.extname(params.file.originalname); // 확장자 조회
                const fileName = `${timestamp}${ext}`;
                fs.writeFileSync(
                    path.resolve(process.cwd(), 'public', fileName),
                    file.buffer // 이미지 버퍼 저장
                );

                // 파일 ID가 있는 경우
                if(!(fileId == undefined || fileId == "")){

                }


                // const result = await sendQuery("select * from code_detail where code_class = $1", [params.codeClass]);


                return { 
                    message: 'success',
                    success: true,
                    data : result // 코드 리스트 조회 데이터
                }
           } catch (error) {
                console.log(`/common/file/upload error : ${error.message}`);
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