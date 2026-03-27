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
        log("Proceeding with header=0 using xlrd engine.")

        log("[6/6] Final data extraction")
        # Here we would map the row data into the subjects format
        # e.g., code, subject_name, grades_count
        # We will mock the parsed_subjects as we don't know the exact internal columns from the user's data yet
        
        parsed_subjects = []
        
        summary = {
            "filename": file.filename,
            "size_bytes": file_size,
            "sheets_count": len(sheet_names),
            "sheets": sheet_names,
            "shape": list(df.shape),
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
