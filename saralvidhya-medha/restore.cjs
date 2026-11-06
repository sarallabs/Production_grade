const fs = require('fs');

let c = fs.readFileSync('c:/Users/Abhi/saralvidhya-mvp/src/pages/StudyTable.tsx', 'utf8');

// 1. Restore imports
c = c.replace(
  /  QuestionCard,\n  MATH_MOCKED_QUESTIONS,\n  ENGLISH_MOCKED_QUESTIONS,\n  MANNU_MOCKED_QUESTIONS,\n} from/,
  '  QuestionCard,\n  MATH_MOCKED_QUESTIONS,\n  ENGLISH_MOCKED_QUESTIONS,\n  MANNU_MOCKED_QUESTIONS,\n  MANAGEMENT_MOCKED_QUESTIONS,\n} from'
);

// 2. Restore dynamic PYQs
c = c.replace(
  /const availableYears = \["All Years", "2024", "2023", "2022"\];\n\n  const \[selectedYear, setSelectedYear\] = useState\("All Years"\);\n\n  useEffect\(\(\) => {\n    setSelectedYear\("All Years"\);\n  }, \[subjectId\]\);\n\n  const supportedSubjects = \["maths", "english", "mannu", "pubadm_ur"\];\n  const isSupported = supportedSubjects.includes\(subjectId\);\n\n  const baseQuestions = subjectId === "maths" \n    \? MATH_MOCKED_QUESTIONS \n    : subjectId === "english" \n      \? ENGLISH_MOCKED_QUESTIONS \n      : \(subjectId === "mannu" || subjectId === "pubadm_ur"\)\n        \? MANNU_MOCKED_QUESTIONS\n        : \[\];/g,
  `const supportedSubjects = ["maths", "english", "mannu", "pubadm_ur", "management"];
  const isSupported = supportedSubjects.includes(subjectId);

  const baseQuestions = subjectId === "maths" 
    ? MATH_MOCKED_QUESTIONS 
    : subjectId === "english" 
      ? ENGLISH_MOCKED_QUESTIONS 
      : subjectId === "management"
        ? MANAGEMENT_MOCKED_QUESTIONS
        : (subjectId === "mannu" || subjectId === "pubadm_ur")
          ? MANNU_MOCKED_QUESTIONS
          : [];

  const availableYears = [
    "All Years",
    ...Array.from(new Set(baseQuestions.map(q => q.year).filter(Boolean))).sort((a, b) => b - a).map(String)
  ];

  const [selectedYear, setSelectedYear] = useState("All Years");

  useEffect(() => {
    setSelectedYear("All Years");
  }, [subjectId]);`
);

// 3. Fix the hardcoded Ask view stuff
c = c.replace(
  /👋 Hi there! I'm Saral Vidhya, your academic tutor for NCERT Class\n\s*10 English. We're currently looking at "A Letter to God."/g,
  `👋 Hi there! I'm Saral Vidhya, your academic tutor for {className} {subjectName}. We're currently looking at "{chapterData?.name || 'this chapter'}."`
);

// 4. Update the askGemini call
c = c.replace(
  /const result = await askGemini\(\n\s*userMsg,\n\s*subjectId,\n\s*chapterName,\n\s*_chapterNumber,\n\s*_difficulty,\n\s*selectedLang,\n\s*\);/g,
  `const result = await askGemini(
          userMsg,
          subjectId,
          chapterName,
          _chapterNumber,
          _difficulty,
          selectedLang,
          className
        );`
);

fs.writeFileSync('c:/Users/Abhi/saralvidhya-mvp/src/pages/StudyTable.tsx', c);
