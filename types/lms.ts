export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // Correct option index (0-based)
  explanation: string;
}

export interface Assignment {
  title: string;
  prompt: string;
}

export interface Download {
  name: string;
  url: string;
}

export interface Lesson {
  lesson_id: string;
  title: string;
  content: string;
  code?: string;
  diagram?: string;
  quiz?: QuizQuestion[];
  assignment?: Assignment;
  downloads?: Download[];
}

export interface CourseModule {
  week: number;
  title: string;
  lessons: Lesson[];
}

export interface RoadmapPhase {
  title: string;
  desc: string;
}

export interface CourseRoadmap {
  phases: RoadmapPhase[];
}

export interface CourseData {
  course_id: number;
  title: string;
  category: string;
  level: string;
  duration: string;
  outcome: string;
  overview: string;
  objectives: string[];
  roadmap: CourseRoadmap;
  modules: CourseModule[];
  capstone: {
    title: string;
    description: string;
  };
  interview_questions: {
    question: string;
    answer: string;
  }[];
}
