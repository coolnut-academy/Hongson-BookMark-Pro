# 📚 แผนงานและสถาปัตยกรรมระบบ (AI WebApp Architecture & Implementation Plan)
**โปรเจค:** ระบบวิเคราะห์และประมวลผลผลการเรียน โรงเรียนห้องสอนศึกษา ในพระอุปถัมภ์ฯ
**เป้าหมาย:** สร้าง Web Application สำหรับครูวัดผล เพื่ออัปโหลดไฟล์คะแนน (.xls) และแสดงผล Dashboard สถิติที่ครอบคลุม ยอมรับได้ในระดับสากลและมาตรฐานไทย พร้อมฟังก์ชันเปรียบเทียบและดาวน์โหลดรายงาน
**Tech Stack:** GitHub + Vercel + Firebase (Auth, Firestore)

---

## 🤖 คำแนะนำสำหรับ AI ที่ทำงานต่อ (AI Hand-off Instructions)
*อ่านเอกสารนี้ให้ครบถ้วนก่อนเริ่มเขียนโค้ด เอกสารนี้ถูกออกแบบมาให้เป็น Master Plan สำหรับการสร้างโปรเจคตั้งแต่ตั้นจนจบ แบ่งเป็นเฟส (Phases) อย่างชัดเจน โปรดทำงานทีละ Phase หากพร้อมให้สอบถามผู้ใช้งานว่าต้องการให้เริ่มพัฒนา Phase 1 ทันทีหรือไม่*
*⚠️ ข้อควรระวัง: ให้ออกแบบ UI ให้มีความเป็น Premium, Modern (ใช้โทนสีเหมาะสม การจัดการ Typography ที่ดี และอาจมีเอฟเฟกต์ Glassmorphism/Micro-animation หรืออื่นๆ เพื่อสร้างความประทับใจขั้นสุดแก่ User) หลีกเลี่ยง design ที่จำเจ!*

---

## 1. สถาปัตยกรรมระบบ (System Architecture)
### 1.1 Tech Stack 
- **Frontend:** Next.js (App Router), React, Tailwind CSS (สำหรับการออกแบบ Responsive & Premium Design) 
- **Chart/Visualization:** `recharts` หรือ `chart.js` สำหรับการทำ Interactive Graph
- **Backend/API (Vercel Integration):** เนื่องจากข้อจำกัดและลักษณะเฉพาะของไฟล์ Excel เก่า (`.xls` รูปแบบ 97-2003 ตาม `read_excel_guide.md`) แนะนำให้ใช้ Vercel Serverless Functions ประเภท Python API Route + `pandas` (ตั้งค่า `engine='xlrd'`) เพื่อประมวลผลแทนฝั่ง Client ป้องกันการค้างและช่วยทำ Defensive Parsing ได้มีประสิทธิภาพสูงสุด
- **Database & Services:**
  - **Firebase Authentication:** ระบบ Login (เน้น Email/Password) โดยผู้ใช้หลักคือ คุณครูผู้ทำหน้าที่วัดผล
  - **Cloud Firestore:** ทำหน้าที่เป็น Data Catalog เก็บข้อมูลหลังจากถูกสกัดออกมาแล้ว (สกัดการคำนวณเบื้องต้นไว้ก่อนเพื่อความรวดเร็วในการ Query)

---

## 2. การจัดการโครงสร้างข้อมูล (Data & Catalog Design)
เพื่อรองรับให้มีการดูสถิติย้อนหลังเป็นสิบปี และการดึงข้อมูลเพื่อเอาไปใช้ต่อในอนาคตได้อย่างทรงพลัง จำเป็นต้องแยกส่วนข้อมูลหลังจาก Parse ไฟล์ Excel บันทึกลง Firestore ดังนี้:

### 2.1 Firestore Database Rules -> `academic_data` Collection
เอกสารแต่ละชุดจะถูกจำแนกแยกด้วย ปีการศึกษา และระดับชั้น เพื่อความรวดเร็ว
- `year`: 2568, 2569... (Number)
- `term`: 1 หรือ 2 หรือ "สรุปชิ้นงาน" (String)
- `grade_level`: "ม.1", "ม.2", ... "ม.6" (String)
- `subjects`: Array of Objects ที่ Parse มาจากตาราง
  - `code`: รหัสวิชา (เช่น ท21101, อ31201)
  - `subject_name`: ชื่อวิชา
  - `credits`: หน่วยกิต
  - `type`: "พื้นฐาน" หรือ "เพิ่มเติม" *(คำนวณจากตัวเลขตัวที่ 4 ของรหัสวิชา: 1=พื้นฐาน, 2=เพิ่มเติม)*
  - `learning_area`: กลุ่มสาระการเรียนรู้ *(คำนวณจากตัวอักษรไทยตัวแรก เช่น ท=ภาษาไทย, ค=คณิตศาสตร์)*
  - `grades_count`: { `0`: x, `1`: x, `1.5`: x, `2`: x, `2.5`: x, `3`: x, `3.5`: x, `4`: x, `r`: x, `x`: x }
  - `total_students`: จำนวนนักเรียนทั้งหมด
  - `gpa`: เกรดเฉลี่ยรายวิชา (Number)

---

