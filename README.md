<p align="center">
  <img src="logo/Logo.png" alt="BookMark Pro Logo" width="120" />
</p>

<h1 align="center">📚 BookMark Pro</h1>

<p align="center">
  <strong>ระบบวิเคราะห์และประมวลผลผลการเรียน</strong><br/>
  โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ สมเด็จพระเจ้าภคินีเธอ เจ้าฟ้าเพชรรัตนราชสุดา สิริโสภาพัณณวดี
</p>

<p align="center">
  <a href="https://hongson-book-mark-pro.vercel.app"><img src="https://img.shields.io/badge/🌐_Live_Demo-Vercel-emerald?style=for-the-badge&labelColor=1a1a2e&color=10b981" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=white&labelColor=1a1a2e" alt="Firebase" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

---

## 🎯 Overview

**BookMark Pro** เป็นแพลตฟอร์มวิเคราะห์ผลสัมฤทธิ์ทางการเรียนที่ออกแบบมาเพื่อ **งานวัดผลและประเมินผลระดับโรงเรียน** โดยเฉพาะ สามารถนำเข้าข้อมูลจากไฟล์ Excel ดั้งเดิม (`.xls` รูปแบบ 97-2003) แปลงข้อมูลดิบเป็น **Interactive Dashboard** เพื่อวิเคราะห์ภาพรวมผลการเรียนได้อย่างครอบคลุมและ Export กลับเป็นรายงาน Excel ได้ทันที

> 💡 **"จากไฟล์ Excel ยุคเก่า สู่ Dashboard ยุคใหม่ — ในเวลาไม่กี่คลิก"**

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Google SSO & RBAC** | เข้าสู่ระบบด้วย Google Account พร้อมระบบจัดการสิทธิ์ Admin/User ผ่าน Firestore |
| 📤 **Smart Excel Parser** | อัปโหลดไฟล์ `.xls` หลายไฟล์พร้อมกัน (ม.1-ม.6) ด้วย Python API + Pandas บน Vercel Serverless |
| 📊 **Interactive Dashboard** | กราฟแท่ง Stacked Bar, Radar Chart, ตาราง GPA Ranking พร้อม Badge ระดับคุณภาพ |
| 🔍 **Multi-Dimension Filter** | กรองข้อมูลตามปีการศึกษา, ภาคเรียน, ระดับชั้น (ม.ต้น/ม.ปลาย/เจาะจง), กลุ่มสาระ, ประเภทวิชา |
| 📥 **Export to Excel** | ดาวน์โหลดข้อมูลที่ Filter แล้วกลับเป็นไฟล์ `.xlsx` พร้อมแถวสรุป |
| 🌐 **Thai Encoding Fix** | แก้ปัญหา TIS-620/Windows-874 → UTF-8 อัตโนมัติ (หมดปัญหาภาษาเอเลี่ยน!) |
| 📱 **Fully Responsive** | รองรับ Desktop, Tablet, Mobile พร้อม Hamburger Menu |
| 🎨 **Premium UI** | ธีม Cozy White/Green, Glassmorphism, Micro-animations, Google Font Kanit |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Client (Browser)                      │
│  Next.js 16 + React + Tailwind CSS + Recharts + SheetJS  │
└────────────┬──────────────────────────────┬───────────────┘
             │                              │
             ▼                              ▼
   ┌─────────────────┐          ┌──────────────────────┐
   │  Firebase Auth   │          │  Vercel Serverless   │
   │  (Google SSO)    │          │  Python API (Flask)  │
   │                  │          │  Pandas + xlrd       │
   └─────────────────┘          └──────────┬───────────┘
             │                              │
             ▼                              ▼
   ┌────────────────────────────────────────────────────┐
   │              Cloud Firestore (NoSQL)                │
   │  Collection: academic_data                          │
   │  Document: Y{year}_T{term}_{gradeLevel}            │
   │  Fields: year, term, grade_level, subjects[]        │
   └────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.9 (สำหรับ API Route)
- **Firebase Project** (Auth + Firestore enabled)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/coolnut-academy/Hongson-BookMark-Pro.git
cd Hongson-BookMark-Pro

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies (optional, for local API)
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials

