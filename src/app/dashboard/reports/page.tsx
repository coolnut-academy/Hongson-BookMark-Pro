"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Loader2, Download, Table as TableIcon } from "lucide-react";

interface GradeCount {
  "0": number; "1": number; "1.5": number; "2": number; "2.5": number; 
  "3": number; "3.5": number; "4": number; "r": number; "x": number;
}

interface Subject {
  code: string;
  subject_name: string;
  credits: number;
  type: string;
  learning_area: string;
  total_students: number;
  gpa: number;
  grades_count: GradeCount;
}

export default function ReportsPage() {
  const { user } = useAuth();
  
  const [year, setYear] = useState<number>(2568);
  const [term, setTerm] = useState<string>("1");
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "academic_data"),
          where("year", "==", year),
          where("term", "==", term)
        );
        const snapshot = await getDocs(q);
        const allSubjects: Subject[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.subjects) {
             allSubjects.push(...data.subjects);
          }
        });
        setSubjects(allSubjects.sort((a,b) => b.gpa - a.gpa));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
       fetchData();
    }
  }, [year, term, user]);

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const rows = subjects.map(sub => {
         const gc = sub.grades_count;
         return {
           "ปีการศึกษา": year,
           "ภาคเรียน": term,
           "กลุ่มสาระ": sub.learning_area || "ไม่ระบุ",
           "ประเภทวิชา": sub.type,
           "รหัสวิชา": sub.code,
           "ชื่อวิชา": sub.subject_name,
           "หน่วยกิต": sub.credits,
           "นักเรียนทั้งหมด": sub.total_students,
           "เกรดเฉลี่ย (GPA)": sub.gpa,
           "เกรด 4": gc["4"] || 0,
           "เกรด 3.5": gc["3.5"] || 0,
           "เกรด 3": gc["3"] || 0,
           "เกรด 2.5": gc["2.5"] || 0,
           "เกรด 2": gc["2"] || 0,
           "เกรด 1.5": gc["1.5"] || 0,
           "เกรด 1": gc["1"] || 0,
           "เกรด 0": gc["0"] || 0,
           "ร": gc["r"] || 0,
           "มส": gc["x"] || 0,
         };
      });
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const cols = [{wch: 10}, {wch: 10}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 30}, {wch: 10}, {wch: 15}, {wch: 15}];
      worksheet['!cols'] = cols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Export");
      XLSX.writeFile(workbook, `ตารางรายงานผลการเรียน_${year}_ภาค${term}.xlsx`);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-emerald-600 tracking-tight mb-2">
            ข้อมูลตารางสรุปรายงาน
          </h1>
          <p className="text-slate-500 font-medium tracking-wide">เจาะลึกรายละเอียดรายวิชาทั้งหมด แบบตารางข้อมูลดิบ (Data Table) พร้อมดาวน์โหลดไฟล์</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
               value={year}
               onChange={(e) => setYear(Number(e.target.value))}
               className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none appearance-none cursor-pointer shadow-sm hover:border-teal-300 transition-colors min-w-[120px]"
            >
              <option value="2568">ปีการศึกษา 2568</option>
              <option value="2567">ปีการศึกษา 2567</option>
              <option value="2566">ปีการศึกษา 2566</option>
            </select>
          </div>
          <div className="relative">
            <select 
               value={term}
               onChange={(e) => setTerm(e.target.value)}
               className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none appearance-none cursor-pointer shadow-sm hover:border-teal-300 transition-colors min-w-[120px]"
            >
              <option value="1">ภาคเรียน ท่ี่ 1</option>
              <option value="2">ภาคเรียน ที่ 2</option>
              <option value="สรุปชิ้นงาน">รวมทั้งปี</option>
            </select>
          </div>
          <button 
             onClick={handleExportExcel}
             disabled={subjects.length === 0}
             className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            ดาวน์โหลด Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-teal-500 animate-in fade-in duration-500">
           <Loader2 className="w-10 h-10 animate-spin" />
           <p className="font-semibold text-slate-600 animate-pulse">กำลังโหลดตารางข้อมูล...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-200 border-dashed animate-in fade-in zoom-in-95 duration-500">
           <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-2">
              <TableIcon className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-lg text-slate-700">ไม่มีข้อมูลแสดงผล</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">รหัสวิชา</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อรายวิชา</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">กลุ่มสาระ</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ประเภท</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">นก.</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">นักเรียน</th>
                  <th className="px-6 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider text-center">GPA</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">ดีเยี่ยม (3.5-4)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">ไม่ผ่าน (0,ร,มส)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub, idx) => {
                  const excellent = (sub.grades_count["4"]||0) + (sub.grades_count["3.5"]||0);
                  const fail = (sub.grades_count["0"]||0) + (sub.grades_count["r"]||0) + (sub.grades_count["x"]||0);
                  return (
                    <tr key={`${sub.code}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{sub.code}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">{sub.subject_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{sub.learning_area || "ไม่ระบุ"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{sub.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-center">{sub.credits}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 text-center">{sub.total_students}</td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-600 text-center">{sub.gpa.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-center">{excellent} ({((excellent/sub.total_students)*100).toFixed(1)}%)</td>
                      <td className="px-6 py-4 text-sm font-medium text-red-500 text-center">{fail > 0 ? `${fail} คน` : "ไม่มี"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
