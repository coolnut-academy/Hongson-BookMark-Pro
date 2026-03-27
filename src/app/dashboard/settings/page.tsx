"use client";

import { useAuth } from "@/context/AuthContext";
import { User, ShieldCheck, Mail, Key } from "lucide-react";

export default function SettingsPage() {
  const { user, userRole } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="pb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-600 tracking-tight mb-2">
          ตั้งค่าระบบ
        </h1>
        <p className="text-slate-500 font-medium tracking-wide">ตั้งค่าบัญชีผู้ใช้และระบบบริหารจัดการหลังบ้าน</p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            ข้อมูลผู้ใช้งาน (Profile)
          </h3>
          
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
               <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                 {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                    <User className="w-8 h-8 text-slate-400" />
                 )}
               </div>
               <div>
                 <h4 className="text-xl font-bold text-slate-900">{user?.displayName || "Admin User"}</h4>
                 <div className="flex items-center gap-2 mt-1 mt-1.5">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {userRole?.toUpperCase()}
                    </span>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1 font-semibold">
                     <Mail className="w-4 h-4" /> อีเมล
                  </div>
                  <p className="font-bold text-slate-800">{user?.email || "..."}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1 font-semibold">
                     <Key className="w-4 h-4" /> Provider
                  </div>
                  <p className="font-bold text-slate-800">Google Auth (OAuth)</p>
                </div>
             </div>

             <div className="pt-6">
                <p className="text-sm text-slate-500">
                  ⚠️ หมายเหตุ: การตั้งค่าสิทธิ์ผู้ใช้งาน (Roles) จะต้องทำผ่าน <a href="https://console.firebase.google.com" target="_blank" className="text-indigo-600 hover:underline font-bold">Firebase Console</a> เท่านั้น เพื่อความปลอดภัยสูงสุดของข้อมูลโรงเรียน
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
