"use client";

import React, { useState } from "react";

interface DashboardProps {
  currentUser: { email: string; name: string; plan: string };
  progressData: { [key: number]: { completed: string[]; quizScores: any; assignments: any } };
  onUpgrade: () => void;
}

export default function Dashboard({ currentUser, progressData, onUpgrade }: DashboardProps) {
  const [copied, setCopied] = useState(false);
  const planNames: { [key: string]: string } = {
    free: "Free Tier",
    starter: "Starter Plan",
    pro: "Pro Plan",
    career_plus: "Career Plus (Flagship)",
    annual_pro: "Annual Pro (Best Value)",
    lifetime: "Lifetime Launch Pass"
  };

  // Calculations for dynamic stats
  let completedLessons = 0;
  let quizAttemptsCount = 0;
  let totalScoreSum = 0;
  let certificateCount = 0;

  Object.keys(progressData).forEach(courseId => {
    const prog = progressData[Number(courseId)];
    completedLessons += (prog.completed || []).length;
    
    const quizWeeks = Object.keys(prog.quizScores || {});
    quizAttemptsCount += quizWeeks.length;
    quizWeeks.forEach(w => {
      totalScoreSum += prog.quizScores[Number(w)];
    });

    if (prog.completed && prog.completed.length > 0 && Object.keys(prog.quizScores).length > 0 && Object.keys(prog.assignments).length > 0) {
      certificateCount++;
    }
  });

  const avgQuizScore = quizAttemptsCount > 0 ? Math.round((totalScoreSum / (quizAttemptsCount * 1)) * 100) / 100 : 0;
  
  // Calculate a Career Score out of 100 based on active learning
  const baseCareerScore = Math.min(100, Math.round((completedLessons * 8) + (avgQuizScore * 40) + (certificateCount * 20)));
  const careerScore = baseCareerScore > 0 ? baseCareerScore : 15; // default starter score

  const referralCode = `RISE-${currentUser.name.split(" ")[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const referralLink = `https://skillrise.in/join?ref=${referralCode}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRenewalDate = () => {
    if (currentUser.plan === "lifetime") return "Never (Lifetime Access)";
    // 30 days from signup mock date
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="pt-24 px-[5%] pb-6" id="member-dashboard">
      {/* Banner */}
      <div className="bg-[linear-gradient(135deg,rgba(245,166,35,0.1)_0%,rgba(74,158,255,0.05)_100%)] border border-[rgba(245,166,35,0.2)] rounded-2xl p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-7">
        <div>
          <div className="text-[1.4rem] font-bold text-[var(--white)] font-serif">
            Welcome back, <span className="text-[var(--gold)]">{currentUser.name.split(" ")[0]}</span> 👋
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[0.8rem] text-[var(--text-dim)]">
            <span className="text-[var(--white)] font-semibold">Active Plan:</span>
            <span className="badge-plan badge-pro py-0.5 px-2.5 rounded-full text-[0.7rem] bg-[var(--gold-glow)] text-[var(--gold)]">
              {planNames[currentUser.plan] || currentUser.plan}
            </span>
            <span className="hidden xs:inline">•</span>
            <span>Next Renewal: {getRenewalDate()}</span>
          </div>
        </div>
        
        <div className="flex gap-6 items-center flex-wrap">
          <div className="text-center bg-[var(--ink)] border border-[var(--border)] rounded-xl px-4 py-2.5 min-w-[100px]">
            <div className="text-[1.3rem] font-extrabold text-[var(--gold)] font-serif">{careerScore}</div>
            <div className="text-[0.65rem] tracking-wider uppercase text-[var(--text-dim)] font-medium mt-0.5">Career Score</div>
          </div>
          <div className="text-center bg-[var(--ink)] border border-[var(--border)] rounded-xl px-4 py-2.5 min-w-[100px]">
            <div className="text-[1.3rem] font-extrabold text-[var(--white)] font-serif">{completedLessons}</div>
            <div className="text-[0.65rem] tracking-wider uppercase text-[var(--text-dim)] font-medium mt-0.5">Lessons Done</div>
          </div>
          <div className="text-center bg-[var(--ink)] border border-[var(--border)] rounded-xl px-4 py-2.5 min-w-[100px]">
            <div className="text-[1.3rem] font-extrabold text-[var(--white)] font-serif">{certificateCount}</div>
            <div className="text-[0.65rem] tracking-wider uppercase text-[var(--text-dim)] font-medium mt-0.5">Certificates</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-7">
        {/* Referral System Box */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 md:p-6 lg:col-span-2">
          <h3 className="font-bold text-[var(--white)] font-serif text-[1.05rem] mb-2 flex items-center gap-2">
            <span>🤝</span> Share SkillRise & Get 1 Month Free
          </h3>
          <p className="text-[0.8rem] text-[var(--text-dim)] mb-4 leading-6">
            Invite friends to learn job-ready skills. When they activate any subscription plan, you get 30 days of Pro membership added to your account for free. They also get a 10% discount on their first payment!
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-[var(--ink)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--white)] text-[0.8rem] outline-none"
            />
            <button
              onClick={copyReferral}
              className="btn-primary py-2 px-4 text-[0.8rem] shadow-none flex-shrink-0 cursor-pointer"
            >
              {copied ? "Copied! ✓" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Upgrade Prompt / Career Edge Panel */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 md:p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[var(--white)] font-serif text-[1.05rem] mb-2 flex items-center gap-2">
              <span>🚀</span> Level Up Your Career
            </h3>
            <p className="text-[0.8rem] text-[var(--text-dim)] leading-6 mb-4">
              {currentUser.plan === "career_plus" 
                ? "You have unlocked the Flagship plan! Access AI resume builders and career coaches inside any course player view." 
                : "Upgrade to Career Plus or Pro to unlock Placement Preparation, AI Resume Reviews, Portfolio Builders, and priority support."}
            </p>
          </div>
          {currentUser.plan !== "career_plus" && currentUser.plan !== "lifetime" && (
            <button className="btn-primary py-2.5 px-5 text-[0.8rem] shadow-none w-full cursor-pointer" onClick={onUpgrade}>
              Upgrade Membership →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
