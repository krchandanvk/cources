const fs = require('fs');
const path = require('path');

const htmlPath = 'c:\\Users\\DELL\\Documents\\GitHub\\cources\\skillrise-platform.html';
let content = fs.readFileSync(htmlPath, 'utf8');

// 1. Inject CSS right before the closing </style> tag
const cssToInject = `
  /* LMS Container Styles */
  #lms-container {
    position: fixed;
    inset: 0;
    background: var(--black);
    z-index: 600;
    display: none;
    flex-direction: column;
  }
  #lms-container.active {
    display: flex;
  }
  .lms-header {
    height: 64px;
    background: var(--ink);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5%;
  }
  .lms-title-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .lms-course-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--white);
  }
  .lms-close-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
  }
  .lms-close-btn:hover {
    border-color: var(--red);
    color: var(--red);
  }
  .lms-body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  .lms-sidebar {
    width: 320px;
    background: var(--ink);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .lms-week-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .lms-week-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }
  .lms-sidebar-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    color: var(--text-dim);
    text-decoration: none;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 3px solid transparent;
  }
  .lms-sidebar-item:hover, .lms-sidebar-item.active {
    background: var(--card);
    color: var(--white);
  }
  .lms-sidebar-item.active {
    border-left-color: var(--gold);
  }
  .lms-sidebar-item.completed::after {
    content: '✓';
    color: var(--green);
    margin-left: auto;
    font-weight: bold;
  }
  .lms-content-area {
    flex: 1;
    overflow-y: auto;
    padding: 40px 8%;
    background: var(--black);
  }
  .lms-pane {
    display: none;
    max-width: 800px;
    margin: 0 auto;
  }
  .lms-pane.active {
    display: block;
  }

  /* Quiz Styles */
  .quiz-container {
    margin-top: 24px;
  }
  .quiz-question-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }
  .quiz-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }
  .quiz-option {
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--ink);
  }
  .quiz-option:hover {
    border-color: var(--gold);
  }
  .quiz-option.selected {
    border-color: var(--gold);
    background: var(--gold-glow);
  }
  .quiz-option.correct {
    border-color: var(--green) !important;
    background: rgba(46,204,113,0.1) !important;
    color: var(--white);
  }
  .quiz-option.incorrect {
    border-color: var(--red) !important;
    background: rgba(255,90,95,0.1) !important;
    color: var(--white);
  }
  .quiz-explanation {
    margin-top: 14px;
    font-size: 0.8rem;
    color: var(--text-dim);
    padding: 10px 14px;
    background: rgba(245,166,35,0.05);
    border-left: 2px solid var(--gold);
    border-radius: 4px;
  }

  /* Certificate Generator Overlay */
  .cert-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.9);
    z-index: 1000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(8px);
  }
  .cert-overlay.active {
    display: flex;
  }
  .cert-card {
    width: 100%;
    max-width: 800px;
    background: #111;
    border: 8px double var(--gold);
    border-radius: 16px;
    padding: 60px 40px;
    text-align: center;
    position: relative;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    font-family: 'Inter', sans-serif;
    color: var(--white);
  }
  .cert-title {
    font-family: 'Syne', sans-serif;
    font-size: 2.2rem;
    font-weight: 800;
    color: var(--gold);
    margin-bottom: 20px;
  }
  .cert-sub {
    font-size: 1.1rem;
    color: var(--text-dim);
    margin-bottom: 30px;
  }
  .cert-recipient {
    font-family: 'Syne', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--white);
    border-bottom: 2px solid var(--border);
    display: inline-block;
    padding-bottom: 10px;
    margin-bottom: 30px;
    min-width: 300px;
  }
  .cert-course {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 40px;
  }
  .cert-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 50px;
    padding: 0 40px;
  }
  .cert-sig {
    border-top: 1px solid var(--border);
    padding-top: 8px;
    width: 150px;
    font-size: 0.8rem;
    color: var(--text-dim);
  }
  .cert-close {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 1.5rem;
    color: var(--text-dim);
    cursor: pointer;
    transition: color 0.2s;
  }
  .cert-close:hover {
    color: var(--white);
  }
`;

content = content.replace('</style>', cssToInject + '\n</style>');

