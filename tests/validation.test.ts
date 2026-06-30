import { describe, it, expect } from "vitest";
import {
  SaveLessonProgressSchema,
  SaveQuizAttemptSchema,
  SaveAssignmentSubmissionSchema,
  UpdateUserPlanSchema,
  CreateRazorpayOrderSchema,
  AITutorSchema,
  AuditResumeSchema,
  GradeInterviewSchema,
  IssueCertificateSchema,
  EmailSchema,
} from "../lib/validation";

describe("EmailSchema", () => {
  it("accepts valid email", () => {
    expect(() => EmailSchema.parse("user@example.com")).not.toThrow();
  });

  it("normalizes to lowercase", () => {
    expect(EmailSchema.parse("USER@EXAMPLE.COM")).toBe("user@example.com");
  });

  it("rejects invalid email", () => {
    expect(() => EmailSchema.parse("not-an-email")).toThrow();
    expect(() => EmailSchema.parse("")).toThrow();
  });

  it("rejects overly long email", () => {
    expect(() => EmailSchema.parse("a".repeat(250) + "@x.com")).toThrow();
  });
});

describe("SaveLessonProgressSchema", () => {
  it("accepts valid input", () => {
    const result = SaveLessonProgressSchema.parse({
      email: "user@example.com",
      lessonId: "w1-l1",
    });
    expect(result.lessonId).toBe("w1-l1");
  });

  it("rejects invalid lessonId with special chars", () => {
    expect(() =>
      SaveLessonProgressSchema.parse({ email: "user@example.com", lessonId: "w1 l1!" })
    ).toThrow();
  });

  it("rejects empty lessonId", () => {
    expect(() =>
      SaveLessonProgressSchema.parse({ email: "user@example.com", lessonId: "" })
    ).toThrow();
  });
});

describe("SaveQuizAttemptSchema", () => {
  it("accepts valid input", () => {
    const result = SaveQuizAttemptSchema.parse({
      email: "user@example.com",
      courseId: 1,
      week: 3,
      score: 8,
      passed: true,
    });
    expect(result.score).toBe(8);
  });

  it("rejects negative courseId", () => {
    expect(() =>
      SaveQuizAttemptSchema.parse({ email: "u@e.com", courseId: -1, week: 1, score: 5, passed: true })
    ).toThrow();
  });

  it("rejects score above 100", () => {
    expect(() =>
      SaveQuizAttemptSchema.parse({ email: "u@e.com", courseId: 1, week: 1, score: 200, passed: true })
    ).toThrow();
  });
});

describe("SaveAssignmentSubmissionSchema", () => {
  it("accepts valid solution text", () => {
    const result = SaveAssignmentSubmissionSchema.parse({
      email: "user@example.com",
      courseId: 1,
      week: 1,
      solutionText: "This is a valid solution with enough content.",
    });
    expect(result.solutionText).toContain("valid solution");
  });

  it("rejects too-short solution", () => {
    expect(() =>
      SaveAssignmentSubmissionSchema.parse({
        email: "u@e.com",
        courseId: 1,
        week: 1,
        solutionText: "Short",
      })
    ).toThrow();
  });

  it("rejects solution exceeding 10,000 chars", () => {
    expect(() =>
      SaveAssignmentSubmissionSchema.parse({
        email: "u@e.com",
        courseId: 1,
        week: 1,
        solutionText: "a".repeat(10_001),
      })
    ).toThrow();
  });
});

describe("UpdateUserPlanSchema", () => {
  it("accepts valid plans", () => {
    const plans = ["free", "starter", "pro", "career_plus", "annual_pro", "lifetime"] as const;
    for (const plan of plans) {
      expect(() => UpdateUserPlanSchema.parse({ email: "u@e.com", plan })).not.toThrow();
    }
  });

  it("rejects unknown plan", () => {
    expect(() =>
      UpdateUserPlanSchema.parse({ email: "u@e.com", plan: "superultrapro" })
    ).toThrow();
  });
});

describe("CreateRazorpayOrderSchema", () => {
  it("accepts valid order", () => {
    const result = CreateRazorpayOrderSchema.parse({
      email: "u@e.com",
      planId: "pro",
      amount: 299,
    });
    expect(result.amount).toBe(299);
  });

  it("rejects negative amount", () => {
    expect(() =>
      CreateRazorpayOrderSchema.parse({ email: "u@e.com", planId: "pro", amount: -1 })
    ).toThrow();
  });

  it("rejects amount above max", () => {
    expect(() =>
      CreateRazorpayOrderSchema.parse({ email: "u@e.com", planId: "pro", amount: 999_999 })
    ).toThrow();
  });
});

describe("AITutorSchema", () => {
  it("accepts valid question", () => {
    const result = AITutorSchema.parse({
      lessonTitle: "Introduction to SQL",
      question: "What is a JOIN and when should I use it?",
    });
    expect(result.question).toContain("JOIN");
  });

  it("strips control characters from question (prompt injection mitigation)", () => {
    const result = AITutorSchema.parse({
      lessonTitle: "Test",
      question: "Normal text\u0000\u001Fwith control chars",
    });
    expect(result.question).not.toContain("\u0000");
  });

  it("rejects question exceeding 2000 chars", () => {
    expect(() =>
      AITutorSchema.parse({ lessonTitle: "Test", question: "a".repeat(2001) })
    ).toThrow();
  });

  it("rejects empty question", () => {
    expect(() =>
      AITutorSchema.parse({ lessonTitle: "Test", question: "ab" })
    ).toThrow();
  });
});

describe("AuditResumeSchema", () => {
  it("accepts valid resume text", () => {
    const resume = "Software Engineer at TechCorp. Built distributed systems. 5 years experience.";
    const result = AuditResumeSchema.parse({ resumeText: resume });
    expect(result.resumeText).toContain("TechCorp");
  });

  it("rejects resume under 50 chars", () => {
    expect(() => AuditResumeSchema.parse({ resumeText: "Too short" })).toThrow();
  });

  it("rejects resume over 4000 chars", () => {
    expect(() => AuditResumeSchema.parse({ resumeText: "x".repeat(4001) })).toThrow();
  });
});

describe("IssueCertificateSchema", () => {
  it("accepts valid input", () => {
    const result = IssueCertificateSchema.parse({ email: "u@e.com", courseId: 1 });
    expect(result.courseId).toBe(1);
  });

  it("rejects courseId of 0", () => {
    expect(() => IssueCertificateSchema.parse({ email: "u@e.com", courseId: 0 })).toThrow();
  });

  it("rejects courseId above 1000", () => {
    expect(() => IssueCertificateSchema.parse({ email: "u@e.com", courseId: 9999 })).toThrow();
  });
});
