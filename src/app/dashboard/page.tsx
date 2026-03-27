"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, TrendingUp, BookOpen, Award, BarChart, Calendar, Filter, ArrowUpRight, ArrowDownRight, Loader2, Search
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { clsx } from "clsx";

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
  const [term, setTerm] = useState<string>("1");
  const [subjectType, setSubjectType] = useState<string>("all");
  
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

  const stats = useMemo(() => {
    let totalSubjects = 0;
    let totalStudents = 0;
    let totalPasses = 0; 
    let totalEvaluation = 0; 

    let passedSubjectsCredits = 0;
    let sumGPACredits = 0;

    data.forEach(d => {
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
  }, [data, subjectType]);

  const chartData = useMemo(() => {
     const areaMap: Record<string, any> = {};
     
     data.forEach(d => {
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
  }, [data, subjectType]);

  return (
    <div className="space-y-6">
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
               className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none appearance-none cursor-pointer shadow-sm min-w-[120px]"
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
               className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none appearance-none cursor-pointer shadow-sm min-w-[120px]"
            >
              <option value="1">ภาคเรียน ท่ี่ 1</option>
              <option value="2">ภาคเรียน ที่ 2</option>
              <option value="สรุปชิ้นงาน">รวมทั้งปี</option>
            </select>
          </div>
          <select 
             value={subjectType}
             onChange={(e) => setSubjectType(e.target.value)}
             className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none cursor-pointer shadow-sm"
          >
            <option value="all">ทุกประเภทวิชา</option>
            <option value="พื้นฐาน">เฉพาะวิชาพื้นฐาน</option>
            <option value="เพิ่มเติม">เฉพาะวิชาเพิ่มเติม</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-indigo-500">
           <Loader2 className="w-10 h-10 animate-spin" />
           <p className="font-semibold text-slate-600 animate-pulse">กำลังดึงข้อมูลสถิติ...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-200 border-dashed">
           <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-2">
              <Search className="w-8 h-8" />
           </div>
           <h3 className="font-bold text-lg text-slate-700">ไม่พบข้อมูล</h3>
           <p className="text-slate-500">ยังไม่มีการนำเข้าไฟล์ Excel ในปีการศึกษาและเทอมที่คุณเลือก</p>
        </div>
      ) : (
        <>
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
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 group">
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
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[460px]">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-indigo-500" />
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
                    <Bar dataKey="ดีเยี่ยม" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="ดี" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="ผ่าน" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="ไม่ผ่าน" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Radar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-[460px]">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
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
                    />
                    <Tooltip
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
