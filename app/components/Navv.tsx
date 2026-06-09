"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navv() {
  return (
    <nav className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-black text-blue-800 dark:text-blue-400 tracking-tight"
        >
          RobertCare
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
