"use client";

import React, { useState, useEffect } from "react";
import { CourseData, Lesson, CourseModule } from "../types/lms";
import ReactMarkdown from "react-markdown";
import { queryAILessonTutor, auditResumeATS, gradeMockInterview } from "../app/actions";

interface CoursePlayerProps {
  courseData: CourseData;
  currentUser: { email: string; name: string; plan: string } | null;
  progress: { completed: string[]; quizScores: { [key: number]: number }; assignments: { [key: number]: string } };
  onSaveProgress: (updatedProgress: any) => void;
  onClose: () => void;
  onClaimCertificate: () => void;
  onUpgrade: () => void;
}

export default function CoursePlayer({
  courseData,
  currentUser,
  progress,
  onSaveProgress,
  onClose,
  onClaimCertificate,
  onUpgrade,
}: CoursePlayerProps) {
  const [activePane, setActivePane] = useState<"overview" | "lesson" | "quiz" | "assignment" | "certificate" | "ai">("overview");
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  
  // Local state for interactive quizzes
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Local state for assignments
  const [solutionText, setSolutionText] = useState("");
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  // AI Co-pilot states
  const [aiActiveTab, setAiActiveTab] = useState<"tutor" | "resume" | "interview">("tutor");
  const [tutorQuery, setTutorQuery] = useState("");
  const [tutorResponse, setTutorResponse] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  const [resumeText, setResumeText] = useState("");
  const [resumeFeedback, setResumeFeedback] = useState<any | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);

  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState<string | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const interviewQuestions = [
    `How do you handle missing or NULL values in a dataset? Explain with an example.`,
    `Explain the difference between calculated columns and measures in DAX.`,
    `How would you explain the value of a dashboard you built to a busy corporate CEO?`
  ];

  // Reset states when week changes
  useEffect(() => {
    setSelectedOptions({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setAssignmentSubmitted(false);
    setSolutionText("");
    setTutorResponse(null);
    setResumeFeedback(null);
    setInterviewFeedback(null);
  }, [activeWeekIdx, activePane]);

  // Compute total segments completed
  const modules = courseData.modules;
  let totalItems = 0;
  let completedItems = 0;

  modules.forEach(mod => {
    mod.lessons.forEach(l => {
      totalItems++;
      if (progress.completed.includes(l.lesson_id)) completedItems++;
    });
    totalItems += 2; // +1 for Quiz, +1 for Assignment
    if (progress.quizScores[mod.week] !== undefined) completedItems++;
    if (progress.assignments[mod.week] !== undefined) completedItems++;
  });

  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Flatten sidebar navigation mapping
  const navigationChain: { type: "lesson" | "quiz" | "assignment"; wIdx: number; lIdx?: number }[] = [];
  modules.forEach((mod, wIdx) => {
    mod.lessons.forEach((_, lIdx) => {
      navigationChain.push({ type: "lesson", wIdx, lIdx });
    });
    navigationChain.push({ type: "quiz", wIdx });
    navigationChain.push({ type: "assignment", wIdx });
  });

  const getNavigationIndex = () => {
    return navigationChain.findIndex(item => {
      if (activePane === "lesson" && item.type === "lesson" && item.wIdx === activeWeekIdx && item.lIdx === activeLessonIdx) return true;
      if (activePane === "quiz" && item.type === "quiz" && item.wIdx === activeWeekIdx) return true;
      if (activePane === "assignment" && item.type === "assignment" && item.wIdx === activeWeekIdx) return true;
      return false;
    });
  };

  const navigate = (direction: number) => {
    const curIdx = getNavigationIndex();
    const nextIdx = curIdx + direction;
    if (nextIdx >= 0 && nextIdx < navigationChain.length) {
      const target = navigationChain[nextIdx];
      if (target.type === "lesson") {
        setActivePane("lesson");
        setActiveWeekIdx(target.wIdx);
        setActiveLessonIdx(target.lIdx!);
      } else if (target.type === "quiz") {
        setActivePane("quiz");
        setActiveWeekIdx(target.wIdx);
      } else if (target.type === "assignment") {
        setActivePane("assignment");
        setActiveWeekIdx(target.wIdx);
      }
    }
  };

  const handleMarkCompleteAndNext = () => {
    const updated = { ...progress };
    if (activePane === "lesson") {
      const les = modules[activeWeekIdx].lessons[activeLessonIdx];
      if (!updated.completed.includes(les.lesson_id)) {
        updated.completed.push(les.lesson_id);
      }
    }
    onSaveProgress(updated);
    navigate(1);
  };

  const handleQuizSubmit = (quizQuestions: any[]) => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedOptions[idx] === q.answer) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);

    const updated = { ...progress };
    updated.quizScores[modules[activeWeekIdx].week] = score;
    onSaveProgress(updated);
  };

  const handleAssignmentSubmit = () => {
    if (!solutionText.trim()) {
      alert("Please write your solution notes before submitting.");
      return;
    }
    setAssignmentSubmitted(true);

    const updated = { ...progress };
    updated.assignments[modules[activeWeekIdx].week] = solutionText;
    onSaveProgress(updated);
  };

  // AI Handlers
  const handleAskTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuery.trim()) return;
    setTutorLoading(true);
    setTutorResponse(null);

    const activeLesson = modules[activeWeekIdx].lessons[activeLessonIdx];
    const res = await queryAILessonTutor(activeLesson.title, tutorQuery);
    
    setTutorLoading(false);
    if (res.success && res.response) {
      setTutorResponse(res.response);
    } else {
      alert("⚠️ AI Tutor query failed: " + res.error);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      alert("Please paste your resume content before analysis.");
      return;
    }
    setResumeLoading(true);
    setResumeFeedback(null);

    const res = await auditResumeATS(resumeText);
    
    setResumeLoading(false);
    if (res.success && res.score !== undefined) {
      setResumeFeedback({
        score: res.score,
        atsMatch: res.score >= 80 ? "ATS Matching Index: High (Ready to apply)" : "ATS Matching Index: Moderate (Needs improvement)",
        improvements: res.optimizations || ["Structure resume achievements around quantitative results."],
      });
    } else {
      alert("⚠️ Resume ATS review failed: " + res.error);
    }
  };

  const handleVerifyInterview = async () => {
    if (!interviewAnswer.trim()) {
      alert("Please type your response before checking feedback.");
      return;
    }
    setInterviewLoading(true);
    setInterviewFeedback(null);

    const activeQuestion = interviewQuestions[currentQuestionIdx];
    const conversationLog = `Question: ${activeQuestion}\nStudent Answer: ${interviewAnswer}`;
    
    const res = await gradeMockInterview(conversationLog);
    
    setInterviewLoading(false);
    if (res.success && res.grade) {
      setInterviewFeedback(
        `### Recruiter Feedback:\n` +
        `*   **Mock Grade**: ${res.grade}\n` +
        `*   **Detailed Review**: ${res.feedback}`
      );
    } else {
      alert("⚠️ Interview feedback grading failed: " + res.error);
    }
  };

  const renderActivePane = () => {
    if (activePane === "overview") {
      return (
        <div>
          <h1 className="text-2xl font-bold font-serif mb-3 text-[var(--white)]">{courseData.title}</h1>
          <p className="text-[var(--text-dim)] leading-7 mb-7 text-[0.95rem]">{courseData.overview}</p>
          
          <h3 className="text-lg font-bold font-serif text-[var(--white)] mb-4">Learning Objectives</h3>
          <ul className="flex flex-col gap-2 list-none mb-8 text-[0.9rem] text-[var(--text)]">
            {courseData.objectives.map((obj, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="text-[var(--gold)]">✓</span> {obj}
              </li>
            ))}
          </ul>

          <h3 className="text-lg font-bold font-serif text-[var(--white)] mb-5">Learning Roadmap</h3>
          <div className="flex flex-col gap-4 mb-8">
            {courseData.roadmap.phases.map((phase, i) => (
              <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
                <div className="font-bold text-[var(--gold)] mb-1">{phase.title}</div>
                <div className="text-[0.82rem] text-[var(--text-dim)]">{phase.desc}</div>
              </div>
            ))}
          </div>

          <button
            className="btn-primary py-3 px-7 text-[0.88rem] mt-2 cursor-pointer"
            onClick={() => {
              if (modules.length > 0) {
                setActivePane("lesson");
                setActiveWeekIdx(0);
                setActiveLessonIdx(0);
              }
            }}
          >
            Start Learning →
          </button>
        </div>
      );
    }

    if (activePane === "lesson") {
      const les = modules[activeWeekIdx].lessons[activeLessonIdx];
      const isPro = currentUser && ["pro", "career_plus", "annual_pro", "lifetime"].includes(currentUser.plan);

      const handleDownloadPDF = () => {
        if (!isPro) {
          onUpgrade();
          return;
        }
        const { generateLessonPDF } = require("../lib/pdf");
        generateLessonPDF(courseData.title, les);
      };

      return (
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="text-[0.7rem] uppercase text-[var(--gold)] font-bold">
              Week {activeWeekIdx + 1} / Lesson {activeLessonIdx + 1}
            </div>
            <button
              onClick={handleDownloadPDF}
              className="text-[0.7rem] text-[var(--gold)] hover:text-white border border-[var(--border)] rounded px-2.5 py-1 bg-[var(--ink)] flex items-center gap-1 cursor-pointer transition-colors font-sans"
            >
              📥 Download Premium PDF
            </button>
          </div>
          <h1 className="text-2xl font-bold font-serif mb-5 text-[var(--white)]">{les.title}</h1>

          <div className="text-[0.95rem] leading-[1.7] text-[var(--text)] mb-8 markdown-content">
            <ReactMarkdown>{les.content}</ReactMarkdown>
          </div>

          {les.code && (
            <div className="bg-[var(--ink)] border border-[var(--border)] rounded-lg p-5 relative mb-8 font-mono text-[0.85rem] overflow-x-auto">
              <button
                className="absolute top-3.5 right-3.5 bg-[var(--card)] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--white)] px-2.5 py-1 rounded text-[0.7rem] cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(les.code!);
                  alert("Code Copied!");
                }}
              >
                Copy
              </button>
              <pre><code className="text-[var(--blue)]">{les.code}</code></pre>
            </div>
          )}

          {les.diagram && (
            <div className="bg-[rgba(245,166,35,0.02)] border border-dashed border-[rgba(245,166,35,0.3)] rounded-lg p-5 mb-8 text-center">
              <div className="text-[0.75rem] text-[var(--gold)] uppercase font-bold tracking-wider mb-2">📊 Visual Specification</div>
              <div className="text-[0.85rem] text-[var(--text-dim)] italic">{les.diagram}</div>
            </div>
          )}

          <div className="border-t border-[var(--border)] pt-6 flex justify-between items-center mt-10">
            <button
              className="btn-ghost py-2.5 px-5 text-[0.8rem] disabled:opacity-40"
              disabled={getNavigationIndex() === 0}
              onClick={() => navigate(-1)}
            >
              ← Previous
            </button>
            <button
              className="btn-primary py-2.5 px-6 text-[0.82rem] shadow-none cursor-pointer"
              onClick={handleMarkCompleteAndNext}
            >
              Mark Complete & Next →
            </button>
          </div>
        </div>
      );
    }

    if (activePane === "quiz") {
      const mod = modules[activeWeekIdx];
      let quizQuestions: any[] = [];
      mod.lessons.forEach(l => {
        if (l.quiz) quizQuestions = quizQuestions.concat(l.quiz);
      });

      if (quizQuestions.length === 0) {
        return <div className="text-[var(--text-dim)]">No quiz available for this week's topics.</div>;
      }

      return (
        <div>
          <h1 className="text-2xl font-bold font-serif mb-3 text-[var(--white)]">Week {mod.week} Quiz</h1>
          <p className="text-[var(--text-dim)] text-[0.85rem] mb-6">Complete this quiz to test your understanding of this week's materials.</p>
          
          <div className="flex flex-col gap-5 mb-6">
            {quizQuestions.map((q, qIdx) => (
              <div key={qIdx} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <div className="font-bold text-[var(--white)] mb-3">Q{qIdx + 1}. {q.question}</div>
                <div className="flex flex-col gap-2.5">
                  {q.options.map((opt: string, oIdx: number) => {
                    const isSelected = selectedOptions[qIdx] === oIdx;
                    const isCorrect = q.answer === oIdx;
                    
                    let optionClass = "border-[var(--border)] bg-[var(--ink)]";
                    if (isSelected && !quizSubmitted) optionClass = "border-[var(--gold)] bg-[var(--gold-glow)]";
                    if (quizSubmitted) {
                      if (isCorrect) optionClass = "border-[var(--green)] bg-[rgba(46,204,113,0.1)] text-[var(--white)]";
                      else if (isSelected) optionClass = "border-[var(--red)] bg-[rgba(255,90,95,0.1)] text-[var(--white)]";
                    }

                    return (
                      <div
                        key={oIdx}
                        onClick={() => {
                          if (!quizSubmitted) {
                            setSelectedOptions({ ...selectedOptions, [qIdx]: oIdx });
                          }
                        }}
                        className={`p-3 border rounded-lg cursor-pointer text-[0.88rem] transition-all ${optionClass}`}
                      >
                        {opt}
                      </div>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <div className="mt-3.5 text-[0.8rem] text-[var(--text-dim)] p-2.5 bg-[rgba(245,166,35,0.05)] border-l-2 border-[var(--gold)] rounded-r">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!quizSubmitted ? (
            <button
              className="btn-primary py-3 px-6 text-[0.88rem] cursor-pointer"
              onClick={() => handleQuizSubmit(quizQuestions)}
            >
              Submit Answers →
            </button>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
              <h2 className="text-xl font-bold font-serif text-[var(--white)] mb-2">
                Your Score: <span className="text-[var(--gold)]">{quizScore}/{quizQuestions.length}</span>
              </h2>
              <p className="text-[0.9rem] text-[var(--text-dim)] mb-4">
                {quizScore === quizQuestions.length ? "Awesome! Perfect score!" : "Good job! Keep learning."}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="btn-ghost py-2 px-5 text-[0.8rem]"
                  onClick={() => {
                    setSelectedOptions({});
                    setQuizSubmitted(false);
                    setQuizScore(0);
                  }}
                >
                  Retry Quiz
                </button>
                <button className="btn-primary py-2 px-5 text-[0.8rem]" onClick={() => navigate(1)}>
                  Next Step →
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activePane === "assignment") {
      const mod = modules[activeWeekIdx];
      let assign: any = null;
      mod.lessons.forEach(l => {
        if (l.assignment) assign = l.assignment;
      });

      let downloads: any[] = [];
      mod.lessons.forEach(l => {
        if (l.downloads) downloads = downloads.concat(l.downloads);
      });

      if (!assign) {
        return <div className="text-[var(--text-dim)]">No assignment available for this week.</div>;
      }

      return (
        <div>
          <h1 className="text-2xl font-bold font-serif mb-3 text-[var(--white)]">Week {mod.week} Assignment</h1>
          <h3 className="text-lg font-bold text-[var(--white)] mb-2">{assign.title}</h3>
          <p className="text-[var(--text-dim)] leading-7 mb-6 text-[0.9rem]">{assign.prompt}</p>

          {downloads.length > 0 && (
            <div className="mb-6">
              <h4 className="text-[var(--white)] font-bold mb-2 text-[0.85rem]">Download Attachments:</h4>
              <div className="flex flex-col gap-2">
                {downloads.map((d, i) => (
                  <a
                    key={i}
                    href={d.url}
                    download
                    className="btn-ghost inline-flex items-center gap-2 text-[0.8rem] py-1.5 px-3 max-w-max text-decoration-none"
                  >
                    📥 {d.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 mb-5 text-left">
            <label className="text-[0.78rem] text-[var(--text-dim)]">Your Solution Notes / Formulas:</label>
            <textarea
              value={solutionText}
              onChange={e => setSolutionText(e.target.value)}
              disabled={assignmentSubmitted}
              rows={6}
              className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-3 text-[var(--white)] font-sans text-[0.88rem] outline-none focus:border-[var(--gold)] resize-y disabled:opacity-50"
              placeholder="Provide calculation formulas, markdown notes or links here..."
            />
          </div>

          {!assignmentSubmitted ? (
            <button className="btn-primary py-3 px-6 text-[0.88rem] cursor-pointer" onClick={handleAssignmentSubmit}>
              Submit Assignment →
            </button>
          ) : (
            <div>
              <div className="bg-[rgba(46,204,113,0.06)] border border-[rgba(46,204,113,0.3)] rounded-lg p-4 text-[var(--green)] text-[0.85rem] mb-4">
                ✓ Assignment Submitted! Instructors will review it shortly.
              </div>
              <button className="btn-primary py-2.5 px-6 text-[0.82rem] shadow-none" onClick={() => navigate(1)}>
                Next Step →
              </button>
            </div>
          )}
        </div>
      );
    }

    if (activePane === "certificate") {
      return (
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold font-serif text-[var(--white)] mb-3">Course Completed! 🎉</h1>
          <p className="text-[var(--text-dim)] leading-7 mb-8 text-[0.92rem]">
            Congratulations! You have completed all lessons, assessments, and tasks for this course. You can now claim your official certificate.
          </p>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-9 max-w-[500px] mx-auto">
            <div className="text-5xl mb-4">📜</div>
            <h3 className="text-xl font-bold font-serif text-[var(--white)] mb-2">Verified Certificate</h3>
            <p className="text-[var(--text-dim)] text-[0.8rem] mb-6">Linked to your profile registry.</p>
            <button className="btn-primary py-3 px-7 text-[0.88rem]" onClick={onClaimCertificate}>
              View Certificate →
            </button>
          </div>
        </div>
      );
    }

    // AI Career Co-pilot Pane
    if (activePane === "ai") {
      const isCareerPlus = currentUser?.plan === "career_plus";

      if (!isCareerPlus) {
        return (
          <div className="text-center py-10 max-w-[520px] mx-auto">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold font-serif text-[var(--white)] mb-3">Unlock AI Career Co-pilot</h2>
            <p className="text-[var(--text-dim)] leading-6 text-[0.88rem] mb-7">
              AI Co-pilot matches you with an <strong>AI Career Coach</strong>, real-time <strong>AI Resume Reviewers</strong>, interactive <strong>AI Interview mock prep</strong>, and instant assignment critique.
            </p>
            <button className="btn-primary py-3 px-6 text-[0.88rem] w-full" onClick={onUpgrade}>
              Upgrade to Career Plus →
            </button>
          </div>
        );
      }

      return (
        <div>
          <h1 className="text-2xl font-bold font-serif mb-2 text-[var(--white)]">AI Career Co-pilot</h1>
          <p className="text-[var(--text-dim)] text-[0.85rem] mb-6">Placement preparation suite powered by intelligence agent engines.</p>

          {/* AI Sub-navigation tabs */}
          <div className="flex gap-2 border-b border-[var(--border)] pb-3 mb-6">
            <button
              onClick={() => setAiActiveTab("tutor")}
              className={`pb-1.5 px-3 text-[0.82rem] font-bold border-b-2 cursor-pointer transition-colors ${
                aiActiveTab === "tutor" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--text-dim)]"
              }`}
            >
              💬 AI Tutor Chat
            </button>
            <button
              onClick={() => setAiActiveTab("resume")}
              className={`pb-1.5 px-3 text-[0.82rem] font-bold border-b-2 cursor-pointer transition-colors ${
                aiActiveTab === "resume" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--text-dim)]"
              }`}
            >
              📄 AI Resume Review
            </button>
            <button
              onClick={() => setAiActiveTab("interview")}
              className={`pb-1.5 px-3 text-[0.82rem] font-bold border-b-2 cursor-pointer transition-colors ${
                aiActiveTab === "interview" ? "border-[var(--gold)] text-[var(--gold)]" : "border-transparent text-[var(--text-dim)]"
              }`}
            >
              🎙️ AI Interview Practice
            </button>
          </div>

          {/* AI Tutor Chat Tab */}
          {aiActiveTab === "tutor" && (
            <div>
              <p className="text-[0.82rem] text-[var(--text-dim)] mb-4">
                Ask specific questions about this course lesson. The AI parses the textbook content and structures clear solutions.
              </p>
              
              <form onSubmit={handleAskTutor} className="flex flex-col gap-3.5 mb-6 text-left">
                <textarea
                  value={tutorQuery}
                  onChange={e => setTutorQuery(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-3 text-[var(--white)] text-[0.88rem] outline-none focus:border-[var(--gold)] resize-none"
                  placeholder="Ask a question (e.g. VLOOKUP syntax clean explain or write dynamic DAX example...)"
                />
                <button
                  type="submit"
                  disabled={tutorLoading}
                  className="btn-primary py-2.5 px-5 text-[0.82rem] max-w-max self-end shadow-none disabled:opacity-50"
                >
                  {tutorLoading ? "Analyzing..." : "Ask AI Tutor"}
                </button>
              </form>

              {tutorResponse && (
                <div
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 text-[0.88rem] text-[var(--text)] leading-7 text-left"
                  dangerouslySetInnerHTML={{
                    __html: tutorResponse
                      .replace(/### (.*)/g, '<h3 style="color:var(--white); margin: 0 0 10px; font-weight:700;">$1</h3>')
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              )}
            </div>
          )}

          {/* AI Resume Reviewer Tab */}
          {aiActiveTab === "resume" && (
            <div>
              <p className="text-[0.82rem] text-[var(--text-dim)] mb-4">
                Paste your resume text. The AI recruiter evaluates matching keywords and metrics scoring against this course outcome path.
              </p>

              <div className="flex flex-col gap-3.5 mb-6 text-left">
                <textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  rows={5}
                  className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-3 text-[var(--white)] text-[0.88rem] outline-none focus:border-[var(--gold)]"
                  placeholder="Paste resume content here..."
                />
                <button
                  onClick={handleAnalyzeResume}
                  disabled={resumeLoading}
                  className="btn-primary py-2.5 px-5 text-[0.82rem] max-w-max self-end shadow-none disabled:opacity-50"
                >
                  {resumeLoading ? "Reviewing ATS..." : "Analyze Resume"}
                </button>
              </div>

              {resumeFeedback && (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 text-left">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-[var(--white)]">Resume Audit Score</h3>
                    <span className="text-2xl font-extrabold text-[var(--gold)]">{resumeFeedback.score}/100</span>
                  </div>
                  <div className="text-[0.82rem] text-[var(--green)] font-semibold mb-4">{resumeFeedback.atsMatch}</div>
                  
                  <h4 className="text-[0.85rem] font-bold text-[var(--white)] mb-2">Suggested Improvements:</h4>
                  <ul className="flex flex-col gap-2 list-none text-[0.82rem] text-[var(--text-dim)]">
                    {resumeFeedback.improvements.map((imp: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[var(--red)]">•</span> {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* AI Interview Mock Practice */}
          {aiActiveTab === "interview" && (
            <div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 text-left mb-5">
                <div className="text-[0.65rem] tracking-wider uppercase text-[var(--gold)] font-bold mb-1">
                  Question {currentQuestionIdx + 1} of {interviewQuestions.length}
                </div>
                <div className="font-bold text-[var(--white)] leading-6 text-[0.92rem]">
                  {interviewQuestions[currentQuestionIdx]}
                </div>
              </div>

              <div className="flex flex-col gap-3.5 mb-6 text-left">
                <textarea
                  value={interviewAnswer}
                  onChange={e => setInterviewAnswer(e.target.value)}
                  rows={4}
                  className="w-full bg-[var(--ink)] border border-[var(--border)] rounded-lg p-3 text-[var(--white)] text-[0.88rem] outline-none focus:border-[var(--gold)]"
                  placeholder="Type your explanation/answer to the question..."
                />
                <div className="flex gap-2.5 justify-end">
                  <button
                    onClick={() => {
                      setCurrentQuestionIdx((currentQuestionIdx + 1) % interviewQuestions.length);
                      setInterviewAnswer("");
                      setInterviewFeedback(null);
                    }}
                    className="btn-ghost py-2.5 px-4 text-[0.8rem]"
                  >
                    Skip / Next Question
                  </button>
                  <button
                    onClick={handleVerifyInterview}
                    disabled={interviewLoading}
                    className="btn-primary py-2.5 px-5 text-[0.82rem] shadow-none disabled:opacity-50"
                  >
                    {interviewLoading ? "Verifying..." : "Check Feedback"}
                  </button>
                </div>
              </div>

              {interviewFeedback && (
                <div
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 text-[0.85rem] text-[var(--text)] leading-7 text-left"
                  dangerouslySetInnerHTML={{
                    __html: interviewFeedback
                      .replace(/### (.*)/g, '<h3 style="color:var(--white); margin: 0 0 8px; font-weight:700;">$1</h3>')
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              )}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--black)] z-[600] flex flex-col">
      {/* Header */}
      <div className="lms-header">
        <div className="lms-title-section">
          <div className="nav-logo hidden xs:block">
            Skill<span>Rise</span>
          </div>
          <div className="lms-course-title text-ellipsis overflow-hidden white-space-nowrap max-w-[200px] sm:max-w-none">
            {courseData.title}
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[0.75rem] text-[var(--text-dim)]">Progress:</span>
            <div className="w-[120px] h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--gold)] transition-all" style={{ width: progressPercent + "%" }} />
            </div>
            <span className="text-[0.75rem] font-bold text-[var(--gold)]">{progressPercent}%</span>
          </div>
          <button className="lms-close-btn" onClick={onClose}>
            ✕ Close Course
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="lms-body">
        {/* Left Sidebar */}
        <div className="lms-sidebar">
          <div
            onClick={() => setActivePane("overview")}
            className={`lms-sidebar-item ${activePane === "overview" ? "active" : ""}`}
          >
            📋 Course Overview
          </div>

          <div
            onClick={() => setActivePane("ai")}
            className={`lms-sidebar-item ${activePane === "ai" ? "active" : ""}`}
            style={{ background: "rgba(74,158,255,0.05)", borderLeft: "3px solid var(--blue)", color: "var(--blue)" }}
          >
            🤖 AI Career Co-pilot
          </div>

          {modules.map((mod, wIdx) => {
            return (
              <div key={wIdx} className="lms-week-group">
                <div className="lms-week-title">Week {mod.week}: {mod.title}</div>
                
                {mod.lessons.map((les, lIdx) => {
                  const isActive = activePane === "lesson" && activeWeekIdx === wIdx && activeLessonIdx === lIdx;
                  const isCompleted = progress.completed.includes(les.lesson_id);
                  
                  return (
                    <div
                      key={les.lesson_id}
                      onClick={() => {
                        setActivePane("lesson");
                        setActiveWeekIdx(wIdx);
                        setActiveLessonIdx(lIdx);
                      }}
                      className={`lms-sidebar-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                    >
                      📖 {les.title}
                    </div>
                  );
                })}

                {/* Week Quiz */}
                <div
                  onClick={() => {
                    setActivePane("quiz");
                    setActiveWeekIdx(wIdx);
                  }}
                  className={`lms-sidebar-item ${
                    activePane === "quiz" && activeWeekIdx === wIdx ? "active" : ""
                  } ${progress.quizScores[mod.week] !== undefined ? "completed" : ""}`}
                >
                  ❓ Week {mod.week} Quiz
                </div>

                {/* Week Assignment */}
                <div
                  onClick={() => {
                    setActivePane("assignment");
                    setActiveWeekIdx(wIdx);
                  }}
                  className={`lms-sidebar-item ${
                    activePane === "assignment" && activeWeekIdx === wIdx ? "active" : ""
                  } ${progress.assignments[mod.week] !== undefined ? "completed" : ""}`}
                >
                  📝 Week {mod.week} Assignment
                </div>
              </div>
            );
          })}

          {/* Certificate Claim */}
          {progressPercent === 100 && (
            <div
              onClick={() => setActivePane("certificate")}
              className={`lms-sidebar-item ${activePane === "certificate" ? "active" : ""}`}
              style={{ background: "var(--gold-glow)", color: "var(--gold)", fontWeight: 700, marginTop: "auto" }}
            >
              📜 Claim Certificate
            </div>
          )}
        </div>

        {/* Content Viewer Area */}
        <div className="lms-content-area">
          <div className="lms-pane active">{renderActivePane()}</div>
        </div>
      </div>
    </div>
  );
}
