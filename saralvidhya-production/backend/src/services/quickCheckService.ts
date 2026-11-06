import fs from 'fs/promises';
import path from 'path';
import { Storage } from '@google-cloud/storage';
import { ReadMode, Persona, QuickCheckQuestion, QuickCheckEvaluationResult } from '../types/read.js';
import { getFirestore } from '../config/firebase.js';

export class QuickCheckService {
  private static storage = new Storage();
  private static readonly BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'saralvidhya-artifacts';
  private static questionCache = new Map<string, any>();

  /**
   * Loads Quick Check questions from Detailed_Study or Quick_Study bank
   */
  public static async getQuestionBank(
    subj: string,
    mode: ReadMode,
    persona: Persona
  ): Promise<any[]> {
    const trackFolder = mode === 'indepth' ? 'Detailed_Study' : 'Quick_Study';
    const filePrefix = mode === 'indepth' ? 'Detailed' : 'Quick';
    const cacheKey = `${subj}__${mode}__${persona}`.toLowerCase();

    if (this.questionCache.has(cacheKey)) {
      return this.questionCache.get(cacheKey);
    }

    // 1. Local filesystem candidates
    const localCandidates = [
      path.resolve(process.cwd(), `../MLRIT/${subj.toUpperCase()}/Learn/Read/Quick Check/${trackFolder}`),
      path.resolve(process.cwd(), `../../MLRIT/${subj.toUpperCase()}/Learn/Read/Quick Check/${trackFolder}`),
      path.resolve(process.cwd(), `MLRIT/${subj.toUpperCase()}/Learn/Read/Quick Check/${trackFolder}`),
    ];

    for (const dir of localCandidates) {
      try {
        const files = await fs.readdir(dir);
        const target = files.find(f => f.includes(`QuickCheck_${filePrefix}`) && f.toLowerCase().includes(persona) && f.endsWith('.json'));
        if (target) {
          const raw = await fs.readFile(path.join(dir, target), 'utf-8');
          const data = JSON.parse(raw);
          const questions = data.questions || [];
          this.questionCache.set(cacheKey, questions);
          return questions;
        }
      } catch {
        // try next
      }
    }

    // 2. GCS fallback
    try {
      const gcsPath = `mlrit/${subj}/read/quick_check/${trackFolder}/DBMS_UNIT_I_QuickCheck_${filePrefix}_${persona}.json`;
      const [buffer] = await this.storage.bucket(this.BUCKET_NAME).file(gcsPath).download();
      const data = JSON.parse(buffer.toString('utf-8'));
      const questions = data.questions || [];
      this.questionCache.set(cacheKey, questions);
      return questions;
    } catch {
      return [];
    }
  }

  /**
   * Returns a sanitized Quick Check question for client rendering (without answer keys)
   */
  public static async getSanitizedQuestionForModule(
    subj: string,
    moduleId: string,
    mode: ReadMode,
    persona: Persona
  ): Promise<QuickCheckQuestion | undefined> {
    const bank = await this.getQuestionBank(subj, mode, persona);
    const q = bank.find((item: any) => item.module_id === moduleId);

    if (!q) return undefined;

    return {
      questionId: `QC_${q.module_id}`,
      moduleId: q.module_id,
      type: q.type || 'mcq_3_option',
      promptType: q.prompt_type || 'Question',
      stem: q.stem,
      options: (q.options || []).map((opt: any) => ({
        key: opt.key,
        text: opt.text,
      })),
    };
  }

  /**
   * Evaluates user selection server-side, updates progress, and unlocks the next module
   */
  public static async evaluateSubmission(
    uni: string,
    subj: string,
    chapter: string,
    sectionId: string,
    moduleId: string,
    selectedKey: string,
    mode: ReadMode,
    persona: Persona,
    uid?: string
  ): Promise<QuickCheckEvaluationResult> {
    const bank = await this.getQuestionBank(subj, mode, persona);
    const q = bank.find((item: any) => item.module_id === moduleId);

    if (!q) {
      throw new Error(`Quick Check question for module ${moduleId} not found`);
    }

    const cleanAnswer = (q.correct_answer || '').trim();
    const isCorrect = cleanAnswer.startsWith(selectedKey);

    // Calculate next section ID (e.g. section_01 -> section_02)
    const match = sectionId.match(/section_0?(\d+)/);
    const currentNum = match ? parseInt(match[1], 10) : 1;
    const nextSectionId = `section_0${currentNum + 1}`;

    let progressPercent = Math.min(100, Math.round(((currentNum + 1) / 6) * 100));

    // Update Firestore if user is authenticated
    if (uid && isCorrect) {
      try {
        const docRef = getFirestore()
          .collection('users')
          .doc(uid)
          .collection('read_progress')
          .doc(`${uni}__${subj}__${chapter}`);

        await docRef.set(
          {
            lastCompletedSection: sectionId,
            nextUnlockedSection: nextSectionId,
            progressPercent,
            updatedAt: new Date(),
            [`quickCheckHistory.${moduleId}`]: {
              passed: true,
              selectedKey,
              attempts: 1,
              passedAt: new Date(),
            },
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn('[QuickCheck] Firestore progress update warning:', err.message);
      }
    }

    return {
      isCorrect,
      correctKey: cleanAnswer,
      rationale: q.rationale || 'Correct conceptual understanding verified.',
      keyTakeaway: q.rationale?.match(/\(Key Takeaway:\s*(.+?)\)/)?.[1] || undefined,
      unlockedNextSectionId: isCorrect ? nextSectionId : undefined,
      chapterProgressPercent: progressPercent,
    };
  }
}
