"use client";

import React, { useState } from "react";

interface Course {
  cat: string;
  icon: string;
  catLabel: string;
  name: string;
  outcome: string;
  level: string;
  duration: string;
  hot: boolean;
  accent: string;
  accentBg: string;
}

interface CourseGridProps {
  courses: Course[];
  currentUser: { email: string; name: string; plan: string } | null;
  onCourseClick: (index: number) => void;
  onShowModal: (modalId: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All Courses" },
  { id: "ai", label: "🤖 AI & Automation" },
  { id: "data", label: "📊 Data & Analytics" },
  { id: "cloud", label: "☁️ Cloud & DevOps" },
  { id: "cyber", label: "🔐 Cybersecurity" },
  { id: "dev", label: "💻 Web & App Dev" },
  { id: "marketing", label: "📣 Digital Marketing" },
  { id: "finance", label: "💰 Finance" },
  { id: "creative", label: "🎨 Creative" },
  { id: "freelance", label: "🧑‍💼 Freelancing" },
  { id: "health", label: "🏥 Healthcare IT" },
];

export default function CourseGrid({ courses, currentUser, onCourseClick, onShowModal }: CourseGridProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const FREE_COURSES = 3;

  const levelMap: { [key: string]: string } = {
    beg: "Beginner",
    int: "Intermediate",
    adv: "Advanced",
  };

  const filteredCourses = courses
    .map((c, i) => ({ ...c, globalIndex: i }))
    .filter(c => activeCategory === "all" || c.cat === activeCategory)
    .filter(c => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.outcome.toLowerCase().includes(q) ||
        c.catLabel.toLowerCase().includes(q)
      );
    });

  return (
    <section id="courses" className="px-[5%] py-20 bg-[var(--black)]">
      <div className="text-[0.72rem] tracking-[2px] uppercase text-[var(--gold)] font-bold mb-3">
        What You'll Learn
      </div>
      <h2 className="font-extrabold text-[clamp(1.6rem,3.5vw,2.4rem)] text-[var(--white)] tracking-[-0.8px] mb-3 font-serif">
        Courses That Get You Hired
      </h2>
      <p className="text-[var(--text-dim)] max-w-[540px] text-[0.95rem] mb-11 leading-[1.7]">
        Every course maps to a real job or freelance income stream.{" "}
        <span className="text-[var(--gold)]">Sign up free to preview 3 courses. Upgrade for all 50+.</span>
      </p>

      {/* Search input bar */}
      <div className="mb-7 max-w-[420px]">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-full px-5 py-3 text-[0.82rem] text-[var(--white)] outline-none focus:border-[var(--gold)] font-sans"
          placeholder="🔍 Search courses by topic, tools or job outcomes..."
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-9">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full border text-[0.8rem] font-medium cursor-pointer transition-all ${
              activeCategory === cat.id
                ? "border-[var(--gold)] text-[var(--gold)] bg-[var(--gold-glow)]"
                : "border-[var(--border)] bg-transparent text-[var(--text-dim)] hover:border-[var(--muted)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {filteredCourses.map(c => {
          const isFree = c.globalIndex < FREE_COURSES;
          const isPro = currentUser && currentUser.plan === "pro";
          const isLoggedIn = !!currentUser;
          const isLocked = isLoggedIn && !isPro && !isFree;
          const needsLogin = !isLoggedIn && !isFree;

          return (
            <div
              key={c.globalIndex}
              onClick={() => !isLocked && !needsLogin && onCourseClick(c.globalIndex)}
              className={`relative bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 transition-all duration-250 cursor-pointer overflow-hidden group hover:border-[var(--muted)] hover:-translate-y-0.5 ${
                isLocked || needsLogin ? "cursor-default hover:translate-y-0" : ""
              }`}
              style={
                {
                  "--accent": c.accent,
                  "--accent-bg": c.accentBg,
                } as React.CSSProperties
              }
            >
              {/* Highlight top stripe on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent,var(--gold))] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />

              {/* Locked/Auth Overlays */}
              {isLocked && (
                <div className="absolute inset-0 bg-[rgba(10,10,10,0.85)] flex flex-col items-center justify-center p-4 rounded-xl gap-2 backdrop-blur-[2px] z-10">
                  <div className="text-3xl">🔒</div>
                  <div className="text-[0.78rem] text-[var(--gold)] font-bold text-center leading-5">
                    Pro course
                    <br />
                    ₹99/mo or ₹999/yr
                  </div>
                  <button
                    className="btn-primary py-2 px-[18px] text-[0.78rem] shadow-none mt-1"
                    onClick={e => {
                      e.stopPropagation();
                      onShowModal("paywall");
                    }}
                  >
                    Unlock Pro →
                  </button>
                </div>
              )}

              {needsLogin && (
                <div className="absolute inset-0 bg-[rgba(10,10,10,0.85)] flex flex-col items-center justify-center p-4 rounded-xl gap-2 backdrop-blur-[2px] z-10">
                  <div className="text-3xl">🔑</div>
                  <div className="text-[0.78rem] text-[var(--gold)] font-bold text-center leading-5">
                    Sign in to access
                    <br />
                    this course
                  </div>
                  <button
                    className="btn-primary py-2 px-[18px] text-[0.78rem] shadow-none mt-1"
                    onClick={e => {
                      e.stopPropagation();
                      onShowModal("login");
                    }}
                  >
                    Sign In →
                  </button>
                </div>
              )}

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3.5"
                style={{ background: c.accentBg }}
              >
                {c.icon}
              </div>
              <div className="text-[0.68rem] tracking-[1.5px] uppercase font-bold mb-1.5" style={{ color: c.accent }}>
                {c.catLabel}
              </div>
              <div className="text-[0.95rem] font-bold text-[var(--white)] leading-[1.35] mb-2 font-serif">
                {c.name}
              </div>
              <div className="text-[0.78rem] text-[var(--text-dim)] flex items-center gap-1.5 mb-3.5 before:content-['→'] before:text-[var(--accent,var(--gold))] before:text-[0.85rem]">
                {c.outcome}
              </div>
              <div className="flex gap-2.5 items-center pt-3.5 border-t border-[var(--border)]">
                <span className={`badge-level badge-${c.level}`}>{levelMap[c.level]}</span>
                {c.hot && <span className="badge-hot">🔥 Hot</span>}
                {isFree && !isPro && <span className="badge-free-tag text-[0.65rem] px-1.5 py-0.5 rounded bg-[rgba(46,204,113,0.12)] text-[var(--green)] font-bold">FREE</span>}
                <span className="text-[0.72rem] text-[var(--text-dim)] ml-auto">{c.duration}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
