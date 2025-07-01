# import sys
# import os
# import json
# import openai
# import psycopg2
# from dotenv import load_dotenv
# from datetime import datetime, timedelta
# import logging
# import re
# import difflib

# # ---------------- 설정 ----------------
# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s [%(levelname)s] %(message)s",
#     handlers=[
#         # logging.FileHandler("D:/log/gptmodelLog.log", encoding="utf-8"),
#         logging.FileHandler("D:/log/gptmodelLog.log", encoding="cp949"),
#         logging.StreamHandler()
#     ]
# )

# load_dotenv()

# DB_HOST = os.getenv("DB_HOST")
# DB_PORT = os.getenv("DB_PORT")
# DB_NAME = os.getenv("DB_NAME")
# DB_USER = os.getenv("DB_USER")
# DB_PASSWORD = os.getenv("DB_PASS")
# openai.api_key = os.getenv("OPEN_AI_API_KEY")


# div = sys.argv[1]
# model = sys.argv[2]
# prompt = sys.argv[3]
# data = sys.argv[4]

# # ---------------- GPT 호출 함수 ----------------
# def gpt_call(role_name, messages):
#     logging.info(f"Calling GPT ({role_name})")
#     try:
#         response = openai.chat.completions.create(
#             model=model,
#             messages=messages,
#             max_tokens=2048
#         )
#         content = response.choices[0].message.content.strip()
#         logging.info(f"GPT 응답 ({role_name}): {content}")
#         return content
#     except Exception as e:
#         error_except(f"GPT 호출 오류 ({role_name}): {e}")

# # ---------------- JSON 추출 ----------------
# def extract_json(text):
#     match = re.search(r'{.*}|\[.*\]', text.strip(), re.DOTALL)
#     if match:
#         try:
#             return json.loads(match.group())
#         except json.JSONDecodeError as e:
#             error_except(f"JSON 파싱 실패: {e}\n원본: {text}")
#     else:
#         error_except(f"GPT 응답에서 JSON을 추출할 수 없습니다. 응답 내용: {text}")

# # ---------------- DB 조회 ----------------
# class DBAgent:
#     def get_activity_list(self):
#         try:
#             conn = psycopg2.connect(
#                 host=DB_HOST,
#                 port=DB_PORT,
#                 dbname=DB_NAME,
#                 user=DB_USER,
#                 password=DB_PASSWORD
#             )
#             cur = conn.cursor()
#             cur.execute("""
#                 SELECT CODE_ID, CODE_NAME, DESCRIPTION 
#                 FROM CODE_DETAIL 
#                 WHERE CODE_CLASS = 'C001'
#             """)
#             rows = cur.fetchall()
#             activities = []
#             for row in rows:
#                 code_id, name, desc = row
#                 try:
#                     kcal, unit_type = desc.split('|')
#                     unit = '시간' if unit_type == 'T' else '회'
#                     activities.append({
#                         "id": code_id,
#                         "name": name,
#                         "unit": unit,
#                         "kcal": float(kcal)
#                     })
#                 except:
#                     continue
#             logging.info(f"운동 코드 목록 조회: {json.dumps(activities, ensure_ascii=False)}")
#             return activities
#         except Exception as e:
#             error_except("DB 연결 실패: " + str(e))

# # ---------------- 실행 흐름 ----------------
# def run():
#     if len(sys.argv) < 5:
#         return error_except("파라미터가 부족합니다.")

#     if div != "schedule":
#         return error_except("지원하지 않는 작업 구분입니다.")

#     profile = json.loads(data)
#     age = profile.get("age")
#     height = profile.get("height")
#     weight = profile.get("weight")
#     gender = "남자" if profile.get("gender") == "M" else "여자"

#     db_data = DBAgent().get_activity_list()
#     activity_names = [a['name'] for a in db_data]
#     activity_string = ', '.join(activity_names)

#     now = datetime.now()
#     fmt = "%Y-%m-%d %H:%M"

#     analyzer_prompt = [
#         {"role": "system", "content": (
#             "사용자의 목표 프롬프트를 기반으로 from/to, goal, preferredTime, level, maxDuration 을 추출하세요.\n"
#             f"기간이 없으면 from은 오늘({now.strftime(fmt)})이고, to는 한 달 뒤({(now + timedelta(days=30)).strftime(fmt)})입니다.\n"
#             "결과는 JSON 형식으로 주세요: {\"from\": \"yyyy-MM-dd HH:mm\", \"to\": \"yyyy-MM-dd HH:mm\", \"goal\": \"감량 목적\", \"preferredTime\": \"오전|오후|저녁|퇴근 후|any\", \"level\": \"낮음|중간|높음\", \"maxDuration\": 숫자(분)}"
#         )},
#         {"role": "user", "content": prompt}
#     ]
#     analysis_result = extract_json(gpt_call("analyzer", analyzer_prompt))

