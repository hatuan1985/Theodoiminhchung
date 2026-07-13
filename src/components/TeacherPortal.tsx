import React, { useState, useEffect, useRef } from "react";
import { Upload, File, FileText, FileSpreadsheet, CheckCircle, AlertCircle, Eye, RefreshCw, ChevronDown, Search, Check, X, User, LogOut } from "lucide-react";
import { Campaign, Department, Teacher, Submission } from "../types.js";
import FilePreviewModal from "./FilePreviewModal.js";

interface TeacherPortalProps {
  campaigns: Campaign[];
  teachers: Teacher[];
  departments: Department[];
  submissions: Submission[];
  onNewSubmission: (submission: any) => Promise<void>;
  loading: boolean;
}

export default function TeacherPortal({
  campaigns,
  teachers,
  departments,
  submissions,
  onNewSubmission,
  loading: globalLoading
}: TeacherPortalProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [searchTeacher, setSearchTeacher] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [successSubmission, setSuccessSubmission] = useState<Submission | null>(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ id: string; name: string; type: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTeacherDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter active campaigns
  const activeCampaigns = campaigns.filter(c => c.status === "active");

  // Auto-select first active campaign on load
  useEffect(() => {
    if (activeCampaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(activeCampaigns[0].id);
    }
  }, [activeCampaigns, selectedCampaignId]);

  // Get selected campaign
  const currentCampaign = campaigns.find(c => c.id === selectedCampaignId);

  // Get selected teacher
  const currentTeacher = teachers.find(t => t.id === selectedTeacherId);
  const currentTeacherDept = currentTeacher
    ? departments.find(d => d.id === currentTeacher.departmentId)?.name
    : "";

  // Check if this teacher has already submitted for this campaign
  const existingSubmission = submissions.find(
    s => s.campaignId === selectedCampaignId && s.teacherId === selectedTeacherId
  );

  // Auto-fill form if existing submission is found
  useEffect(() => {
    if (existingSubmission) {
      setComment(existingSubmission.comment || "");
    } else {
      setComment("");
    }
    setFile(null);
    setErrorMessage("");
    setAgreementAccepted(false);
  }, [selectedCampaignId, selectedTeacherId, existingSubmission]);

  // Handle department filter change
  const handleDeptFilterChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    setSearchTeacher("");
    // If current selected teacher is not in this department, reset selected teacher
    if (deptId !== "all" && currentTeacher && currentTeacher.departmentId !== deptId) {
      setSelectedTeacherId("");
    }
  };

  // Filter teachers based on search query and department filter
  const filteredTeachers = teachers.filter(t => {
    const excludedIds = currentCampaign?.excludedTeacherIds || [];
    if (excludedIds.includes(t.id)) return false;
    
    const deptMatch = selectedDeptId === "all" || t.departmentId === selectedDeptId;
    const nameMatch = t.name.toLowerCase().includes(searchTeacher.toLowerCase());
    return deptMatch && nameMatch;
  });

  // Group teachers by department
  const teachersByDept = departments.map(dept => {
    return {
      deptName: dept.name,
      teachers: filteredTeachers.filter(t => t.departmentId === dept.id)
    };
  }).filter(group => group.teachers.length > 0);

  // Drag handers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (uploadedFile: File) => {
    setErrorMessage("");
    // Limit: 3MB
    const limit = 3 * 1024 * 1024;
    if (uploadedFile.size > limit) {
      setErrorMessage("Kích thước tệp tin vượt quá giới hạn 3MB. Vui lòng nén hoặc chọn tệp nhỏ hơn.");
      setFile(null);
      return;
    }

    // Allowed types: PNG, JPG, JPEG, PDF, Word (doc/docx), Excel (xls/xlsx), CSV
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"];
    const ext = "." + uploadedFile.name.split(".").pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      setErrorMessage("Định dạng tệp không được hỗ trợ. Chỉ chấp nhận Ảnh (PNG, JPG, JPEG) hoặc Tài liệu (PDF, Word, Excel, CSV).");
      setFile(null);
      return;
    }

    setFile(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    return parseFloat((bytes / k).toFixed(1)) + " KB";
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Convert file to Base64
  const fileToBase64 = (fileObj: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId || !selectedTeacherId) {
      setErrorMessage("Vui lòng chọn đợt bồi dưỡng và họ tên giáo viên.");
      return;
    }

    if (!file && !existingSubmission) {
      setErrorMessage("Vui lòng tải lên tập tin minh chứng.");
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      let fileData = "";
      let fileName = "";
      let fileType = "";
      let fileSize = 0;

      if (file) {
        setUploadProgress(50);
        fileData = await fileToBase64(file);
        fileName = file.name;
        fileType = file.type;
        fileSize = file.size;
      } else if (existingSubmission) {
        // Keeping old submission but updating comment
        // Let's call API without changing file or update with existing file
        // To keep it simple, if no new file uploaded, but there's an existing submission and they hit submit, we don't change anything or just update comment
        setUploading(false);
        setSuccessSubmission(existingSubmission);
        return;
      }

      setUploadProgress(80);

      const submissionPayload = {
        campaignId: selectedCampaignId,
        teacherId: selectedTeacherId,
        fileName,
        fileType,
        fileSize,
        fileData,
        comment
      };

      await onNewSubmission(submissionPayload);
      
      setUploadProgress(100);
      
      // Find the newly added/updated submission to show success details
      setTimeout(() => {
        // Wait a small bit for state to update
        setUploading(false);
      }, 500);

    } catch (err: any) {
      setUploading(false);
      setErrorMessage(err.message || "Đã xảy ra lỗi trong quá trình tải lên.");
    }
  };

  // When submission is successful, set the successSubmission state
  useEffect(() => {
    if (selectedCampaignId && selectedTeacherId && !uploading && file === null) {
      const latestSub = submissions.find(
        s => s.campaignId === selectedCampaignId && s.teacherId === selectedTeacherId
      );
      if (latestSub && (successSubmission === null || successSubmission.uploadedAt !== latestSub.uploadedAt)) {
        // Only set success if we actually just uploaded a new file
        if (uploadProgress === 100) {
          setSuccessSubmission(latestSub);
          setUploadProgress(0);
        }
      }
    }
  }, [submissions, selectedCampaignId, selectedTeacherId, uploading, file]);

  const resetForm = () => {
    setFile(null);
    setComment("");
    setSuccessSubmission(null);
    setErrorMessage("");
    setUploadProgress(0);
    setAgreementAccepted(false);
  };

  const totalTeachersCount = teachers.length;
  const submittedCount = submissions.filter(s => s.campaignId === selectedCampaignId).length;

  const getShortDeptName = (name: string) => {
    return name.replace(/^Tổ\s+/, "");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="teacher-portal-view">
      {successSubmission ? (
        // Success Screen
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden text-center p-8 animate-in fade-in duration-300">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-950">Nộp Minh Chứng Thành Công!</h2>
          <p className="text-sm text-gray-500 mt-2">
            Hệ thống đã ghi nhận minh chứng của Thầy/Cô trên máy chủ nhà trường.
          </p>

          {/* Submission Details Card */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 mt-6 text-left max-w-lg mx-auto">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">Thông tin biên nhận</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between py-1 border-b border-emerald-100/40">
                <span className="text-gray-500">Giáo viên:</span>
                <span className="font-semibold text-gray-900">{currentTeacher?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-100/40">
                <span className="text-gray-500">Tổ chuyên môn:</span>
                <span className="font-semibold text-gray-900">{currentTeacherDept}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-100/40">
                <span className="text-gray-500">Đợt nộp:</span>
                <span className="font-semibold text-gray-900 truncate max-w-[280px]" title={currentCampaign?.title}>
                  {currentCampaign?.title}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-100/40">
                <span className="text-gray-500">Tập tin:</span>
                <span className="font-medium text-emerald-700 truncate max-w-[280px]" title={successSubmission.fileName}>
                  {successSubmission.fileName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-100/40">
                <span className="text-gray-500">Dung lượng:</span>
                <span className="font-mono text-xs text-gray-800">{formatSize(successSubmission.fileSize)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Thời gian nhận:</span>
                <span className="font-mono text-xs text-gray-800">
                  {new Date(successSubmission.uploadedAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
            <button
              onClick={() => {
                setPreviewData({
                  id: successSubmission.fileId,
                  name: successSubmission.fileName,
                  type: successSubmission.fileType,
                  size: successSubmission.fileSize
                });
                setPreviewOpen(true);
              }}
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              <span>Xem trực tiếp minh chứng</span>
            </button>
            <button
              onClick={() => {
                setSelectedTeacherId("");
                setSearchTeacher("");
                resetForm();
              }}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-[#00875a] hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/10 transition-colors duration-200 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Thoát</span>
            </button>
          </div>
        </div>
      ) : (
        // Standard Submission Form with Premium Visual design matching the image perfectly
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100/60 overflow-hidden">
          {/* Header Banner in Vietnamese Education Emerald Color Theme */}
          <div className="bg-[#007A48] text-white p-6 sm:p-8 relative overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-white/[0.03] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-950/45 border border-emerald-500/20 rounded-full text-[10px] font-bold tracking-wider uppercase text-emerald-200">
                    CỔNG THÔNG TIN GIÁO VIÊN
                  </span>
                  
                  {/* Campaign selector integrated inside header */}
                  <div className="relative inline-block">
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      disabled={uploading}
                      className="bg-[#005c36]/80 hover:bg-[#005c36] text-white text-[11px] font-bold py-1 pl-3 pr-7 rounded-full border border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-400 appearance-none cursor-pointer transition-all duration-200"
                    >
                      {activeCampaigns.map((c) => (
                        <option key={c.id} value={c.id} className="text-gray-900 font-medium">
                          Đợt: {c.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-emerald-200 pointer-events-none" />
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white uppercase">
                  NỘP MINH CHỨNG KHẢO SÁT / BỒI DƯỠNG
                </h1>
                
                <p className="text-yellow-300 font-extrabold text-base sm:text-lg uppercase tracking-wide leading-snug">
                  {currentCampaign ? currentCampaign.title.toUpperCase() : "VUI LÒNG CHỌN ĐỢT KHẢO SÁT / BỒI DƯỠNG"}
                </p>
                
                {currentCampaign && (
                  <p className="text-emerald-50 text-xs sm:text-sm italic font-medium leading-relaxed max-w-xl">
                    &ldquo;{currentCampaign.description}&rdquo;
                  </p>
                )}
              </div>

              {/* Solid Emerald Progress Panel matching the image */}
              <div className="flex items-center justify-start md:justify-end shrink-0">
                <div className="bg-[#005c36] border border-emerald-500/20 rounded-2xl px-5 py-3 text-center min-w-[130px] shadow-md">
                  <span className="block text-2xl sm:text-3xl font-black text-yellow-300 tracking-tight leading-none">
                    {submittedCount}/{totalTeachersCount}
                  </span>
                  <span className="block text-[9px] sm:text-[10px] font-bold text-white uppercase mt-1.5 tracking-wider">
                    ĐÃ HOÀN THÀNH
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-sm animate-in fade-in duration-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Select Teacher Name */}
            <div className="space-y-4">
              <h3 className="text-xs sm:text-sm font-black tracking-wider text-slate-500 uppercase">
                BƯỚC 1: CHỌN HỌ VÀ TÊN CỦA THẦY/CÔ
              </h3>

              {/* Department filtering button bar */}
              <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-3 sm:gap-4 shadow-sm">
                <span className="text-xs font-black text-slate-500 tracking-wider uppercase shrink-0">
                  TỔ CÔNG TÁC:
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => handleDeptFilterChange("all")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      selectedDeptId === "all"
                        ? "bg-[#00875a] text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    Tất cả
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDeptFilterChange(dept.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                        selectedDeptId === dept.id
                          ? "bg-[#00875a] text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {getShortDeptName(dept.name)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropdown Select teacher box - styled elegantly matching the image */}
              <div className="relative">
                <select
                  id="teacher-select"
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  disabled={uploading}
                  className="w-full px-5 py-4 bg-[#f8fafc] border border-slate-200 hover:border-slate-300 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#00875a] appearance-none cursor-pointer transition-all duration-200"
                >
                  <option value="">
                    -- Bấm vào đây để chọn tên trong danh sách giáo viên --
                  </option>
                  {filteredTeachers.map((t) => {
                    const submission = submissions.find(
                      (s) => s.campaignId === selectedCampaignId && s.teacherId === t.id
                    );
                    const hasSubmitted = !!submission;
                    const dept = departments.find((d) => d.id === t.departmentId);
                    const deptName = dept ? dept.name : "";
                    const shortDeptName = getShortDeptName(deptName);
                    
                    return (
                      <option key={t.id} value={t.id} className="text-gray-900 font-medium">
                        {t.name} ({shortDeptName}) - [{hasSubmitted ? "Đã nộp" : "Chưa nộp"}]
                      </option>
                    );
                  })}
                </select>
                <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none text-gray-600">
                  <ChevronDown className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Submission Status Box matching the image perfectly */}
            {selectedCampaignId && selectedTeacherId && (
              <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                <span className="text-xs font-black text-slate-500 tracking-wider uppercase">
                  TRẠNG THÁI NỘP:
                </span>
                {existingSubmission ? (
                  <span className="px-4 py-1.5 bg-[#D1FAE5] text-[#065F46] rounded-full text-xs font-extrabold uppercase tracking-wide">
                    ĐÃ HOÀN THÀNH
                  </span>
                ) : (
                  <span className="px-4 py-1.5 bg-[#FEF3C7] text-[#D97706] rounded-full text-xs font-extrabold uppercase tracking-wide">
                    CHƯA HOÀN THÀNH
                  </span>
                )}
              </div>
            )}

            {/* Existing Submission Warning / Preview */}
            {selectedCampaignId && selectedTeacherId && existingSubmission && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 animate-in fade-in duration-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Minh chứng đã nộp trước đó</h4>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1 max-w-md">
                      Thầy/Cô đã nộp tập tin <strong className="break-all">{existingSubmission.fileName}</strong> cho đợt này. Việc tải lên và xác nhận tệp mới sẽ <strong>thay thế hoàn toàn</strong> minh chứng cũ.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewData({
                      id: existingSubmission.fileId,
                      name: existingSubmission.fileName,
                      type: existingSubmission.fileType,
                      size: existingSubmission.fileSize
                    });
                    setPreviewOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold shadow-sm shrink-0 transition-all duration-150 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Xem tệp cũ</span>
                </button>
              </div>
            )}

            {/* STEP 2: File Upload Area (Only visible when teacher is selected) */}
            {selectedCampaignId && selectedTeacherId && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xs sm:text-sm font-black tracking-wider text-slate-500 uppercase">
                  BƯỚC 2: TẢI LÊN TỆP MINH CHỨNG CỦA THẦY/CÔ
                </h3>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleUploadClick}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[190px] ${
                    dragActive
                      ? "border-emerald-600 bg-emerald-50/50 scale-[0.99] ring-4 ring-emerald-500/10"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-500 hover:shadow-inner"
                  }`}
                  id="drag-drop-area"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
                    disabled={uploading}
                    id="file-uploader-input"
                  />

                  {file ? (
                    <div className="space-y-3 w-full max-w-sm animate-in scale-in duration-200" onClick={(e) => e.stopPropagation()}>
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                        {file.name.endsWith(".pdf") ? (
                          <FileText className="h-6 w-6 text-emerald-700" />
                        ) : file.name.endsWith(".xls") || file.name.endsWith(".xlsx") || file.name.endsWith(".csv") ? (
                          <FileSpreadsheet className="h-6 w-6 text-emerald-700" />
                        ) : (
                          <File className="h-6 w-6 text-emerald-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 font-semibold">
                          {formatSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer"
                      >
                        Hủy tệp này
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm mb-4 text-slate-400">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        Click để chọn tệp hoặc kéo thả file vào đây
                      </p>
                      <p className="text-xs text-gray-400 font-bold mt-1.5 leading-relaxed max-w-xs mx-auto">
                        Chấp nhận mọi định dạng: Ảnh chụp màn hình, PDF, Word, Excel...
                      </p>
                    </>
                  )}
                </div>

                {/* Agreement Checkbox Container perfectly matching screenshot */}
                <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm">
                  <label className="flex items-start space-x-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreementAccepted}
                      onChange={(e) => setAgreementAccepted(e.target.checked)}
                      disabled={uploading}
                      className="mt-1 h-4.5 w-4.5 text-[#00875a] focus:ring-[#00875a] border-slate-300 rounded cursor-pointer transition"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                      Tôi xác nhận đã thực hiện đầy đủ cuộc thi/khảo sát này và tự chịu trách nhiệm về tính trung thực, chính xác của minh chứng gửi kèm.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Submit Button & Progress */}
            {selectedCampaignId && selectedTeacherId && (
              <div className="pt-4 space-y-4">
                {uploading && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-850">
                      <span className="flex items-center space-x-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                        <span>Đang tải lên dữ liệu... Thầy cô vui lòng đợi trong giây lát...</span>
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-emerald-50 rounded-full overflow-hidden border border-emerald-100/20">
                      <div
                        className="h-full bg-[#00875a] rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading || (!file && !existingSubmission) || !agreementAccepted}
                  onClick={handleSubmit}
                  className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm tracking-wide text-white shadow-md transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer ${
                    uploading
                      ? "bg-slate-300 cursor-not-allowed shadow-none text-white/80"
                      : (!file && !existingSubmission) || !agreementAccepted
                      ? "bg-slate-300 text-white/80 cursor-not-allowed shadow-none"
                      : "bg-[#00875a] hover:bg-emerald-750 hover:shadow-emerald-600/10 hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                  id="btn-submit-evidence"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Xác nhận & Gửi minh chứng</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded File Preview Modal */}
      {previewData && (
        <FilePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileName={previewData.name}
          fileType={previewData.type}
          fileId={previewData.id}
          fileSize={previewData.size}
        />
      )}
    </div>
  );
}
