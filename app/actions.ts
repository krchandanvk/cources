"use server";

/**
 * SkillRise Server Actions
 *
 * SECURITY MODEL:
 * - Koi bhi Server Action client-provided email, userId, ya planId trust
 *   NAHI karta.
 * - Har protected action requireAuth() call karta hai jo server-side
 *   Supabase cookie session se user identity verify karta hai.
 * - Client payload se sirf non-identity data (courseId, lessonId,
 *   solutionText, etc.) accept hota hai — aur wo bhi Zod se validate hota hai.
 */

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import Razorpay from "razorpay";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ZodError } from "zod";
import {
  SaveQuizAttemptSchema,
  SaveAssignmentSubmissionSchema,
  CreateRazorpayOrderSchema,
  AITutorSchema,
  AuditResumeSchema,
  GradeInterviewSchema,
  CourseIdSchema,
  WeekSchema,
} from "../lib/validation";
import { memoryLimiter } from "../lib/ratelimit/memory";
import { requireAuth, isSupabaseServerConfigured, getServerSession } from "../lib/supabase-server";

// ─── Constants ────────────────────────────────────────────────────────────────
const AI_RATE_LIMIT   = { maxRequests: 10, windowMs: 60_000 };
const PAY_RATE_LIMIT  = { maxRequests: 5,  windowMs: 60_000 };

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Error message sanitize karo — stack traces ya internal paths client ko
 * kabhi nahi jaani chahiye.
 */
function clientError(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (error instanceof ZodError) {
    return error.issues.map((e) => e.message).join("; ");
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return "Authentication required. Please log in.";
    }
    console.error("[SkillRise Action Error]", error.message, error.stack);
  } else {
    console.error("[SkillRise Action Error]", error);
  }
  return fallback;
}

/**
 * Authenticated user ka profile DB mein get ya create karo.
 * Email ALWAYS server session se aata hai — kabhi parameter se nahi.
 */
async function getOrCreateProfile(verifiedEmail: string) {
  let user = await prisma.user.findUnique({
    where: { email: verifiedEmail },
    include: { profile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: verifiedEmail,
        role: "STUDENT", // Admin kabhi signup pe nahi milta
        plan: "FREE",
      },
      include: { profile: true },
    });
  }

  if (!user.profile) {
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        name: verifiedEmail.split("@")[0],
      },
    });
    return { profile, user };
  }

  return { profile: user.profile, user };
}

/**
 * DB se user ka role check karo — authorization ke liye.
 */
async function getDbUserRole(verifiedEmail: string): Promise<"STUDENT" | "ADMIN"> {
  const user = await prisma.user.findUnique({
    where: { email: verifiedEmail },
    select: { role: true },
  });
  return (user?.role as "STUDENT" | "ADMIN") ?? "STUDENT";
}

// ─── Dev mode helper ──────────────────────────────────────────────────────────
/**
 * Jab Supabase configure nahi hua — dev mode mein safe fallback email
 * use karo. Production mein ye code path never reach hona chahiye.
 */
const DEV_FALLBACK_EMAIL = "dev@skillrise.local";

async function resolveCallerEmail(): Promise<string> {
  if (!isSupabaseServerConfigured) {
    // Dev mode: Supabase not configured yet — use fallback
    console.warn("[SkillRise] Supabase not configured — using dev fallback identity.");
    return DEV_FALLBACK_EMAIL;
  }
  const { email } = await requireAuth();
  return email;
}

// ─── PROTECTED SERVER ACTIONS ─────────────────────────────────────────────────

/**
 * Lesson complete karo — progress DB mein save karo.
 * Client se sirf lessonId aata hai — email server session se.
 */
