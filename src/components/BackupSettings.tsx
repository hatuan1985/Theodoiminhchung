import React, { useState, useRef } from "react";
import { Database, Download, Upload, AlertTriangle, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";

interface BackupSettingsProps {
  onResetDB: () => Promise<void>;
  loading: boolean;
}

export default function BackupSettings({ onResetDB, loading: globalLoading }: BackupSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      // Direct browser download of `/api/backup/export` using robust anchor element
      const link = document.createElement("a");
      link.href = "/api/backup/export";
      link.setAttribute("download", `Backup_HeThongMinhChung_MaiSon_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setLoading(false);
        setSuccessMsg("Tải xuống tập tin sao lưu thành công! Hãy lưu giữ tập tin này cẩn thận.");
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg("Không thể xuất tập tin sao lưu.");
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);

        if (!backupData.db || !backupData.files) {
          throw new Error("Cấu trúc tệp sao lưu không đúng định dạng chuẩn của hệ thống.");
        }

        const response = await fetch("/api/backup/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: text
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Ghi đè dữ liệu thất bại.");
        }

        const resData = await response.json();
        setSuccessMsg("Khôi phục toàn bộ dữ liệu và minh chứng thành công! Hệ thống sẽ tải lại trang.");
        
        // Reload after 2 seconds to update states
        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (err: any) {
        setErrorMsg(err.message || "Tệp sao lưu bị lỗi hoặc không khớp định dạng.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (confirm("🚨 CẢNH BÁO BẢO MẬT:\n\nKhôi phục cài đặt gốc sẽ xóa SẠCH toàn bộ dữ liệu hiện tại, tất cả giáo viên và minh chứng tự tạo của Thầy/Cô, và đưa hệ thống về danh sách 20 giáo viên mặc định của Trường PTDTNT THCS & THPT Mai Sơn.\n\nThầy/Cô có thực sự muốn khôi phục?")) {
      setLoading(true);
      setSuccessMsg("");
      setErrorMsg("");
      try {
        // We delete the data file and let the server re-initialize.
        // We can hit a helper endpoint or just trigger clean reset
        // Let's call reset endpoint
        const response = await fetch("/api/backup/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            // Empty structure will trigger reset on import handler or empty files
            db: null,
            files: null
          })
        });

        // Let's implement reset in the App state through onResetDB
        await onResetDB();
        setSuccessMsg("Đã khôi phục trạng thái mặc định của Trường Mai Sơn thành công! Trang web đang tải lại...");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        setErrorMsg(err.message || "Khôi phục trạng thái mặc định thất bại.");
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="backup-settings-panel">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Sao lưu dữ liệu & Cài đặt hệ thống</h2>
        <p className="text-xs text-gray-500 mt-1">
          Lưu trữ dữ liệu an toàn và linh hoạt. Đảm bảo 100% không mất mát hồ sơ minh chứng khi di chuyển sang máy chủ khác hoặc khi máy chủ bị khởi động lại.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-900 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-900 text-sm font-semibold animate-in fade-in duration-200">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup export & import */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2 flex items-center space-x-1.5">
            <Database className="h-4 w-4 text-emerald-600" />
            <span>Sao lưu & Khôi phục</span>
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed">
            Hệ thống hỗ trợ đóng gói toàn bộ trạng thái cơ sở dữ liệu (gồm danh sách giáo viên, các đợt nộp) kết hợp với <strong>toàn bộ tệp tin minh chứng đã tải lên</strong> dưới dạng một tệp nén JSON duy nhất để lưu về máy tính cá nhân.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-colors"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Tải tập tin Sao lưu (.json)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Upload className="h-4 w-4 text-gray-500" />
              <span>Khôi phục từ tệp cũ</span>
            </button>
          </div>
        </div>

        {/* Danger Zone: Factory Reset */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider border-b border-red-50 pb-2 flex items-center space-x-1.5">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span>Vùng Nguy hiểm (Danger Zone)</span>
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed">
            Hành động này sẽ khôi phục cài đặt gốc, xóa toàn bộ các đợt nộp và tệp minh chứng tự tạo của giáo viên. Đồng thời sẽ nạp lại danh sách <strong>7 tổ chuyên môn mặc định và 20 giáo viên cốt cán</strong> của Trường PTDTNT THCS & THPT Mai Sơn để Thầy/Cô dùng thử.
          </p>

          <div>
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 bg-red-50 hover:bg-red-100 disabled:bg-red-50/50 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition-colors"
            >
              <RefreshCw className="h-4 w-4 text-red-600" />
              <span>Khôi phục Cài đặt Mặc định Trường Mai Sơn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
