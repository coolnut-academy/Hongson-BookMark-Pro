"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Loader2, Download, Table as TableIcon, TrendingUp, Award, BookOpen, Users, Filter } from "lucide-react";

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

interface AcademicDoc {
  grade_level: string;
  subjects: Subject[];
}

export default function ReportsPage() {
  const { user } = useAuth();
  
  const [year, setYear] = useState<number>(2568);
  const [term, setTerm] = useState<string>("สรุปสองภาคเรียน");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [subjectType, setSubjectType] = useState<string>("all");
  const [learningArea, setLearningArea] = useState<string>("all");
  
  const [rawDocs, setRawDocs] = useState<AcademicDoc[]>([]);
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
        const docs: AcademicDoc[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.subjects) {
            docs.push({
              grade_level: data.grade_level || "ไม่ระบุ",
              subjects: data.subjects
            });
          }
        });
        setRawDocs(docs);
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

  // Derive available grade levels
  const gradeLevels = useMemo(() => {
    const levels = new Set<string>();
    rawDocs.forEach(d => levels.add(d.grade_level));
    return Array.from(levels).sort();
  }, [rawDocs]);

  // Derive available learning areas
  const learningAreas = useMemo(() => {
    const areas = new Set<string>();
    rawDocs.forEach(d => d.subjects.forEach(s => {
      if (s.learning_area) areas.add(s.learning_area);
    }));
    return Array.from(areas).sort();
  }, [rawDocs]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    let result: (Subject & { grade_level: string })[] = [];
    
    rawDocs.forEach(d => {
      // Grade level filter
      if (gradeFilter === "lower" && !["ม.1","ม.2","ม.3","ม1","ม2","ม3"].some(g => d.grade_level.includes(g.replace("ม.","ม"))||d.grade_level===g)) {
        // check more flexibly
        const gl = d.grade_level;
        if (!gl.includes("1") && !gl.includes("2") && !gl.includes("3")) return;
        if (gl.includes("4") || gl.includes("5") || gl.includes("6")) return;
      }
      if (gradeFilter === "upper" && !["ม.4","ม.5","ม.6","ม4","ม5","ม6"].some(g => d.grade_level.includes(g.replace("ม.","ม"))||d.grade_level===g)) {
        const gl = d.grade_level;
        if (!gl.includes("4") && !gl.includes("5") && !gl.includes("6")) return;
      }
      if (gradeFilter !== "all" && gradeFilter !== "lower" && gradeFilter !== "upper" && d.grade_level !== gradeFilter) {
        return;
      }
      
      d.subjects.forEach(sub => {
        if (subjectType !== "all" && sub.type !== subjectType) return;
        if (learningArea !== "all" && sub.learning_area !== learningArea) return;
        result.push({ ...sub, grade_level: d.grade_level });
      });
    });

    return result.sort((a, b) => b.gpa - a.gpa);
  }, [rawDocs, gradeFilter, subjectType, learningArea]);

  // Statistics for filtered data
  const stats = useMemo(() => {
    let totalSubjects = 0;
    let totalStudents = 0;
    let totalPasses = 0;
    let totalEval = 0;
    let sumGPACredits = 0;
    let sumCredits = 0;

    filteredSubjects.forEach(sub => {
      totalSubjects++;
      totalStudents += sub.total_students;
      
      const gc = sub.grades_count;
      const pass = (gc["1"]||0) + (gc["1.5"]||0) + (gc["2"]||0) + (gc["2.5"]||0) + (gc["3"]||0) + (gc["3.5"]||0) + (gc["4"]||0);
      const fail = (gc["0"]||0) + (gc["r"]||0) + (gc["x"]||0);
      
      totalPasses += pass;
      totalEval += (pass + fail);
      sumGPACredits += (sub.gpa * sub.credits);
      sumCredits += sub.credits;
    });

    const averageGPA = sumCredits > 0 ? (sumGPACredits / sumCredits) : 0;
    const passRate = totalEval > 0 ? (totalPasses / totalEval) * 100 : 0;
    const excellentCount = filteredSubjects.reduce((sum, s) => sum + (s.grades_count["4"]||0) + (s.grades_count["3.5"]||0), 0);
    const failCount = filteredSubjects.reduce((sum, s) => sum + (s.grades_count["0"]||0) + (s.grades_count["r"]||0) + (s.grades_count["x"]||0), 0);

    return {
      averageGPA: averageGPA.toFixed(2),
      passRate: passRate.toFixed(1),
      totalSubjects,
      totalStudents,
      excellentCount,
      failCount
    };
  }, [filteredSubjects]);

  // Get filter label for filename
  const getFilterLabel = () => {
    let label = `${year}_${term}`;
    if (gradeFilter !== "all") label += `_${gradeFilter === "lower" ? "ม.ต้น" : gradeFilter === "upper" ? "ม.ปลาย" : gradeFilter}`;
    if (subjectType !== "all") label += `_${subjectType}`;
    if (learningArea !== "all") label += `_${learningArea}`;
    return label;
  };

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const rows = filteredSubjects.map(sub => {
         const gc = sub.grades_count;
         return {
           "ปีการศึกษา": year,
           "ภาคเรียน": term,
           "ระดับชั้น": sub.grade_level,
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

      // Add summary row
      rows.push({
        "ปีการศึกษา": year,
        "ภาคเรียน": term,
        "ระดับชั้น": "--- สรุป ---",
        "กลุ่มสาระ": "",
        "ประเภทวิชา": "",
        "รหัสวิชา": "",
        "ชื่อวิชา": `รวม ${stats.totalSubjects} รายวิชา`,
        "หน่วยกิต": 0,
        "นักเรียนทั้งหมด": stats.totalStudents,
        "เกรดเฉลี่ย (GPA)": Number(stats.averageGPA),
        "เกรด 4": 0, "เกรด 3.5": 0, "เกรด 3": 0, "เกรด 2.5": 0,
        "เกรด 2": 0, "เกรด 1.5": 0, "เกรด 1": 0, "เกรด 0": 0, "ร": 0, "มส": 0,
      } as any);

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const cols = [{wch:10},{wch:18},{wch:10},{wch:25},{wch:12},{wch:15},{wch:35},{wch:8},{wch:12},{wch:12},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:6},{wch:6}];
      worksheet['!cols'] = cols;
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "รายงาน");
      XLSX.writeFile(workbook, `รายงานผลการเรียน_${getFilterLabel()}.xlsx`);
    });
  };

  const selectClass = "pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none appearance-none cursor-pointer shadow-sm hover:border-teal-300 transition-colors";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-emerald-600 tracking-tight mb-2">
          ข้อมูลตารางสรุปรายงาน
        </h1>
        <p className="text-slate-500 font-medium tracking-wide">เจาะลึกรายละเอียดรายวิชาทั้งหมด พร้อม Filter หลายมิติ และดาวน์โหลดเป็น Excel</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-600">
          <Filter className="w-4 h-4 text-teal-600" />
          ตัวกรองข้อมูล
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectClass}>
            <option value="2568">ปีการศึกษา 2568</option>
            <option value="2567">ปีการศึกษา 2567</option>
            <option value="2566">ปีการศึกษา 2566</option>
          </select>

          <select value={term} onChange={(e) => setTerm(e.target.value)} className={selectClass}>
            <option value="สรุปสองภาคเรียน">สรุปสองภาคเรียน</option>
            <option value="1">ภาคเรียนที่ 1</option>
            <option value="2">ภาคเรียนที่ 2</option>
          </select>
          
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className={selectClass}>
            <option value="all">ทุกระดับชั้น</option>
            <option value="lower">ม.ต้น (ม.1-3)</option>
            <option value="upper">ม.ปลาย (ม.4-6)</option>
            {gradeLevels.map(gl => (
              <option key={gl} value={gl}>{gl}</option>
            ))}
          </select>
          
          <select value={subjectType} onChange={(e) => setSubjectType(e.target.value)} className={selectClass}>
            <option value="all">ทุกประเภทวิชา</option>
            <option value="พื้นฐาน">วิชาพื้นฐาน</option>
            <option value="เพิ่มเติม">วิชาเพิ่มเติม</option>
          </select>
          
          <select value={learningArea} onChange={(e) => setLearningArea(e.target.value)} className={selectClass}>
            <option value="all">ทุกกลุ่มสาระ</option>
            {learningAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>

          <button 
             onClick={handleExportExcel}
             disabled={filteredSubjects.length === 0}
             className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none group ml-auto"
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
      ) : rawDocs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-200 border-dashed animate-in fade-in zoom-in-95 duration-500">
           <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-2">
              <TableIcon className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-lg text-slate-700">ไม่มีข้อมูลแสดงผล</h3>
           <p className="text-slate-500 text-sm">ยังไม่มีการนำเข้าไฟล์ Excel ในปีการศึกษาและเทอมที่เลือก</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-700">
          {/* Stats Dashboard Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { title: "GPA เฉลี่ยรวม", value: stats.averageGPA, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
              { title: "อัตราผ่าน", value: `${stats.passRate}%`, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
              { title: "รายวิชาทั้งหมด", value: stats.totalSubjects.toLocaleString(), icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
              { title: "นร. ประเมินรวม", value: stats.totalStudents.toLocaleString(), icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
              { title: "จำนวนดีเยี่ยม", value: stats.excellentCount.toLocaleString(), icon: Award, color: "text-teal-600", bg: "bg-teal-50" },
              { title: "ไม่ผ่าน (0,ร,มส)", value: stats.failCount.toLocaleString(), icon: Search, color: "text-red-600", bg: "bg-red-50" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.07)] transition-all duration-300 hover:-translate-y-0.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} mb-3`}>
                  <stat.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">{stat.title}</p>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h4>
              </div>
            ))}
          </div>

          {/* Active Filter Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">กำลังกรอง:</span>
            {gradeFilter !== "all" && (
              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                {gradeFilter === "lower" ? "ม.ต้น" : gradeFilter === "upper" ? "ม.ปลาย" : gradeFilter}
              </span>
            )}
            {subjectType !== "all" && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{subjectType}</span>
            )}
            {learningArea !== "all" && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{learningArea}</span>
            )}
            {gradeFilter === "all" && subjectType === "all" && learningArea === "all" && (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">แสดงทั้งหมด</span>
            )}
            <span className="text-xs font-medium text-slate-400 ml-2">{filteredSubjects.length} รายวิชา</span>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ระดับชั้น</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">รหัสวิชา</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อรายวิชา</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">กลุ่มสาระ</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ประเภท</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">นก.</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">นักเรียน</th>
                    <th className="px-5 py-4 text-xs font-bold text-indigo-600 uppercase tracking-wider text-center">GPA</th>
                    <th className="px-5 py-4 text-xs font-bold text-emerald-600 uppercase tracking-wider text-center">ดีเยี่ยม (3.5-4)</th>
                    <th className="px-5 py-4 text-xs font-bold text-red-500 uppercase tracking-wider text-center">ไม่ผ่าน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.map((sub, idx) => {
                    const excellent = (sub.grades_count["4"]||0) + (sub.grades_count["3.5"]||0);
                    const fail = (sub.grades_count["0"]||0) + (sub.grades_count["r"]||0) + (sub.grades_count["x"]||0);
                    return (
                      <tr key={`${sub.code}-${sub.grade_level}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-semibold text-xs">{sub.grade_level}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">{sub.code}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{sub.subject_name}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{sub.learning_area || "ไม่ระบุ"}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${sub.type === "พื้นฐาน" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                            {sub.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600 text-center">{sub.credits}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600 text-center">{sub.total_students}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-sm font-black ${sub.gpa >= 3.5 ? 'text-emerald-600' : sub.gpa >= 2.5 ? 'text-blue-600' : sub.gpa >= 1.5 ? 'text-amber-600' : 'text-red-600'}`}>
                            {sub.gpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-emerald-600 text-center">
                          {excellent} <span className="text-slate-400 text-xs">({sub.total_students > 0 ? ((excellent/sub.total_students)*100).toFixed(1) : 0}%)</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-center">
                          {fail > 0 ? (
                            <span className="text-red-600 font-bold">{fail} <span className="text-xs text-red-400">คน</span></span>
                          ) : (
                            <span className="text-emerald-500 text-xs font-semibold">✓ ไม่มี</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredSubjects.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Search className="w-10 h-10" />
                <p className="font-semibold text-slate-500">ไม่พบข้อมูลตรงตามเงื่อนไขที่เลือก</p>
                <p className="text-sm text-slate-400">ลองเปลี่ยนตัวกรองดูค่ะ/ครับ</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