## 3. UI/UX Design & Layout (การออกแบบประสบการณ์ผู้ใช้งาน)
มุ่งเน้นความ "Friendly & Reliable" ใช้งานง่าย แต่ได้ความรู้สึกมั่นคงน่าเชื่อถือระดับสากล!
- **Cross-Device Responsive:** แสดงผลดีเยี่ยมทั้งภาพและกราฟใน Mobile, Tablet, PC และ Chromebook 
- **Dynamic Navigation:** กรณีเป็น Mobile ให้แสดงเป็น Hamburger Buttons เมนูด้านล่างหรือด้านข้าง 
- **Premium Themes:** ใช้ Typography ทันสมัย (Prompt หรือ Kanit), กล่อง Card สถิติขนาดใหญ่

### 3.1 องค์ประกอบหน้า Dashboard หลัก
**1. Filter Panel (ส่วนควบคุมข้อมูลระดับบนสุด):**
- Dropdown เลือกปีการศึกษา (รองรับการเลือกแบบ Single Year หรือ Compare 2 Years)
- Tabs/Pills เลือกช่วงชั้น (รวมทั้งหมด, เฉพาะ ม.ต้น, เฉพาะ ม.ปลาย, เจาะจงชั้น)
- Switch เลือกระหว่าง (ดูทุกกลุ่มสาระ / แยกกลุ่มสาระ) และ (รวมรหัสวิชา / แยกพื้นฐานกับเพิ่มเติม)

**2. Executive Summary Cards:**
- เกรดเฉลี่ยรวมระดับทั้งหมดประจําปี (Overall GPA)
- อัตราการรอดพ้น (ร้อยละของนักเรียนที่ไม่มี 0, ร, มส.) 
- จำนวนรายวิชาทั้งหมด / จำนวนนักเรียนทั้งหมด

**3. Interactive Data Visualization (สากลโลกที่ยอมรับทั่วไทย):**
- **Trending Line Chart:** กราฟเส้นเปรียบเทียบเกรดเฉลี่ยแต่ละกลุ่มสาระ ระหว่างปีที่เลือก กับปีก่อนหน้า
- **Stacked Bar Chart:** แสดงสัดส่วนนักเรียนที่ได้เกรดระดับต่างๆ (4, 3-3.5, 2-2.5, 1-1.5, 0/ร/มส) แยกตามกลุ่มสาระหรือรายวิชา
- **Radar Chart:** โชว์สมรรถนะภาพรวมรายกลุ่มสาระการเรียนรู้ของทั้งชั้นปี

**4. Data Table & Export System:**
- ตารางสรุปด้านล่างสุด สามารถกดย่อยดูรายวิชาได้ พร้อมความสามารถ **Export to Excel**

---

## 4. แผนปฏิบัติการสำหรับ AI (Implementation Roadmap)

### 🟢 Phase 1: Foundation & Firebase Integration
1. Initialize Project ด้วยโค้ดคำสั่ง Next.js App Router (พร้อม Tailwind CSS)
2. Setup Firebase Project Config ใน `.env.local`
3. เขียนระบบ Authentication พร้อมหน้า Login ที่สวยงาม และ Protect Route ไปยัง `/dashboard`
4. Setup Skeleton Layout (Sidebar/Top Nav & Mobile Hamburger) 

### 🟢 Phase 2: Defensive Excel Parser (API Route)
1. นำหลักการจากไฟล์ `read_excel_guide.md` แบบเคร่งครัด สร้าง API endpoint หรือ Service เพื่ออ่านไฟล์ Excel เก่า
2. สร้างหน้าอัปโหลดไฟล์ (Drag & Drop) ที่รองรับให้ผู้ใช้อัปโหลดครั้งละหลายๆ ไฟล์ได้ (เช่น ม.1 ถึง ม.6 ของปี 2568)
3. รันการสกัดข้อมูล จัดกลุ่ม "พื้นฐาน/เพิ่มเติม" และ "สาระการเรียนรู้" ด้วยรหัสวิชาตั้งแต่ขั้นตอนนี้

### 🟢 Phase 3: Firestore Data Saving & Cataloging
1. รับข้อมูลที่ Parse แล้ว ส่งต่อให้ Firebase Client/Admin SDK เขียนลงฐานข้อมูล `academic_data`
2. สร้างระบบจัดการ "อัปโหลดซ้ำ/ทับข้อมูลเดิม" ได้อย่างปลอดภัย (Upsert mechanism) เพื่อป้องกันข้อมูลผิดพลาด

### 🟢 Phase 4: Dynamic Dashboard & Visualization
1. พัฒนาดึงข้อมูลจาก Firestore ตาม Filter Panel ที่ผู้ใช้จิ้มเลือก (Real-time สะท้อนค่า)
2. นำ Component กราฟมิติเจาะลึกต่างๆ มาเชื่อมต่อข้อมูล
3. อิมพลีเมนต์การเทียบ "ผลต่างรายปี (YoY Comparison)" และการ "แยกกลุ่มวิชาพื้นฐาน/เพิ่มเติม" ตามรีเควสแบบ Real-time โดยไม่ค้าง

### 🟢 Phase 5: Exporting & Final Polish
1. สร้างปุ่ม Export Data โดยแปลงข้อมูลตารางสถิติที่ Filters แล้ว ให้กลายเป็นไฟล์ Excel (`.xlsx`) กลับออกมา
2. เก็บรายละเอียดสีสัน Animations ให้ WebApp นี้ดูล้ำสมัย ที่สุดเท่าที่เทคโนโลยียุคปัจจุบันจะอำนวย
