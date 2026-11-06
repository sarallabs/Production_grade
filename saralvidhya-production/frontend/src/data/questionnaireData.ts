export type Option = {
  text: string;
  points: number;
  icon?: string;
};

export type Question = {
  id: number;
  text: string;
  description?: string;
  options: Option[];
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What was your primary medium of instruction before joining this program?",
    options: [
      { text: "Urdu Medium", points: 3, icon: "✒️" },
      { text: "English Medium", points: 2, icon: "🔤" },
      { text: "Vernacular / Other Language", points: 1, icon: "🗣️" }
    ]
  },
  {
    id: 2,
    text: "How would you rate your comfort level with typing or writing assignments in your course language?",
    options: [
      { text: "Completely fluent", points: 3, icon: "⌨️" },
      { text: "Understand well, struggle to frame answers", points: 2, icon: "🧩" },
      { text: "Need help with basic writing/vocabulary", points: 1, icon: "📝" }
    ]
  },
  {
    id: 3,
    text: "Alongside your distance learning, what does your daily routine primarily look like?",
    options: [
      { text: "Full-Time Student", points: 3, icon: "🎒" },
      { text: "Working Professional", points: 2, icon: "💼" },
      { text: "Homemaker / Family Responsibilities", points: 2, icon: "🏠" }
    ]
  },
  {
    id: 4,
    text: "On average, how much time can you realistically invest in your studies every week?",
    options: [
      { text: "More than 15 hours", points: 3, icon: "🔋" },
      { text: "5 to 15 hours", points: 2, icon: "⚖️" },
      { text: "Less than 5 hours", points: 1, icon: "⏳" }
    ]
  },
  {
    id: 5,
    text: "What is the main milestone you want Saral Vidhya to help you achieve?",
    options: [
      { text: "Excel in university exams", points: 2, icon: "🏆" },
      { text: "Prepare for competitive exams", points: 3, icon: "🎯" },
      { text: "Gain domain knowledge", points: 2, icon: "🧠" }
    ]
  },
  {
    id: 6,
    text: "Which learning format keeps you most engaged?",
    options: [
      { text: "Text & Analysis (Books, Notes)", points: 3, icon: "📖" },
      { text: "Audio-Visual Media (Videos, Podcasts)", points: 2, icon: "🎬" },
      { text: "Self-Assessment (Mock tests)", points: 2, icon: "💯" }
    ]
  },
  {
    id: 7,
    text: "How will you primarily be accessing the Saral Vidhya platform?",
    options: [
      { text: "Smartphone (Android App)", points: 1, icon: "📱" },
      { text: "Laptop/Desktop PC (Web App)", points: 2, icon: "💻" },
      { text: "Both Smartphone & PC", points: 3, icon: "📱💻" }
    ]
  },
  {
    id: 8,
    text: "According to the author, what is the primary strength of distance education?",
    description: "\"Distance education is often critiqued for lacking physical classroom community. However, its true democratic power lies in its radical accessibility. By decoupling learning from rigid geographic boundaries and fixed time schedules, it allows non-traditional scholars—such as working professionals and homemakers—to claim an academic identity that conventional brick-and-mortar universities structurally deny them.\"",
    options: [
      { text: "Provides physical classroom community.", points: 0, icon: "🏫" },
      { text: "Replaces conventional universities.", points: 0, icon: "🏛️" },
      { text: "Offers democratic accessibility.", points: 1, icon: "🔓" },
      { text: "Designed for traditional scholars.", points: 0, icon: "🎓" }
    ]
  },
  {
    id: 9,
    text: "Which of the following is the most logical conclusion from this statement?",
    description: "Scenario: \"Students who attend 90% of live online webinars consistently score higher marks than those who only read the PDF notes.\"",
    options: [
      { text: "Reading PDF notes is completely useless.", points: 0, icon: "❌" },
      { text: "Live engagement correlates with better grasp.", points: 1, icon: "📊" },
      { text: "Attending webinars guarantees topping exams.", points: 0, icon: "🥇" },
      { text: "Webinars are always superior to lectures.", points: 0, icon: "🖥️" }
    ]
  },
  {
    id: 10,
    text: "Choose the word that best completes this sentence into a formal academic statement:",
    description: "\"The committee decided to _________ the older curriculum models to incorporate more modern digital skills.\"",
    options: [
      { text: "Destroy", points: 0, icon: "🗑️" },
      { text: "Revamp / Restructure", points: 1, icon: "🏗️" },
      { text: "Ignore", points: 0, icon: "🚫" },
      { text: "Postpone", points: 0, icon: "📅" }
    ]
  }
];

export const calculatePersona = (selections: number[]): { totalScore: number; persona: string } => {
  let totalScore = 0;
  selections.forEach((selIdx, qIdx) => {
    if (selIdx !== -1) {
      totalScore += QUESTIONS[qIdx].options[selIdx].points;
    }
  });

  let persona = "Beginner";
  if (totalScore >= 22) persona = "Advanced";
  else if (totalScore >= 16) persona = "Intermediate";

  return { totalScore, persona };
};
