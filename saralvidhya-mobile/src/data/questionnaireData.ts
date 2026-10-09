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
      { text: "English Medium", points: 3, icon: "🔤" },
      { text: "Telugu / Vernacular Medium", points: 2, icon: "🗣️" },
      { text: "Hindi / Other Language", points: 1, icon: "✒️" }
    ]
  },
  {
    id: 2,
    text: "How would you rate your comfort level with understanding scientific terminology in Agriculture?",
    options: [
      { text: "Completely comfortable", points: 3, icon: "🔬" },
      { text: "Understand with simplified explanations", points: 2, icon: "🧩" },
      { text: "Need foundational glossary & basics first", points: 1, icon: "📝" }
    ]
  },
  {
    id: 3,
    text: "Alongside your agricultural studies, what does your daily routine primarily look like?",
    options: [
      { text: "Full-Time College Student", points: 3, icon: "🎒" },
      { text: "Working in field / Farming / Internship", points: 2, icon: "🌾" },
      { text: "Family Responsibilities & Part-time study", points: 2, icon: "🏠" }
    ]
  },
  {
    id: 4,
    text: "On average, how much time can you realistically invest in self-study every week?",
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
      { text: "Excel in university semester exams (ANGRAU)", points: 2, icon: "🏆" },
      { text: "Crack competitive agricultural exams (ICAR / JRF)", points: 3, icon: "🎯" },
      { text: "Master practical crop & pest management", points: 2, icon: "🧠" }
    ]
  },
  {
    id: 6,
    text: "Which learning format keeps you most engaged?",
    options: [
      { text: "Quick Study Notes & Flashcards", points: 3, icon: "📖" },
      { text: "Audio Podcasts & Video lectures", points: 2, icon: "🎙️" },
      { text: "Self-Assessments & Previous Exam Papers", points: 2, icon: "💯" }
    ]
  },
  {
    id: 7,
    text: "How will you primarily be accessing the Saral Vidhya platform?",
    options: [
      { text: "Smartphone (Android App)", points: 2, icon: "📱" },
      { text: "Tablet / iPad", points: 2, icon: "📟" },
      { text: "Both Phone & Desktop PC", points: 3, icon: "💻" }
    ]
  },
  {
    id: 8,
    text: "What is your primary revision strategy before semester exams?",
    options: [
      { text: "Solving 2-Mark, 5-Mark & 10-Mark PYQs", points: 3, icon: "📝" },
      { text: "Rapid revision with flashcard decks", points: 2, icon: "🗂️" },
      { text: "Rereading comprehensive detailed notes", points: 1, icon: "📚" }
    ]
  },
  {
    id: 9,
    text: "When studying complex topics (e.g. Insect Morphology or Metamorphosis):",
    options: [
      { text: "I prefer visual mindmaps & labeled diagrams", points: 3, icon: "🧠" },
      { text: "I prefer bullet points and key takeaways", points: 2, icon: "📌" },
      { text: "I like listening to audio explanations", points: 2, icon: "🎧" }
    ]
  },
  {
    id: 10,
    text: "How do you prefer testing your retention after completing a chapter?",
    options: [
      { text: "Challenging timed mock tests", points: 3, icon: "⏱️" },
      { text: "Instant-feedback topic assessments", points: 2, icon: "🎯" },
      { text: "Reviewing summary questions at my own pace", points: 1, icon: "🌱" }
    ]
  }
];

export const calculatePersona = (selections: number[]): { totalScore: number; persona: 'beginner' | 'intermediate' | 'advanced' } => {
  let totalScore = 0;
  selections.forEach((selIdx, qIdx) => {
    if (selIdx !== -1 && QUESTIONS[qIdx] && QUESTIONS[qIdx].options[selIdx]) {
      totalScore += QUESTIONS[qIdx].options[selIdx].points;
    }
  });

  let persona: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (totalScore >= 24) persona = 'advanced';
  else if (totalScore >= 16) persona = 'intermediate';

  return { totalScore, persona };
};
