export interface ParsedQa {
  question: string;
  answer: string;
}

export interface QuestionBankEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  chapterName: string;
  question: string;
  shortAnswer: string;
  longAnswer: string;
}

function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function parseUniversal(markdown: string): ParsedQa[] {
  // Specialized parser for university/advanced question banks with "# Question X" through "###### Question X" structures
  if (/^#{1,6}\s+Question\s+\d+/im.test(markdown)) {
    const parts = markdown.split(/\n(?=#{1,6}\s+Question\s+\d+)/i);
    const result: ParsedQa[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      
      // Find the solution/answer heading or marker
      const solMatch = part.match(/\n(###?\s*(?:Detailed Walkthrough\s+)?Solution|\*\*Solution:\*\*|\*\*Answer:\*\*|Solution:|Answer:)/i);
      if (solMatch) {
        let qText = part.substring(0, solMatch.index).trim();
        qText = qText.replace(/^#{1,6}\s+Question\s+\d+[:\s-]*/i, '').trim();
        const aText = part.substring(solMatch.index).trim();
        result.push({
          question: qText,
          answer: aText
        });
      } else {
        if (/^#{1,6}\s+Question/i.test(part)) {
          const qText = part.replace(/^#{1,6}\s+Question\s+\d+[:\s-]*/i, '').trim();
          result.push({
            question: qText,
            answer: ''
          });
        }
      }
    }
    if (result.length > 0) {
      return result;
    }
  }

  const lines = markdown.split(/\r?\n/);
  const questions: string[] = [];
  const answers: string[] = [];

  let mode: 'q' | 'a' = 'q';
  let currentText = '';
  let currentType: 'q' | 'a' | null = null;

  const pushCurrent = () => {
    if (currentType === 'q' && currentText.trim()) questions.push(currentText);
    if (currentType === 'a' && currentText.trim()) answers.push(currentText);
    currentText = '';
    currentType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lowerLine = line.toLowerCase();

    const isAnswerHeading =
      lowerLine.match(/^(?:#+|\*\*).*(?:answer key|جوابات|نمونہ جوابات|خاکہ جوابات)/i) ||
      lowerLine.replace(/^[#*\s-]+|[*\s-:]+$/g, '') === 'answers';

    const isQuestionHeading =
      lowerLine.match(/^(?:#+|\*\*).*(?:part|section|حصہ)/i) ||
      lowerLine.match(/^(?:#+|\*\*).*(?:questions?|سوالات)/i);

    if (isAnswerHeading && !isQuestionHeading) {
      pushCurrent();
      mode = 'a';
      continue;
    }

    if (isQuestionHeading) {
      pushCurrent();
      mode = 'q';
      continue;
    }

    const numMatch = line.match(/^(?:##?\s*Q\d+\.?\s*|\d+\.\s+|###\s*PQB_[A-Z_0-9]+:\s*)(.+)$/i);
    if (numMatch) {
      pushCurrent();
      currentType = mode;
      currentText = numMatch[1];
      continue;
    }

    const inlineMatch = line.match(/^(?:[>*-]\s*)?(?:\*\*)?(?:✅\s*)?(?:Model Answer|Outline Answer|Answer|Solution|Explanation|Brief Explanation)[:\s-]*(?:\*\*)?[:\s-]*\s*(.*)$/i);
    if (inlineMatch) {
      pushCurrent();
      currentType = 'a';
      currentText = inlineMatch[1] || '';
      continue;
    }

    if (currentType && line.length > 0 && !line.startsWith('---') && !line.match(/^(?:#+|\*\*)/)) {
      currentText += '\n' + line;
    }
  }
  pushCurrent();

  const result: ParsedQa[] = [];
  const maxLen = Math.max(questions.length, answers.length);
  for (let i = 0; i < maxLen; i++) {
    const q = questions[i] ? normalizeText(questions[i]) : '';
    const a = answers[i] ? normalizeText(answers[i]) : '';
    if (q) result.push({ question: q, answer: a });
  }

  return result;
}

export function parseQuestionBankMarkdown(
  markdown: string,
  subjectId: string,
  subjectName: string,
  chapterNumber: number,
  chapterName: string,
): QuestionBankEntry[] {
  const trimmed = (markdown || '').trim();

  // 1. Structured JSON format (Cloud Run API / GCS question_bank.json)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      const rawList = Array.isArray(data) ? data : (data.questions || data.items || data.data || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        return rawList.map((q: any, idx: number): QuestionBankEntry => {
          const qText = q.question || q.q || q.title || '';
          const shortAns = q.short_answer_2mark || q.shortAnswer || q.short_answer || q.answer || '';
          const longAnsPoints = q.long_answer_5mark_points || q.longAnswer || q.long_answer || q.explanation || '';
          const longAns = Array.isArray(longAnsPoints)
            ? longAnsPoints.join('\n\n')
            : String(longAnsPoints || '');

          return {
            id: q.id || `${subjectId}-${chapterNumber}-${idx}`,
            subjectId,
            subjectName,
            chapterNumber,
            chapterName,
            question: qText,
            shortAnswer: shortAns,
            longAnswer: longAns || shortAns,
          };
        });
      }
    } catch (e) {
      console.warn('Failed to parse question bank JSON:', e);
    }
  }

  // 2. Dual-Answer Markdown format (## Q1... **2-Mark Short Answer:**... **5-Mark Comprehensive Long Answer:**)
  if (/##\s*Q\d+[\.:\s]/i.test(trimmed) && /\*\*2-Mark Short Answer:\*\*/i.test(trimmed)) {
    const qBlocks = trimmed.split(/\n(?=##\s+Q\d+[\.:\s])/i);
    const dualEntries: QuestionBankEntry[] = [];

    qBlocks.forEach((block, idx) => {
      const qMatch = block.match(/^##\s+Q\d+[\.:\s]+([^\n]+)/i);
      if (!qMatch) return;
      const question = qMatch[1].trim();

      let shortAnswer = '';
      const shortMatch = block.match(/\*\*2-Mark Short Answer:\*\*([\s\S]*?)(?=\*\*5-Mark Comprehensive Long Answer:\*\*|---|##|$)/i);
      if (shortMatch) {
        shortAnswer = shortMatch[1].trim();
      }

      let longAnswer = '';
      const longMatch = block.match(/\*\*5-Mark Comprehensive Long Answer:\*\*([\s\S]*?)(?=---|##|$)/i);
      if (longMatch) {
        longAnswer = longMatch[1].trim();
      }

      dualEntries.push({
        id: `${subjectId}-${chapterNumber}-${idx}`,
        subjectId,
        subjectName,
        chapterNumber,
        chapterName,
        question,
        shortAnswer,
        longAnswer: longAnswer || shortAnswer,
      });
    });

    if (dualEntries.length > 0) {
      return dualEntries;
    }
  }

  // 3. Fallback: Universal line-by-line parser for legacy CBSE / Urdu formats
  const parsed = parseUniversal(trimmed);

  // Extract MCQ answer key — handles "1. b) On the crest...", "1. C", "1. (b) text"
  const answerKeyMap: Record<number, string> = {};
  const akSection = trimmed.match(/answer\s+key[\s\S]*?(?=\n#{1,4}|\n\*\*2\.|\n---\n#{1,4}|$)/i);
  if (akSection) {
    for (const line of akSection[0].split('\n')) {
      // Check for inline MCQ answers like "1(b), 2(d), 3(b)"
      const mcqMatches = [...line.matchAll(/(\d+)\(([a-d])\)/gi)];
      if (mcqMatches.length > 0) {
        for (const match of mcqMatches) {
          answerKeyMap[parseInt(match[1], 10)] = match[2];
        }
        continue;
      }

      // Matches "1. ...", "* 1. ...", "* **11:** ...", "**11:** ..."
      const m = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?(\d+)(?:\*\*|[:\.])\s*(.+)/);
      if (m && m[2]) {
        const text = m[2].replace(/^[a-dA-D][\)\.]\s*/i, '').trim();
        if (text) answerKeyMap[parseInt(m[1], 10)] = text;
      }
    }
  }

  return parsed.map((p, index) => {
    const keyAnswer = answerKeyMap[index + 1] || '';
    const fullAnswer = p.answer || keyAnswer;
    const cleanAnswer = fullAnswer.replace(/^[a-dA-D][\)\.]\s*/i, '').trim();
    const answerLines = cleanAnswer.split(/\n/).map(l => l.trim()).filter(Boolean);
    const short = answerLines[0] || cleanAnswer;
    const long = answerLines.length > 1 ? cleanAnswer : '';

    return {
      id: `${subjectId}-${chapterNumber}-${index}`,
      subjectId,
      subjectName,
      chapterNumber,
      chapterName,
      question: p.question,
      shortAnswer: short,
      longAnswer: long,
    };
  });
}
