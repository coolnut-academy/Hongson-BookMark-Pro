import os
import io
import traceback
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/upload', methods=['POST'])
def handle_upload():
    logs = []
    def log(msg):
        logs.append(msg)
        print(msg)
        
    try:
        log("[1/6] Checking file existence")
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "No file uploaded", "logs": logs}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "message": "No selected file", "logs": logs}), 400

        file_bytes = file.read()
        file_size = len(file_bytes)
        log(f"File path/name: {file.filename}")
        log(f"File size: {file_size} bytes")
        
        if not file.filename.endswith('.xls'):
            log("Error: File is not .xls")
            return jsonify({"status": "error", "message": "Only .xls format is supported", "logs": logs}), 400

        log("[2/6] Inspecting workbook using xlrd")
        import xlrd
        
        workbook = xlrd.open_workbook(file_contents=file_bytes)
        sheet_names = workbook.sheet_names()
        log(f"Found {len(sheet_names)} sheets: {', '.join(sheet_names)}")
        
        log("[3/6] Safe preview of first sheet")
        # Try reading to find structure
        df = pd.read_excel(io.BytesIO(file_bytes), engine='xlrd', sheet_name=0)
        log(f"Shape: {df.shape}")
        
        log("[4/6] Structural analysis")
        # We can detect correct header by finding where typical columns are
        # For simplicity, returning structural overview
        columns = list(df.columns.astype(str))
        log(f"Columns found: {columns}")
        
        log("[5/6] Parsing strategy proposal")
        log("Proceeding with header=0, converting column names to lowercase")
        df.columns = [str(col).strip().lower() for col in df.columns]

        log("[6/6] Final data extraction")
        parsed_subjects = []

        def get_learning_area(code):
            c = str(code).strip()
            if not c: return "อื่นๆ"
            first_char = c[0]
            mapped = {
                "ท": "ภาษาไทย",
                "ค": "คณิตศาสตร์",
                "ว": "วิทยาศาสตร์และเทคโนโลยี",
                "ส": "สังคมศึกษาศาสนาและวัฒนธรรม",
                "พ": "สุขศึกษาและพลศึกษา",
                "ศ": "ศิลปะ",
                "ง": "การงานอาชีพ",
                "อ": "ภาษาต่างประเทศ",
                "จ": "ภาษาต่างประเทศ",
                "ญ": "ภาษาต่างประเทศ",
                "ก": "กิจกรรมพัฒนาผู้เรียน",
                "I": "การศึกษาค้นคว้าด้วยตนเอง (IS)"
            }
            return mapped.get(first_char, "อื่นๆ")
            
        def get_subject_type(code):
            c = str(code).strip()
            if len(c) >= 4 and any(char.isdigit() for char in c):
                digits_only = "".join([ch for ch in c if ch.isdigit()])
                if len(digits_only) >= 3:
                    if digits_only[2] == '1': return "พื้นฐาน"
                    if digits_only[2] == '2': return "เพิ่มเติม"
            return "ไม่ระบุ"

        def fix_thai_encoding(text):
            if not isinstance(text, str):
                return text
            try:
                return text.encode('latin1').decode('windows-874')
            except (UnicodeEncodeError, UnicodeDecodeError):
                return text

        for _, row in df.iterrows():
            raw_code = str(row.get('code', '')).strip()
            if not raw_code or str(raw_code).lower() == 'nan':
                 continue
            
            code = fix_thai_encoding(raw_code)
            titles = fix_thai_encoding(str(row.get('titles', '')).strip())
                 
            subject = {
                "code": code,
                "subject_name": titles,
                "credits": float(row.get('credits', 0)) if pd.notnull(row.get('credits')) else 0.0,
                "type": get_subject_type(code),
                "learning_area": get_learning_area(code),
                "total_students": int(row.get('tgrade_t', 0)) if pd.notnull(row.get('tgrade_t')) else 0,
                "gpa": float(row.get('gaverage', 0)) if pd.notnull(row.get('gaverage')) else 0.0,
                "grades_count": {
                    "0": int(row.get('tgrade_0', 0)) if pd.notnull(row.get('tgrade_0')) else 0,
                    "1": int(row.get('tgrade_1', 0)) if pd.notnull(row.get('tgrade_1')) else 0,
                    "1.5": int(row.get('tgrade_15', 0)) if pd.notnull(row.get('tgrade_15')) else 0,
                    "2": int(row.get('tgrade_2', 0)) if pd.notnull(row.get('tgrade_2')) else 0,
                    "2.5": int(row.get('tgrade_25', 0)) if pd.notnull(row.get('tgrade_25')) else 0,
                    "3": int(row.get('tgrade_3', 0)) if pd.notnull(row.get('tgrade_3')) else 0,
                    "3.5": int(row.get('tgrade_35', 0)) if pd.notnull(row.get('tgrade_35')) else 0,
                    "4": int(row.get('tgrade_4', 0)) if pd.notnull(row.get('tgrade_4')) else 0,
                    "r": int(row.get('tgrade_r', 0)) if pd.notnull(row.get('tgrade_r')) else 0,
                    "x": int(row.get('tgrade_x', 0)) if pd.notnull(row.get('tgrade_x')) else 0,
                }
            }
            parsed_subjects.append(subject)
        
        summary = {
            "filename": file.filename,
            "size_bytes": file_size,
            "sheets_count": len(sheet_names),
            "sheets": sheet_names,
            "shape": list(df.shape),
            "total_subjects_parsed": len(parsed_subjects)
        }

        return jsonify({
            "status": "success",
            "summary": summary,
            "extracted_data": parsed_subjects,
            "logs": logs
        }), 200

    except Exception as e:
        error_info = traceback.format_exc()
        log(f"Exception occurred: {str(e)}")
        log(error_info)
        return jsonify({"status": "error", "message": str(e), "logs": logs}), 500

# Vercel needs this module exposed.
if __name__ == '__main__':
    app.run(debug=True, port=5328)
