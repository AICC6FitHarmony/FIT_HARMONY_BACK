import sys
import os
import json
from datetime import datetime, timedelta
from paddleocr import PaddleOCR
import psycopg2
from dotenv import load_dotenv
import logging
import re
from PIL import Image
import base64
import io
import cv2
import numpy as np
import openai


sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ---------------- 설정 ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
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
        return psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME, 
            user=DB_USER, password=DB_PASSWORD
        )
        
    def get_file_info(self):
        conn = None
        cur = None
        try:
            conn = self.conn()
            cur = conn.cursor()
            cur.execute("""
                SELECT FILE_PATH
                FROM FILE 
                WHERE FILE_ID = %s
            """, (file_id,))
            row = cur.fetchone()
            return row[0] if row else None
        except Exception as e:
            error_except("DB 연결 실패: " + str(e))
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

# ---------------- 이미지 전처리 ----------------
def deskew_image(file_path):
    # 이미지 열기
    img = cv2.imread(file_path, cv2.IMREAD_COLOR)
    if img is None:
        error_except(f"이미지를 읽을 수 없습니다: {file_path}")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # 이진화
    _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # 좌표 추출
    coords = np.column_stack(np.where(bw > 0))
    
    if len(coords) == 0:
        # 텍스트가 없는 경우 원본 이미지 반환
        return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    
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
def analyze_inbody_image(image_input) -> dict:
    try:
        # PaddleOCR 초기화 (한국어 지원)
        ocr = PaddleOCR(use_textline_orientation=True, lang='korean')
        
        # 이미지에서 텍스트 추출
        # PIL Image인 경우 numpy 배열로 변환
        if hasattr(image_input, 'mode'):  # PIL Image 객체인 경우
            import numpy as np
            image_array = np.array(image_input)
            results = ocr.predict(image_array)
        else:  # 파일 경로인 경우
            results = ocr.predict(image_input)
        
        # PaddleOCR 결과 처리
        text_bbox = []
        input_data = {}
        
        if results and len(results) > 0:
            # results[0]는 딕셔너리 형태
            result_dict = results[0]
            
            # rec_texts에서 텍스트 추출
            if 'rec_texts' in result_dict:
                rec_texts = result_dict['rec_texts']
                rec_boxes = result_dict.get('rec_boxes', [])
                print(f"OCR 결과: {len(rec_texts)}개의 텍스트 블록 발견", file=sys.stderr)
                for i, text in enumerate(rec_texts):
                    bbox = rec_boxes[i] if i < len(rec_boxes) else []
                    
                    if len(bbox) >= 4:
                        x_min, y_min, x_max, y_max = bbox[0], bbox[1], bbox[2], bbox[3]
                        input_data = {"text": text, "x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max}
                        text_bbox.append(input_data)
                    
        print(f"text_bbox: {text_bbox}", file=sys.stderr)
        
        return text_bbox
        
    except Exception as e:
        error_except(f"OCR 분석 오류: {e}")

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
        
        # 파일 존재 확인
        if not os.path.exists(image_path):
            error_except(f"이미지 파일이 존재하지 않습니다: {image_path}")
        
        # 이미지 보정
        deskewed_image = deskew_image(image_path)
        
        # OCR 분석 실행 (PIL Image 객체 직접 전달)
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