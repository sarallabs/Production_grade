import { getChapterDir, getSubjectBaseUrl } from './manifestService.ts'; // This won't work in node directly without compiling.

// Let's just simulate the path generation
const subject = "management";
const chapterNumber = 1;
const videoDir = "video_1_importance_and_scope_of_marketing";
const normLevel = "advanced";

const subjectBase = "/generated_resources/Nagarjuna_University/MBA"; // hardcoded for management
const chDir = "chapter_1"; // hardcoded

const paths = [
    ...(videoDir
      ? [
          `${subjectBase}/${chDir}/${videoDir}/Learn/Flashcards/flashcards_${normLevel}.md`,
          `${subjectBase}/${chDir}/${videoDir}/Prepare/Flashcards/prep_flashcards.md`,
          `${subjectBase}/${chDir}/${videoDir}/Prepare/Flashcards/flashcards_prep_master.md`,
        ]
      : []),
    `${subjectBase}/${chDir}/Learn/Flashcards/flashcards_${normLevel}.md`,
];

console.log(paths);