// 2. Inject HTML markup right before the footer tag
const htmlToInject = `
<!-- LMS Container -->
<div id="lms-container">
  <div class="lms-header">
    <div class="lms-title-section">
      <div class="nav-logo" style="margin-right: 20px;">Skill<span>Rise</span></div>
      <div class="lms-course-title" id="lms-course-title">Course Title</div>
    </div>
    <div style="display: flex; align-items: center; gap: 20px;">
      <div class="lms-progress-container" style="display: flex; align-items: center; gap: 8px;">
        <div style="font-size: 0.75rem; color: var(--text-dim);">Progress:</div>
        <div style="width: 120px; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; position: relative;">
          <div id="lms-progress-bar" style="width: 0%; height: 100%; background: var(--gold); transition: width 0.3s;"></div>
        </div>
        <div id="lms-progress-text" style="font-size: 0.75rem; font-weight: 700; color: var(--gold);">0%</div>
      </div>
      <button class="lms-close-btn" onclick="closeLMS()">✕ Close Course</button>
    </div>
  </div>
  <div class="lms-body">
    <div class="lms-sidebar" id="lms-sidebar">
      <!-- Generated dynamically -->
    </div>
    <div class="lms-content-area">
      <!-- 1. Course Overview Pane -->
      <div class="lms-pane active" id="pane-overview">
        <h1 id="overview-title" style="font-family:'Syne',sans-serif; margin-bottom: 12px; color:var(--white);">Course Overview</h1>
        <p id="overview-desc" style="color:var(--text-dim); margin-bottom: 24px; line-height:1.7; font-size: 0.95rem;"></p>
        
        <h3 style="font-family:'Syne',sans-serif; margin-bottom: 12px; color:var(--white);">Learning Objectives</h3>
        <ul id="overview-objectives" style="list-style: none; margin-bottom: 32px; display: flex; flex-direction: column; gap: 8px; color: var(--text);">
          <!-- Objectives list -->
        </ul>
        
        <h3 style="font-family:'Syne',sans-serif; margin-bottom: 16px; color:var(--white);">Learning Roadmap</h3>
        <div id="overview-roadmap" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;">
          <!-- Roadmap phases -->
        </div>
        
        <button class="btn-primary" onclick="startCourse()">Start Learning →</button>
      </div>
      
      <!-- 2. Lesson Viewer Pane -->
      <div class="lms-pane" id="pane-lesson">
        <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--gold); font-weight: 700; margin-bottom: 4px;" id="lesson-week-tag">Week 1 / Lesson 1</div>
        <h1 id="lesson-title" style="font-family:'Syne',sans-serif; margin-bottom: 20px; color:var(--white);">Lesson Title</h1>
        
        <div id="lesson-content" style="color:var(--text); line-height: 1.7; font-size: 0.95rem; margin-bottom: 30px;">
          <!-- Lesson content -->
        </div>

        <div id="lesson-code-block" style="display: none; background: var(--ink); border: 1px solid var(--border); border-radius: 8px; padding: 16px; position: relative; margin-bottom: 30px; font-family: monospace; font-size: 0.85rem; overflow-x: auto;">
          <button style="position: absolute; top: 12px; right: 12px; background: var(--card); border: 1px solid var(--border); color: var(--text-dim); padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer;" onclick="copyCodeText()">Copy</button>
          <pre><code id="lesson-code-content" style="color: #4A9EFF;"></code></pre>
        </div>

        <div id="lesson-diagram-block" style="display: none; background: rgba(245,166,35,0.02); border: 1px dashed rgba(245,166,35,0.3); border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
          <div style="font-size: 0.75rem; color: var(--gold); text-transform: uppercase; font-weight: 700; margin-bottom: 8px;">📊 Visual Specification</div>
          <div id="lesson-diagram-content" style="font-size: 0.85rem; color: var(--text-dim); font-style: italic;"></div>
        </div>

        <div style="border-top: 1px solid var(--border); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 40px;">
          <button class="btn-ghost" style="padding: 10px 20px; font-size: 0.8rem;" id="btn-prev-lesson" onclick="navigateLesson(-1)">← Previous</button>
          <button class="btn-primary" style="padding: 10px 24px; font-size: 0.82rem; box-shadow: none;" id="btn-next-lesson" onclick="markCompleteAndNext()">Mark Complete & Next →</button>
        </div>
      </div>

      <!-- 3. Quiz Pane -->
      <div class="lms-pane" id="pane-quiz">
        <h1 style="font-family:'Syne',sans-serif; margin-bottom: 12px; color:var(--white);">Module Quiz</h1>
        <p style="color: var(--text-dim); font-size: 0.85rem; margin-bottom: 24px;">Complete this quiz to test your understanding of this week's materials.</p>
        
        <div id="quiz-questions-list">
          <!-- Quiz questions -->
        </div>
        
        <button class="btn-primary" id="btn-submit-quiz" onclick="submitQuiz()">Submit Answers →</button>
        <div id="quiz-results" style="display: none; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-top: 24px; text-align: center;">
          <h2 style="font-family:'Syne',sans-serif; color: var(--white); margin-bottom: 8px;">Your Score: <span id="quiz-score-val" style="color: var(--gold);">0/0</span></h2>
          <p id="quiz-status-msg" style="font-size: 0.9rem; color: var(--text-dim); margin-bottom: 16px;"></p>
          <button class="btn-ghost" style="padding: 8px 18px; font-size: 0.8rem;" onclick="resetQuiz()">Retry Quiz</button>
        </div>
      </div>

      <!-- 4. Assignment Pane -->
      <div class="lms-pane" id="pane-assignment">
        <h1 style="font-family:'Syne',sans-serif; margin-bottom: 12px; color:var(--white);">Weekly Assignment</h1>
        <h3 id="assignment-title" style="color: var(--white); margin-bottom: 12px;">Assignment Title</h3>
        <p id="assignment-prompt" style="color: var(--text-dim); line-height: 1.7; margin-bottom: 24px; font-size: 0.9rem;"></p>
        
        <div id="assignment-downloads" style="margin-bottom: 24px;">
          <h4 style="color: var(--white); margin-bottom: 8px; font-size: 0.85rem;">Download Attachments:</h4>
          <div id="assignment-downloads-list" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Downloads -->
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 20px;">
          <label>Your Answer / Solution Notes:</label>
          <textarea id="assignment-solution" rows="6" style="width:100%; background:var(--ink); border:1px solid var(--border); border-radius:8px; padding:12px; color:var(--white); font-family:inherit; font-size:0.88rem; outline:none; resize:vertical; transition:border-color 0.2s;" placeholder="Describe your solution steps, calculations or write your formulas here..."></textarea>
        </div>

        <button class="btn-primary" id="btn-submit-assignment" onclick="submitAssignment()">Submit Assignment →</button>
        <div id="assignment-status" style="display: none; background: rgba(46,204,113,0.06); border: 1px solid rgba(46,204,113,0.3); border-radius: 8px; padding: 14px 18px; font-size: 0.85rem; color: var(--green); margin-top: 16px;">
          ✓ Assignment Submitted! Instructors will review it shortly.
        </div>
      </div>

      <!-- 5. Certificate Pane -->
      <div class="lms-pane" id="pane-certificate" style="text-align: center;">
        <h1 style="font-family:'Syne',sans-serif; margin-bottom: 12px; color:var(--white);">Course Completed! 🎉</h1>
        <p style="color: var(--text-dim); margin-bottom: 30px; line-height: 1.7;">Congratulations! You have completed all lessons, quizzes, and assignments for this course. You can now claim your verified certificate of completion.</p>
        
        <div style="background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 40px; margin-bottom: 30px; display: inline-block; max-width: 500px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">📜</div>
          <h3 style="color: var(--white); font-family:'Syne',sans-serif; margin-bottom: 8px;">Verified Certificate</h3>
          <p style="color: var(--text-dim); font-size: 0.8rem; margin-bottom: 24px;">Includes unique verification ID linked to your profile.</p>
          <button class="btn-primary" onclick="generateCertificate()">View Certificate →</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Certificate Modal -->
<div class="cert-overlay" id="cert-overlay">
  <div class="cert-card">
    <div class="cert-close" onclick="closeCertificate()">✕</div>
    <div style="font-size: 0.8rem; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 16px; font-weight: 700;">Certificate of Completion</div>
    <div class="cert-title">Skill<span>Rise</span> Academy</div>
    <div class="cert-sub">This is proudly presented to</div>
    <div class="cert-recipient" id="cert-user-name">User Name</div>
    <div class="cert-sub">for successfully completing the online course</div>
    <div class="cert-course" id="cert-course-name">Course Name</div>
    <div class="cert-sub" style="font-size: 0.85rem; font-style: italic;">with all lessons, assessments, and capstone requirements fulfilled.</div>
    <div class="cert-footer">
      <div>
        <div style="font-size: 0.72rem; color: var(--text-dim); margin-bottom: 4px;">Date</div>
        <div style="font-size: 0.85rem; font-weight: 600;" id="cert-date">June 30, 2026</div>
      </div>
      <div>
        <div style="font-family:'Syne',sans-serif; color: var(--gold); font-size: 0.95rem; font-weight: 800; font-style: italic; margin-bottom: 4px;">SkillRise Team</div>
        <div class="cert-sig">Authorized Signature</div>
      </div>
    </div>
    <div style="font-size: 0.6rem; color: var(--muted); margin-top: 40px;" id="cert-verification-id">Verification ID: SR-XXXX-XXXX</div>
  </div>
</div>
`;

