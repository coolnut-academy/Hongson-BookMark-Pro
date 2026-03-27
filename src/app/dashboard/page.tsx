"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, TrendingUp, BookOpen, Award, BarChart, Calendar, Filter, ArrowUpRight, ArrowDownRight, Loader2, Search, Download
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

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

interface AcademicData {
  id: string;
  year: number;
  term: string;
  grade_level: string;
  subjects: Subject[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [year, setYear] = useState<number>(2568);
  const [term, setTerm] = useState<string>("สรุปสองภาคเรียน");
  const [subjectType, setSubjectType] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  
  const [data, setData] = useState<AcademicData[]>([]);
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
        const fetchedData: AcademicData[] = [];
        snapshot.forEach((doc) => {
          fetchedData.push({ id: doc.id, ...doc.data() } as AcademicData);
        });
        setData(fetchedData);
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

  // Derive available grade levels from fetched data
  const gradeLevels = useMemo(() => {
    const levels = new Set<string>();
    data.forEach(d => levels.add(d.grade_level));
    return Array.from(levels).sort();
  }, [data]);

  // Helper: check if a document matches the grade filter
  const matchesGradeFilter = (gradeLevel: string): boolean => {
    if (gradeFilter === "all") return true;
    if (gradeFilter === "lower") {
      // ม.ต้น = ม.1, ม.2, ม.3
      const gl = gradeLevel;
      if (["ม.1","ม.2","ม.3","ม1","ม2","ม3"].some(g => gl.includes(g.replace("ม.","ม")) || gl === g)) return true;
      // flexible fallback
      if ((gl.includes("1") || gl.includes("2") || gl.includes("3")) && !gl.includes("4") && !gl.includes("5") && !gl.includes("6")) return true;
      return false;
    }
    if (gradeFilter === "upper") {
      // ม.ปลาย = ม.4, ม.5, ม.6
      const gl = gradeLevel;
      if (["ม.4","ม.5","ม.6","ม4","ม5","ม6"].some(g => gl.includes(g.replace("ม.","ม")) || gl === g)) return true;
      if ((gl.includes("4") || gl.includes("5") || gl.includes("6")) && !gl.includes("1") && !gl.includes("2") && !gl.includes("3")) return true;
      return false;
    }
    // specific grade level
    return gradeLevel === gradeFilter;
  };

  const stats = useMemo(() => {
    let totalSubjects = 0;
    let totalStudents = 0;
    let totalPasses = 0; 
    let totalEvaluation = 0; 

    let passedSubjectsCredits = 0;
    let sumGPACredits = 0;

    data.forEach(d => {
      if (!matchesGradeFilter(d.grade_level)) return;
      d.subjects.forEach(sub => {
        if (subjectType !== "all" && sub.type !== subjectType) return;
        
        totalSubjects++;
        totalStudents += sub.total_students;
        
        const gc = sub.grades_count;
        const pass = (gc["1"]||0) + (gc["1.5"]||0) + (gc["2"]||0) + (gc["2.5"]||0) + (gc["3"]||0) + (gc["3.5"]||0) + (gc["4"]||0);
        const fail = (gc["0"]||0) + (gc["r"]||0) + (gc["x"]||0);
        
        totalPasses += pass;
        totalEvaluation += (pass + fail);
        
        sumGPACredits += (sub.gpa * sub.credits);
        passedSubjectsCredits += sub.credits;
      });
    });

    const averageGPA = passedSubjectsCredits > 0 ? (sumGPACredits / passedSubjectsCredits) : 0;
    const passRate = totalEvaluation > 0 ? (totalPasses / totalEvaluation) * 100 : 0;

    return {
      averageGPA: averageGPA.toFixed(2),
      passRate: passRate.toFixed(1),
      totalSubjects,
      totalStudents
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, subjectType, gradeFilter]);

  const chartData = useMemo(() => {
     const areaMap: Record<string, any> = {};
     
     data.forEach(d => {
       if (!matchesGradeFilter(d.grade_level)) return;
       d.subjects.forEach(sub => {
         if (subjectType !== "all" && sub.type !== subjectType) return;
         
         const key = sub.learning_area || "อื่นๆ";
         if(!areaMap[key]) {
            areaMap[key] = {
               subject: key,
               excellent: 0,
               good: 0,
               pass: 0,
               fail: 0,
               totalGPA: 0,
               count: 0
            };
         }
         
         const gc = sub.grades_count;
         areaMap[key].excellent += ((gc["3.5"]||0) + (gc["4"]||0));
         areaMap[key].good += ((gc["2.5"]||0) + (gc["3"]||0));
         areaMap[key].pass += ((gc["1"]||0) + (gc["1.5"]||0) + (gc["2"]||0));
         areaMap[key].fail += ((gc["0"]||0) + (gc["r"]||0) + (gc["x"]||0));
         areaMap[key].totalGPA += sub.gpa;
         areaMap[key].count += 1;
       });
     });

     const barData = Object.values(areaMap).map(a => ({
         name: a.subject.length > 15 ? a.subject.substring(0, 15) + "..." : a.subject,
         ดีเยี่ยม: a.excellent,
         ดี: a.good,
         ผ่าน: a.pass,
         ไม่ผ่าน: a.fail,
         fullSubjectName: a.subject
     })).sort((a,b) => b.ดีเยี่ยม - a.ดีเยี่ยม);
     
     const radarData = Object.values(areaMap).map(a => ({
         subject: a.subject.length > 12 ? a.subject.substring(0, 12) + ".." : a.subject,
         GPA: Number((a.totalGPA / a.count).toFixed(2)),
         fullMark: 4.0
     }));
     
     return { barData, radarData };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, subjectType, gradeFilter]);

  // Get filter label for filename
  const getFilterLabel = () => {
    let label = `${year}_${term}`;
    if (gradeFilter !== "all") label += `_${gradeFilter === "lower" ? "ม.ต้น" : gradeFilter === "upper" ? "ม.ปลาย" : gradeFilter}`;
    if (subjectType !== "all") label += `_${subjectType}`;
    return label;
  };

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const rows: any[] = [];
      data.forEach(d => {
        if (!matchesGradeFilter(d.grade_level)) return;
        d.subjects.forEach(sub => {
           if (subjectType !== "all" && sub.type !== subjectType) return;
           const gc = sub.grades_count;
           rows.push({
             "ปีการศึกษา": d.year,
             "ภาคเรียน": d.term,
             "ระดับชั้น": d.grade_level,
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
           });
        });
      });
      
      const worksheet = XLSX.utils.json_to_sheet(rows);
      // Auto-fit columns
      const cols = [{wch: 10}, {wch: 10}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 35}, {wch: 10}, {wch: 15}, {wch: 15}];
      worksheet['!cols'] = cols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Academic Stats");
      XLSX.writeFile(workbook, `สรุปผลการเรียน_${getFilterLabel()}.xlsx`);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600 tracking-tight mb-2">
            ภาพรวมสถิติผลการเรียน
          </h1>
          <p className="text-slate-500 font-medium tracking-wide">รายงานข้อมูลวิชาการของโรงเรียน คัดกรองจากฐานข้อมูลแบบเรียลไทม์</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
               value={year}
               onChange={(e) => setYear(Number(e.target.value))}
               className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none appearance-none cursor-pointer shadow-sm hover:border-indigo-300 transition-colors min-w-[120px]"
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
               className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none appearance-none cursor-pointer shadow-sm hover:border-indigo-300 transition-colors min-w-[120px]"
            >
              <option value="สรุปสองภาคเรียน">สรุปสองภาคเรียน</option>
              <option value="1">ภาคเรียนที่ 1</option>
              <option value="2">ภาคเรียนที่ 2</option>
            </select>
          </div>
          <select 
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none cursor-pointer shadow-sm hover:border-indigo-300 transition-colors appearance-none"
           >
             <option value="all">ทุกระดับชั้น</option>
             <option value="lower">ม.ต้น (ม.1-3)</option>
             <option value="upper">ม.ปลาย (ม.4-6)</option>
             {gradeLevels.map(gl => (
               <option key={gl} value={gl}>{gl}</option>
             ))}
           </select>
          <select 
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none cursor-pointer shadow-sm hover:border-indigo-300 transition-colors appearance-none"
           >
             <option value="all">ทุกประเภทวิชา</option>
             <option value="พื้นฐาน">เฉพาะวิชาพื้นฐาน</option>
             <option value="เพิ่มเติม">เฉพาะวิชาเพิ่มเติม</option>
           </select>

          <button 
              onClick={handleExportExcel}
              disabled={data.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none group"
           >
             <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
             ดาวน์โหลด Excel
           </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-indigo-500 animate-in fade-in duration-500">
           <Loader2 className="w-10 h-10 animate-spin" />
           <p className="font-semibold text-slate-600 animate-pulse">กำลังดึงข้อมูลสถิติ...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-200 border-dashed animate-in fade-in zoom-in-95 duration-500">
           <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-2">
              <Search className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-lg text-slate-700">ไม่พบข้อมูล</h3>
           <p className="text-slate-500">ยังไม่มีการนำเข้าไฟล์ Excel ในปีการศึกษาและเทอมที่คุณเลือก</p>
        </div>
      ) : data.length > 0 && stats.totalSubjects === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-200 border-dashed animate-in fade-in zoom-in-95 duration-500">
           <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-2">
              <Search className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-lg text-slate-700">ไม่พบข้อมูลตรงตามเงื่อนไข</h3>
           <p className="text-slate-500">ลองเปลี่ยนตัวกรอง ระดับชั้น หรือ ประเภทวิชา ดูค่ะ/ครับ</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-700">
          {/* Active Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">กำลังกรอง:</span>
            {gradeFilter !== "all" && (
              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">
                {gradeFilter === "lower" ? "ม.ต้น (ม.1-3)" : gradeFilter === "upper" ? "ม.ปลาย (ม.4-6)" : gradeFilter}
              </span>
            )}
            {subjectType !== "all" && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{subjectType}</span>
            )}
            {gradeFilter === "all" && subjectType === "all" && (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">แสดงทั้งหมด</span>
            )}
            <span className="text-xs font-medium text-slate-400 ml-2">{stats.totalSubjects} รายวิชา</span>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "เกรดเฉลี่ยรวม (GPA)",
                value: stats.averageGPA,
                icon: TrendingUp,
                color: "text-blue-600",
                bg: "bg-blue-50"
              },
              {
                title: "อัตราการรอดพ้น (ไม่ติด 0, ร)",
                value: `${stats.passRate}%`,
                icon: Award,
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              },
              {
                title: "จำนวนรายวิชาทั้งหมด",
                value: stats.totalSubjects.toLocaleString(),
                icon: BookOpen,
                color: "text-indigo-600",
                bg: "bg-indigo-50"
              },
              {
                title: "จำนวนนักเรียนประเมินรวม",
                value: stats.totalStudents.toLocaleString(),
                icon: Users,
                color: "text-purple-600",
                bg: "bg-purple-50"
              }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-2">
            
            {/* Stacked Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[460px] group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-indigo-500 group-hover:rotate-12 transition-transform duration-300" />
                  สัดส่วนผลการเรียน แยกตามกลุ่มสาระ
                </h3>
              </div>
              <div className="flex-1 min-h-0 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={chartData.barData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 600 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}/>
                    <Bar dataKey="ดีเยี่ยม" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} animationDuration={1500} />
                    <Bar dataKey="ดี" stackId="a" fill="#3b82f6" animationDuration={1500} />
                    <Bar dataKey="ผ่าน" stackId="a" fill="#f59e0b" animationDuration={1500} />
                    <Bar dataKey="ไม่ผ่าน" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={1500} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Radar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[460px] group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500 group-hover:-rotate-12 transition-transform duration-300" />
                  สมรรถนะภาพรวมรายกลุ่มสาระ (GPA)
                </h3>
              </div>
              <div className="flex-1 min-h-0 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData.radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#94a3b8' }} />
                    <Radar 
                      name="GPA เฉลี่ย" 
                      dataKey="GPA" 
                      stroke="#4f46e5" 
                      fill="#6366f1" 
                      fillOpacity={0.4} 
                      animationDuration={1500}
                    />
                    <Tooltip
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* GPA Breakdown Table by Learning Area */}
          {chartData.radarData.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                สรุป GPA เฉลี่ยรายกลุ่มสาระการเรียนรู้ (เรียงจากมากไปน้อย)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-10">อันดับ</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">กลุ่มสาระการเรียนรู้</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">GPA เฉลี่ย</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider" style={{minWidth: '300px'}}>สัดส่วน GPA (เทียบ 4.00)</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">ระดับ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...chartData.radarData]
                      .sort((a, b) => b.GPA - a.GPA)
                      .map((item, idx) => {
                        const pct = (item.GPA / 4) * 100;
                        const rank = idx + 1;
                        let levelBadge = { text: 'ปรับปรุง', bg: 'bg-red-100', color: 'text-red-700' };
                        if (item.GPA >= 3.5) levelBadge = { text: 'ดีเยี่ยม', bg: 'bg-emerald-100', color: 'text-emerald-700' };
                        else if (item.GPA >= 3.0) levelBadge = { text: 'ดีมาก', bg: 'bg-blue-100', color: 'text-blue-700' };
                        else if (item.GPA >= 2.5) levelBadge = { text: 'ดี', bg: 'bg-cyan-100', color: 'text-cyan-700' };
                        else if (item.GPA >= 2.0) levelBadge = { text: 'พอใช้', bg: 'bg-amber-100', color: 'text-amber-700' };
                        else if (item.GPA >= 1.0) levelBadge = { text: 'ผ่านเกณฑ์', bg: 'bg-orange-100', color: 'text-orange-700' };

                        let barColor = 'bg-emerald-500';
                        if (item.GPA < 1.0) barColor = 'bg-red-500';
                        else if (item.GPA < 2.0) barColor = 'bg-orange-500';
                        else if (item.GPA < 2.5) barColor = 'bg-amber-500';
                        else if (item.GPA < 3.0) barColor = 'bg-cyan-500';
                        else if (item.GPA < 3.5) barColor = 'bg-blue-500';

                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-black ${
                                rank === 1 ? 'bg-amber-400 text-white shadow-md shadow-amber-400/30' :
                                rank === 2 ? 'bg-slate-300 text-white' :
                                rank === 3 ? 'bg-amber-600 text-white' :
                                'bg-slate-100 text-slate-500'
                              }`}>{rank}</span>
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-slate-800">{item.subject}</td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-xl font-black text-slate-900">{item.GPA.toFixed(2)}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                  <div className={`h-3 rounded-full ${barColor} transition-all duration-1000`} style={{width: `${pct}%`}} />
                                </div>
                                <span className="text-xs font-bold text-slate-500 w-12 text-right">{pct.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${levelBadge.bg} ${levelBadge.color}`}>{levelBadge.text}</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