#     try:
#         from_dt = datetime.strptime(analysis_result['from'], fmt)
#         to_dt = datetime.strptime(analysis_result['to'], fmt)
#         if (to_dt - from_dt).days < 7:
#             raise ValueError("기간 너무 짧음")
#     except:
#         analysis_result['from'] = now.strftime(fmt)
#         analysis_result['to'] = (now + timedelta(days=30)).strftime(fmt)

#     analysis_result.setdefault('preferredTime', 'any')
#     analysis_result.setdefault('level', '중간')
#     analysis_result.setdefault('maxDuration', 180)
#     analysis_result.setdefault('maxCount', 300)

#     preferred_time = analysis_result['preferredTime']
#     time_range_msg = {
#         "오전": "오전 6시~오전 11시",
#         "오후": "오후 12시~오후 5시",
#         "저녁": "오후 6시~밤 10시",
#         "퇴근 후": "오후 6시~밤 10시"
#     }.get(preferred_time, "아침 7시~저녁 10시")

#     recommender_prompt = [
#         {"role": "system", "content": (
#             f"나이 {age}세, 성별 {gender}, 키 {height}cm, 몸무게 {weight}kg인 사용자에게\n"
#             f"운동 강도 {analysis_result['level']}, 하루 최대 {analysis_result['maxDuration']}분 제한 내, 또는 {analysis_result['maxCount']}회 에서\n"
#             f"운동 목적: {analysis_result['goal']}\n"
#             f"다음 운동 리스트에서만 고르세요: {activity_string} (정확한 이름 사용).\n"
#             "JSON 형식으로 추천: [{\"name\":\"운동명\", \"duration\": 분(또는 횟수)}]"
#         )}
#     ]
#     recommend_result = extract_json(gpt_call("recommender", recommender_prompt))

#     scheduler_prompt = [
#         {"role": "system", "content": (
#             f"지금부터 스케줄을 짜세요.\n"
#             f"운동은 반드시 이 목록에서만 고르세요: {', '.join([r['name'] for r in recommend_result])} (정확한 이름 사용 필수).\n"
#             f"스케줄 범위: {analysis_result['from']}부터 {analysis_result['to']}까지, 하루 최대 {analysis_result['maxDuration']}분 또는 {analysis_result['maxCount']}회, 시간대: {time_range_msg}.\n"
#             "운동은 주기적으로 분산 배치하세요. 같은 날 너무 많은 운동이 몰리지 않도록 하고, 반복되더라도 주 단위로 분산되도록 하세요. 운동 종류에 따라 횟수, 시간으로 구분해 주세요.(예: 조깅 2시간, 푸시업 50회)\n"
#             "초기에는 낮은 강도, 짧은 시간의 운동부터 시작하고 점차 강도를 증가시키도록 구성하세요.\n"
#             "사용자의 프롬프트가 간단한 경우에도 무조건 건강하고 꾸준히 지속 가능한 루틴으로 배정하세요.\n"
#             "결과는 JSON 형식: [{\"name\":\"운동명\", \"start\":\"yyyy-MM-dd HH:mm\", \"end\":\"yyyy-MM-dd HH:mm\"}]"
#         )}
#     ]
#     schedule_result = extract_json(gpt_call("scheduler", scheduler_prompt))

#     def find_code_id(name):
#         for a in db_data:
#             if name.strip() == a['name']:
#                 return a['id']
#             ratio = difflib.SequenceMatcher(None, name.strip(), a['name']).ratio()
#             if ratio > 0.85:
#                 return a['id']
#         return "UNKNOWN"

#     final_schedule = []
#     for s in schedule_result:
#         final_schedule.append({
#             "excersiseDivision": find_code_id(s["name"]),
#             "excersiseCnt": 1,
#             "startTime": s["start"],
#             "endTime": s["end"]
#         })

#     print(json.dumps({"success": "true", "content": final_schedule}, ensure_ascii=False))

