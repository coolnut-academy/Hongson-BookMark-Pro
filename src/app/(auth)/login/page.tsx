"use client";

import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Lock, Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, userRole, loading: contextLoading } = useAuth();

  useEffect(() => {
    if (!contextLoading && user && userRole === "admin") {
      router.push("/dashboard");
    }
  }, [user, userRole, contextLoading, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login popup error:", err);
      const errorCode = err.code || "unknown";
      if (errorCode === "auth/popup-closed-by-user") {
         setError("คุณปิดหน้าต่างการล็อกอินก่อนจะเสร็จสิ้น");
      } else {
         setError(`เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google (${errorCode})`);
      }
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setLoading(false);
  };

  if (contextLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Pending Approval State
  if (user && userRole !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-emerald-100/60 p-10 text-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-amber-100">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">รอการอนุมัติการเข้าระบบ</h1>
          <p className="text-slate-600 font-medium leading-relaxed mb-8">
            บัญชี <span className="text-emerald-700 font-bold">{user.email}</span> เข้าสู่ระบบสำเร็จแล้ว แต่คุณยังไม่ได้รับสิทธิ์ (Role) ระดับ Admin <br/><br/>
            กรุณาติดต่อผู้ดูแลระบบเพื่อปรับสถานะใน Firebase ให้เป็น Admin ก่อนเข้าใช้งาน
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg"
          >
            ลงชื่อเข้าใช้ด้วยบัญชีอื่น
          </button>
        </div>
      </div>
    );
  }

  // Normal Login State
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-stone-50 to-green-50 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-emerald-100/60">
        <div className="p-8 pb-6 bg-gradient-to-r from-emerald-700 to-green-600">
          <div className="w-20 h-20 bg-white shadow-xl shadow-black/10 rounded-[28px] overflow-hidden flex items-center justify-center mb-6 mx-auto p-1.5 border-4 border-white/40">
            <img src="/Logo.png" alt="BookMark Pro Logo" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-center text-white mb-2">BookMark Pro</h1>
          <p className="text-emerald-100 text-center text-sm font-medium">ระบบวิเคราะห์ผลการเรียน โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ</p>
        </div>

        <div className="p-10 text-center space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              {error}
            </div>
          )}

          <p className="text-slate-500 font-medium mb-6">เริ่มจัดการและวิเคราะห์ผลการเรียนง่ายๆ เพียงคลิกเดียว</p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-sm disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                ลงชื่อเข้าใช้ด้วย Google
              </>
            )}
          </button>
        </div>
      </div>

      {/* Developer Badge */}
      <div className="mt-6 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-emerald-100/60 shadow-sm">
        <p className="text-xs font-medium text-slate-500 tracking-wide">พัฒนาโดย: <span className="font-bold text-emerald-700">นายสาธิต ศิริวัชน์</span></p>
      </div>
    </div>
  );
}
