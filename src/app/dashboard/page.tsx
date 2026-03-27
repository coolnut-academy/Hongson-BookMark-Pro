"use client";

import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  TrendingUp, 
  BookOpen, 
  Award, 
  BarChart,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-blue-600 tracking-tight mb-2">
            ภาพรวมสถิติผลการเรียน
          </h1>
          <p className="text-slate-500 font-medium">ยินดีต้อนรับ, แสดงข้อมูลสถิติผลการเรียนล่าสุด</p>
        </div>
        
        {/* Filter Panel Skeleton */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none appearance-none cursor-pointer shadow-sm">
              <option>ปีการศึกษา 2568</option>
              <option>ปีการศึกษา 2567</option>
              <option>ปีการศึกษา 2566</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100">
            <Filter className="w-4 h-4" />
            ตัวกรองเพิ่มเติม
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "เกรดเฉลี่ยรวมระดับทั้งหมด",
            value: "2.84",
            change: "+0.12",
            trend: "up",
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
          {
            title: "อัตราการรอดพ้น (ไม่มี 0, ร, มส)",
            value: "92.5%",
            change: "+1.2%",
            trend: "up",
            icon: Award,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          {
            title: "จำนวนรายวิชาทั้งหมด",
            value: "142",
            change: "0",
            trend: "neutral",
            icon: BookOpen,
            color: "text-indigo-600",
            bg: "bg-indigo-50"
          },
          {
            title: "จำนวนนักเรียนทั้งหมด",
            value: "1,245",
            change: "-12",
            trend: "down",
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
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                stat.trend === "up" ? "text-emerald-700 bg-emerald-50 border border-emerald-100" :
                stat.trend === "down" ? "text-red-700 bg-red-50 border border-red-100" :
                "text-slate-600 bg-slate-50 border border-slate-200"
              }`}>
                {stat.trend === "up" && <ArrowUpRight className="w-3 h-3" />}
                {stat.trend === "down" && <ArrowDownRight className="w-3 h-3" />}
                {stat.trend === "neutral" && "-"}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Visualization Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[400px]">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-indigo-500" />
              แนวโน้มเกรดเฉลี่ยรายกลุ่มสาระ
            </h3>
            <button className="text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
              ดูรายละเอียด
            </button>
          </div>
          <div className="flex-1 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex flex-col items-center justify-center text-indigo-300 border-dashed">
             <BarChart className="w-12 h-12 mb-3 opacity-50" />
             <p className="font-medium text-sm">ส่วนแสดงกราฟจะถูกเชื่อมข้อมูลใน Phase 4</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[400px]">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              สมรรถนะภาพรวมรายกลุ่มสาระ
            </h3>
            <button className="text-sm font-semibold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">
              ดูรายละเอียด
            </button>
          </div>
          <div className="flex-1 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 flex flex-col items-center justify-center text-emerald-300 border-dashed">
             <BookOpen className="w-12 h-12 mb-3 opacity-50" />
             <p className="font-medium text-sm">ส่วนแสดงกราฟจะถูกเชื่อมข้อมูลใน Phase 4</p>
          </div>
        </div>
      </div>
    </div>
  );
}
