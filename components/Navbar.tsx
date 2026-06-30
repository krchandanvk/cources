"use client";

import React from "react";

interface NavbarProps {
  currentUser: { email: string; name: string; plan: string } | null;
  onShowModal: (modalId: string) => void;
  onLogout: () => void;
}

export default function Navbar({ currentUser, onShowModal, onLogout }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-[5%] h-16 bg-[rgba(10,10,10,0.9)] backdrop-blur-md border-b border-[var(--border)]">
      <div className="nav-logo">
        Skill<span>Rise</span>
      </div>
      
      <ul className="hidden sm:flex items-center gap-7 list-none">
        <li>
          <a href="#courses" className="text-[var(--text-dim)] hover:text-[var(--white)] text-[0.85rem] font-medium transition-colors">
            Courses
          </a>
        </li>
        <li>
          <a href="#pricing" className="text-[var(--text-dim)] hover:text-[var(--white)] text-[0.85rem] font-medium transition-colors">
            Pricing
          </a>
        </li>
        <li>
          <a href="#how" className="text-[var(--text-dim)] hover:text-[var(--white)] text-[0.85rem] font-medium transition-colors">
            How It Works
          </a>
        </li>
      </ul>

      <div className="flex items-center gap-2">
        {!currentUser ? (
          <div className="flex items-center gap-2">
            <button className="btn-outline" onClick={() => onShowModal("login")}>
              Sign In
            </button>
            <button className="btn-primary py-2 px-5 text-[0.82rem] shadow-none" onClick={() => onShowModal("signup")}>
              Start Free
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-full bg-[var(--gold-glow)] border-2 border-[var(--gold)] text-[var(--gold)] flex items-center justify-center font-bold text-[0.85rem] cursor-pointer">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden xs:block text-left">
              <div className="text-[0.82rem] font-semibold text-[var(--white)]">{currentUser.name.split(" ")[0]}</div>
              <span className={`badge-plan ${currentUser.plan === "pro" ? "badge-pro" : "badge-free"}`}>
                {currentUser.plan.toUpperCase()}
              </span>
            </div>
            <button className="text-[var(--text-dim)] hover:text-[var(--red)] text-[0.78rem] ml-2 transition-colors cursor-pointer" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
