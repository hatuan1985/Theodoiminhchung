import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Campaign, Department, Teacher, Submission, DatabaseState } from "./src/types.js";

// Robust detection of __filename and __dirname working in both ESM (development) and CJS (compiled production bundle)
let myFilename = "";
let myDirname = "";

try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    myFilename = fileURLToPath(import.meta.url);
    myDirname = path.dirname(myFilename);
  }
} catch (e) {
  // ESM detection failed, we might be in CommonJS
}

if (!myFilename && typeof __filename !== "undefined") {
  myFilename = __filename;
}
if (!myDirname && typeof __dirname !== "undefined") {
  myDirname = __dirname;
}

const __filenameFallback = myFilename;
const __dirnameFallback = myDirname;

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Pre-populated data for Trường PTDTNT THCS & THPT Mai Sơn
const defaultDepartments: Department[] = [
  { id: "dept-bgh", name: "BGH" },
  { id: "dept-khtn1", name: "KHTN1" },
  { id: "dept-khtn2", name: "KHTN2" },
  { id: "dept-khxh", name: "KHXH" },
  { id: "dept-van-phong", name: "Văn phòng" }
];

const defaultTeachers: Teacher[] = [
  { id: "t-1", name: "Nguyễn Văn Hùng", departmentId: "dept-bgh", phone: "0912345678" },
  { id: "t-2", name: "Lê Thị Mai", departmentId: "dept-bgh", phone: "0987654321" },
  { id: "t-3", name: "Trần Thanh Sơn", departmentId: "dept-khtn1", phone: "0901234567" },
  { id: "t-4", name: "Nguyễn Thu Trang", departmentId: "dept-khtn1", phone: "0934567890" },
  { id: "t-5", name: "Phạm Thị Tuyết", departmentId: "dept-khtn1", phone: "0945678901" },
  { id: "t-6", name: "Vũ Hoài Thương", departmentId: "dept-khtn1", phone: "0956789012" },
  { id: "t-7", name: "Đỗ Hồng Hạnh", departmentId: "dept-khtn2", phone: "0967890123" },
  { id: "t-8", name: "Hoàng Minh Đức", departmentId: "dept-khtn2", phone: "0978901234" },
  { id: "t-9", name: "Phùng Thế Anh", departmentId: "dept-khtn2", phone: "0989012345" },
  { id: "t-10", name: "Đinh Thị Thảo", departmentId: "dept-khtn2", phone: "0990123456" },
  { id: "t-11", name: "Lò Văn Hợp", departmentId: "dept-khxh", phone: "0321654987" },
  { id: "t-12", name: "Quàng Thị Biên", departmentId: "dept-khxh", phone: "0354678123" },
  { id: "t-13", name: "Tòng Văn Hoài", departmentId: "dept-khxh", phone: "0367891234" },
  { id: "t-14", name: "Lò Thị Hương", departmentId: "dept-khxh", phone: "0378901235" },
  { id: "t-15", name: "Nguyễn Bích Ngọc", departmentId: "dept-khxh", phone: "0389012346" },
  { id: "t-16", name: "Lò Thị Dung", departmentId: "dept-khxh", phone: "0390123457" },
  { id: "t-17", name: "Hà Văn Nam", departmentId: "dept-van-phong", phone: "0812345678" },
  { id: "t-18", name: "Nguyễn Minh Triết", departmentId: "dept-van-phong", phone: "0823456789" },
  { id: "t-19", name: "Điêu Thị Thúy", departmentId: "dept-van-phong", phone: "0834567890" },
  { id: "t-20", name: "Lường Thị Hoa", departmentId: "dept-van-phong", phone: "0845678901" }
];

const defaultCampaigns: Campaign[] = [
  {
    id: "camp-bdtx",
    title: "Bồi dưỡng thường xuyên - Học kỳ II (Năm học 2025-2026)",
    description: "Nộp minh chứng hoàn thành các mô-đun bồi dưỡng thường xuyên theo quy định của Bộ Giáo dục & Đào tạo trong năm học.",
    deadline: "2026-08-30",
    status: "active",
    createdAt: "2026-05-15T08:00:00Z"
  },
  {
    id: "camp-sgk",
    title: "Tập huấn Sách giáo khoa mới - Lớp 9 & Lớp 12",
    description: "Nộp chứng nhận hoàn thành chương trình tập huấn sách giáo khoa mới biên soạn theo Chương trình GDPT 2018.",
    deadline: "2026-07-20",
    status: "active",
    createdAt: "2026-06-01T09:30:00Z"
  },
  {
    id: "camp-kns",
    title: "Khảo sát Kỹ năng số & Ứng dụng CNTT trong giảng dạy",
    description: "Báo cáo tự đánh giá năng lực số và đính kèm kế hoạch bài dạy (giáo án) có ứng dụng thiết bị công nghệ hoặc phần mềm dạy học tích cực.",
    deadline: "2026-06-15",
    status: "closed",
    createdAt: "2026-05-01T14:00:00Z"
  }
];