export async function saveLessonProgress(lessonId: string) {
  try {
    const email = await resolveCallerEmail();

    // Validate lessonId
    if (!lessonId || typeof lessonId !== "string" || !/^[a-z0-9-]+$/.test(lessonId)) {
      return { success: false, error: "Invalid lesson ID." };
    }

    const { profile } = await getOrCreateProfile(email);

    const lesson = await prisma.lesson.findFirst({
      where: { slug: { contains: lessonId } },
    });

    if (!lesson) {
      console.warn(`[saveLessonProgress] Lesson "${lessonId}" not found. User: ${email}`);
      return { success: false, error: "Lesson not found." };
    }

    await prisma.progress.upsert({
      where: { profileId_lessonId: { profileId: profile.id, lessonId: lesson.id } },
      update: {},
      create: { profileId: profile.id, lessonId: lesson.id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: clientError(error) };
  }
}

/**
 * Quiz attempt save karo.
 * Client se sirf courseId, week, score, passed aata hai.
 */
export async function saveQuizAttempt(
  courseId: number,
  week: number,
  score: number,
  passed: boolean
) {
  try {
    const email = await resolveCallerEmail();
    const validated = SaveQuizAttemptSchema.omit({ email: true }).parse({ courseId, week, score, passed });

    const { profile } = await getOrCreateProfile(email);

    const course = await prisma.course.findFirst({
      where: { slug: { contains: `course-${validated.courseId.toString().padStart(2, "0")}` } },
    });
    if (!course) return { success: false, error: "Course not found." };

    const moduleRecord = await prisma.courseModule.findFirst({
      where: { courseId: course.id, order: validated.week },
      include: { quiz: true },
    });
    if (!moduleRecord?.quiz) return { success: false, error: "Quiz not found for this module." };

    await prisma.quizAttempt.create({
      data: {
        profileId: profile.id,
        quizId: moduleRecord.quiz.id,
        score: validated.score,
        passed: validated.passed,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: clientError(error) };
  }
}

/**
 * Assignment submission save ya update karo.
 * Client se sirf courseId, week, solutionText aata hai.
 */
export async function saveAssignmentSubmission(
  courseId: number,
  week: number,
  solutionText: string
) {
  try {
    const email = await resolveCallerEmail();
    const validated = SaveAssignmentSubmissionSchema.omit({ email: true }).parse({
      courseId,
      week,
      solutionText,
    });

    const { profile } = await getOrCreateProfile(email);

    const course = await prisma.course.findFirst({
      where: { slug: { contains: `course-${validated.courseId.toString().padStart(2, "0")}` } },
    });
    if (!course) return { success: false, error: "Course not found." };

    const moduleRecord = await prisma.courseModule.findFirst({
      where: { courseId: course.id, order: validated.week },
      include: { assignment: true },
    });
    if (!moduleRecord?.assignment) return { success: false, error: "Assignment not found." };

    await prisma.assignmentSubmission.upsert({
      where: {
        profileId_assignmentId: {
          profileId: profile.id,
          assignmentId: moduleRecord.assignment.id,
        },
      },
      update: { solutionText: validated.solutionText },
      create: {
        profileId: profile.id,
        assignmentId: moduleRecord.assignment.id,
        solutionText: validated.solutionText,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: clientError(error) };
  }
}

/**
 * Student dashboard data fetch karo — session se identity verify karke.
 */
export async function fetchStudentDashboardData() {
  try {
    const email = await resolveCallerEmail();

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: {
          include: {
            progress: { include: { lesson: true } },
            attempts: { include: { quiz: { include: { module: true } } } },
            submissions: { include: { assignment: { include: { module: true } } } },
            certificates: true,
          },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: "STUDENT",
          plan: "FREE",
          profile: { create: { name: email.split("@")[0] } },
        },
        include: {
          profile: {
            include: {
              progress: { include: { lesson: true } },
              attempts: { include: { quiz: { include: { module: true } } } },
              submissions: { include: { assignment: { include: { module: true } } } },
              certificates: true,
            },
          },
        },
      });
    }

    if (!user.profile) {
      return { email: user.email, name: email.split("@")[0], plan: "free", progress: [], quizScores: {}, assignments: {}, certificates: [] };
    }

    const profile = user.profile;

    const progressList = profile.progress.map((p) => {
      const parts = p.lesson.slug.split("-");
      return parts.slice(parts.length - 2).join("-");
    });

    const quizScores: Record<number, number> = {};
    for (const att of profile.attempts) {
      const mod = att.quiz?.module;
      if (mod) quizScores[mod.order] = att.score;
    }

    const assignments: Record<number, string> = {};
    for (const sub of profile.submissions) {
      const mod = sub.assignment?.module;
      if (mod) assignments[mod.order] = sub.solutionText;
    }

    const plan = ((user as any).plan ?? "FREE").toLowerCase();

    return {
      email: user.email,
      name: profile.name,
      plan,
      progress: progressList,
      quizScores,
      assignments,
      certificates: profile.certificates,
    };
  } catch (error) {
    console.error("[fetchStudentDashboardData]", error);
    return null;
  }
}

/**
 * User plan upgrade karo.
 *
 * AUTHORIZATION RULES:
 * - Normal user: apna hi plan upgrade kar sakta hai
 * - Admin: kisi bhi user ka plan change kar sakta hai (targetEmail param se)
 * - Client se targetEmail ONLY admin flow mein aata hai — aur DB se role verify hota hai
 */
export async function updateUserPlan(plan: string, targetEmail?: string) {
  try {
    const email = await resolveCallerEmail();

    // Validate plan
    const validPlans = ["free", "starter", "pro", "career_plus", "annual_pro", "lifetime"];
    if (!validPlans.includes(plan.toLowerCase())) {
      console.warn(`[updateUserPlan] Invalid plan "${plan}" attempted by ${email}`);
      return { success: false, error: "Invalid plan." };
    }

    let resolvedTarget = email; // Default: apna hi plan update karo

    if (targetEmail && targetEmail !== email) {
      // Admin kisi aur ka plan change karna chahta hai — DB se role verify karo
      const callerRole = await getDbUserRole(email);
      if (callerRole !== "ADMIN") {
        console.warn(`[updateUserPlan] SECURITY: ${email} tried to update plan for ${targetEmail} — DENIED`);
        return { success: false, error: "Unauthorized: Admin access required." };
      }
      resolvedTarget = targetEmail;
    }

    await prisma.user.update({
      where: { email: resolvedTarget },
      data: { plan: plan.toUpperCase() as any },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: clientError(error) };
  }
}

/**
 * Razorpay order create karo.
 * Client se sirf planId aur amount aata hai — email server session se.
 */
export async function createRazorpayOrder(planId: string, amount: number) {
  try {
    const email = await resolveCallerEmail();

    const validated = CreateRazorpayOrderSchema.omit({ email: true }).parse({ planId, amount });

    // Rate limit
    const rl = await memoryLimiter.check(
      `create_order:${email}`,
      PAY_RATE_LIMIT.maxRequests,
      PAY_RATE_LIMIT.windowMs
    );
    if (!rl.allowed) {
      return {
        success: false,
        error: `Too many payment attempts. Please wait ${Math.ceil((rl.retryAfterMs ?? 60000) / 1000)}s.`,
      };
    }

    const { profile } = await getOrCreateProfile(email);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    let orderId = `test_order_${crypto.randomBytes(8).toString("hex")}`;
    let testMode = true;

    if (keyId && keySecret && keyId !== "placeholder") {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: Math.round(validated.amount * 100),
        currency: "INR",
        receipt: `rcpt_${validated.planId}_${Date.now()}`,
      });
      orderId = order.id;
      testMode = false;
    } else if (isProduction) {
      return { success: false, error: "Payment gateway not configured. Please contact support." };
    }

    await prisma.order.create({
      data: {
        profileId: profile.id,
        amount: validated.amount,
        planId: validated.planId,
        status: "PENDING",
        razorpayOrderId: orderId,
      },
    });

    return {
      success: true,
      testMode,
      orderId,
      amount: Math.round(validated.amount * 100),
      keyId: keyId ?? "placeholder",
    };
  } catch (error) {
    return { success: false, error: clientError(error) };
  }
}

/**
 * Razorpay payment verify karo.
 * Client se sirf planId aur payment details aate hain.
 * Email server session se — client-provided email completely ignored.
 */
export async function verifyRazorpayPayment(
  planId: string,
  paymentDetails: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    isTestCheckout?: boolean;
    amount: number;
  }
) {
  try {
    const email = await resolveCallerEmail();

    const validPlans = ["starter", "pro", "career_plus", "annual_pro", "lifetime"];
    if (!validPlans.includes(planId)) {
      return { success: false, error: "Invalid plan." };
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, isTestCheckout } =
      paymentDetails;

    // Production mein test checkout blocked
    if (isTestCheckout && process.env.NODE_ENV === "production") {
      console.warn(`[verifyRazorpayPayment] Test checkout blocked in production. User: ${email}`);
      return { success: false, error: "Test mode payments are not allowed in production." };
    }

    if (isTestCheckout) {
      await updateUserPlan(planId);

      if (razorpay_order_id) {
        const orderRecord = await prisma.order.findUnique({
          where: { razorpayOrderId: razorpay_order_id },
        });
        if (orderRecord) {
          await prisma.order.update({ where: { id: orderRecord.id }, data: { status: "COMPLETED" } });
          const existingPayment = await prisma.payment.findUnique({ where: { orderId: orderRecord.id } });
          if (!existingPayment) {
            await prisma.payment.create({
              data: {
                orderId: orderRecord.id,
                paymentMethod: "TEST_MODE",
                transactionId: `test_tx_${crypto.randomBytes(8).toString("hex")}`,
              },
            });
          }
        }
      }
      return { success: true, verified: true, isTestCheckout: true };
    }

    // Real payment — HMAC verify
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return { success: false, error: "Payment gateway not configured." };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { success: false, error: "Missing payment parameters." };
    }

    const generatedSig = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSig !== razorpay_signature) {
      // Signature mismatch — FAILED mark karo
      console.warn(`[verifyRazorpayPayment] INVALID SIGNATURE for order ${razorpay_order_id}. User: ${email}`);
      await prisma.order.updateMany({
        where: { razorpayOrderId: razorpay_order_id, status: "PENDING" },
        data: { status: "FAILED" },
      });
      return { success: false, error: "Payment verification failed. Please contact support." };
    }

    // Duplicate payment guard
    const existingTx = await prisma.payment.findUnique({ where: { transactionId: razorpay_payment_id } });
    if (existingTx) return { success: true, verified: true }; // Idempotent

    await updateUserPlan(planId);

    const orderRecord = await prisma.order.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
    if (orderRecord) {
      await prisma.order.update({ where: { id: orderRecord.id }, data: { status: "COMPLETED" } });
      await prisma.payment.create({
        data: {
          orderId: orderRecord.id,
          paymentMethod: "RAZORPAY",
          transactionId: razorpay_payment_id,
        },
      });
    }

    revalidatePath("/");
    return { success: true, verified: true };
  } catch (error) {
    return { success: false, error: clientError(error) };
  }
}

