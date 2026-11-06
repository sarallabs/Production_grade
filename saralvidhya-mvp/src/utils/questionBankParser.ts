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
  tenMarkAnswer?: string;
}

const PILLAR_TITLES: Record<string, string> = {
  pillar_1_nomenclature: 'Introduction & Nomenclature',
  pillar_2_mechanisms_and_kinetics: 'Mechanisms & Kinetics',
  pillar_3_comparative_matrix: 'Comparative Matrix',
  pillar_4_agronomic_applications: 'Agronomic Applications',
  pillar_4_enterprise_applications: 'Enterprise Applications & Production Case Study',
  pillar_5_diagnostic_synthesis: 'Diagnostic Synthesis',
};

/** Strips any embedded "Marking Scheme" / "Marking Rubric" heading and its markdown table from an answer string. */
export function stripMarkingScheme(md?: string): string {
  if (!md) return '';
  return md
    .replace(
      /(?:^|\n)\s*(?:#{1,6}\s*|\*\*)?(?:Marking\s+(?:Scheme|Rubric)|Evaluation\s+Scheme)(?:\*\*)?[:\s]*\r?\n(?:\s*\r?\n)*(?:\|[^\n]*\|\r?\n)+/gi,
      '\n',
    )
    .replace(
      /(?:^|\n)\s*(?:#{1,6}\s*|\*\*)?(?:Marking\s+(?:Scheme|Rubric))(?:\*\*)?[:\s]*[^\n]*(?:\r?\n|$)/gi,
      '\n',
    )
    .trim();
}

/** Converts the nested `essay_answer_10mark` JSON object (or plain string/array) into markdown. */
function formatTenMarkAnswer(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') return stripMarkingScheme(raw);
  if (Array.isArray(raw)) return stripMarkingScheme(raw.join('\n\n'));
  if (typeof raw !== 'object') return stripMarkingScheme(String(raw));

  const getPillarTitle = (k: string) => {
    return (
      PILLAR_TITLES[k] ||
      k
        .replace(/^pillar_\d+_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  const parts: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'marking_rubric' || typeof value !== 'string' || !value.trim()) continue;
    const title = getPillarTitle(key);
    // ASCII flow diagrams need a code fence to keep their alignment
    const body = /^\s+\|\s*$/m.test(value) && !value.includes('```') ? '```\n' + value + '\n```' : value;
    parts.push(`### ${title}\n\n${body}`);
  }
  return stripMarkingScheme(parts.join('\n\n'));
}

export function ensureQuestionMark(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Check if wrapped with markdown bold/italic at the end
  if (trimmed.endsWith('**')) {
    const inner = trimmed.slice(0, -2).trim();
    if (inner.endsWith('?')) return trimmed;
    return inner.replace(/[:.;\s]+$/, '') + '?**';
  }
  if (trimmed.endsWith('*')) {
    const inner = trimmed.slice(0, -1).trim();
    if (inner.endsWith('?')) return trimmed;
    return inner.replace(/[:.;\s]+$/, '') + '?*';
  }

  if (trimmed.endsWith('?')) return trimmed;
  return trimmed.replace(/[:.;\s]+$/, '') + '?';
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
          question: ensureQuestionMark(qText),
          answer: aText
        });
      } else {
        if (/^#{1,6}\s+Question/i.test(part)) {
          const qText = part.replace(/^#{1,6}\s+Question\s+\d+[:\s-]*/i, '').trim();
          result.push({
            question: ensureQuestionMark(qText),
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
            question: ensureQuestionMark(qText),
            shortAnswer: stripMarkingScheme(shortAns),
            longAnswer: stripMarkingScheme(longAns || shortAns),
            tenMarkAnswer: formatTenMarkAnswer(q.essay_answer_10mark || q.long_answer_10mark || q.ten_mark_answer || q.answer_10mark) || undefined,
          };
        });
      }
    } catch (e) {
      console.warn('Failed to parse question bank JSON:', e);
    }
  }

  // 2. Structured Mark-Based Markdown format (## Q1 / ## Question 1 ... 2-Mark ... 5-Mark ... 10-Mark)
  const hasQuestionHeaders = /#{1,6}\s*(?:Q\d+|Question\s+\d+)[\.:\s]/i.test(trimmed);
  const hasMarkHeadings = /(?:###?\s*|\*\*)\s*(?:2|5|10)[- ]?Marks?/i.test(trimmed) ||
                          /(?:###?\s*|\*\*)\s*(?:2|5|10)M\b/i.test(trimmed);

  if (hasQuestionHeaders && hasMarkHeadings) {
    const qBlocks = trimmed.split(/\n(?=#{1,6}\s*(?:Q\d+|Question\s+\d+)[\.:\s])/i);
    const dualEntries: QuestionBankEntry[] = [];

    qBlocks.forEach((block, idx) => {
      const qMatch = block.match(/^#{1,6}\s*(?:Q\d+|Question\s+\d+)[\.:\s]+([^\n]+)/i);
      if (!qMatch) return;
      const question = ensureQuestionMark(qMatch[1].trim());

      const m2 = block.match(/(?:^|\n)(?:###?\s*|\*\*)\s*2[- ]?Marks?(?:\s+Short)?(?:\s+Answer)?(?::|\*\*)?[^\n]*/i);
      const m5 = block.match(/(?:^|\n)(?:###?\s*|\*\*)\s*5[- ]?Marks?(?:\s+Comprehensive)?(?:\s+Long)?(?:\s+Answer)?(?::|\*\*)?[^\n]*/i);
      const m10 = block.match(/(?:^|\n)(?:###?\s*|\*\*)\s*10[- ]?Marks?(?:\s+Comprehensive)?(?:\s+(?:Essay|Long|Answer))?(?::|\*\*)?[^\n]*/i);

      // Collect all mark markers found in the block
      const markers: { tier: 'short' | 'long' | 'ten'; start: number; contentStart: number }[] = [];
      if (m2 && m2.index !== undefined) markers.push({ tier: 'short', start: m2.index, contentStart: m2.index + m2[0].length });
      if (m5 && m5.index !== undefined) markers.push({ tier: 'long', start: m5.index, contentStart: m5.index + m5[0].length });
      if (m10 && m10.index !== undefined) markers.push({ tier: 'ten', start: m10.index, contentStart: m10.index + m10[0].length });
      
      markers.sort((a, b) => a.start - b.start);

      // End of answer content in this block: up to --- or end of block
      const dividerMatch = block.match(/\n---(?:\n|$)/);
      const blockEnd = dividerMatch && dividerMatch.index !== undefined ? dividerMatch.index : block.length;

      let shortAnswer = '';
      let longAnswer = '';
      let tenMarkAnswer = '';

      if (markers.length > 0) {
        for (let mIdx = 0; mIdx < markers.length; mIdx++) {
          const cur = markers[mIdx];
          const nextStart = mIdx + 1 < markers.length ? markers[mIdx + 1].start : blockEnd;
          const text = stripMarkingScheme(block.slice(cur.contentStart, nextStart).trim());
          if (cur.tier === 'short') shortAnswer = text;
          else if (cur.tier === 'long') longAnswer = text;
          else if (cur.tier === 'ten') tenMarkAnswer = text;
        }
      } else {
        const mAns = block.match(/(?:^|\n)(?:###?\s*|\*\*)\s*(?:Detailed Walkthrough\s+)?(?:Answer|Solution|Explanation|Model Answer)[:\s\*]*[^\n]*/i);
        if (mAns && mAns.index !== undefined) {
          const ansText = stripMarkingScheme(block.slice(mAns.index + mAns[0].length, blockEnd).trim());
          shortAnswer = ansText;
          longAnswer = ansText;
        }
      }

      if (shortAnswer || longAnswer || tenMarkAnswer) {
        dualEntries.push({
          id: `${subjectId}-${chapterNumber}-${idx}`,
          subjectId,
          subjectName,
          chapterNumber,
          chapterName,
          question,
          shortAnswer: shortAnswer || longAnswer,
          longAnswer: longAnswer || shortAnswer,
          tenMarkAnswer: tenMarkAnswer || undefined,
        });
      }
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
    const fullAnswer = stripMarkingScheme(p.answer || keyAnswer);
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
      question: ensureQuestionMark(p.question),
      shortAnswer: short,
      longAnswer: long,
    };
  });
}
