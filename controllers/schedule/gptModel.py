# # sys 모듈: 커맨드라인 인자 접근용
# # json 모듈: 출력 결과를 JSON 형태로 만들기 위해 사용
# # pip install openai python-dotenv psycopg2-binary
# import sys
# import os
# import json
# import openai
# import psycopg2 # pg 연결 모듈
# from dotenv import load_dotenv
# from datetime import datetime


# import logging

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s [%(levelname)s] %(message)s",
#     handlers=[
#         logging.FileHandler("D:/log/gptmodelLog.log", encoding="utf-8"),  # 로그 파일로 저장
#         logging.StreamHandler()  # 콘솔에도 출력
#     ]
# )

# load_dotenv() # env load

# DB_HOST = os.getenv("DB_HOST")
# DB_PORT = os.getenv("DB_PORT")
# DB_NAME = os.getenv("DB_NAME")
# DB_USER = os.getenv("DB_USER")
# DB_PASSWORD = os.getenv("DB_PASS")

# openai.api_key = os.getenv("OPEN_AI_API_KEY")

# # sys.argv는 실행 시 전달된 인자 목록
# # sys.argv[0]은 파일 이름(xx.py), 그 뒤부터는 넘긴 파라미터 값
# # sys.argv[1] : 구분( role : system 의 content 구성 시 활용 ) 
# # sys.argv[2] : gpt 모델 명 
# # sys.argv[3] : 프롬프트
# # sys.argv[4] : 추가 정보 (JSON)
# if len(sys.argv) < 3:
#     print(json.dumps({
#         "status" : "error",
#         "message" : "파라미터가 전달되지 않았습니다."
#     }))
#     sys.exit(1)
    
# div = sys.argv[1]
# model = sys.argv[2]
# prompt = sys.argv[3]
# data = sys.argv[4]

# def conn_db() :
#     try :
#         conn = psycopg2.connect(
#             host=DB_HOST,
#             port=DB_PORT,
#             dbname=DB_NAME,
#             user=DB_USER,
#             password=DB_PASSWORD
#         )
#         return conn
#     except Exception :
#         error_except("DB 연결에 실패하였습니다.")


# def request_gpt_model() -> dict:
#     try:
#         messages = []
#         if div == 'schedule':
#             now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
            
#             profile_data = json.loads(data)

#             age = profile_data.get("age")
#             height = profile_data.get("height")
#             weight = profile_data.get("weight")
#             gender = "남자" if profile_data.get("gender") == "M" else "여자"

#             conn = conn_db()
#             activity_list = []

#             if conn:
#                 cur = conn.cursor()
#                 cur.execute("""
#                     SELECT CODE_ID, CODE_NAME, DESCRIPTION 
#                     FROM CODE_DETAIL 
#                     WHERE CODE_CLASS = 'C001'
#                 """)
#                 rows = cur.fetchall()

#                 for row in rows:
#                     code_id = row[0]
#                     name = row[1]
#                     description = row[2].split('|')
#                     if len(description) != 2:
#                         continue
#                     kcal, unit_type = description
#                     unit = '시간' if unit_type == 'T' else '회'
#                     activity_list.append({"id": code_id, "name": name, "unit": unit, "kcal": float(kcal)})
#             else:
#                 error_except("DB 연결에 실패하였습니다.")

#             list_msg = ", ".join(
#                 f"{a['name']}(codeId : {a['id']})는 {a['unit']}당 {a['kcal']}소모"
#                 for a in activity_list
#             )

