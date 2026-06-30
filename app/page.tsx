"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CourseGrid from "../components/CourseGrid";
import { COURSES } from "../lib/courses";
import { CourseData } from "../types/lms";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  saveLessonProgress,
  saveQuizAttempt,
  saveAssignmentSubmission,
  fetchStudentDashboardData,
  updateUserPlan,
  createRazorpayOrder,
  verifyRazorpayPayment,
  issueCertificate,
} from "./actions";

// ─── Dynamic imports (code splitting) ─────────────────────────────────────────
// CoursePlayer (35KB) and Dashboard (7KB) are only needed after login.
// Lazy-loading them reduces initial bundle by ~40KB.
const Dashboard = dynamic(() => import("../components/Dashboard"), {
  ssr: false,
  loading: () => (
    <div className="pt-24 px-[5%] pb-6 text-[var(--text-dim)] text-[0.9rem]">Loading dashboard…</div>
  ),
});

const CoursePlayer = dynamic(() => import("../components/CoursePlayer"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[var(--black)] flex items-center justify-center z-[600] text-[var(--text-dim)]">
      Loading course…
    </div>
  ),
});

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; plan: string } | null>(null);
  const [activeModal, setActiveModal] = useState<"login" | "signup" | "paywall" | "checkout" | "admin" | null>(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number | null>(null);
  const [activeCourseData, setActiveCourseData] = useState<CourseData | null>(null);
  
  // Progress states mapping: { [courseId]: { completed: [lessonIds], quizScores: {}, assignments: {} } }
  const [studentProgress, setStudentProgress] = useState<{ [key: number]: any }>({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [certId, setCertId] = useState("");
  const [certDate, setCertDate] = useState("");

  // Business Model states (Changeable by Admin)
  const [planPrices, setPlanPrices] = useState({
    starter: 149,
    pro: 299,
    career_plus: 999,
    annual_pro: 2499,
    lifetime: 4999
  });
  const [plansEnabled, setPlansEnabled] = useState({
    starter: true,
    pro: true,
    career_plus: true,
    annual_pro: true,
    lifetime: true
  });

  // Coupons state
  const [couponCode, setCouponCode] = useState("");
  const [activeDiscount, setActiveDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [checkoutPlanId, setCheckoutPlanId] = useState<string>("pro");

  // Sync state data from DB — no email passed; Server Action reads from session cookie
  const syncDashboardData = async () => {
    const data = await fetchStudentDashboardData();
    if (data) {
      setCurrentUser({
        email: data.email,
        name: data.name,
        plan: data.plan,
      });

      const courseId = activeCourseData?.course_id || 6;
      setStudentProgress({
        ...studentProgress,
        [courseId]: {
          completed: data.progress,
          quizScores: data.quizScores,
          assignments: data.assignments,
        }
      });
    }
  };

  // Load state on mount & listen to Supabase auth changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Get current session — identity resolved server-side, no email passed from client
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncDashboardData();
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncDashboardData();
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeCourseData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) return;

    const emailInput = document.getElementById("login-email") as HTMLInputElement;
    const passInput = document.getElementById("login-pass") as HTMLInputElement;
    
    if (emailInput.value.trim() && passInput.value) {
      const email = emailInput.value.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: passInput.value,
      });

      if (error) {
        alert("⚠️ Authentication Error: " + error.message);
        return;
      }

      if (data?.user) {
        await syncDashboardData();
        setActiveModal(null);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) return;

    const nameInput = document.getElementById("signup-name") as HTMLInputElement;
    const emailInput = document.getElementById("signup-email") as HTMLInputElement;
    const passInput = document.getElementById("signup-pass") as HTMLInputElement;
    
    if (nameInput.value.trim() && emailInput.value.trim() && passInput.value) {
      const email = emailInput.value.trim().toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password: passInput.value,
        options: {
          data: { name: nameInput.value.trim() },
        },
      });

      if (error) {
        alert("⚠️ Registration Error: " + error.message);
        return;
      }

      if (data?.user) {
        alert("🎉 Registration successful! You can now log in.");
        setActiveModal("login");
      }
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    setSelectedCourseIndex(null);
    setActiveCourseData(null);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === "LAUNCH50") {
      setActiveDiscount({ code: "LAUNCH50", percent: 50 });
      alert("🎟️ 50% discount coupon applied successfully!");
    } else if (couponCode.toUpperCase() === "RISE10") {
      setActiveDiscount({ code: "RISE10", percent: 10 });
      alert("🎟️ 10% referral discount applied successfully!");
    } else {
      alert("⚠️ Invalid coupon code.");
    }
  };

  const handleCheckoutSubmit = async () => {
    if (!currentUser) return;

    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const rawPrice = getDiscountedPrice(checkoutPlanId);

    // Call server action to create Razorpay Order
    // Email not passed — Server Action reads identity from session cookie
    const orderRes = await createRazorpayOrder(checkoutPlanId, rawPrice);
    if (!orderRes.success) {
      alert("⚠️ Error creating order: " + orderRes.error);
      return;
    }

    if (orderRes.testMode) {
      alert("⚠️ Razorpay credentials are not configured in your .env. Running test mode simulated payment.");
      
      const verifyRes = await verifyRazorpayPayment(checkoutPlanId, {
        isTestCheckout: true,
        amount: rawPrice,
        razorpay_order_id: orderRes.orderId,
      });

      if (verifyRes.success) {
        const updated = { ...currentUser, plan: checkoutPlanId };
        setCurrentUser(updated);
        setActiveModal(null);
        alert(`🎉 Test Membership updated to ${checkoutPlanId.toUpperCase()}!`);
      } else {
        alert("⚠️ Failed to verify test checkout: " + verifyRes.error);
      }
      return;
    }

    // Load checkout.js script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("⚠️ Failed to load Razorpay checkout client. Check internet connection.");
      return;
    }

    const options = {
      key: orderRes.keyId,
      amount: orderRes.amount,
      currency: "INR",
      name: "SkillRise Academy",
      description: `${checkoutPlanId.toUpperCase()} membership plan`,
      order_id: orderRes.orderId,
      handler: async (response: any) => {
        const verifyRes = await verifyRazorpayPayment(checkoutPlanId, {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          amount: rawPrice,
        });

        if (verifyRes.success) {
          const updated = { ...currentUser, plan: checkoutPlanId };
          setCurrentUser(updated);
          setActiveModal(null);
          alert(`🎉 Membership updated to ${checkoutPlanId.toUpperCase()}! Transaction verified.`);
        } else {
          alert("⚠️ Signature validation failed: " + verifyRes.error);
        }
      },
      prefill: {
        name: currentUser.name,
        email: currentUser.email,
      },
      theme: {
        color: "#F5A623",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleCourseClick = async (index: number) => {
    if (!currentUser) {
      setActiveModal("login");
      return;
    }
    
    // Check course limits based on SaaS plans rules
    const FREE_COURSES = 3;
    const isFreeCourse = index < FREE_COURSES;
    const isProUser = ["pro", "career_plus", "annual_pro", "lifetime"].includes(currentUser.plan);
    const isStarterUser = currentUser.plan === "starter";

    const isPremiumCourse = index > 15;

    if (currentUser.plan === "free" && !isFreeCourse) {
      setActiveModal("paywall");
      return;
    }
    if (isStarterUser && isPremiumCourse) {
      setActiveModal("paywall");
      return;
    }

    const paddedIndex = (index + 1).toString().padStart(2, '0');
    const courseDataPath = `/courses/course-${paddedIndex}/course-data.json`;
    
    try {
      const res = await fetch(courseDataPath);
      if (!res.ok) throw new Error("File not found");
      const data = await res.json();
      setActiveCourseData(data);
      setSelectedCourseIndex(index);
    } catch (err) {
      const c = COURSES[index];
      const mockData: CourseData = {
        course_id: index + 1,
        title: c.name,
        category: c.cat,
        level: c.level,
        duration: c.duration,
        outcome: c.outcome,
        overview: `A complete module-by-module course for learning ${c.name}. Ideal for job-seekers targeting ${c.outcome} roles.`,
        objectives: [
          `Master core ${c.name} conceptual syntax and schemas.`,
          "Perform hands-on lab exercises validating logic.",
          "Build real-world portfolio capstone projects to showcase to recruiters."
        ],
        roadmap: {
          phases: [
            { title: "Phase 1: Foundations", desc: "Understand initial configurations & tool setups." },
            { title: "Phase 2: Project Build", desc: "Construct primary portfolio assets and labs." }
          ]
        },
        modules: [
          {
            week: 1,
            title: "Getting Started",
            lessons: [
              {
                lesson_id: `w1-l1-${index}`,
                title: `Introduction to ${c.name}`,
                content: `### Course Introduction\n\nIn this lesson, we will install tools, test environments and establish the core syntax configurations needed to learn ${c.name}.\n\n### Core Tasks:\n1. Configure local IDE settings.\n2. Review documentation guides.\n3. Complete the week 1 assignment.`,
                code: `// Sample console output\nconsole.log("Welcome to ${c.name}!");`,
                diagram: "Syllabus -> Setup -> Lab Build -> Verification",
                quiz: [
                  {
                    question: `What is the primary output outcome for ${c.name}?`,
                    options: [c.outcome, "Generic logs", "Static files", "Empty objects"],
                    answer: 0,
                    explanation: "This course is explicitly structured around preparing candidates for " + c.outcome + " roles."
                  }
                ],
                assignment: {
                  title: "Syllabus Setup Assignment",
                  prompt: "Write out a brief summary (100 words) matching your career goals and how you plan to use these tools."
                },
                downloads: []
              }
            ]
          }
        ],
        capstone: {
          title: `${c.name} Professional Portfolio Project`,
          description: "An end-to-end industry verified system build showcasing comprehensive implementation."
        },
        interview_questions: [
          {
            question: `What is the primary role of a ${c.outcome}?`,
            answer: `A ${c.outcome} manages dynamic data analytics, setups or content delivery matching client goals.`
          }
        ]
      };
      setActiveCourseData(mockData);
      setSelectedCourseIndex(index);
    }
  };

  const handleSaveProgress = async (updatedProgress: any) => {
    if (currentUser?.email && activeCourseData) {
      const currentProg = studentProgress[activeCourseData.course_id] || { completed: [], quizScores: {}, assignments: {} };
      
      // Save Lesson completions — email comes from server session, not passed here
      const newCompleted = (updatedProgress.completed || []).filter((x: string) => !(currentProg.completed || []).includes(x));
      for (const les of newCompleted) {
        await saveLessonProgress(les);
      }

      // Save Quiz completions
      const quizWeeks = Object.keys(updatedProgress.quizScores || {});
      for (const w of quizWeeks) {
        const weekNum = Number(w);
        if (currentProg.quizScores[weekNum] === undefined) {
          const score = updatedProgress.quizScores[weekNum];
          await saveQuizAttempt(activeCourseData.course_id, weekNum, score, true);
        }
      }

      // Save Assignments
      const assignWeeks = Object.keys(updatedProgress.assignments || {});
      for (const w of assignWeeks) {
        const weekNum = Number(w);
        if (currentProg.assignments[weekNum] === undefined || currentProg.assignments[weekNum] !== updatedProgress.assignments[weekNum]) {
          const notes = updatedProgress.assignments[weekNum];
          await saveAssignmentSubmission(activeCourseData.course_id, weekNum, notes);
        }
      }
    }
    
    setStudentProgress(updatedProgress);
  };

  const handleClaimCertificate = async () => {
    if (currentUser && activeCourseData) {
      // Email not passed — Server Action reads identity from session
      const res = await issueCertificate(activeCourseData.course_id);
      if (res.success && res.certificate) {
        setCertId(res.certificate.verificationId);
        setCertDate(new Date(res.certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
        setShowCertificate(true);
      } else {
        alert("⚠️ Failed to issue certificate: " + res.error);
      }
    }
  };

  // Environment key verification screen
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[var(--black)] flex items-center justify-center p-5 text-center">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl max-w-[500px] p-8 shadow-2xl">
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold font-serif text-[var(--white)] mb-3">Supabase Keys Required</h2>
          <p className="text-[var(--text-dim)] leading-6 text-[0.88rem] mb-6">
            To run the SkillRise platform in production-ready mode, you must configure your Supabase Auth environment variables. Please add these keys to your <code className="text-[var(--gold)]">.env</code> file:
          </p>
          <div className="bg-[var(--ink)] border border-[var(--border)] p-4 rounded-xl font-mono text-[0.72rem] text-left text-[var(--text)] mb-6 flex flex-col gap-2">
            <div>NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key</div>
          </div>
          <div className="text-[0.72rem] text-[var(--text-dim)]">Once updated, restart your Next.js dev server.</div>
        </div>
      </div>
    );
  }

  const getOriginalPrice = (planId: string) => {
    return planPrices[planId as keyof typeof planPrices] || 0;
  };

  const getDiscountedPrice = (planId: string) => {
    const orig = getOriginalPrice(planId);
    if (activeDiscount) {
      return Math.round(orig * (1 - activeDiscount.percent / 100));
    }
    return orig;
  };

  const currentCourseProgress = selectedCourseIndex !== null && activeCourseData
    ? studentProgress[activeCourseData.course_id] || { completed: [], quizScores: {}, assignments: {} }
    : { completed: [], quizScores: {}, assignments: {} };

  // Admin status comes from DB plan/role — not from email string comparison
  const isAdmin = currentUser?.plan === "admin" || currentUser?.plan === "career_plus";

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--text)] relative">
      {/* Admin Panel Link */}
      {isAdmin && (
        <button
          onClick={() => setActiveModal("admin")}
          className="fixed bottom-5 right-5 z-[500] bg-[var(--red)] text-white px-4 py-2.5 rounded-full font-bold shadow-lg text-[0.8rem] hover:bg-red-600 transition-all cursor-pointer"
        >
          ⚙️ Admin Revenue Dashboard
        </button>
      )}

      {/* Watermark */}
      {currentUser && (
        <div id="watermark-overlay" className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.03]">
          <div className="wm-text" style={{ top: "10%", left: "5%" }}>
            {currentUser.name} • {currentUser.email} • SkillRise Member
          </div>
          <div className="wm-text" style={{ top: "40%", left: "20%" }}>
            {currentUser.name} • {currentUser.email} • SkillRise Member
          </div>
          <div className="wm-text" style={{ top: "70%", left: "45%" }}>
            {currentUser.name} • {currentUser.email} • SkillRise Member
          </div>
        </div>
      )}

      <Navbar currentUser={currentUser} onShowModal={(id) => setActiveModal(id as any)} onLogout={handleLogout} />

      {!currentUser ? (
        <Hero onStartFree={() => setActiveModal("signup")} />
      ) : (
        <Dashboard
          currentUser={currentUser}
          progressData={studentProgress}
          onUpgrade={() => setActiveModal("paywall")}
        />
      )}

      <CourseGrid
        courses={COURSES}
        currentUser={currentUser}
        onCourseClick={handleCourseClick}
        onShowModal={(id) => setActiveModal(id as any)}
      />

      {/* Course Player */}
      {selectedCourseIndex !== null && activeCourseData && (
        <CoursePlayer
          courseData={activeCourseData}
          currentUser={currentUser}
          progress={currentCourseProgress}
          onSaveProgress={handleSaveProgress}
          onClose={() => {
            setSelectedCourseIndex(null);
            setActiveCourseData(null);
          }}
          onClaimCertificate={handleClaimCertificate}
          onUpgrade={() => setActiveModal("paywall")}
        />
      )}

      {/* Plan Comparison Table */}
      {selectedCourseIndex === null && (
        <section id="pricing" className="px-[5%] py-20 bg-[var(--ink)] border-y border-[var(--border)] text-center">
          <div className="text-[0.72rem] tracking-[2px] uppercase text-[var(--gold)] font-bold mb-3">Pricing Plans</div>
          <h2 className="font-extrabold text-[clamp(1.6rem,3.5vw,2.4rem)] text-[var(--white)] tracking-[-0.8px] mb-3 font-serif">
            A Plan for Every Career Goal
          </h2>
          <p className="text-[var(--text-dim)] max-w-[540px] mx-auto text-[0.95rem] mb-12 leading-[1.7]">
            Start free to build core concepts, or unlock placement prep and custom AI portfolio coaches.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto mb-16">
            {plansEnabled.starter && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-7 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[var(--white)] font-serif text-[1.1rem] mb-1">Starter</h3>
                  <div className="text-[var(--text-dim)] text-[0.78rem] mb-4">Master foundational skills</div>
                  <div className="text-3xl font-extrabold text-[var(--gold)] font-serif mb-5">
                    ₹{planPrices.starter}<span className="text-sm font-normal text-[var(--text-dim)]">/month</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 list-none text-[0.8rem] text-[var(--text-dim)] mb-7">
                    <li>✓ All 50+ Standard Courses</li>
                    <li>✓ Shareable Certificates</li>
                    <li>✓ Homework & Projects</li>
                    <li>✓ Standard Support</li>
                  </ul>
                </div>
                <button
                  className="btn-ghost py-2.5 w-full text-[0.85rem]"
                  onClick={() => {
                    setCheckoutPlanId("starter");
                    setActiveModal("checkout");
                  }}
                >
                  Get Started →
                </button>
              </div>
            )}

            {plansEnabled.pro && (
              <div className="bg-[var(--card)] border-2 border-[var(--gold)] relative rounded-xl p-7 text-left flex flex-col justify-between shadow-[0_0_30px_rgba(245,166,35,0.1)]">
                <div className="absolute top-[-11px] left-1/2 -translate-x-1/2 bg-[var(--gold)] text-[var(--black)] font-bold text-[0.62rem] tracking-wider uppercase px-3 py-0.5 rounded-full">
                  MOST POPULAR
                </div>
                <div>
                  <h3 className="font-bold text-[var(--white)] font-serif text-[1.1rem] mb-1 mt-1">Pro</h3>
                  <div className="text-[var(--text-dim)] text-[0.78rem] mb-4">Complete professional package</div>
                  <div className="text-3xl font-extrabold text-[var(--gold)] font-serif mb-5">
                    ₹{planPrices.pro}<span className="text-sm font-normal text-[var(--text-dim)]">/month</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 list-none text-[0.8rem] text-[var(--text-dim)] mb-7">
                    <li className="text-[var(--white)] font-semibold">✓ Everything in Starter</li>
                    <li>✓ Premium MDX Syllabus</li>
                    <li>✓ AI Prompt Libraries</li>
                    <li>✓ Dynamic Templates & SOPs</li>
                    <li>✓ Portfolio Project Builder</li>
                    <li>✓ Priority Support</li>
                  </ul>
                </div>
                <button
                  className="btn-primary py-2.5 w-full text-[0.85rem] shadow-none"
                  onClick={() => {
                    setCheckoutPlanId("pro");
                    setActiveModal("checkout");
                  }}
                >
                  Upgrade to Pro →
                </button>
              </div>
            )}

            {plansEnabled.career_plus && (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-7 text-left flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[var(--white)] font-serif text-[1.1rem] mb-1">Career Plus</h3>
                  <div className="text-[var(--text-dim)] text-[0.78rem] mb-4">Flagship placement coaching</div>
                  <div className="text-3xl font-extrabold text-[var(--gold)] font-serif mb-5">
                    ₹{planPrices.career_plus}<span className="text-sm font-normal text-[var(--text-dim)]">/month</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 list-none text-[0.8rem] text-[var(--text-dim)] mb-7">
                    <li className="text-[var(--white)] font-semibold">✓ Everything in Pro</li>
                    <li>✓ AI Placement Career Coach</li>
                    <li>✓ AI Resume ATS Audit</li>
                    <li>✓ AI Interview Practice Mock</li>
                    <li>✓ LinkedIn Registry Audit</li>
                    <li>✓ Premium 24/7 Support</li>
                  </ul>
                </div>
                <button
                  className="btn-ghost py-2.5 w-full text-[0.85rem]"
                  onClick={() => {
                    setCheckoutPlanId("career_plus");
                    setActiveModal("checkout");
                  }}
                >
                  Join Career Plus →
                </button>
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold font-serif text-[var(--white)] mb-7">Full Subscriptions Comparison</h3>
          <div className="max-w-[900px] mx-auto overflow-x-auto border border-[var(--border)] rounded-xl bg-[var(--card)] mb-12">
            <table className="w-full border-collapse text-left text-[0.8rem]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--ink)]">
                  <th className="p-4 font-bold text-[var(--white)]">Features</th>
                  <th className="p-4 text-center">Free</th>
                  <th className="p-4 text-center">Starter</th>
                  <th className="p-4 text-center">Pro</th>
                  <th className="p-4 text-center">Career Plus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-dim)]">
                <tr>
                  <td className="p-4 font-medium text-[var(--white)]">Total Courses Access</td>
                  <td className="p-4 text-center">First 3 Only</td>
                  <td className="p-4 text-center">All 50+</td>
                  <td className="p-4 text-center">All 50+</td>
                  <td className="p-4 text-center">All 50+</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[var(--white)]">Lessons Previews</td>
                  <td className="p-4 text-center">✓</td>
                  <td className="p-4 text-center">✓</td>
                  <td className="p-4 text-center">✓</td>
                  <td className="p-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[var(--white)]">Shareable Certificates</td>
                  <td className="p-4 text-center">✕</td>
                  <td className="p-4 text-center">✓</td>
                  <td className="p-4 text-center">✓</td>
                  <td className="p-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[var(--white)]">Weekly Assignments</td>
                  <td className="p-4 text-center">Limited</td>
                  <td className="p-4 text-center">✓</td>
                  <td className="p-4 text-center">✓</td>
                  <td className="p-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[var(--white)]">AI Prompt Libraries & Cheat Sheets</td>
                  <td className="p-4 text-center">✕</td>
                  <td className="p-4 text-center">✕</td>
                  <td className="p-4 text-center">✓</td>
                  <td className="p-4 text-center">✓</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-[var(--white)]">AI Career Coach & Mock Interviews</td>
                  <td className="p-4 text-center">✕</td>
                  <td className="p-4 text-center">✕</td>
                  <td className="p-4 text-center">✕</td>
                  <td className="p-4 text-center">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Checkout Modal */}
      {activeModal === "checkout" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5 z-[500] backdrop-blur-[6px]">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-[460px] p-[36px_32px]">
            <h2 className="text-xl font-bold font-serif text-[var(--white)] mb-2">Secure Checkout</h2>
            <p className="text-[0.8rem] text-[var(--text-dim)] mb-5">Validate payments via secure Razorpay checkout gateways.</p>
            
            <div className="bg-[var(--ink)] border border-[var(--border)] rounded-xl p-4 mb-5 flex justify-between items-center">
              <div>
                <div className="text-[0.85rem] font-bold text-[var(--white)]">
                  {checkoutPlanId.toUpperCase()} Subscription
                </div>
                <div className="text-[0.72rem] text-[var(--text-dim)]">Billed monthly</div>
              </div>
              <div className="text-right">
                {activeDiscount ? (
                  <>
                    <span className="text-[0.72rem] text-[var(--red)] line-through mr-1.5">
                      ₹{getOriginalPrice(checkoutPlanId)}
                    </span>
                    <span className="text-[1.2rem] font-extrabold text-[var(--gold)] font-serif">
                      ₹{getDiscountedPrice(checkoutPlanId)}
                    </span>
                  </>
                ) : (
                  <span className="text-[1.2rem] font-extrabold text-[var(--gold)] font-serif">
                    ₹{getOriginalPrice(checkoutPlanId)}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-6">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                className="flex-1 bg-[var(--ink)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--white)] text-[0.8rem] outline-none"
                placeholder="Enter Coupon (LAUNCH50)"
              />
              <button type="submit" className="btn-ghost py-2.5 px-4 text-[0.8rem] flex-shrink-0 cursor-pointer">
                Apply
              </button>
            </form>

            <button className="btn-primary w-full py-3 text-[0.88rem]" onClick={handleCheckoutSubmit}>
              Pay with Razorpay →
            </button>
            <div className="text-center mt-4 text-[0.8rem]">
              <span className="text-[var(--text-dim)] hover:text-[var(--white)] cursor-pointer" onClick={() => setActiveModal(null)}>
                Cancel
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {activeModal === "admin" && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-5 z-[500] backdrop-blur-[6px] overflow-y-auto">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-[700px] p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-serif text-[var(--white)]">Admin Settings & Revenue Dashboard</h2>
              <span className="text-xl cursor-pointer" onClick={() => setActiveModal(null)}>✕</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-[var(--ink)] border border-[var(--border)] p-4 rounded-xl text-center">
                <div className="text-xl font-bold text-[var(--gold)] font-serif">₹1,42,800</div>
                <div className="text-[0.62rem] text-[var(--text-dim)] uppercase tracking-wide">MRR Revenue</div>
              </div>
              <div className="bg-[var(--ink)] border border-[var(--border)] p-4 rounded-xl text-center">
                <div className="text-xl font-bold text-[var(--white)] font-serif">2,420</div>
                <div className="text-[0.62rem] text-[var(--text-dim)] uppercase tracking-wide">Monthly Visitors</div>
              </div>
              <div className="bg-[var(--ink)] border border-[var(--border)] p-4 rounded-xl text-center">
                <div className="text-xl font-bold text-[var(--white)] font-serif">4.82%</div>
                <div className="text-[0.62rem] text-[var(--text-dim)] uppercase tracking-wide">Conversion Rate</div>
              </div>
              <div className="bg-[var(--ink)] border border-[var(--border)] p-4 rounded-xl text-center">
                <div className="text-xl font-bold text-[var(--white)] font-serif">2.1%</div>
                <div className="text-[0.62rem] text-[var(--text-dim)] uppercase tracking-wide">Monthly Churn</div>
              </div>
            </div>

            <h3 className="font-bold text-[var(--white)] text-[0.95rem] mb-3">Adjust Plan Prices (Monthly / Yearly)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[0.7rem] text-[var(--text-dim)]">Starter price (₹)</label>
                <input
                  type="number"
                  value={planPrices.starter}
                  onChange={e => setPlanPrices({ ...planPrices, starter: Number(e.target.value) })}
                  className="bg-[var(--ink)] border border-[var(--border)] rounded-lg p-2 text-[var(--white)] text-[0.8rem] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[0.7rem] text-[var(--text-dim)]">Pro price (₹)</label>
                <input
                  type="number"
                  value={planPrices.pro}
                  onChange={e => setPlanPrices({ ...planPrices, pro: Number(e.target.value) })}
                  className="bg-[var(--ink)] border border-[var(--border)] rounded-lg p-2 text-[var(--white)] text-[0.8rem] outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[0.7rem] text-[var(--text-dim)]">Career Plus price (₹)</label>
                <input
                  type="number"
                  value={planPrices.career_plus}
                  onChange={e => setPlanPrices({ ...planPrices, career_plus: Number(e.target.value) })}
                  className="bg-[var(--ink)] border border-[var(--border)] rounded-lg p-2 text-[var(--white)] text-[0.8rem] outline-none"
                />
              </div>
            </div>

            <h3 className="font-bold text-[var(--white)] text-[0.95rem] mb-3">Enable / Disable Subscriptions</h3>
            <div className="flex flex-wrap gap-4 mb-6 text-[0.8rem]">
              <label className="flex items-center gap-2 text-[var(--text-dim)]">
                <input
                  type="checkbox"
                  checked={plansEnabled.starter}
                  onChange={e => setPlansEnabled({ ...plansEnabled, starter: e.target.checked })}
                />
                Starter Plan
              </label>
              <label className="flex items-center gap-2 text-[var(--text-dim)]">
                <input
                  type="checkbox"
                  checked={plansEnabled.pro}
                  onChange={e => setPlansEnabled({ ...plansEnabled, pro: e.target.checked })}
                />
                Pro Plan
              </label>
              <label className="flex items-center gap-2 text-[var(--text-dim)]">
                <input
                  type="checkbox"
                  checked={plansEnabled.career_plus}
                  onChange={e => setPlansEnabled({ ...plansEnabled, career_plus: e.target.checked })}
                />
                Career Plus
              </label>
            </div>

            <button className="btn-primary w-full py-2.5 text-[0.85rem]" onClick={() => setActiveModal(null)}>
              Save Configurations & Close
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {activeModal === "login" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5 z-[500] backdrop-blur-[6px]">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-[440px] p-[36px_32px]">
            <div className="nav-logo mb-1.5 text-center">
              Skill<span>Rise</span>
            </div>
            <div className="text-[0.82rem] text-[var(--text-dim)] mb-7 text-center">Learn. Work. Earn.</div>
            <h2 className="text-xl font-bold font-serif text-[var(--white)] mb-5 text-center">Sign In to Your Account</h2>
            
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-[0.78rem] text-[var(--text-dim)] mb-1.5 font-medium tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  id="login-email"
                  required
                  defaultValue="demo@skillrise.in"
                  className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-[11px_14px] text-[var(--white)] text-[0.88rem] outline-none focus:border-[var(--gold)]"
                  placeholder="you@example.com"
                />
              </div>
              <div className="mb-5">
                <label className="block text-[0.78rem] text-[var(--text-dim)] mb-1.5 font-medium tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  id="login-pass"
                  required
                  defaultValue="demo123"
                  className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-[11px_14px] text-[var(--white)] text-[0.88rem] outline-none focus:border-[var(--gold)]"
                  placeholder="Enter your password"
                />
              </div>
              <button type="submit" className="btn-full">
                Sign In →
              </button>
            </form>
            <div className="text-center mt-4 text-[0.8rem] text-[var(--text-dim)]">
              Don't have an account?{" "}
              <span className="text-[var(--gold)] cursor-pointer hover:underline" onClick={() => setActiveModal("signup")}>
                Create one free
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {activeModal === "signup" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5 z-[500] backdrop-blur-[6px]">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-[440px] p-[36px_32px]">
            <div className="nav-logo mb-1.5 text-center">
              Skill<span>Rise</span>
            </div>
            <div className="text-[0.82rem] text-[var(--text-dim)] mb-7 text-center">Start learning. Start earning.</div>
            <h2 className="text-xl font-bold font-serif text-[var(--white)] mb-5 text-center">Create Free Account</h2>
            
            <form onSubmit={handleSignup}>
              <div className="mb-4">
                <label className="block text-[0.78rem] text-[var(--text-dim)] mb-1.5 font-medium tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  id="signup-name"
                  required
                  className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-[11px_14px] text-[var(--white)] text-[0.88rem] outline-none focus:border-[var(--gold)]"
                  placeholder="Your full name"
                />
              </div>
              <div className="mb-4">
                <label className="block text-[0.78rem] text-[var(--text-dim)] mb-1.5 font-medium tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  id="signup-email"
                  required
                  className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-[11px_14px] text-[var(--white)] text-[0.88rem] outline-none focus:border-[var(--gold)]"
                  placeholder="you@example.com"
                />
              </div>
              <div className="mb-5">
                <label className="block text-[0.78rem] text-[var(--text-dim)] mb-1.5 font-medium tracking-wide">
                  Choose Password
                </label>
                <input
                  type="password"
                  id="signup-pass"
                  required
                  className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-[11px_14px] text-[var(--white)] text-[0.88rem] outline-none focus:border-[var(--gold)]"
                  placeholder="At least 6 characters"
                />
              </div>
              <button type="submit" className="btn-full">
                Create Free Account →
              </button>
            </form>
            <div className="text-center mt-4 text-[0.8rem] text-[var(--text-dim)]">
              Already have an account?{" "}
              <span className="text-[var(--gold)] cursor-pointer hover:underline" onClick={() => setActiveModal("login")}>
                Sign in
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Upgrade Modal */}
      {activeModal === "paywall" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-5 z-[500] backdrop-blur-[6px]">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-[520px] p-[36px_32px]">
            <div className="nav-logo mb-1.5 text-center">
              Skill<span>Rise</span>
            </div>
            <div className="text-[0.82rem] text-[var(--text-dim)] mb-5 text-center">Unlock all 50+ courses with Pro access</div>
            
            <div className="bg-[rgba(74,158,255,0.08)] border border-[rgba(74,158,255,0.2)] rounded-lg p-3 text-[0.76rem] text-[var(--blue)] mb-5 leading-5 text-center">
              🔵 <strong>Demo mode:</strong> Choose any pricing tier. In production, this forwards transactions to Razorpay integration.
            </div>

            <div className="flex flex-col gap-2.5 mb-5 max-h-[300px] overflow-y-auto">
              <div
                onClick={() => {
                  setCheckoutPlanId("starter");
                  setActiveModal("checkout");
                }}
                className="border border-[var(--border)] hover:border-[var(--gold)] rounded-xl p-3.5 flex justify-between items-center cursor-pointer transition-all bg-[var(--ink)]"
              >
                <div>
                  <span className="font-bold text-[var(--white)] text-[0.85rem]">Starter Plan</span>
                  <div className="text-[0.72rem] text-[var(--text-dim)] mt-0.5">All courses + standard support</div>
                </div>
                <span className="font-bold text-[var(--gold)] text-lg">₹{planPrices.starter}/mo</span>
              </div>
              <div
                onClick={() => {
                  setCheckoutPlanId("pro");
                  setActiveModal("checkout");
                }}
                className="border-2 border-[var(--gold)] bg-[var(--gold-glow)] rounded-xl p-3.5 flex justify-between items-center cursor-pointer"
              >
                <div>
                  <span className="font-bold text-[var(--white)] text-[0.85rem]">Pro Plan ⭐</span>
                  <div className="text-[0.72rem] text-[var(--text-dim)] mt-0.5">Templates, SOPs + prompt libraries</div>
                </div>
                <span className="font-bold text-[var(--gold)] text-lg">₹{planPrices.pro}/mo</span>
              </div>
              <div
                onClick={() => {
                  setCheckoutPlanId("career_plus");
                  setActiveModal("checkout");
                }}
                className="border border-[var(--border)] hover:border-[var(--gold)] rounded-xl p-3.5 flex justify-between items-center cursor-pointer transition-all bg-[var(--ink)]"
              >
                <div>
                  <span className="font-bold text-[var(--white)] text-[0.85rem]">Career Plus</span>
                  <div className="text-[0.72rem] text-[var(--text-dim)] mt-0.5">AI Placement coaches + Mock interviews</div>
                </div>
                <span className="font-bold text-[var(--gold)] text-lg">₹{planPrices.career_plus}/mo</span>
              </div>
            </div>

            <div className="text-center text-[0.8rem]">
              <span className="text-[var(--gold)] cursor-pointer hover:underline" onClick={() => setActiveModal(null)}>
                Maybe later — continue with free access
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {showCertificate && activeCourseData && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-5 z-[1000] backdrop-blur-[8px]">
          <div className="bg-[#111] border-[8px] border-double border-[var(--gold)] rounded-2xl w-full max-w-[800px] p-10 md:p-14 text-center relative shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="absolute top-5 right-5 text-xl text-[var(--text-dim)] hover:text-[var(--white)] cursor-pointer transition-colors" onClick={() => setShowCertificate(false)}>
              ✕
            </div>
            
            <div className="text-[0.8rem] tracking-[2px] uppercase text-[var(--gold)] font-bold mb-4">
              Certificate of Completion
            </div>
            <div className="text-3xl font-extrabold text-[var(--gold)] font-serif mb-5">
              Skill<span>Rise</span> Academy
            </div>
            <div className="text-[1.1rem] text-[var(--text-dim)] mb-7">This is proudly presented to</div>
            <div className="text-3xl font-bold text-[var(--white)] border-b border-[var(--border)] inline-block pb-2 mb-7 min-w-[300px] font-serif">
              {currentUser ? currentUser.name : "Student Name"}
            </div>
            <div className="text-[1.1rem] text-[var(--text-dim)] mb-2">for successfully completing the online course</div>
            <div className="text-xl font-bold text-[var(--white)] mb-10 font-serif">
              {activeCourseData.title}
            </div>
            <div className="text-[0.85rem] italic text-[var(--text-dim)] mb-12">
              with all lessons, assessments, and capstone requirements fulfilled.
            </div>

            <div className="flex justify-between items-end mt-12 px-5 md:px-10">
              <div className="text-left">
                <div className="text-[0.72rem] text-[var(--text-dim)] mb-1">Date</div>
                <div className="text-[0.85rem] font-semibold">{certDate}</div>
              </div>
              <div className="text-center">
                <div className="font-serif text-[var(--gold)] font-extrabold italic text-sm mb-1">SkillRise Team</div>
                <div className="border-t border-[var(--border)] pt-2 w-[150px] text-[0.8rem] text-[var(--text-dim)]">
                  Authorized Signature
                </div>
              </div>
            </div>

            <div className="text-[0.6rem] text-[var(--muted)] mt-10">
              Verification ID: {certId}
            </div>
          </div>
        </div>
      )}

      {/* Main Footer */}
      {selectedCourseIndex === null && (
        <footer className="border-t border-[var(--border)] py-9 px-[5%] text-center text-[var(--text-dim)] text-xs">
          <p>
            <strong>SkillRise</strong> — Learn. Work. Earn. &nbsp;|&nbsp; Built for the generation that has degrees but not jobs. &nbsp;|&nbsp; © 2026
          </p>
          <p className="mt-2 text-[0.72rem]">All content is protected and watermarked. Unauthorized sharing violates our Terms of Service.</p>
        </footer>
      )}
    </div>
  );
}
