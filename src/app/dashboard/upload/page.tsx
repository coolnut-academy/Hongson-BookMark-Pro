"use client";

import { useState, useCallback } from "react";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Calendar, BookOpen } from "lucide-react";
import { clsx } from "clsx";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FileItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  message?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [year, setYear] = useState<string>("2568");
  const [term, setTerm] = useState<string>("สรุปชิ้นงาน");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const items: FileItem[] = Array.from(newFiles)
      .filter((file) => file.name.endsWith(".xls"))
      .map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        status: "idle",
        progress: 0,
      }));
    setFiles((prev) => [...prev, ...items]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const inferGradeLevel = (filename: string) => {
    const match = filename.match(/ม\.[1-6]/);
    return match ? match[0] : "อื่นๆ";
  };

  const uploadFiles = async () => {
    const toUpload = files.filter((f) => f.status === "idle" || f.status === "error");
    if (toUpload.length === 0) return;

    for (const item of toUpload) {
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 20 } : f))
      );

      const formData = new FormData();
      formData.append("file", item.file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
           throw new Error(data.message || "Failed to parse file");
        }

        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, progress: 60, message: "กำลังบันทึกลงฐานข้อมูล..." } : f))
        );

        // Save to Firestore
        const extractedData = data.extracted_data || [];
        const gradeLevel = inferGradeLevel(item.file.name);
        
        // Use custom document ID for easy querying and upsert
        const docId = `Y${year}_T${term}_${gradeLevel.replace('.', '')}`;
        
        await setDoc(doc(db, "academic_data", docId), {
          year: parseInt(year),
          term,
          grade_level: gradeLevel,
          subjects: extractedData,
          updated_at: new Date().toISOString()
        }, { merge: true });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "success",
                  progress: 100,
                  message: `บันทึกข้อมูล ${extractedData.length} รายวิชา สำเร็จ`,
                }
              : f
          )
        );
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: "error", progress: 0, message: error.message || "Server Error" } : f
          )
        );
      }
    }
  };

  const isUploading = files.some((f) => f.status === "uploading");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          นำเข้าไฟล์สถิติ (Excel)
        </h1>
        <p className="text-slate-500 font-medium pb-6 border-b border-slate-200">
          อัปโหลดไฟล์คะแนน (.xls) เพื่อประมวลผลและจัดเก็บเข้าสู่ฐานข้อมูลกลางสำหรับแสดงสถิติ
        </p>
      </div>

      {/* Upload Settings Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 flex items-end gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6">
         <div className="flex-1 space-y-2">
           <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              ปีการศึกษา
           </label>
           <select 
             value={year}
             onChange={(e) => setYear(e.target.value)}
             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
           >
             <option value="2568">2568</option>
             <option value="2567">2567</option>
             <option value="2566">2566</option>
           </select>
         </div>
         <div className="flex-1 space-y-2">
           <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              ภาคเรียน
           </label>
           <select 
             value={term}
             onChange={(e) => setTerm(e.target.value)}
             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
           >
             <option value="สรุปชิ้นงาน">สรุปชิ้นงาน/ทั้งปี</option>
             <option value="1">ภาคเรียนที่ 1</option>
             <option value="2">ภาคเรียนที่ 2</option>
           </select>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        {/* Dropzone */}
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              "relative overflow-hidden group border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[400px]",
              isDragging
                ? "bg-indigo-50 border-indigo-500"
                : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-slate-50 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
            )}
          >
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-indigo-600/10">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">ลากไฟล์มาวางที่นี่</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 max-w-[250px] mx-auto leading-relaxed">
              คลิกปุ่มด้านล่างหรือลากไฟล์ .xls 97-2003 (เช่น ม.1.xls, ม.2.xls) มาวางได้เลย
            </p>

            <input
              type="file"
              id="fileInput"
              accept=".xls"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer bg-slate-900 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95 transition-all w-full max-w-[200px]"
            >
              เลือกไฟล์ Excel
            </label>
          </div>
        </div>

        {/* Upload File List */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col min-h-[400px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">รายการไฟล์ที่เลือก</h3>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
              {files.length} ไฟล์
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-6">
            {files.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <FileSpreadsheet className="w-12 h-12 opacity-30" />
                <p className="text-sm font-medium">ยังไม่มีไฟล์ในคิว</p>
              </div>
            ) : (
              files.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    "p-4 rounded-2xl border transition-colors flex items-center gap-4 group",
                    item.status === "error" ? "bg-red-50 border-red-100" :
                    item.status === "success" ? "bg-emerald-50 border-emerald-100" :
                    "bg-slate-50 border-slate-200"
                  )}
                >
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <FileSpreadsheet className={clsx(
                      "w-6 h-6",
                      item.status === "error" ? "text-red-500" :
                      item.status === "success" ? "text-emerald-500" :
                      "text-indigo-500"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate mb-0.5">{item.file.name}</p>
                    <div className="flex items-center gap-2">
                       {item.status === "uploading" && (
                         <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                           <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                         </div>
                       )}
                       {item.status !== "uploading" && (
                         <p className="text-xs font-medium text-slate-500">{item.message || inferGradeLevel(item.file.name)}</p>
                       )}
                    </div>
                  </div>

                  {item.status === "idle" && (
                    <button onClick={() => removeFile(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {item.status === "uploading" && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                  {item.status === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {item.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              ))
            )}
          </div>

          <button
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading}
            className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isUploading ? (
               <><Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึกข้อมูล...</>
            ) : (
              <><UploadCloud className="w-5 h-5" /> ยืนยันการอัปโหลดเข้าฐานข้อมูล</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
