import { z } from "zod";

// Re-export for use in actions.ts single-field validation
export { z };

// ─── Shared primitives ───────────────────────────────────────────────────────

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(254, "Email too long");

export const CourseIdSchema = z
  .number()
  .int()
  .positive("Course ID must be positive")
  .max(1000, "Invalid course ID");

export const WeekSchema = z
  .number()
  .int()
  .min(1, "Week must be at least 1")
  .max(52, "Week cannot exceed 52");

// ─── Server Action Schemas ────────────────────────────────────────────────────

export const SaveLessonProgressSchema = z.object({
  email: EmailSchema,
  lessonId: z
    .string()
    .trim()
    .min(1, "Lesson ID cannot be empty")
    .max(100, "Lesson ID too long")
    .regex(/^[a-z0-9-]+$/, "Lesson ID must be alphanumeric with hyphens"),
});

export const SaveQuizAttemptSchema = z.object({
  email: EmailSchema,
  courseId: CourseIdSchema,
  week: WeekSchema,
  score: z.number().int().min(0).max(100),
  passed: z.boolean(),
});

export const SaveAssignmentSubmissionSchema = z.object({
  email: EmailSchema,
  courseId: CourseIdSchema,
  week: WeekSchema,
  solutionText: z
    .string()
    .trim()
    .min(10, "Solution must be at least 10 characters")
    .max(10_000, "Solution text too long (max 10,000 chars)"),
});

export const FetchDashboardSchema = z.object({
  email: EmailSchema,
});

export const UpdateUserPlanSchema = z.object({
  email: EmailSchema,
  plan: z.enum(["free", "starter", "pro", "career_plus", "annual_pro", "lifetime"], {
    error: "Invalid plan identifier",
  }),
});

export const CreateRazorpayOrderSchema = z.object({
  email: EmailSchema,
  planId: z.enum(["starter", "pro", "career_plus", "annual_pro", "lifetime"]),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(100_000, "Amount exceeds maximum allowed"),
});

export const VerifyRazorpayPaymentSchema = z.object({
  email: EmailSchema,
  planId: z.enum(["starter", "pro", "career_plus", "annual_pro", "lifetime"]),
  paymentDetails: z.object({
    razorpay_payment_id: z.string().max(100).optional(),
    razorpay_order_id: z.string().max(100).optional(),
    razorpay_signature: z.string().max(256).optional(),
    isTestCheckout: z.boolean().optional(),
    amount: z.number().positive().max(100_000),
  }),
});

export const IssueCertificateSchema = z.object({
  email: EmailSchema,
  courseId: CourseIdSchema,
});

export const AITutorSchema = z.object({
  lessonTitle: z
    .string()
    .trim()
    .min(1, "Lesson title required")
    .max(200, "Lesson title too long"),
  question: z
    .string()
    .trim()
    .min(3, "Question too short")
    .max(2000, "Question too long (max 2,000 chars)")
    // Strip null bytes and control chars (prompt injection mitigation)
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, " ").trim()),
});

export const AuditResumeSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(50, "Resume text too short")
    .max(4000, "Resume text too long (max 4,000 chars)")
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, " ").trim()),
});

export const GradeInterviewSchema = z.object({
  conversationLog: z
    .string()
    .trim()
    .min(20, "Conversation log too short")
    .max(4000, "Conversation log too long (max 4,000 chars)")
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, " ").trim()),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type SaveLessonProgressInput = z.infer<typeof SaveLessonProgressSchema>;
export type SaveQuizAttemptInput = z.infer<typeof SaveQuizAttemptSchema>;
export type SaveAssignmentSubmissionInput = z.infer<typeof SaveAssignmentSubmissionSchema>;
export type UpdateUserPlanInput = z.infer<typeof UpdateUserPlanSchema>;
export type CreateRazorpayOrderInput = z.infer<typeof CreateRazorpayOrderSchema>;
export type VerifyRazorpayPaymentInput = z.infer<typeof VerifyRazorpayPaymentSchema>;
export type IssueCertificateInput = z.infer<typeof IssueCertificateSchema>;
export type AITutorInput = z.infer<typeof AITutorSchema>;
export type AuditResumeInput = z.infer<typeof AuditResumeSchema>;
export type GradeInterviewInput = z.infer<typeof GradeInterviewSchema>;