#             messages = [
#                 {
#                     "role": "system",
#                     "content": (
#                         f"당신은 운동 스케쥴 전문 분석가야. 나이는 {age}세 이며, 성별은 {gender}이고, 키는 {height}cm, 몸무게는 {weight}kg 인 사람을 보고 질문에 대한 운동 스케쥴을 운동 리스트를 참조하여 ({list_msg})을 JSON 형식으로 작성 해서 반환해. 스케쥴은 현 시간부터 작성해. 기간에 대한 이야기가 있으면 해당 기간을 꽉채워줘. 시간은 10분 단위로 정리해줘.\n"
#                         + "결과는 반드시 다음 형식의 배열 JSON String 형태로 제공해. 공백 및 개행 없어도 됨.: [{\"excersiseDivision\": \"운동리스트코드\", \"excersiseCnt\": 회수 또는 시간의 숫자만, \"startTime\": 시작시간(yyyy-MM-dd HH:mm), \"endTime\": 종료시간(yyyy-MM-dd HH:mm)] 스케쥴이 하나도 없으면 []와 같이 빈 배열 JSON String 형태로 제공해.다른 말은 하지마."
#                     )
#                 },
#                 {
#                     "role": "user",
#                     "content":  now_str+" 부터 "+prompt
#                 }
#             ]
#         elif div == 'diet':
#             messages = [
#                 {
#                     "role": "system",
#                     "content": (
#                         "당신은 음식 이미지 분석 전문가입니다. 주어진 이미지를 보고 음식 이름, 주요 토핑, 예상 칼로리를 JSON 형식으로 반환하세요. 데이터는 음식만 반환해주세요. 내용은 한국어로 작성해주세요.\n"
#                         "결과는 반드시 다음 형식의 배열 JSON String 형태로 제공하세요: [{\"name\": \"음식명\", \"topping\": [\"토핑1\", ...], \"totalCalo\": 숫자] 음식이 하나도 없으면 []와 같이 빈 배열 JSON String 형태로 제공해주세요."
#                     )
#                 }
#             ]
#         else:
#             error_except("구분이 명확하지 않습니다.")

#         response = openai.chat.completions.create(
#             model=model,
#             messages=messages,
#             max_tokens=8192 
#         )
        
#         return json.dumps({
#             "success": "true",
#             "content": response.choices[0].message.content
#         }, ensure_ascii=False)

#     except Exception as e:
#         error_except(e)

# def error_except(message):
#     print(json.dumps({
#         "success": "false",
#         "message": str(message)
#     }))
#     sys.exit(1)

# def run():
#     result = request_gpt_model()
#     print(result)

# if __name__ == "__main__":
#     run()

import sys
import os
import json
import openai
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta
import logging
import re
import difflib

# ---------------- 설정 ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("D:/log/gptmodelLog.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASS")
openai.api_key = os.getenv("OPEN_AI_API_KEY")


div = sys.argv[1]
model = sys.argv[2]
prompt = sys.argv[3]
data = sys.argv[4]

# ---------------- GPT 호출 함수 ----------------
def gpt_call(role_name, messages):
    logging.info(f"Calling GPT ({role_name})")
    try:
        response = openai.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=2048
        )
        content = response.choices[0].message.content.strip()
        logging.info(f"GPT 응답 ({role_name}): {content}")
        return content
    except Exception as e:
        error_except(f"GPT 호출 오류 ({role_name}): {e}")

