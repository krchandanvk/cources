export interface Course {
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

export const COURSES: Course[] = [
  {cat:'ai',icon:'🤖',catLabel:'AI & Automation',name:'AI Prompt Engineering Masterclass',outcome:'Freelancer / AI Trainer',level:'beg',duration:'4 weeks',hot:true,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'ai',icon:'🧠',catLabel:'AI & Automation',name:'Build AI Agents with LangChain & Python',outcome:'AI Developer',level:'int',duration:'8 weeks',hot:true,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'ai',icon:'⚙️',catLabel:'AI & Automation',name:'Workflow Automation: Make.com / Zapier / n8n',outcome:'Automation Consultant',level:'beg',duration:'4 weeks',hot:false,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'ai',icon:'💬',catLabel:'AI & Automation',name:'ChatGPT & AI Tools for Business',outcome:'AI-powered Virtual Assistant',level:'beg',duration:'3 weeks',hot:false,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'ai',icon:'🚀',catLabel:'AI & Automation',name:'No-Code AI App Building',outcome:'SaaS Founder / Freelancer',level:'beg',duration:'5 weeks',hot:true,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'data',icon:'📊',catLabel:'Data & Analytics',name:'Data Analytics with Excel & Power BI',outcome:'Data Analyst',level:'beg',duration:'6 weeks',hot:true,accent:'#4A9EFF',accentBg:'rgba(74,158,255,0.1)'},
  {cat:'data',icon:'🐍',catLabel:'Data & Analytics',name:'Python for Data Science',outcome:'Data Scientist',level:'int',duration:'10 weeks',hot:true,accent:'#4A9EFF',accentBg:'rgba(74,158,255,0.1)'},
  {cat:'data',icon:'🗄️',catLabel:'Data & Analytics',name:'SQL for Business Intelligence',outcome:'BI Analyst',level:'beg',duration:'4 weeks',hot:false,accent:'#4A9EFF',accentBg:'rgba(74,158,255,0.1)'},
  {cat:'data',icon:'📈',catLabel:'Data & Analytics',name:'Data Visualization & Dashboarding',outcome:'Freelance Analyst',level:'int',duration:'5 weeks',hot:false,accent:'#4A9EFF',accentBg:'rgba(74,158,255,0.1)'},
  {cat:'data',icon:'💡',catLabel:'Data & Analytics',name:'Business Analytics & Decision Making',outcome:'Business Analyst',level:'beg',duration:'6 weeks',hot:false,accent:'#4A9EFF',accentBg:'rgba(74,158,255,0.1)'},
  {cat:'cloud',icon:'☁️',catLabel:'Cloud & DevOps',name:'AWS Cloud Practitioner (Zero to Certified)',outcome:'Cloud Support Engineer',level:'beg',duration:'6 weeks',hot:true,accent:'#2ECC71',accentBg:'rgba(46,204,113,0.1)'},
  {cat:'cloud',icon:'🔷',catLabel:'Cloud & DevOps',name:'Microsoft Azure Fundamentals (AZ-900)',outcome:'Azure Administrator',level:'beg',duration:'5 weeks',hot:true,accent:'#2ECC71',accentBg:'rgba(46,204,113,0.1)'},
  {cat:'cloud',icon:'🌐',catLabel:'Cloud & DevOps',name:'Google Cloud Associate Engineer',outcome:'Cloud Engineer',level:'int',duration:'8 weeks',hot:false,accent:'#2ECC71',accentBg:'rgba(46,204,113,0.1)'},
  {cat:'cloud',icon:'🐳',catLabel:'Cloud & DevOps',name:'DevOps with Docker & Kubernetes',outcome:'DevOps Engineer',level:'adv',duration:'10 weeks',hot:true,accent:'#2ECC71',accentBg:'rgba(46,204,113,0.1)'},
  {cat:'cloud',icon:'🐧',catLabel:'Cloud & DevOps',name:'Linux for Beginners (Server Admin)',outcome:'System Administrator',level:'beg',duration:'4 weeks',hot:false,accent:'#2ECC71',accentBg:'rgba(46,204,113,0.1)'},
  {cat:'cyber',icon:'🔐',catLabel:'Cybersecurity',name:'Cybersecurity Fundamentals (CompTIA Security+)',outcome:'Security Analyst',level:'beg',duration:'8 weeks',hot:true,accent:'#FF5A5F',accentBg:'rgba(255,90,95,0.1)'},
  {cat:'cyber',icon:'🕵️',catLabel:'Cybersecurity',name:'Ethical Hacking & Penetration Testing',outcome:'Penetration Tester',level:'int',duration:'12 weeks',hot:true,accent:'#FF5A5F',accentBg:'rgba(255,90,95,0.1)'},
  {cat:'cyber',icon:'🛡️',catLabel:'Cybersecurity',name:'Network Security & Firewall Management',outcome:'Network Engineer',level:'int',duration:'8 weeks',hot:false,accent:'#FF5A5F',accentBg:'rgba(255,90,95,0.1)'},
  {cat:'cyber',icon:'🔍',catLabel:'Cybersecurity',name:'Digital Forensics & Incident Response',outcome:'SOC Analyst',level:'adv',duration:'10 weeks',hot:false,accent:'#FF5A5F',accentBg:'rgba(255,90,95,0.1)'},
  {cat:'cyber',icon:'🌩️',catLabel:'Cybersecurity',name:'Cloud Security Essentials',outcome:'Cloud Security Engineer',level:'int',duration:'6 weeks',hot:true,accent:'#FF5A5F',accentBg:'rgba(255,90,95,0.1)'},
  {cat:'dev',icon:'💻',catLabel:'Web & App Dev',name:'Full-Stack Web Development (HTML/CSS/JS/React)',outcome:'Web Developer',level:'beg',duration:'16 weeks',hot:true,accent:'#9B59B6',accentBg:'rgba(155,89,182,0.1)'},
  {cat:'dev',icon:'▲',catLabel:'Web & App Dev',name:'Next.js & Node.js for Modern Web Apps',outcome:'Full-Stack Developer',level:'int',duration:'10 weeks',hot:true,accent:'#9B59B6',accentBg:'rgba(155,89,182,0.1)'},
  {cat:'dev',icon:'📱',catLabel:'Web & App Dev',name:'Mobile App Development (Flutter / React Native)',outcome:'App Developer',level:'int',duration:'12 weeks',hot:false,accent:'#9B59B6',accentBg:'rgba(155,89,182,0.1)'},
  {cat:'dev',icon:'🌐',catLabel:'Web & App Dev',name:'WordPress Website Building & Freelancing',outcome:'Freelance Web Designer',level:'beg',duration:'4 weeks',hot:false,accent:'#9B59B6',accentBg:'rgba(155,89,182,0.1)'},
  {cat:'dev',icon:'🎨',catLabel:'Web & App Dev',name:'UI/UX Design with Figma',outcome:'UI/UX Designer',level:'beg',duration:'6 weeks',hot:true,accent:'#9B59B6',accentBg:'rgba(155,89,182,0.1)'},
  {cat:'marketing',icon:'📣',catLabel:'Digital Marketing',name:'Digital Marketing Complete Course (A–Z)',outcome:'Digital Marketer',level:'beg',duration:'8 weeks',hot:true,accent:'#E67E22',accentBg:'rgba(230,126,34,0.1)'},
  {cat:'marketing',icon:'🔎',catLabel:'Digital Marketing',name:'SEO Mastery — Rank Websites on Google',outcome:'SEO Specialist',level:'beg',duration:'5 weeks',hot:true,accent:'#E67E22',accentBg:'rgba(230,126,34,0.1)'},
  {cat:'marketing',icon:'💰',catLabel:'Digital Marketing',name:'Meta & Google Paid Ads (Performance Marketing)',outcome:'Ads Manager',level:'int',duration:'6 weeks',hot:true,accent:'#E67E22',accentBg:'rgba(230,126,34,0.1)'},
  {cat:'marketing',icon:'📧',catLabel:'Digital Marketing',name:'Email Marketing & List Building',outcome:'Email Marketer',level:'beg',duration:'3 weeks',hot:false,accent:'#E67E22',accentBg:'rgba(230,126,34,0.1)'},
  {cat:'marketing',icon:'📱',catLabel:'Digital Marketing',name:'Social Media Management & Content Strategy',outcome:'Social Media Manager',level:'beg',duration:'4 weeks',hot:false,accent:'#E67E22',accentBg:'rgba(230,126,34,0.1)'},
  {cat:'marketing',icon:'🎬',catLabel:'Digital Marketing',name:'Short-Form Video Marketing (Reels / TikTok / Shorts)',outcome:'Content Creator',level:'beg',duration:'3 weeks',hot:true,accent:'#E67E22',accentBg:'rgba(230,126,34,0.1)'},
  {cat:'finance',icon:'📒',catLabel:'Finance & Accounting',name:'Accounting & Bookkeeping for Beginners',outcome:'Freelance Bookkeeper',level:'beg',duration:'5 weeks',hot:false,accent:'#1ABC9C',accentBg:'rgba(26,188,156,0.1)'},
  {cat:'finance',icon:'🧾',catLabel:'Finance & Accounting',name:'Tally Prime / QuickBooks Mastery',outcome:'Accounts Executive',level:'beg',duration:'4 weeks',hot:false,accent:'#1ABC9C',accentBg:'rgba(26,188,156,0.1)'},
  {cat:'finance',icon:'📉',catLabel:'Finance & Accounting',name:'Financial Modelling & Valuation (Excel)',outcome:'Financial Analyst',level:'int',duration:'8 weeks',hot:true,accent:'#1ABC9C',accentBg:'rgba(26,188,156,0.1)'},
  {cat:'finance',icon:'🇮🇳',catLabel:'Finance & Accounting',name:'GST, Taxation & Compliance',outcome:'Tax Consultant',level:'beg',duration:'4 weeks',hot:false,accent:'#1ABC9C',accentBg:'rgba(26,188,156,0.1)'},
  {cat:'finance',icon:'📈',catLabel:'Finance & Accounting',name:'Stock Market & Trading Fundamentals',outcome:'Trader / Investor',level:'beg',duration:'5 weeks',hot:true,accent:'#1ABC9C',accentBg:'rgba(26,188,156,0.1)'},
  {cat:'creative',icon:'🖌️',catLabel:'Creative & Design',name:'Graphic Design with Canva & Adobe',outcome:'Freelance Designer',level:'beg',duration:'5 weeks',hot:false,accent:'#E91E8C',accentBg:'rgba(233,30,140,0.1)'},
  {cat:'creative',icon:'🎬',catLabel:'Creative & Design',name:'Video Editing (Premiere Pro / CapCut)',outcome:'Video Editor',level:'beg',duration:'4 weeks',hot:true,accent:'#E91E8C',accentBg:'rgba(233,30,140,0.1)'},
  {cat:'creative',icon:'✨',catLabel:'Creative & Design',name:'Motion Graphics & After Effects',outcome:'Motion Designer',level:'int',duration:'8 weeks',hot:false,accent:'#E91E8C',accentBg:'rgba(233,30,140,0.1)'},
  {cat:'creative',icon:'📷',catLabel:'Creative & Design',name:'Photography & Photo Editing for Freelancers',outcome:'Photographer',level:'beg',duration:'4 weeks',hot:false,accent:'#E91E8C',accentBg:'rgba(233,30,140,0.1)'},
  {cat:'creative',icon:'🧊',catLabel:'Creative & Design',name:'3D Design & Product Visualization (Blender)',outcome:'3D Artist',level:'adv',duration:'12 weeks',hot:true,accent:'#E91E8C',accentBg:'rgba(233,30,140,0.1)'},
  {cat:'freelance',icon:'💼',catLabel:'Freelancing & Remote',name:'Freelancing on Upwork & Fiverr',outcome:'Freelancer (₹1L+/month)',level:'beg',duration:'3 weeks',hot:true,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'freelance',icon:'🖥️',catLabel:'Freelancing & Remote',name:'Virtual Assistant Business Setup',outcome:'Remote VA',level:'beg',duration:'3 weeks',hot:false,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'freelance',icon:'✍️',catLabel:'Freelancing & Remote',name:'Copywriting & Content Writing for the Web',outcome:'Freelance Writer',level:'beg',duration:'4 weeks',hot:false,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'freelance',icon:'🔗',catLabel:'Freelancing & Remote',name:'LinkedIn Profile & Personal Branding Mastery',outcome:'Job Seeker / Consultant',level:'beg',duration:'2 weeks',hot:true,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'freelance',icon:'📋',catLabel:'Freelancing & Remote',name:'Project Management (PMP / Agile / Scrum)',outcome:'Project Manager',level:'int',duration:'8 weeks',hot:false,accent:'#F5A623',accentBg:'rgba(245,166,35,0.1)'},
  {cat:'health',icon:'🏥',catLabel:'Healthcare IT',name:'Medical Coding & Billing (ICD-10)',outcome:'Medical Coder',level:'beg',duration:'8 weeks',hot:false,accent:'#3498DB',accentBg:'rgba(52,152,219,0.1)'},
  {cat:'health',icon:'💊',catLabel:'Healthcare IT',name:'Health Data & EHR Management',outcome:'Health IT Specialist',level:'int',duration:'8 weeks',hot:true,accent:'#3498DB',accentBg:'rgba(52,152,219,0.1)'},
  {cat:'health',icon:'🏢',catLabel:'Healthcare IT',name:'SAP Basics for Business (ERP)',outcome:'SAP Consultant',level:'beg',duration:'6 weeks',hot:true,accent:'#3498DB',accentBg:'rgba(52,152,219,0.1)'},
  {cat:'health',icon:'🚢',catLabel:'Healthcare IT',name:'Supply Chain & Logistics Management',outcome:'Logistics Analyst',level:'beg',duration:'6 weeks',hot:false,accent:'#3498DB',accentBg:'rgba(52,152,219,0.1)'}
];
