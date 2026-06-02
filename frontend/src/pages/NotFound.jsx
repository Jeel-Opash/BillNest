import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-700 font-sans antialiased">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">

        <div className="relative">
          <div className="text-[120px] font-extrabold text-slate-100 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-500 text-[40px]">search_off</span>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Check the URL or navigate back to your workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            to="/dashboard"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
