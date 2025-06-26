# sys 모듈: 커맨드라인 인자 접근용
# json 모듈: 출력 결과를 JSON 형태로 만들기 위해 사용
# pip install openai python-dotenv psycopg2-binary
import sys
import os
import json
import openai
import psycopg2 # pg 연결 모듈
from dotenv import load_dotenv
from datetime import datetime


import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("D:/log/gptmodelLog.log", encoding="utf-8"),  # 로그 파일로 저장
        logging.StreamHandler()  # 콘솔에도 출력
    ]
)

load_dotenv() # env load

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASS")

openai.api_key = os.getenv("OPEN_AI_API_KEY")

# sys.argv는 실행 시 전달된 인자 목록
# sys.argv[0]은 파일 이름(xx.py), 그 뒤부터는 넘긴 파라미터 값
# sys.argv[1] : 구분( role : system 의 content 구성 시 활용 ) 
# sys.argv[2] : gpt 모델 명 
# sys.argv[3] : 프롬프트
# sys.argv[4] : 추가 정보 (JSON)
if len(sys.argv) < 3:
    print(json.dumps({
        "status" : "error",
        "message" : "파라미터가 전달되지 않았습니다."
    }))
    sys.exit(1)
    
div = sys.argv[1]
model = sys.argv[2]
prompt = sys.argv[3]
data = sys.argv[4]

def conn_db() :
    try :
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception :
        error_except("DB 연결에 실패하였습니다.")


def request_gpt_model() -> dict:
    try:
        messages = []
        if div == 'schedule':
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            
            profile_data = json.loads(data)

            age = profile_data.get("age")
            height = profile_data.get("height")
            weight = profile_data.get("weight")
            gender = "남자" if profile_data.get("gender") == "M" else "여자"

            conn = conn_db()
            activity_list = []

            if conn:
                cur = conn.cursor()
                cur.execute("""
                    SELECT CODE_ID, CODE_NAME, DESCRIPTION 
                    FROM CODE_DETAIL 
                    WHERE CODE_CLASS = 'C001'
                """)
                rows = cur.fetchall()

                for row in rows:
                    code_id = row[0]
                    name = row[1]
                    description = row[2].split('|')
                    if len(description) != 2:
                        continue
                    kcal, unit_type = description
                    unit = '시간' if unit_type == 'T' else '회'
                    activity_list.append({"id": code_id, "name": name, "unit": unit, "kcal": float(kcal)})
            else:
                error_except("DB 연결에 실패하였습니다.")

            list_msg = ", ".join(
                f"{a['name']}(codeId : {a['id']})는 {a['unit']}당 {a['kcal']}소모"
                for a in activity_list
            )

            messages = [
                {
                    "role": "system",
                    "content": (
                        f"당신은 운동 스케쥴 전문 분석가야. 나이는 {age}세 이며, 성별은 {gender}이고, 키는 {height}cm, 몸무게는 {weight}kg 인 사람을 보고 질문에 대한 운동 스케쥴을 운동 리스트를 참조하여 ({list_msg})을 JSON 형식으로 작성 해서 반환해. 스케쥴은 현 시간부터 작성해. 기간에 대한 이야기가 있으면 해당 기간을 꽉채워\n"
                        + "결과는 반드시 다음 형식의 배열 JSON String 형태로 제공해. 공백 및 개행 없어도 됨.: [{\"excersiseDivision\": \"운동리스트코드\", \"excersiseCnt\": 회수 또는 시간의 숫자만, \"startTime\": 시작시간(yyyy-MM-dd HH:mm), \"endTime\": 종료시간(yyyy-MM-dd HH:mm)] 스케쥴이 하나도 없으면 []와 같이 빈 배열 JSON String 형태로 제공해.다른 말은 하지마."
                    )
                },
                {
                    "role": "user",
                    "content":  now_str+" 부터 "+prompt
                }
            ]
        elif div == 'diet':
            messages = [
                {
                    "role": "system",
                    "content": (
                        "당신은 음식 이미지 분석 전문가입니다. 주어진 이미지를 보고 음식 이름, 주요 토핑, 예상 칼로리를 JSON 형식으로 반환하세요. 데이터는 음식만 반환해주세요. 내용은 한국어로 작성해주세요.\n"
                        "결과는 반드시 다음 형식의 배열 JSON String 형태로 제공하세요: [{\"name\": \"음식명\", \"topping\": [\"토핑1\", ...], \"totalCalo\": 숫자] 음식이 하나도 없으면 []와 같이 빈 배열 JSON String 형태로 제공해주세요."
                    )
                }
            ]
        else:
            error_except("구분이 명확하지 않습니다.")

        # logging.info("============================ role & prompt ============================")
        # logging.info(messages)

        response = openai.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=8192 
        )
        
        return json.dumps({
            "success": "true",
            "content": response.choices[0].message.content
        }, ensure_ascii=False)

    except Exception as e:
        error_except(e)

def error_except(message):
    print(json.dumps({
        "success": "false",
        "message": str(message)
    }))
    sys.exit(1)

def run():
    result = request_gpt_model()
    # logging.info("=====================result=======================")
    # logging.info(result)
    print(result)

if __name__ == "__main__":
    run()

