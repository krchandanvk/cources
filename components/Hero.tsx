"use client";

import React from "react";

interface HeroProps {
  onStartFree: () => void;
}

export default function Hero({ onStartFree }: HeroProps) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-[5%] py-20 relative overflow-hidden" id="hero-section">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(245,166,35,0.08)_0%,transparent_70%),radial-gradient(ellipse_40%_60%_at_80%_60%,rgba(74,158,255,0.05)_0%,transparent_60%)]"></div>
      <div className="absolute inset-0 z-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.25]"></div>
      
      <div className="relative z-10 max-w-[820px] mt-10">
        <div className="inline-flex items-center gap-2 bg-[var(--gold-glow)] border border-[rgba(245,166,35,0.3)] text-[var(--gold)] text-[0.75rem] font-semibold px-[14px] py-[6px] rounded-[100px] tracking-[0.8px] uppercase mb-7">
          <span className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-ping"></span> 
          2026 Job Market Skills — Updated Monthly
        </div>
        
        <h1 className="font-extrabold text-[clamp(2.4rem,6vw,4.2rem)] text-[var(--white)] leading-[1.1] tracking-[-1.5px] mb-5 font-serif">
          No Job?<br />
          <em className="not-italic text-[var(--gold)]">Wrong Skills.</em><br />
          Fix That Here.
        </h1>
        
        <p className="text-[clamp(0.95rem,2vw,1.1rem)] text-[var(--text-dim)] max-w-[560px] mx-auto mb-9 leading-[1.7]">
          50+ industry-validated courses for job seekers. Learn the exact skills companies are hiring for right now — start earning within months.
        </p>
        
        <div className="flex gap-3 justify-center flex-wrap">
          <button className="btn-primary" onClick={onStartFree}>
            Start Free Today →
          </button>
          <a href="#how" className="btn-ghost">
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}