# ---------------- JSON 추출 ----------------
def extract_json(text):
    match = re.search(r'{.*}|\[.*\]', text.strip(), re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError as e:
            error_except(f"JSON 파싱 실패: {e}\n원본: {text}")
    else:
        error_except(f"GPT 응답에서 JSON을 추출할 수 없습니다. 응답 내용: {text}")

# ---------------- DB 조회 ----------------
class DBAgent:
    def get_activity_list(self):
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            cur = conn.cursor()
            cur.execute("""
                SELECT CODE_ID, CODE_NAME, DESCRIPTION 
                FROM CODE_DETAIL 
                WHERE CODE_CLASS = 'C001'
            """)
            rows = cur.fetchall()
            activities = []
            for row in rows:
                code_id, name, desc = row
                try:
                    kcal, unit_type = desc.split('|')
                    unit = '시간' if unit_type == 'T' else '회'
                    activities.append({
                        "id": code_id,
                        "name": name,
                        "unit": unit,
                        "kcal": float(kcal)
                    })
                except:
                    continue
            logging.info(f"운동 코드 목록 조회: {json.dumps(activities, ensure_ascii=False)}")
            return activities
        except Exception as e:
            error_except("DB 연결 실패: " + str(e))

# ---------------- 실행 흐름 ----------------
def run():
    if len(sys.argv) < 5:
        return error_except("파라미터가 부족합니다.")

    if div != "schedule":
        return error_except("지원하지 않는 작업 구분입니다.")

    profile = json.loads(data)
    age = profile.get("age")
    height = profile.get("height")
    weight = profile.get("weight")
    gender = "남자" if profile.get("gender") == "M" else "여자"

    db_data = DBAgent().get_activity_list()
    activity_names = [a['name'] for a in db_data]
    activity_string = ', '.join(activity_names)

    now = datetime.now()
    fmt = "%Y-%m-%d %H:%M"

    analyzer_prompt = [
        {"role": "system", "content": (
            "사용자의 목표 프롬프트를 기반으로 from/to, goal, preferredTime, level, maxDuration 을 추출하세요.\n"
            f"기간이 없으면 from은 오늘({now.strftime(fmt)})이고, to는 한 달 뒤({(now + timedelta(days=30)).strftime(fmt)})입니다.\n"
            "결과는 JSON 형식으로 주세요: {\"from\": \"yyyy-MM-dd HH:mm\", \"to\": \"yyyy-MM-dd HH:mm\", \"goal\": \"감량 목적\", \"preferredTime\": \"오전|오후|저녁|퇴근 후|any\", \"level\": \"낮음|중간|높음\", \"maxDuration\": 숫자(분)}"
        )},
        {"role": "user", "content": prompt}
    ]
    analysis_result = extract_json(gpt_call("analyzer", analyzer_prompt))

    try:
        from_dt = datetime.strptime(analysis_result['from'], fmt)
        to_dt = datetime.strptime(analysis_result['to'], fmt)
        if (to_dt - from_dt).days < 7:
            raise ValueError("기간 너무 짧음")
    except:
        analysis_result['from'] = now.strftime(fmt)
        analysis_result['to'] = (now + timedelta(days=30)).strftime(fmt)

    analysis_result.setdefault('preferredTime', 'any')
    analysis_result.setdefault('level', '중간')
    analysis_result.setdefault('maxDuration', 60)

    preferred_time = analysis_result['preferredTime']
    time_range_msg = {
        "오전": "오전 6시~오전 11시",
        "오후": "오후 12시~오후 5시",
        "저녁": "오후 6시~밤 10시",
        "퇴근 후": "오후 6시~밤 10시"
    }.get(preferred_time, "아침 7시~저녁 10시")

    recommender_prompt = [
        {"role": "system", "content": (
            f"나이 {age}세, 성별 {gender}, 키 {height}cm, 몸무게 {weight}kg인 사용자에게\n"
            f"운동 강도 {analysis_result['level']}, 하루 최대 {analysis_result['maxDuration']}분 제한 내에서\n"
            f"운동 목적: {analysis_result['goal']}\n"
            f"다음 운동 리스트에서만 고르세요: {activity_string} (정확한 이름 사용).\n"
            "JSON 형식으로 추천: [{\"name\":\"운동명\", \"duration\": 분}]"
        )}
    ]
    recommend_result = extract_json(gpt_call("recommender", recommender_prompt))

    scheduler_prompt = [
        {"role": "system", "content": (
            f"지금부터 스케줄을 짜세요.\n"
            f"운동은 반드시 이 목록에서만 고르세요: {', '.join([r['name'] for r in recommend_result])} (정확한 이름 사용 필수).\n"
            f"스케줄 범위: {analysis_result['from']}부터 {analysis_result['to']}까지, 하루 최대 {analysis_result['maxDuration']}분, 시간대: {time_range_msg}.\n"
            "운동은 주기적으로 분산 배치하세요. 같은 날 너무 많은 운동이 몰리지 않도록 하고, 반복되더라도 주 단위로 분산되도록 하세요.\n"
            "초기에는 낮은 강도, 짧은 시간의 운동부터 시작하고 점차 강도를 증가시키도록 구성하세요.\n"
            "사용자의 프롬프트가 간단한 경우에도 무조건 건강하고 꾸준히 지속 가능한 루틴으로 배정하세요.\n"
            "결과는 JSON 형식: [{\"name\":\"운동명\", \"start\":\"yyyy-MM-dd HH:mm\", \"end\":\"yyyy-MM-dd HH:mm\"}]"
        )}
    ]
    schedule_result = extract_json(gpt_call("scheduler", scheduler_prompt))

    def find_code_id(name):
        for a in db_data:
            if name.strip() == a['name']:
                return a['id']
            ratio = difflib.SequenceMatcher(None, name.strip(), a['name']).ratio()
            if ratio > 0.85:
                return a['id']
        return "UNKNOWN"

    final_schedule = []
    for s in schedule_result:
        final_schedule.append({
            "excersiseDivision": find_code_id(s["name"]),
            "excersiseCnt": 1,
            "startTime": s["start"],
            "endTime": s["end"]
        })

    print(json.dumps({"success": "true", "content": final_schedule}, ensure_ascii=False))

# ---------------- 에러 처리 ----------------
def error_except(message):
    logging.error(f"[ERROR] {message}")
    print(json.dumps({
        "success": "false",
        "message": str(message)
    }))
    sys.exit(1)

if __name__ == "__main__":
    run()