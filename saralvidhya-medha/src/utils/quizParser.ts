export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

/**
 * Heuristically parses a markdown string into a list of multiple-choice questions.
 * Supports standard block MCQ format, inline option lists, checkmark correct answers,
 * and handles question texts containing answer keywords.
 */
export function parseQuestionBank(markdownText: string): QuizQuestion[] {
  if (!markdownText) return [];

  // Pre-process to split inline options (e.g. "A) Option B) Option") into separate lines
  markdownText = markdownText.replace(/\s+\b([A-D]|[a-d])([\)\.])\s+/g, '\n$1$2 ');

  // Normalize bold question headings like **1.** or Question 1
  markdownText = markdownText
    .replace(/^\s*\*\*(\d+)\.\*\*\s*/gim, '\n$1. ')
    .replace(/^\s*(?:#{1,6}\s+)?\*\*Question\s+(\d+)\*\*\s*$/gim, '\n$1. ')
    .replace(/^\s*(?:#{1,6}\s+)?Question\s+(\d+)\s*$/gim, '\n$1. ');

  const questions: QuizQuestion[] = [];

  // ── Step 1: Extract answer key from the bottom of the file if present ──
  const answerKeyMap: Record<number, number> = {};
  const answerKeyMatch = markdownText.match(/answer\s+key[\s\S]*?(?=\n#{1,4}|\n\*\*2\.|\n---|\n####\s+2\.|$)/i);
  if (answerKeyMatch) {
    const akLines = answerKeyMatch[0].split('\n');
    for (const line of akLines) {
      const m = line.match(/^\s*(\d+)\.\s+([a-dA-D])[\)\.]/);
      if (m) {
        const qNum = parseInt(m[1], 10);
        const letter = m[2].toUpperCase();
        const idx = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : 3;
        answerKeyMap[qNum] = idx;
      }
    }
  }

  // ── Step 2: Parse MCQ blocks ──
  const blocks = markdownText.split(/(?=\n\s*\d+\.\s+)/);

  let questionNumber = 0;
  for (const block of blocks) {
    if (!block.trim() || !/^\s*\d+\.\s+/.test(block)) continue;

    const lines = block.split('\n').map(l => l.trim()).filter(l => l);

    // Collect all lines before the first option or answer as the question text
    let qText = "";
    let optionsStartIndex = 1;
    const optRegex = /^([A-D][\)\.]|[a-d][\)\.]-?)\s+(.+)/i;
    
    // Match answer indicators only when they appear at the start of a line
    const ansStartRegex = /^\s*(?:\*\*|__)?(?:Correct|Answer|correct|answer|جواب|صحیح)\b/i;

    for (let i = 0; i < lines.length; i++) {
      const cleanLine = lines[i].replace(/^[-*+]\s+/, '').trim();
      if (i > 0 && (optRegex.test(cleanLine) || ansStartRegex.test(cleanLine))) {
        optionsStartIndex = i;
        break;
      }
      qText += (qText ? "\n" : "") + lines[i];
      optionsStartIndex = i + 1; // In case there are no options
    }

    const qLine = qText.replace(/^\d+\.\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1').trim();

    // Process MCQ blocks
    const options: string[] = [];
    let detectedAnswerIndex = -1;

    for (let i = optionsStartIndex; i < lines.length; i++) {
      const line = lines[i];
      const cleanLine = line.replace(/^[-*+]\s+/, '').trim();
      if (ansStartRegex.test(cleanLine)) break;
      const match = cleanLine.match(optRegex);
      if (match) {
        let optionText = match[2].trim();
        // Check for inline checkmark indicator (e.g. "Option text ✓")
        const isCorrect = optionText.includes('✓') || optionText.includes('✔');
        if (isCorrect) {
          optionText = optionText.replace(/[✓✔]/g, '').trim();
          detectedAnswerIndex = options.length;
        }
        options.push(optionText);
      }
    }

    if (options.length === 0) {
      const ansIndex = lines.findIndex(l => {
        const cl = l.replace(/^[-*+]\s+/, '').trim();
        return ansStartRegex.test(cl);
      });
      if (ansIndex > 1) {
        for (let i = 1; i < ansIndex; i++) {
          const clean = lines[i].replace(/^[-*+]\s+/, '').replace(/^[a-dA-D][\)\.]\s+/, '').replace(/^[-\*]\s*/, '').trim();
          if (clean) options.push(clean);
        }
      }
    }

    if (options.length < 2) continue;

    questionNumber++;

    // ── Step 3: Determine answer index ──
    let answerIndex = 0;
    let explanation = "";

    if (detectedAnswerIndex !== -1) {
      answerIndex = detectedAnswerIndex;
    } else if (answerKeyMap[questionNumber] !== undefined) {
      answerIndex = answerKeyMap[questionNumber];
    } else {
      const ansLineIdx = lines.findIndex(l => {
        const cl = l.replace(/^[-*+]\s+/, '').trim();
        return ansStartRegex.test(cl);
      });
      if (ansLineIdx !== -1) {
        const ansText = lines[ansLineIdx];
        const letterMatch = ansText.match(/(?:Answer|correct|جواب).*?\b([A-D])\b[.*]*\s*$/i);
        if (letterMatch) {
          const letter = letterMatch[1].toUpperCase();
          answerIndex = letter === 'A' ? 0 : letter === 'B' ? 1 : letter === 'C' ? 2 : 3;
        } else {
          const bestMatch = options.findIndex(opt => ansText.includes(opt));
          if (bestMatch !== -1) answerIndex = bestMatch;
        }
      }
    }

    // ── Step 4: Extract explanation ──
    const expLineIdx = lines.findIndex(l => /explanation/i.test(l) || /وضاحت/i.test(l));
    if (expLineIdx !== -1) {
      explanation = lines.slice(expLineIdx).join(' ').replace(/^(?:\*\*)?(?:Explanation|Brief Explanation|Solution|Answer|وضاحت)(?:\*\*)?[\s:]*/i, '').trim();
      explanation = explanation.replace(/^\*+|\*+$/g, '').trim();
    } else {
      const ansLineIdx = lines.findIndex(l => {
        const cl = l.replace(/^[-*+]\s+/, '').trim();
        return ansStartRegex.test(cl);
      });
      if (ansLineIdx !== -1) {
        explanation = lines.slice(ansLineIdx + 1).join(' ').trim();
        explanation = explanation.replace(/^(?:\*\*)?(?:Explanation|Brief Explanation|Solution|Answer|وضاحت)(?:\*\*)?[\s:]*/i, '').trim();
        explanation = explanation.replace(/^\*+|\*+$/g, '').trim();
      }
    }

    questions.push({
      q: qLine,
      options: options.slice(0, 4),
      answer: answerIndex >= 0 && answerIndex < options.length ? answerIndex : 0,
      explanation: explanation || "No explanation provided."
    });
  }

  return questions;
}
