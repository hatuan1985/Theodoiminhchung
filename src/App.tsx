import React, { useState, useEffect } from "react";
import Header from "./components/Header.js";
import TeacherPortal from "./components/TeacherPortal.js";
import AdminDashboard from "./components/AdminDashboard.js";
import { Campaign, Department, Teacher, Submission, DatabaseState } from "./types.js";
import { RefreshCw, AlertCircle, BookOpen } from "lucide-react";

export default function App() {
  const [currentView, setCurrentView] = useState<"teacher" | "admin">("teacher");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load database state from full-stack server
  const loadDatabaseState = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/db");
      if (!response.ok) {
        throw new Error("Không thể kết nối đến máy chủ dữ liệu nhà trường.");
      }
      const data: DatabaseState = await response.json();
      setCampaigns(data.campaigns);
      setTeachers(data.teachers);
      setDepartments(data.departments);
      setSubmissions(data.submissions);
    } catch (err: any) {
      console.error("Error loading database state:", err);
      setError(err.message || "Đã xảy ra lỗi bất ngờ khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseState();
  }, []);

  // API handler: Add Campaign
  const handleAddCampaign = async (newCamp: { title: string; description: string; deadline: string }) => {
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCamp)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể khởi tạo đợt nộp chuyên môn.");
      }
      const savedCamp: Campaign = await response.json();
      setCampaigns(prev => [...prev, savedCamp]);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Update Campaign
  const handleUpdateCampaign = async (id: string, updates: Partial<Campaign>) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể cập nhật đợt nộp.");
      }
      const updatedCamp: Campaign = await response.json();
      setCampaigns(prev => prev.map(c => c.id === id ? updatedCamp : c));
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Delete Campaign
  const handleDeleteCampaign = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể xóa đợt nộp.");
      }
      setCampaigns(prev => prev.filter(c => c.id !== id));
      // Remove local submissions linked to deleted campaign
      setSubmissions(prev => prev.filter(s => s.campaignId !== id));
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Add Teacher
  const handleAddTeacher = async (newTeacher: { name: string; departmentId: string; phone?: string }) => {
    try {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeacher)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể thêm giáo viên.");
      }
      const savedTeacher: Teacher = await response.json();
      setTeachers(prev => [...prev, savedTeacher]);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Add Department
  const handleAddDepartment = async (name: string) => {
    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể tạo tổ chuyên môn.");
      }
      const savedDept: Department = await response.json();
      setDepartments(prev => [...prev, savedDept]);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Import Teachers (CSV)
  const handleImportTeachers = async (csvContent: string) => {
    try {
      const response = await fetch("/api/teachers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể xử lý nhập danh sách.");
      }
      const data = await response.json();
      // Reload entire DB state to capture newly imported teachers and potentially new departments
      await loadDatabaseState();
      return data;
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Delete Teacher
  const handleDeleteTeacher = async (id: string) => {
    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể xóa giáo viên.");
      }
      setTeachers(prev => prev.filter(t => t.id !== id));
      // Remove submissions linked to deleted teacher
      setSubmissions(prev => prev.filter(s => s.teacherId !== id));
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Update Teacher
  const handleUpdateTeacher = async (id: string, updates: { name: string; departmentId: string; phone?: string }) => {
    try {
      const response = await fetch(`/api/teachers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể cập nhật thông tin giáo viên.");
      }
      const updatedTeacher: Teacher = await response.json();
      setTeachers(prev => prev.map(t => t.id === id ? updatedTeacher : t));
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Create/Replace Submission
  const handleNewSubmission = async (submissionPayload: any) => {
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gửi minh chứng chuyên môn thất bại.");
      }
      const savedSub: Submission = await response.json();
      
      // Update state: replace if there was an existing one for same campaign and teacher
      setSubmissions(prev => {
        const filtered = prev.filter(
          s => !(s.campaignId === savedSub.campaignId && s.teacherId === savedSub.teacherId)
        );
        return [...filtered, savedSub];
      });
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Delete Submission
  const handleDeleteSubmission = async (id: string) => {
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Không thể xóa minh chứng.");
      }
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // API handler: Reset DB
  const handleResetDB = async () => {
    // Calling import with null triggers server re-initialisation
    // States are re-loaded post reload in the BackupSettings component
    setCampaigns([]);
    setTeachers([]);
    setDepartments([]);
    setSubmissions([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-900" id="main-app-container">
      {/* Universal Header */}
      <Header currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
            <p className="text-sm font-semibold text-gray-500">Đang khởi tạo cơ sở dữ liệu nhà trường...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-16 p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4 shadow-sm">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-bold text-red-950">Lỗi kết nối hệ thống</h2>
            <p className="text-sm text-red-700 leading-relaxed">
              {error}
            </p>
            <button
              onClick={loadDatabaseState}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Thử kết nối lại
            </button>
          </div>
        ) : (
          <>
            {currentView === "teacher" ? (
              <TeacherPortal
                campaigns={campaigns}
                teachers={teachers}
                departments={departments}
                submissions={submissions}
                onNewSubmission={handleNewSubmission}
                loading={loading}
              />
            ) : (
              <AdminDashboard
                campaigns={campaigns}
                teachers={teachers}
                departments={departments}
                submissions={submissions}
                onAddCampaign={handleAddCampaign}
                onUpdateCampaign={handleUpdateCampaign}
                onDeleteCampaign={handleDeleteCampaign}
                onAddTeacher={handleAddTeacher}
                onAddDepartment={handleAddDepartment}
                onImportTeachers={handleImportTeachers}
                onDeleteTeacher={handleDeleteTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteSubmission={handleDeleteSubmission}
                onResetDB={handleResetDB}
                loading={loading}
              />
            )}
          </>
        )}
      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-white border-t border-gray-100 py-6" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400 font-medium space-y-1">
          <p>© 2026 Trường Phổ thông Dân tộc Nội trú THCS & THPT Mai Sơn</p>
          <p className="font-mono text-[10px] text-gray-300">Hệ thống Thu thập & Theo dõi Minh chứng Chuyên môn nội bộ v1.0.0</p>
        </div>
      </footer>
    </div>
  );
}