# 5. Run the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 📂 Project Structure

```
Hongson-BookMark-Pro/
├── api/
│   └── index.py              # Python Flask API (Excel Parser)
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page (Google SSO)
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Main analytics dashboard
│   │   │   ├── layout.tsx     # Sidebar navigation layout
│   │   │   ├── upload/        # Excel upload page
│   │   │   ├── reports/       # Data table reports + filters
│   │   │   └── settings/      # Admin profile settings
│   │   ├── layout.tsx         # Root layout (Kanit font, AuthProvider)
│   │   └── page.tsx           # Root redirect → /login
│   ├── context/
│   │   └── AuthContext.tsx    # Firebase Auth + Firestore role context
│   └── lib/
│       └── firebase.ts        # Firebase client config
├── public/                    # Static assets (Logo, favicons)
├── requirements.txt           # Python dependencies
├── AI_WEBAPP_ARCHITECTURE_PLAN.md  # Master architecture plan
└── read_excel_guide.md        # Excel parsing strategy guide
```

---

## 📊 Data Flow

```mermaid
graph LR
    A[📄 ไฟล์ Excel .xls] -->|Upload| B[🐍 Python API]
    B -->|Parse & Fix Encoding| C[📦 JSON Data]
    C -->|Firestore SDK| D[🔥 Cloud Firestore]
    D -->|Real-time Query| E[📊 Dashboard]
    E -->|Filter & Export| F[📥 Excel .xlsx]
```

1. **Upload** — ครูวัดผลลากไฟล์ Excel (.xls) มาวางในระบบ
2. **Parse** — Python API อ่านไฟล์ด้วย `pandas` + `xlrd` พร้อมแก้ภาษาอัตโนมัติ
3. **Store** — ข้อมูลถูกจัดโครงสร้างและบันทึกลง Firestore
4. **Visualize** — Dashboard ดึงข้อมูลแบบ Real-time แสดงเป็นกราฟและตาราง
5. **Export** — ดาวน์โหลดข้อมูลที่ Filter แล้วออกมาเป็น `.xlsx`

---

## 🛡️ Security

- **Authentication:** Google OAuth 2.0 via Firebase Auth
- **Authorization:** Role-based access control (Admin-only dashboard)
- **New User Flow:** ผู้ใช้ใหม่จะได้สถานะ "รอการอนุมัติ" จนกว่า Admin จะปรับ Role ใน Firestore
- **Environment Variables:** API Keys จัดเก็บใน `.env.local` (ไม่ commit ขึ้น Git)

---

## 🌐 Deployment

โปรเจคนี้ Deploy บน **[Vercel](https://vercel.com)** พร้อมรองรับ:

- ✅ Next.js Static + Server-Side Rendering
- ✅ Python Serverless Functions (Flask API)  
- ✅ Auto SSL + Custom Domain

```bash
# Deploy via Git push (auto-deploy on Vercel)
git push origin main
```

> **Note:** ต้องตั้ง Environment Variables บน Vercel Dashboard ด้วย  
> และเพิ่ม Domain ของ Vercel ใน Firebase Auth → Authorized Domains

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Kanit Font |
| **Charts** | Recharts |
| **Export** | SheetJS (xlsx) |
| **Auth** | Firebase Authentication (Google SSO) |
| **Database** | Cloud Firestore |
| **API** | Python 3.12, Flask, Pandas, xlrd |
| **Hosting** | Vercel (Serverless) |
| **CI/CD** | GitHub → Vercel Auto Deploy |

---

## 👨‍💻 Developer

<table>
  <tr>
    <td align="center">
      <strong>นายสาธิต ศิริวัชน์</strong><br/>
      <sub>Full-Stack Developer</sub><br/>
      <sub>โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ</sub>
    </td>
  </tr>
</table>

---

## 📄 License

This project is proprietary software developed for Hongson Academy.  
All rights reserved © 2026 Coolnut Academy.

---

<p align="center">
  <sub>Built with ❤️ for Thai Education</sub>
</p>