// Helper to write mock files
const writeMockFiles = () => {
  const mockImagePath = path.join(UPLOADS_DIR, "mock-image.png");
  if (!fs.existsSync(mockImagePath)) {
    // 1x1 transparent pixel base64
    const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    fs.writeFileSync(mockImagePath, Buffer.from(base64Png, "base64"));
  }

  const mockPdfPath = path.join(UPLOADS_DIR, "mock-pdf.pdf");
  if (!fs.existsSync(mockPdfPath)) {
    // Minimal valid PDF text
    const minimalPdf = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 51 >>\nstream\nBT /F1 12 Tf 72 712 Td (Minh chung tap huan SGK Lop 9 - Nguyen Van Hung) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000224 00000 n\ntrailer\n<< /Size 5 >>\nstartxref\n326\n%%EOF`;
    fs.writeFileSync(mockPdfPath, minimalPdf);
  }
};

const defaultSubmissions: Submission[] = [
  {
    id: "sub-1",
    campaignId: "camp-sgk",
    teacherId: "t-1",
    fileName: "Chung_nhan_SGK_Toan_9.pdf",
    fileSize: 345,
    fileType: "application/pdf",
    uploadedAt: "2026-06-15T10:15:30Z",
    fileId: "mock-pdf.pdf",
    comment: "Đã hoàn thành tập huấn SGK môn Toán lớp 9 mới."
  },
  {
    id: "sub-2",
    campaignId: "camp-bdtx",
    teacherId: "t-2",
    fileName: "Minh_chung_BDTX_Modun_8.png",
    fileSize: 68,
    fileType: "image/png",
    uploadedAt: "2026-06-20T16:45:12Z",
    fileId: "mock-image.png",
    comment: "Minh chứng hoàn thành mô-đun 8 bồi dưỡng thường xuyên."
  }
];

// Load or initialize DB
const getDBState = (): DatabaseState => {
  if (!fs.existsSync(DB_FILE)) {
    const initialState: DatabaseState = {
      campaigns: defaultCampaigns,
      departments: defaultDepartments,
      teachers: defaultTeachers,
      submissions: defaultSubmissions
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), "utf-8");
    writeMockFiles();
    return initialState;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    // Migrate from old departments to new ones ONLY ONCE
    const hasOldDepts = (parsed.departments || []).some((d: any) => d.id === "dept-toan-tin");
    if (hasOldDepts || !parsed.teachers || parsed.teachers.length === 0) {
      parsed.departments = defaultDepartments;
      parsed.teachers = defaultTeachers;
      
      // Filter out submissions with obsolete teacher IDs
      const validTeacherIds = new Set(defaultTeachers.map(t => t.id));
      parsed.submissions = (parsed.submissions || []).filter((s: any) => validTeacherIds.has(s.teacherId));
      
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }
    return parsed;
  } catch (error) {
    console.error("Error reading database file, resetting to initial state", error);
    const initialState: DatabaseState = {
      campaigns: defaultCampaigns,
      departments: defaultDepartments,
      teachers: defaultTeachers,
      submissions: defaultSubmissions
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), "utf-8");
    return initialState;
  }
};

const saveDBState = (state: DatabaseState) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Increase payload size limit to support base64 file uploads (3MB max requested, so 10MB limit is generous)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // API Route: Check Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Get Database State
  app.get("/api/db", (req, res) => {
    const state = getDBState();
    res.json(state);
  });

  // API Route: Campaigns
  app.get("/api/campaigns", (req, res) => {
    const state = getDBState();
    res.json(state.campaigns);
  });

  app.post("/api/campaigns", (req, res) => {
    const state = getDBState();
    const { title, description, deadline, status, excludedTeacherIds } = req.body;
    
    if (!title || !deadline) {
      return res.status(400).json({ error: "Thiếu tiêu đề hoặc hạn chót" });
    }

    const newCampaign: Campaign = {
      id: "camp-" + Date.now().toString(),
      title,
      description: description || "",
      deadline,
      status: status || "active",
      createdAt: new Date().toISOString(),
      excludedTeacherIds: excludedTeacherIds || []
    };

    state.campaigns.push(newCampaign);
    saveDBState(state);
    res.status(201).json(newCampaign);
  });

  app.put("/api/campaigns/:id", (req, res) => {
    const state = getDBState();
    const { id } = req.params;
    const { title, description, deadline, status, excludedTeacherIds } = req.body;

    const campaignIndex = state.campaigns.findIndex(c => c.id === id);
    if (campaignIndex === -1) {
      return res.status(404).json({ error: "Không tìm thấy đợt khảo sát/bồi dưỡng" });
    }

    const updatedCampaign = {
      ...state.campaigns[campaignIndex],
      title: title !== undefined ? title : state.campaigns[campaignIndex].title,
      description: description !== undefined ? description : state.campaigns[campaignIndex].description,
      deadline: deadline !== undefined ? deadline : state.campaigns[campaignIndex].deadline,
      status: status !== undefined ? status : state.campaigns[campaignIndex].status,
      excludedTeacherIds: excludedTeacherIds !== undefined ? excludedTeacherIds : (state.campaigns[campaignIndex].excludedTeacherIds || [])
    };

    state.campaigns[campaignIndex] = updatedCampaign;
    saveDBState(state);
    res.json(updatedCampaign);
  });

  app.delete("/api/campaigns/:id", (req, res) => {
    const state = getDBState();
    const { id } = req.params;

    const campaignExists = state.campaigns.some(c => c.id === id);
    if (!campaignExists) {
      return res.status(404).json({ error: "Không tìm thấy đợt khảo sát/bồi dưỡng" });
    }

    // Filter out submissions for this campaign and delete physical files
    const submissionsToDelete = state.submissions.filter(s => s.campaignId === id);
    submissionsToDelete.forEach(sub => {
      const filePath = path.join(UPLOADS_DIR, sub.fileId);
      if (fs.existsSync(filePath) && !sub.fileId.startsWith("mock-")) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error(`Error deleting file ${sub.fileId}`, e);
        }
      }
    });

    state.campaigns = state.campaigns.filter(c => c.id !== id);
    state.submissions = state.submissions.filter(s => s.campaignId !== id);
    saveDBState(state);
    res.json({ success: true, message: "Đã xóa đợt khảo sát và các minh chứng liên quan" });
  });

  // API Route: Teachers
  app.get("/api/teachers", (req, res) => {
    const state = getDBState();
    res.json(state.teachers);
  });

  app.post("/api/teachers", (req, res) => {
    const state = getDBState();
    const { name, departmentId, phone } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({ error: "Thiếu tên giáo viên hoặc tổ chuyên môn" });
    }

    const newTeacher: Teacher = {
      id: "t-" + Date.now().toString(),
      name,
      departmentId,
      phone: phone || ""
    };

    state.teachers.push(newTeacher);
    saveDBState(state);
    res.status(201).json(newTeacher);
  });

  // Batch import teachers via CSV/Text content
  app.post("/api/teachers/import", (req, res) => {
    const state = getDBState();
    const { csvContent } = req.body;

    if (!csvContent || typeof csvContent !== "string") {
      return res.status(400).json({ error: "Dữ liệu CSV không hợp lệ" });
    }

    const lines = csvContent.split("\n");
    let importCount = 0;
    const errors: string[] = [];

    lines.forEach((line, index) => {
      // Skip header or empty line
      if (index === 0 && (line.toLowerCase().includes("tên") || line.toLowerCase().includes("name"))) {
        return;
      }
      if (!line.trim()) return;

      // Parse comma or semicolon separated values
      const parts = line.split(/[;,]/).map(p => p.trim());
      if (parts.length < 2) {
        errors.push(`Dòng ${index + 1}: Thiếu thông tin (yêu cầu ít nhất Tên và Tên Tổ chuyên môn)`);
        return;
      }

      const name = parts[0];
      const deptName = parts[1];
      const phone = parts[2] || "";

      if (!name || !deptName) {
        errors.push(`Dòng ${index + 1}: Tên hoặc Tổ chuyên môn trống`);
        return;
      }

      // Find or create department matching the name
      let department = state.departments.find(d => d.name.toLowerCase() === deptName.toLowerCase());
      if (!department) {
        const deptId = "dept-" + Date.now().toString() + "-" + Math.random().toString(36).substring(2, 5);
        department = { id: deptId, name: deptName };
        state.departments.push(department);
      }

      // Create new teacher
      const newTeacher: Teacher = {
        id: "t-" + Date.now().toString() + "-" + importCount,
        name,
        departmentId: department.id,
        phone
      };

      state.teachers.push(newTeacher);
      importCount++;
    });

    saveDBState(state);
    res.json({ success: true, count: importCount, errors });
  });

  app.delete("/api/teachers/:id", (req, res) => {
    const state = getDBState();
    const { id } = req.params;

    const teacherExists = state.teachers.some(t => t.id === id);
    if (!teacherExists) {
      return res.status(404).json({ error: "Không tìm thấy giáo viên" });
    }

    // Delete teacher submissions and files
    const teacherSubmissions = state.submissions.filter(s => s.teacherId === id);
    teacherSubmissions.forEach(sub => {
      const filePath = path.join(UPLOADS_DIR, sub.fileId);
      if (fs.existsSync(filePath) && !sub.fileId.startsWith("mock-")) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error(`Error deleting file ${sub.fileId}`, e);
        }
      }
    });

    state.teachers = state.teachers.filter(t => t.id !== id);
    state.submissions = state.submissions.filter(s => s.teacherId !== id);
    saveDBState(state);
    res.json({ success: true, message: "Đã xóa giáo viên và các minh chứng liên quan" });
  });

  app.put("/api/teachers/:id", (req, res) => {
    const state = getDBState();
    const { id } = req.params;
    const { name, departmentId, phone } = req.body;

    const teacherIndex = state.teachers.findIndex(t => t.id === id);
    if (teacherIndex === -1) {
      return res.status(404).json({ error: "Không tìm thấy giáo viên" });
    }

    if (!name || !departmentId) {
      return res.status(400).json({ error: "Thiếu tên giáo viên hoặc tổ chuyên môn" });
    }

    const updatedTeacher = {
      ...state.teachers[teacherIndex],
      name,
      departmentId,
      phone: phone || ""
    };

    state.teachers[teacherIndex] = updatedTeacher;
    saveDBState(state);
    res.json(updatedTeacher);
  });

  // API Route: Departments
  app.get("/api/departments", (req, res) => {
    const state = getDBState();
    res.json(state.departments);
  });

  app.post("/api/departments", (req, res) => {
    const state = getDBState();
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Thiếu tên tổ chuyên môn" });
    }

    const deptId = "dept-" + Date.now().toString();
    const newDept: Department = { id: deptId, name };
    
    state.departments.push(newDept);
    saveDBState(state);
    res.status(201).json(newDept);
  });

  // API Route: Submissions
  app.post("/api/submissions", (req, res) => {
    const state = getDBState();
    const { campaignId, teacherId, fileName, fileType, fileSize, fileData, comment } = req.body;

    if (!campaignId || !teacherId || !fileName || !fileData) {
      return res.status(400).json({ error: "Thiếu thông tin nộp minh chứng bắt buộc" });
    }

    // Limit size check: 3MB = 3,145,728 bytes
    if (fileSize > 3 * 1024 * 1024) {
      return res.status(400).json({ error: "Kích thước tệp vượt quá giới hạn 3MB" });
    }

    // Verify campaign is active
    const campaign = state.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      return res.status(404).json({ error: "Không tìm thấy đợt khảo sát/bồi dưỡng" });
    }
    if (campaign.status === "closed") {
      return res.status(400).json({ error: "Đợt khảo sát/bồi dưỡng này đã đóng, không thể nộp thêm minh chứng" });
    }

    // Verify teacher exists
    const teacher = state.teachers.find(t => t.id === teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Không tìm thấy giáo viên trong danh sách" });
    }

    // Remove any previous submission by this teacher for this campaign (replace old submission)
    const existingSubIndex = state.submissions.findIndex(
      s => s.campaignId === campaignId && s.teacherId === teacherId
    );

    if (existingSubIndex !== -1) {
      const oldSub = state.submissions[existingSubIndex];
      const oldFilePath = path.join(UPLOADS_DIR, oldSub.fileId);
      if (fs.existsSync(oldFilePath) && !oldSub.fileId.startsWith("mock-")) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (e) {
          console.error(`Error deleting old file ${oldSub.fileId}`, e);
        }
      }
      state.submissions.splice(existingSubIndex, 1);
    }

    // Save uploaded file to disk
    const fileId = `${Date.now()}_${teacherId}_${fileName.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, fileId);

    // Write fileData (strip base64 prefix if present)
    const base64Data = fileData.replace(/^data:.*?;base64,/, "");
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    const newSubmission: Submission = {
      id: "sub-" + Date.now().toString(),
      campaignId,
      teacherId,
      fileName,
      fileSize,
      fileType,
      uploadedAt: new Date().toISOString(),
      fileId,
      comment: comment || ""
    };

    state.submissions.push(newSubmission);
    saveDBState(state);
    res.status(201).json(newSubmission);
  });

  app.delete("/api/submissions/:id", (req, res) => {
    const state = getDBState();
    const { id } = req.params;

    const subIndex = state.submissions.findIndex(s => s.id === id);
    if (subIndex === -1) {
      return res.status(404).json({ error: "Không tìm thấy minh chứng" });
    }

    const sub = state.submissions[subIndex];
    const filePath = path.join(UPLOADS_DIR, sub.fileId);

    if (fs.existsSync(filePath) && !sub.fileId.startsWith("mock-")) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error(`Error deleting file ${sub.fileId}`, e);
      }
    }

    state.submissions.splice(subIndex, 1);
    saveDBState(state);
    res.json({ success: true, message: "Đã xóa minh chứng thành công" });
  });

  // API Route: Serve uploaded files for Preview & Download
  app.get("/api/files/:id", (req, res) => {
    const { id } = req.params;
    const filePath = path.join(UPLOADS_DIR, id);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Không tìm thấy tệp tin" });
    }

    // Find submission metadata to set proper headers if possible
    const state = getDBState();
    const sub = state.submissions.find(s => s.fileId === id);

    let contentType = "";
    let fileName = id;

    if (sub) {
      contentType = sub.fileType || "";
      fileName = sub.fileName;
    }

    // Fallback content-type detection based on extension if content type is empty or missing
    if (!contentType) {
      const ext = path.extname(fileName).toLowerCase();
      if (ext === ".pdf") {
        contentType = "application/pdf";
      } else if (ext === ".png") {
        contentType = "image/png";
      } else if (ext === ".jpg" || ext === ".jpeg") {
        contentType = "image/jpeg";
      } else if (ext === ".doc") {
        contentType = "application/msword";
      } else if (ext === ".docx") {
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (ext === ".xls") {
        contentType = "application/vnd.ms-excel";
      } else if (ext === ".xlsx") {
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (ext === ".csv") {
        contentType = "text/csv";
      } else {
        contentType = "application/octet-stream";
      }
    }

    res.setHeader("Content-Type", contentType);
    // RFC 5987 compatible Content-Disposition header with safe filename for all browsers (iOS, Safari, Android, Chrome, etc.)
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );

    fs.createReadStream(filePath).pipe(res);
  });

  // Backup & Restore System
  // API Route: Export Backup JSON containing DB and ALL Base64 encoded files
  app.get("/api/backup/export", (req, res) => {
    try {
      const state = getDBState();
      const files: { [fileId: string]: string } = {};

      state.submissions.forEach(sub => {
        const filePath = path.join(UPLOADS_DIR, sub.fileId);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          files[sub.fileId] = fileBuffer.toString("base64");
        }
      });

      // Also export mock-image.png and mock-pdf.pdf just in case
      ["mock-image.png", "mock-pdf.pdf"].forEach(mFile => {
        const filePath = path.join(UPLOADS_DIR, mFile);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          files[mFile] = fileBuffer.toString("base64");
        }
      });

      const backupData = {
        db: state,
        files
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="Backup_HeThongMinhChung_MaiSon_${new Date().toISOString().slice(0, 10)}.json"`);
      res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
      console.error("Backup export error", error);
      res.status(500).json({ error: "Không thể tạo tập tin sao lưu dữ liệu" });
    }
  });

  // API Route: Import Backup JSON
  app.post("/api/backup/import", (req, res) => {
    try {
      const { db, files } = req.body;

      if (!db || !db.campaigns || !db.teachers || !db.departments || !db.submissions || !files) {
        return res.status(400).json({ error: "Định dạng tập tin sao lưu không hợp lệ" });
      }

      // Restore DB State
      saveDBState(db as DatabaseState);

      // Restore files on disk
      Object.keys(files).forEach(fileId => {
        const fileContentBase64 = files[fileId];
        const filePath = path.join(UPLOADS_DIR, fileId);
        fs.writeFileSync(filePath, Buffer.from(fileContentBase64, "base64"));
      });

      res.json({ success: true, message: "Đã phục hồi dữ liệu hệ thống thành công!" });
    } catch (error) {
      console.error("Backup import error", error);
      res.status(500).json({ error: "Lỗi trong quá trình khôi phục dữ liệu từ tập tin sao lưu" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