/**
 * Certificate issue karo — server session se user verify karke.
 * Client se sirf courseId aata hai.
 */
export async function issueCertificate(courseId: number) {
  try {
    const email = await resolveCallerEmail();
    const validCourseId = CourseIdSchema.parse(courseId);

    const { profile } = await getOrCreateProfile(email);
    const courseSlug = `course-${validCourseId.toString().padStart(2, "0")}`;

    const course = await prisma.course.findFirst({ where: { slug: { contains: courseSlug } } });
    if (!course) return { success: false, error: "Course not found." };

    const existing = await prisma.certificate.findFirst({
      where: { profileId: profile.id, courseId: course.id },
    });
    if (existing) return { success: true, certificate: existing };

    const verificationId = `SR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://skillrise.in/verify/${verificationId}`;

    const certificate = await prisma.certificate.create({
      data: { profileId: profile.id, courseId: course.id, verificationId, qrCodeUrl },
    });

    revalidatePath("/");
    return { success: true, certificate };
  } catch (error) {
    return { success: false, error: clientError(error) };
  }
}

// ─── AI ACTIONS (rate-limited + session-verified) ─────────────────────────────

/**
 * AI Lesson Tutor — session verified, rate limited per user.
 */
export async function queryAILessonTutor(lessonTitle: string, question: string) {
  try {
    const email = await resolveCallerEmail();
    const validated = AITutorSchema.parse({ lessonTitle, question });

    const rl = await memoryLimiter.check(`ai_tutor:${email}`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
    if (!rl.allowed) {
      return {
        success: false,
        error: `AI Tutor rate limit reached. Please wait ${Math.ceil((rl.retryAfterMs ?? 60000) / 1000)}s.`,
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return {
        success: true,
        response: `[Demo Mode — configure GEMINI_API_KEY for live responses]\n\nRegarding "${validated.lessonTitle}":\n\n1. Review the core concepts covered in this lesson.\n2. Apply the examples to your own project.\n3. Complete the quiz to validate your understanding.\n\n*(Set GEMINI_API_KEY in .env to get real AI-powered answers)*`,
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(
      `You are an expert AI tutor in a professional LMS platform called SkillRise.\n` +
      `The student is studying the lesson: "${validated.lessonTitle}".\n\n` +
      `Student Question: "${validated.question}"\n\n` +
      `Respond concisely in English with practical examples. Be helpful and precise.`
    );

    return { success: true, response: response.response.text() };
  } catch (error) {
    return { success: false, error: clientError(error, "AI Tutor is temporarily unavailable.") };
  }
}

/**
 * Resume ATS Audit — session verified, rate limited per user.
 */
export async function auditResumeATS(resumeText: string) {
  try {
    const email = await resolveCallerEmail();
    const validated = AuditResumeSchema.parse({ resumeText });

    const rl = await memoryLimiter.check(`ai_resume:${email}`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
    if (!rl.allowed) {
      return {
        success: false,
        error: `Resume audit rate limit reached. Please wait ${Math.ceil((rl.retryAfterMs ?? 60000) / 1000)}s.`,
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return {
        success: true,
        score: 72,
        optimizations: [
          "Add job-specific keywords: 'data analysis', 'Excel', 'Power BI', 'SQL'.",
          "Format employment dates consistently as 'MMM YYYY – MMM YYYY'.",
          "Quantify achievements with percentages or dollar values.",
          "*(Configure GEMINI_API_KEY in .env for personalized AI review)*",
        ],
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(
      `You are an ATS resume screening expert. Audit the resume below and return ONLY valid JSON:\n` +
      `{"score": <number 0-100>, "optimizations": [<string>, ...]}\n\n` +
      `Resume:\n${validated.resumeText}`
    );

    const txt = response.response.text().replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(txt);
    return {
      success: true,
      score: Number(parsed.score) || 70,
      optimizations: Array.isArray(parsed.optimizations)
        ? parsed.optimizations.slice(0, 8)
        : ["Add measurable impact statements to each role."],
    };
  } catch (error) {
    return { success: false, error: clientError(error, "Resume audit is temporarily unavailable.") };
  }
}

/**
 * Mock Interview Grader — session verified, rate limited per user.
 */
export async function gradeMockInterview(conversationLog: string) {
  try {
    const email = await resolveCallerEmail();
    const validated = GradeInterviewSchema.parse({ conversationLog });

    const rl = await memoryLimiter.check(`ai_interview:${email}`, AI_RATE_LIMIT.maxRequests, AI_RATE_LIMIT.windowMs);
    if (!rl.allowed) {
      return {
        success: false,
        error: `Interview grading rate limit reached. Please wait ${Math.ceil((rl.retryAfterMs ?? 60000) / 1000)}s.`,
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "placeholder") {
      return {
        success: true,
        grade: "B+",
        feedback:
          "Good structure and clear communication. To improve:\n" +
          "• Use the STAR method (Situation, Task, Action, Result) for behavioral questions.\n" +
          "• Add concrete metrics to quantify your achievements.\n" +
          "*(Configure GEMINI_API_KEY in .env for personalized AI feedback)*",
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(
      `You are an expert technical interview coach. Grade the following mock interview. Return ONLY valid JSON:\n` +
      `{"grade": "<A+|A|B+|B|C+|C|D|F>", "feedback": "<detailed multiline review>"}\n\n` +
      `Interview Log:\n${validated.conversationLog}`
    );

    const txt = response.response.text().replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(txt);
    return {
      success: true,
      grade: parsed.grade ?? "B",
      feedback: parsed.feedback ?? "Good attempt. Practice more structured responses.",
    };
  } catch (error) {
    return { success: false, error: clientError(error, "Interview grading is temporarily unavailable.") };
  }
}
