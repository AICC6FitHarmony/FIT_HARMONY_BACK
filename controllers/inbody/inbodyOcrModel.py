import sys
import os
import json
from paddleocr import PaddleOCR
import psycopg2
from dotenv import load_dotenv
from datetime import datetime
import logging
import re
from PIL import Image
import base64
import io
import cv2
import numpy as np

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ---------------- 설정 ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ],
    encoding='utf-8'
)

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASS")

div = sys.argv[1]
file_id = sys.argv[2]

# ---------------- DB 조회 ----------------
class DBAgent:
    def conn(self):
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    
    def get_file_info(self):
        try:
            conn = self.conn()
            cur = conn.cursor()
            cur.execute(f"""
                SELECT FILE_PATH
                FROM FILE 
                WHERE FILE_ID = {file_id}
            """)
            row = cur.fetchone()
            return row[0]
        except Exception as e:
            error_except("DB 연결 실패: " + str(e))

# ---------------- 이미지 전처리 ----------------
def resize_and_encode_image(file_path: str, max_size=(1024, 1024)) -> str:
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    normalized_path = file_path.lstrip('/')
    image_path = os.path.join(base_dir, normalized_path)
    
    img = Image.open(image_path)
    img.thumbnail(max_size)  # 크기 비율 유지하면서 축소
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    img_bytes = buffered.getvalue()
    return base64.b64encode(img_bytes).decode("utf-8")

def deskew_image(file_path):
    # 이미지 열기
    img = cv2.imread(file_path, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # 이진화
    _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # 좌표 추출
    coords = np.column_stack(np.where(bw > 0))
    angle = cv2.minAreaRect(coords)[-1]
    # 각도 보정
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    # 회전 행렬 생성 및 적용
    (h, w) = img.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    # PIL 이미지로 변환
    return Image.fromarray(cv2.cvtColor(rotated, cv2.COLOR_BGR2RGB))

# ---------------- OCR 분석 ----------------
def analyze_inbody_image(image_path: str) -> dict:
    try:
        # PaddleOCR 초기화 (한국어 지원)
        ocr = PaddleOCR(use_textline_orientation=True, lang='korean')
        
        # 이미지에서 텍스트 추출
        results = ocr.predict(image_path)
        
        # PaddleOCR 결과 처리
        extracted_texts = []
        text_bbox = []
        print(f"전체 results 구조: {type(results)}", file=sys.stderr)
        
        if results and len(results) > 0:
            # results[0]는 딕셔너리 형태
            result_dict = results[0]
            
            # rec_texts에서 텍스트 추출
            if 'rec_texts' in result_dict:
                rec_texts = result_dict['rec_texts']
                rec_scores = result_dict.get('rec_scores', [])
                rec_boxes = result_dict.get('rec_boxes', [])
                
                print(f"OCR 결과: {len(rec_texts)}개의 텍스트 블록 발견", file=sys.stderr)
                
                for i, text in enumerate(rec_texts):
                    confidence = rec_scores[i] if i < len(rec_scores) else 0.0
                    bbox = rec_boxes[i] if i < len(rec_boxes) else []
                    
                    if len(bbox) >= 4:
                        x1, y1, x2, y2 = bbox[0], bbox[1], bbox[2], bbox[3]
                        text_bbox.append((text, [[x1,y1], [x2,y2]]))
                        print(f"text_bbox: {text_bbox}", file=sys.stderr)
                    
                    extracted_texts.append(text)
        
        # 추출된 텍스트들을 하나의 문자열로 결합
        extracted_text = ' '.join(extracted_texts)
        
        # 인바디 데이터 추출
        inbody_data = extract_inbody_data(extracted_text)
        
        return inbody_data
        
    except Exception as e:
        error_except(f"OCR 분석 오류: {e}")

# ---------------- 인바디 데이터 추출 ----------------
def extract_inbody_data(text: str) -> dict:
    # 정규표현식 패턴들
    patterns = {
        'weight': r'체중[:\s]*(\d+\.?\d*)',
        'bodyWater': r'체수분[:\s]*(\d+\.?\d*)',
        'inbodyScore': r'인바디점수[:\s]*(\d+)',
        'protein': r'단백질[:\s]*(\d+\.?\d*)',
        'bodyMineral': r'무기질[:\s]*(\d+\.?\d*)',
        'bodyFat': r'체지방[:\s]*(\d+\.?\d*)',
        'bodyFatPercent': r'체지방률[:\s]*(\d+\.?\d*)',
        'bmi': r'BMI[:\s]*(\d+\.?\d*)',
        'skeletalMuscle': r'골격근량[:\s]*(\d+\.?\d*)',
        'trunkMuscle': r'몸통근육량[:\s]*(\d+\.?\d*)',
        'leftArmMuscle': r'왼팔근육량[:\s]*(\d+\.?\d*)',
        'rightArmMuscle': r'오른팔근육량[:\s]*(\d+\.?\d*)',
        'leftLegMuscle': r'왼다리근육량[:\s]*(\d+\.?\d*)',
        'rightLegMuscle': r'오른다리근육량[:\s]*(\d+\.?\d*)',
        'trunkFat': r'몸통체지방[:\s]*(\d+\.?\d*)',
        'leftArmFat': r'왼팔체지방[:\s]*(\d+\.?\d*)',
        'rightArmFat': r'오른팔체지방[:\s]*(\d+\.?\d*)',
        'leftLegFat': r'왼다리체지방[:\s]*(\d+\.?\d*)',
        'rightLegFat': r'오른다리체지방[:\s]*(\d+\.?\d*)'
    }
    
    extracted_data = {}
    
    for field, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                value = float(match.group(1))
                extracted_data[field] = value
                print(f"{field}: {value}", file=sys.stderr)
            except ValueError:
                print(f"{field} 값 변환 실패: {match.group(1)}", file=sys.stderr)
    
    # 필수 필드 검증
    required_fields = ['weight', 'bodyWater', 'inbodyScore']
    missing_fields = [field for field in required_fields if field not in extracted_data]
    
    if missing_fields:
        print(f"필수 필드 누락: {missing_fields}", file=sys.stderr)
    
    return extracted_data

# ---------------- 실행 흐름 ----------------
def run():
    if len(sys.argv) < 3:
        return error_except("파라미터가 부족합니다.")

    if div == "inbody_ocr":
        process_inbody_ocr()
    else:
        return error_except("지원하지 않는 작업 구분입니다.")

def process_inbody_ocr():
    try:
        # 파일 경로 조회
        file_path = DBAgent().get_file_info()
        if not file_path:
            error_except("파일을 찾을 수 없습니다.")
        
        # 이미지 분석
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
        normalized_path = file_path.lstrip('/')
        image_path = os.path.join(base_dir, normalized_path)
        
        # 이미지 보정
        deskewed_image = deskew_image(image_path)
        
        # OCR 분석 실행
        inbody_data = analyze_inbody_image(deskewed_image)
        
        print("=============== inbody_ocr 결과 ==============", file=sys.stderr)
        print(inbody_data, file=sys.stderr)
        
        print(json.dumps({"success": "true", "content": inbody_data}, ensure_ascii=False), flush=True)
        
    except Exception as e:
        error_except(f"인바디 OCR 처리 오류: {e}")

# ---------------- 에러 처리 ----------------
def error_except(message):
    print(f"[ERROR] {message}", file=sys.stderr)
    print(json.dumps({
        "success": "false",
        "message": str(message)
    }))
    sys.exit(1)

if __name__ == "__main__":
    run() 