content = content.replace('<footer>', htmlToInject + '\n<footer>');

// 3. Replace handleCourseClick and add supporting LMS JS methods
const jsLmsEngine = `
let currentCourseData = null;
let currentCourseIndex = null;
let activeItemType = 'overview'; // 'overview', 'lesson', 'quiz', 'assignment', 'certificate'
let activeWeekIdx = 0;
let activeLessonIdx = 0;
let currentSelectedOptions = {}; // tracks options selected by users in quizzes

// Progress states mapping: { courseId: { completed: [lessonIds], quizScores: { weekIdx: score }, assignments: { weekIdx: solution } } }
let studentProgress = {};
if (localStorage.getItem('skillrise_student_progress')) {
  studentProgress = JSON.parse(localStorage.getItem('skillrise_student_progress'));
}

function saveStudentProgress() {
  localStorage.setItem('skillrise_student_progress', JSON.stringify(studentProgress));
  updateDashboard();
  updateProgressUI();
}

function updateProgressUI() {
  if (!currentCourseData) return;
  const courseId = currentCourseData.course_id;
  const courseProg = studentProgress[courseId] || { completed: [], quizScores: {}, assignments: {} };
  
  // Calculate total items (lessons + quizzes + assignments)
  let totalItems = 0;
  let completedItems = 0;
  
  currentCourseData.modules.forEach(mod => {
    mod.lessons.forEach(les => {
      totalItems++;
      if (courseProg.completed.includes(les.lesson_id)) completedItems++;
      
      // Update checkmarks in sidebar
      const itemEl = document.getElementById('item-' + les.lesson_id);
      if (itemEl) {
        itemEl.classList.toggle('completed', courseProg.completed.includes(les.lesson_id));
      }
    });
    
    // Quiz & Assignment items
    totalItems += 2; 
    const qKey = 'q-' + mod.week;
    const aKey = 'a-' + mod.week;
    
    if (courseProg.quizScores[mod.week] !== undefined) completedItems++;
    if (courseProg.assignments[mod.week] !== undefined) completedItems++;
    
    const quizEl = document.getElementById('item-' + qKey);
    if (quizEl) quizEl.classList.toggle('completed', courseProg.quizScores[mod.week] !== undefined);
    
    const assignEl = document.getElementById('item-' + aKey);
    if (assignEl) assignEl.classList.toggle('completed', courseProg.assignments[mod.week] !== undefined);
  });
  
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  document.getElementById('lms-progress-bar').style.width = percentage + '%';
  document.getElementById('lms-progress-text').textContent = percentage + '%';
  
  // Show certificate option if 100% complete
  const certSidebarItem = document.getElementById('item-certificate');
  if (certSidebarItem) {
    certSidebarItem.style.display = percentage === 100 ? 'flex' : 'none';
  }
}

async function handleCourseClick(index) {
  if(!currentUser){ showModal('login-modal'); return; }
  if(currentUser.plan !== 'pro' && index >= FREE_COURSES){ showModal('paywall-modal'); return; }
  
  const paddedIndex = (index + 1).toString().padStart(2, '0');
  const courseDataPath = 'courses/course-' + paddedIndex + '/course-data.json';
  
  try {
    const res = await fetch(courseDataPath);
    if (!res.ok) {
      throw new Error('Course content file not found. Loading skeleton data.');
    }
    const data = await res.json();
    currentCourseData = data;
    currentCourseIndex = index;
    openLMS(data);
  } catch (err) {
    console.error(err);
    // Load fallback mock data for testing empty skeleton courses
    const c = courses[index];
    currentCourseData = {
      course_id: index + 1,
      title: c.name,
      overview: "Standard learning curriculum overview content in Hinglish for: " + c.name,
      objectives: ["Core concepts review", "Hands-on implementation", "Portfolio enhancement"],
      roadmap: { phases: [{ title: "Phase 1: Fundamentals", desc: "Introduction" }, { title: "Phase 2: Mastery", desc: "Advanced usage" }] },
      modules: [
        {
          week: 1,
          title: "Introduction & Setup",
          lessons: [
            {
              lesson_id: "w1-l1",
              title: "Getting Started with " + c.name,
              content: "### Learning Objectives\\n\\nIn this lesson, we will cover setup workflows and tool chains. Please complete matching assignments.",
              code: "// Sample code\\nconsole.log('Welcome to " + c.name + "');",
              diagram: "Input Data Flow -> Processing Step -> Output Schema Validation",
              quiz: [
                {
                  question: "Standard baseline evaluation methodology matches:",
                  options: ["Exact parameter validations", "Static defaults", "Generic formats", "Query logs"],
                  answer: 0,
                  explanation: "Validation parameters verify input schemas match constraints."
                }
              ],
              assignment: {
                title: "Basics Setup Lab",
                prompt: "Complete baseline environment alignment setup as described in class guidelines."
              },
              downloads: []
            }
          ]
        }
      ]
    };
    currentCourseIndex = index;
    openLMS(currentCourseData);
  }
}

function openLMS(data) {
  document.getElementById('lms-course-title').textContent = data.title;
  buildLMSSidebar(data);
  loadOverviewPane(data);
  document.getElementById('lms-container').classList.add('active');
  document.body.style.overflow = 'hidden';
  updateProgressUI();
}

function closeLMS() {
  document.getElementById('lms-container').classList.remove('active');
  document.body.style.overflow = '';
}

function buildLMSSidebar(data) {
  const sidebar = document.getElementById('lms-sidebar');
  let html = \`<div class="lms-sidebar-item active" id="item-overview" onclick="showPane('overview')">📋 Course Overview</div>\`;
  
  data.modules.forEach((mod, wIdx) => {
    html += \`<div class="lms-week-group">
      <div class="lms-week-title">Week \${mod.week}: \${mod.title}</div>\`;
    
    mod.lessons.forEach((les, lIdx) => {
      html += \`<div class="lms-sidebar-item" id="item-\${les.lesson_id}" onclick="loadLesson(\${wIdx}, \${lIdx})">📖 \${les.title}</div>\`;
    });
    
    html += \`<div class="lms-sidebar-item" id="item-q-\${mod.week}" onclick="loadQuiz(\dots) || loadQuiz(\${wIdx})">❓ Week \${mod.week} Quiz</div>\`;
    html += \`<div class="lms-sidebar-item" id="item-a-\${mod.week}" onclick="loadAssignment(\${wIdx})">📝 Week \${mod.week} Assignment</div>\`;
    html += \`</div>\`;
  });
  
  html += \`<div class="lms-sidebar-item" id="item-certificate" style="display: none; background: var(--gold-glow); color: var(--gold); font-weight: 700; margin-top: auto;" onclick="showPane('certificate')">📜 Claim Certificate</div>\`;
  
  sidebar.innerHTML = html;
}

function showPane(paneId) {
  document.querySelectorAll('.lms-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('pane-' + paneId).classList.add('active');
  
  document.querySelectorAll('.lms-sidebar-item').forEach(item => item.classList.remove('active'));
  const activeSidebarItem = document.getElementById('item-' + paneId);
  if (activeSidebarItem) activeSidebarItem.classList.add('active');
}

function loadOverviewPane(data) {
  document.getElementById('overview-title').textContent = data.title;
  document.getElementById('overview-desc').textContent = data.overview;
  
  const objList = document.getElementById('overview-objectives');
  objList.innerHTML = data.objectives.map(obj => \`<li>✓ \${obj}</li>\`).join('');
  
  const roadmapEl = document.getElementById('overview-roadmap');
  roadmapEl.innerHTML = data.roadmap.phases.map(p => \`<div style="background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 14px 18px;">
    <div style="font-weight: 700; color: var(--gold); margin-bottom: 4px;">\${p.title}</div>
    <div style="font-size: 0.82rem; color: var(--text-dim);">\${p.desc}</div>
  </div>\`).join('');
  
  showPane('overview');
}

function startCourse() {
  if (currentCourseData.modules.length > 0) {
    loadLesson(0, 0);
  }
}

function loadLesson(wIdx, lIdx) {
  activeWeekIdx = wIdx;
  activeLessonIdx = lIdx;
  activeItemType = 'lesson';
  
  const les = currentCourseData.modules[wIdx].lessons[lIdx];
  document.getElementById('lesson-week-tag').textContent = \`Week \${wIdx + 1} / Lesson \${lIdx + 1}\`;
  document.getElementById('lesson-title').textContent = les.title;
  
  // Render content (simple markdown conversion for headers and lists)
  let cleanContent = les.content
    .replace(/### (.*)/g, '<h3 style="color:var(--white); margin: 20px 0 10px;">$1</h3>')
    .replace(/## (.*)/g, '<h2 style="color:var(--white); margin: 24px 0 12px;">$1</h2>')
    .replace(/\\n/g, '<br/>')
    .replace(/(\\*\\*|__)(.*?)\\1/g, '<strong>$2</strong>');
  
  document.getElementById('lesson-content').innerHTML = cleanContent;
  
  // Show code block if available
  const codeBlock = document.getElementById('lesson-code-block');
  if (les.code) {
    document.getElementById('lesson-code-content').textContent = les.code;
    codeBlock.style.display = 'block';
  } else {
    codeBlock.style.display = 'none';
  }
  
  // Show diagram block if available
  const diagramBlock = document.getElementById('lesson-diagram-block');
  if (les.diagram) {
    document.getElementById('lesson-diagram-content').textContent = les.diagram;
    diagramBlock.style.display = 'block';
  } else {
    diagramBlock.style.display = 'none';
  }
  
  // Set sidebar selection
  document.querySelectorAll('.lms-sidebar-item').forEach(item => item.classList.remove('active'));
  const activeItem = document.getElementById('item-' + les.lesson_id);
  if (activeItem) activeItem.classList.add('active');
  
  // Show Pane
  document.querySelectorAll('.lms-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('pane-lesson').classList.add('active');
}

function copyCodeText() {
  const code = document.getElementById('lesson-code-content').textContent;
  navigator.clipboard.writeText(code);
  
  const alertEl = document.createElement('div');
  alertEl.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:var(--gold); color:var(--black); padding:8px 16px; border-radius:6px; font-size:0.8rem; font-weight:700; z-index:1100;';
  alertEl.textContent = 'Code Copied!';
  document.body.appendChild(alertEl);
  setTimeout(() => alertEl.remove(), 1500);
}

function navigateLesson(dir) {
  let lessonsList = [];
  currentCourseData.modules.forEach((mod, wIdx) => {
    mod.lessons.forEach((les, lIdx) => {
      lessonsList.push({ type: 'lesson', weekIdx: wIdx, lessonIdx: lIdx });
    });
    lessonsList.push({ type: 'quiz', weekIdx: wIdx });
    lessonsList.push({ type: 'assignment', weekIdx: wIdx });
  });
  
  // Find current index
  let curIdx = -1;
  for (let i = 0; i < lessonsList.length; i++) {
    const item = lessonsList[i];
    if (activeItemType === 'lesson' && item.type === 'lesson' && item.weekIdx === activeWeekIdx && item.lessonIdx === activeLessonIdx) {
      curIdx = i;
      break;
    }
    if (activeItemType === 'quiz' && item.type === 'quiz' && item.weekIdx === activeWeekIdx) {
      curIdx = i;
      break;
    }
    if (activeItemType === 'assignment' && item.type === 'assignment' && item.weekIdx === activeWeekIdx) {
      curIdx = i;
      break;
    }
  }
  
  const nextIdx = curIdx + dir;
  if (nextIdx >= 0 && nextIdx < lessonsList.length) {
    const target = lessonsList[nextIdx];
    if (target.type === 'lesson') loadLesson(target.weekIdx, target.lessonIdx);
    else if (target.type === 'quiz') loadQuiz(target.weekIdx);
    else if (target.type === 'assignment') loadAssignment(target.weekIdx);
  }
}

function markCompleteAndNext() {
  if (!currentCourseData) return;
  const courseId = currentCourseData.course_id;
  
  if (!studentProgress[courseId]) {
    studentProgress[courseId] = { completed: [], quizScores: {}, assignments: {} };
  }
  
  if (activeItemType === 'lesson') {
    const les = currentCourseData.modules[activeWeekIdx].lessons[activeLessonIdx];
    if (!studentProgress[courseId].completed.includes(les.lesson_id)) {
      studentProgress[courseId].completed.push(les.lesson_id);
    }
  }
  
  saveStudentProgress();
  navigateLesson(1);
}

function loadQuiz(wIdx) {
  activeWeekIdx = wIdx;
  activeItemType = 'quiz';
  currentSelectedOptions = {};
  
  const mod = currentCourseData.modules[wIdx];
  
  // Find first lesson to get matching quizzes if not direct
  let quizData = [];
  mod.lessons.forEach(l => {
    if (l.quiz) quizData = quizData.concat(l.quiz);
  });
  
  const quizListEl = document.getElementById('quiz-questions-list');
  document.getElementById('btn-submit-quiz').style.display = 'block';
  document.getElementById('quiz-results').style.display = 'none';
  
  if (quizData.length === 0) {
    quizListEl.innerHTML = '<div style="color:var(--text-dim)">No quiz available for this week.</div>';
    document.getElementById('btn-submit-quiz').style.display = 'none';
  } else {
    quizListEl.innerHTML = quizData.map((q, qIdx) => \`
      <div class="quiz-question-card">
        <div style="font-weight:700; color:var(--white); margin-bottom:12px;">Q\dots Q\${qIdx+1}. \${q.question}</div>
        <div class="quiz-options">
          \${q.options.map((opt, oIdx) => \`
            <div class="quiz-option" id="q-\${qIdx}-o-\${oIdx}" onclick="selectQuizOption(\${qIdx}, \${oIdx})">\${opt}</div>
          \`).join('')}
        </div>
        <div id="q-\${qIdx}-exp" class="quiz-explanation" style="display:none;">
          <strong>Explanation:</strong> \${q.explanation}
        </div>
      </div>
    \`).join('');
  }
  
  // Sidebar select
  document.querySelectorAll('.lms-sidebar-item').forEach(item => item.classList.remove('active'));
  const activeItem = document.getElementById('item-q-' + mod.week);
  if (activeItem) activeItem.classList.add('active');
  
  showPane('quiz');
}

function selectQuizOption(qIdx, oIdx) {
  // Deselect others
  const optionsContainer = document.querySelector(\`#q-\${qIdx}-o-\${oIdx}\`).parentElement;
  optionsContainer.querySelectorAll('.quiz-option').forEach(el => el.classList.remove('selected'));
  
  document.getElementById(\`q-\${qIdx}-o-\${oIdx}\`).classList.add('selected');
  currentSelectedOptions[qIdx] = oIdx;
}

function submitQuiz() {
  const mod = currentCourseData.modules[activeWeekIdx];
  let quizData = [];
  mod.lessons.forEach(l => {
    if (l.quiz) quizData = quizData.concat(l.quiz);
  });
  
  let score = 0;
  let total = quizData.length;
  
  quizData.forEach((q, qIdx) => {
    const selected = currentSelectedOptions[qIdx];
    const explanationEl = document.getElementById(\`q-\${qIdx}-exp\`);
    if (explanationEl) explanationEl.style.display = 'block';
    
    // Highlight options
    const optionsContainer = document.getElementById(\`q-\${qIdx}-o-0\`).parentElement;
    optionsContainer.querySelectorAll('.quiz-option').forEach((el, oIdx) => {
      el.onclick = null; // disable clicks
      if (oIdx === q.answer) {
        el.classList.add('correct');
      } else if (oIdx === selected) {
        el.classList.add('incorrect');
      }
    });
    
    if (selected === q.answer) score++;
  });
  
  document.getElementById('btn-submit-quiz').style.display = 'none';
  const resultsEl = document.getElementById('quiz-results');
  resultsEl.style.display = 'block';
  document.getElementById('quiz-score-val').textContent = \`\${score}/\dots \${score}/\${total}\`;
  
  const statusMsg = document.getElementById('quiz-status-msg');
  if (score === total) statusMsg.textContent = 'Awesome! Perfect score!';
  else if (score >= total / 2) statusMsg.textContent = 'Good job! Keep learning to improve.';
  else statusMsg.textContent = 'Retry to improve your score.';
  
  // Save Quiz Completion
  const courseId = currentCourseData.course_id;
  if (!studentProgress[courseId]) {
    studentProgress[courseId] = { completed: [], quizScores: {}, assignments: {} };
  }
  studentProgress[courseId].quizScores[mod.week] = score;
  saveStudentProgress();
}

function resetQuiz() {
  loadQuiz(activeWeekIdx);
}

function loadAssignment(wIdx) {
  activeWeekIdx = wIdx;
  activeItemType = 'assignment';
  
  const mod = currentCourseData.modules[wIdx];
  
  // Find first lesson assignment
  let assign = null;
  mod.lessons.forEach(l => {
    if (l.assignment) assign = l.assignment;
  });
  
  document.getElementById('pane-assignment').querySelector('h1').textContent = \`Week \${mod.week} Assignment\`;
  document.getElementById('assignment-title').textContent = assign ? assign.title : "No Assignment";
  document.getElementById('assignment-prompt').textContent = assign ? assign.prompt : "No assignment prompt available for this week.";
  
  // Load downloads
  let downloads = [];
  mod.lessons.forEach(l => {
    if (l.downloads) downloads = downloads.concat(l.downloads);
  });
  
  const downloadEl = document.getElementById('assignment-downloads-list');
  if (downloads.length === 0) {
    document.getElementById('assignment-downloads').style.display = 'none';
  } else {
    document.getElementById('assignment-downloads').style.display = 'block';
    downloadEl.innerHTML = downloads.map(d => \`
      <a href="\${d.url}" download class="btn-ghost" style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.8rem; padding: 6px 12px; margin-top: 4px; text-decoration: none; width: max-content;">
        📥 \${d.name}
      </a>
    \`).join('');
  }
  
  // Submission text area value load
  const courseId = currentCourseData.course_id;
  const courseProg = studentProgress[courseId] || { completed: [], quizScores: {}, assignments: {} };
  const prevSolution = courseProg.assignments[mod.week];
  
  document.getElementById('assignment-solution').value = prevSolution || '';
  document.getElementById('assignment-status').style.display = prevSolution ? 'block' : 'none';
  
  // Sidebar select
  document.querySelectorAll('.lms-sidebar-item').forEach(item => item.classList.remove('active'));
  const activeItem = document.getElementById('item-a-' + mod.week);
  if (activeItem) activeItem.classList.add('active');
  
  showPane('assignment');
}

function submitAssignment() {
  const solutionText = document.getElementById('assignment-solution').value.trim();
  if (!solutionText) {
    alert('Please enter your solution notes before submitting.');
    return;
  }
  
  const courseId = currentCourseData.course_id;
  const mod = currentCourseData.modules[activeWeekIdx];
  
  if (!studentProgress[courseId]) {
    studentProgress[courseId] = { completed: [], quizScores: {}, assignments: {} };
  }
  
  studentProgress[courseId].assignments[mod.week] = solutionText;
  saveStudentProgress();
  
  document.getElementById('assignment-status').style.display = 'block';
  
  const alertEl = document.createElement('div');
  alertEl.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#2ECC71; color:#000; padding:8px 16px; border-radius:6px; font-size:0.8rem; font-weight:700; z-index:1100;';
  alertEl.textContent = 'Assignment Submitted Successfully!';
  document.body.appendChild(alertEl);
  setTimeout(() => alertEl.remove(), 2000);
}

function generateCertificate() {
  const userName = currentUser ? currentUser.name : "Student Name";
  const courseName = currentCourseData.title;
  
  document.getElementById('cert-user-name').textContent = userName;
  document.getElementById('cert-course-name').textContent = courseName;
  
  // Random verification ID
  const randomId = 'SR-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
  document.getElementById('cert-verification-id').textContent = 'Verification ID: ' + randomId;
  
  // Format Date
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('cert-date').textContent = dateStr;
  
  document.getElementById('cert-overlay').classList.add('active');
}

function closeCertificate() {
  document.getElementById('cert-overlay').classList.remove('active');
}

// Intercept original login success dashboard stats mapping
function updateDashboard() {
  document.getElementById('dash-name').textContent = currentUser.name.split(' ')[0];
  const isPro = currentUser.plan === 'pro';
  document.getElementById('dash-meta').textContent = isPro
    ? 'Pro Member — All 50+ courses unlocked 🎉'
    : 'Free Plan — 3 preview courses available';
  document.getElementById('dash-courses-count').textContent = isPro ? '50+' : '3';
  document.getElementById('upgrade-banner').classList.toggle('hidden', isPro);
  
  // Calculate completed courses from studentProgress
  let completedCount = 0;
  let certCount = 0;
  
  Object.keys(studentProgress).forEach(courseId => {
    // Check if progress is 100%
    const prog = studentProgress[courseId];
    const totalCompleted = (prog.completed || []).length + Object.keys(prog.quizScores || {}).length + Object.keys(prog.assignments || {}).length;
    if (totalCompleted > 0) {
      completedCount++;
    }
    
    // Certificate count (if 100%)
    if (prog.completed.length > 0 && Object.keys(prog.quizScores).length > 0 && Object.keys(prog.assignments).length > 0) {
      certCount++;
    }
  });
  
  document.querySelector('.dashboard-stats').innerHTML = \`
    <div class="dash-stat"><div class="dash-stat-num" id="dash-courses-count">\${isPro ? '50+' : '3'}</div><div class="dash-stat-label">Courses Available</div></div>
    <div class="dash-stat"><div class="dash-stat-num">\${completedCount}</div><div class="dash-stat-label">In Progress</div></div>
    <div class="dash-stat"><div class="dash-stat-num" id="dash-cert-count">\${certCount}</div><div class="dash-stat-label">Certificates</div></div>
  \`;
}
`;

content = content.replace('function handleCourseClick(index){', '/* Original handleCourseClick replaced by LMS Engine */\n' + jsLmsEngine + '\nfunction original_handleCourseClick(index){');

fs.writeFileSync(htmlPath, content);
console.log('SkillRise HTML integrated with full LMS Engine!');
