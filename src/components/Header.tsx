import React from "react";
import { BookOpen, ShieldCheck, User } from "lucide-react";

interface HeaderProps {
  currentView: "teacher" | "admin";
  onViewChange: (view: "teacher" | "admin") => void;
  selectedCampaignId?: string;
}

export default function Header({ currentView, onViewChange, selectedCampaignId }: HeaderProps) {
  return (
    <header className="bg-emerald-900 text-white shadow-md border-b border-emerald-800" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo & School Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 text-emerald-900 p-2.5 rounded-xl shadow-inner flex items-center justify-center">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-emerald-50">
                Hệ thống Minh chứng Bồi dưỡng
              </h1>
              <p className="text-xs text-emerald-300 font-medium">
                Trường PTDTNT THCS & THPT Mai Sơn
              </p>
            </div>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center bg-emerald-950/50 p-1 rounded-xl border border-emerald-800/60">
            <button
              onClick={() => onViewChange("teacher")}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                currentView === "teacher"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20"
                  : "text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/40"
              }`}
              id="btn-nav-teacher"
            >
              <User className="h-4 w-4" />
              <span>Cổng Giáo viên</span>
            </button>

            <button
              onClick={() => onViewChange("admin")}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                currentView === "admin"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20"
                  : "text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/40"
              }`}
              id="btn-nav-admin"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Bảng Quản trị</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