# # ---------------- 에러 처리 ----------------
# def error_except(message):
#     logging.error(f"[ERROR] {message}")
#     print(json.dumps({
#         "success": "false",
#         "message": str(message)
#     }))
#     sys.exit(1)

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
    try:
        match = re.search(r'```json\s*(\{.*\}|\[.*\])\s*```', text, re.DOTALL)
        if not match:
            match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        else:
            raise ValueError("JSON not found in GPT response.")
    except Exception as e:
        error_except(f"GPT 응답이 JSON 형식이 아닙니다. 원문: {text}")

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
                    kcal_raw, unit_raw = desc.split('|')
                    unit_type = 'T' if '시' in unit_raw else 'C'
                    unit = '시간' if unit_type == 'T' else '회'
                    activities.append({
                        "id": code_id,
                        "name": name,
                        "unit": unit,
                        "kcal": float(kcal_raw),
                        "unit_type": unit_type
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
    activity_desc = ', '.join([
        f"{a['name']}({a['unit']}당 {a['kcal']}kcal)"
        for a in db_data
    ])

    now = datetime.now()
    fmt = "%Y-%m-%d %H:%M"
    analysis_result = {
        'from': now.strftime(fmt),
        'to': (now + timedelta(days=30)).strftime(fmt),
        'goal': prompt,
        'preferredTime': 'any',
        'level': '중간',
        'maxDuration': 120,
        'maxCount': 200
    }

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
            f"다음 운동 리스트에서만 고르세요: {activity_desc} (정확한 이름 사용).\n"
            "운동 강도는 점진적으로 증가하며, 하루 2~3가지 운동으로 구성된 루틴을 구성하세요.\n"
            "같은 운동은 가능하면 동일한 시간대에 반복되도록 구성하세요.\n"
            "결과는 JSON 형식으로 추천: [{\"name\":\"운동명\"}]"
        )}
    ]
    recommend_result = extract_json(gpt_call("recommender", recommender_prompt))

    names_from_recommend = []
    for r in recommend_result:
        if isinstance(r, dict) and 'name' in r:
            names_from_recommend.append(r['name'])
        elif isinstance(r, str):
            names_from_recommend.append(r)

    scheduler_prompt = [
        {"role": "system", "content": (
            f"운동은 반드시 이 목록에서만 고르세요: {', '.join(names_from_recommend)} (정확한 이름 사용 필수).\n"
            f"스케줄 범위: {analysis_result['from']}부터 {analysis_result['to']}까지, 하루 최대 {analysis_result['maxDuration']}분, 시간대: {time_range_msg}.\n"
            "하루 2~3개의 운동 루틴을 구성하고, 같은 종류는 동일 시간대 반복, 점진적 강도 증가, 무리한 시간(예: 걷기 60시간)은 금지.\n"
            "운동 시간은 GPT가 추론하지 말고 서버에서 계산합니다. 운동은 이름만 포함하고 하루별 리스트로 구성하세요.\n"
            "결과는 JSON 형식: [{\"day\": 1, \"exercises\": [{\"name\":\"운동명\"}]}]"
        )}
    ]
    schedule_result = extract_json(gpt_call("scheduler", scheduler_prompt))

    def find_code_id_and_unit(name):
        for a in db_data:
            if name.strip() == a['name']:
                return a['id'], a['unit'], a['unit_type'], a['kcal']
            ratio = difflib.SequenceMatcher(None, name.strip(), a['name']).ratio()
            if ratio > 0.85:
                return a['id'], a['unit'], a['unit_type'], a['kcal']
        return "UNKNOWN", "단위없음", "N", 0.0

    final_schedule = []
    for s in schedule_result:
        day = s.get("day")
        exercises = s.get("exercises", [])
        base_date = now + timedelta(days=day-1)
        base_hour = 7  # 7시 시작
        for idx, ex in enumerate(exercises):
            name = ex.get("name")
            code, unit_label, unit_type, kcal = find_code_id_and_unit(name)
            if code == "UNKNOWN":
                continue

            start_dt = datetime(base_date.year, base_date.month, base_date.day, base_hour + idx * 2, 0)
            if unit_type == "T":
                duration_min = 60
                exc_cnt = 1
            else:
                duration_min = 15
                exc_cnt = 30
            end_dt = start_dt + timedelta(minutes=duration_min)

            final_schedule.append({
                "excersiseDivision": code,
                "excersiseCnt": exc_cnt,
                "startTime": start_dt.strftime(fmt),
                "endTime": end_dt.strftime(fmt)
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
