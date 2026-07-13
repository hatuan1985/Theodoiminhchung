import React from "react";
import { X, Download, FileText, FileSpreadsheet, File, ExternalLink } from "lucide-react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: string;
  fileId: string;
  fileSize: number;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  fileName,
  fileType,
  fileId,
  fileSize
}: FilePreviewModalProps) {
  if (!isOpen) return null;

  const fileUrl = `/api/files/${fileId}`;
  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = () => {
    if (fileType.includes("word") || fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
      return <FileText className="h-16 w-16 text-blue-500" />;
    }
    if (fileType.includes("sheet") || fileType.includes("excel") || fileName.endsWith(".xls") || fileName.endsWith(".xlsx") || fileName.endsWith(".csv")) {
      return <FileSpreadsheet className="h-16 w-16 text-emerald-600" />;
    }
    return <File className="h-16 w-16 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-semibold text-gray-900 truncate" title={fileName}>
              {fileName}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Dung lượng: {formatSize(fileSize)} • Định dạng: {fileType || "Không rõ"}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors duration-200"
              title="Xem toàn màn hình trong tab mới"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Xem toàn màn hình</span>
            </a>
            <a
              href={fileUrl}
              download={fileName}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors duration-200"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Tải xuống</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-lg transition-colors duration-200"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content / Preview Area */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4 relative">
          {isImage ? (
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col space-y-3">
              <iframe
                src={fileUrl}
                title={fileName}
                className="flex-1 w-full border-0 rounded-lg bg-white shadow-sm"
              />
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs font-medium flex items-center space-x-3 justify-between shadow-sm">
                <span>💡 Gợi ý: Nếu tài liệu PDF không hiển thị trực tiếp (đặc biệt trên iPhone, iPad, Safari), quý Thầy/Cô vui lòng bấm nút <strong>Xem toàn màn hình</strong> để xem chi tiết.</span>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Mở tab mới
                </a>
              </div>
            </div>
          ) : (
            // Non-previewable documents (Word, Excel)
            <div className="text-center p-8 bg-white rounded-2xl max-w-md shadow-md border border-gray-200/60 animate-in fade-in duration-300">
              <div className="mx-auto flex justify-center mb-4">
                {getFileIcon()}
              </div>
              <h4 className="text-lg font-bold text-gray-800 break-all px-4">
                {fileName}
              </h4>
              <p className="text-sm text-gray-500 mt-2 px-6">
                Tệp tài liệu này không hỗ trợ xem trước trực tiếp trên trình duyệt. Thầy/Cô vui lòng nhấn nút bên dưới để tải tệp về thiết bị.
              </p>
              <div className="mt-6">
                <a
                  href={fileUrl}
                  download={fileName}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/10 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" />
                  <span>Tải xuống tài liệu</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
