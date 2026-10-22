import { storage } from '@/utils/storage';

export const GCS_API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://saralvidhya-api-193782571555.asia-south1.run.app';

export interface Chapter {
  number: number;
  name: string;
  title?: string;
  dir: string;
  completed?: string[];
  resourceCount?: number;
  description?: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: string;
  semester: string;
  university: string;
  chapters: Chapter[];
  progressPercent: number;
}

export interface CourseSubjectProgress {
  index: number;
  id: string;
  code: string;
  name: string;
  progressPercent: number;
  statusColor: string;
}

export interface CourseOverviewData {
  courseId: string;
  courseName: string;
  degree: string;
  semester: string;
  overallProgress: number;
  subjects: CourseSubjectProgress[];
}

export const ANGRAU_SUBJECTS: Subject[] = [
  {
    id: 'ento_131',
    code: 'ENTO 131',
    name: 'Entomology',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 50,
    chapters: [
      {
        number: 1,
        name: 'Digestive System',
        dir: 'chapter_01',
        description: 'Alimentary canal, foregut, midgut, hindgut, digestive enzymes and nutrient absorption in insects.',
        completed: ['summary', 'detailed_view', 'flashcards', 'quiz'],
        resourceCount: 4,
      },
      {
        number: 2,
        name: 'Metamorphosis',
        dir: 'chapter_02',
        description: 'Ametabolous, hemimetabolous and holometabolous life cycles, ecdysis and hormonal regulation.',
        completed: ['summary', 'detailed_view', 'flashcards', 'quiz'],
        resourceCount: 4,
      },
      {
        number: 3,
        name: 'Weathering',
        dir: 'chapter_03',
        description: 'Abiotic environmental factors, temperature, humidity and photoperiod influence on insect population.',
        completed: ['summary'],
        resourceCount: 4,
      },
      {
        number: 4,
        name: 'Pollination',
        dir: 'chapter_04',
        description: 'Floral biology, insect pollinators, apiculture, honey bees and crop pollination mechanisms.',
        completed: [],
        resourceCount: 4,
      },
    ],
  },
];

export const manifestService = {
  async getSubjects(): Promise<Subject[]> {
    const cacheKey = 'saral_cached_subjects_v10_ento_starting_card';
    const cached = await storage.getItem<Subject[]>(cacheKey);
    if (cached && cached.length === ANGRAU_SUBJECTS.length && cached[0].chapters?.length === 4) {
      return cached;
    }

    try {
      const res = await fetch(`${GCS_API_BASE}/api/content/angrau/entomology/manifest`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const liveData = await res.json();
        if (liveData && liveData.chapters) {
          ANGRAU_SUBJECTS[0].chapters = liveData.chapters;
        }
      }
    } catch {
      // Fallback to local ANGRAU syllabus
    }

    await storage.setItem(cacheKey, ANGRAU_SUBJECTS);
    return ANGRAU_SUBJECTS;
  },

  calculateChapterProgress(chapter: Chapter): { percentage: number; statusColor: string } {
    const total = chapter.resourceCount || 4;
    const completedCount = chapter.completed?.length || 0;
    const pct = total > 0 ? Math.min(100, Math.round((completedCount / total) * 100)) : 0;
    const statusColor = pct === 100 ? '#22c55e' : pct > 0 ? '#3b82f6' : '#f97316';
    return { percentage: pct, statusColor };
  },

  calculateSubjectProgress(subject: Subject): number {
    if (!subject.chapters || subject.chapters.length === 0) return 0;
    const totalPossible = subject.chapters.reduce((sum, ch) => sum + (ch.resourceCount || 4), 0);
    const totalDone = subject.chapters.reduce((sum, ch) => sum + (ch.completed?.length || 0), 0);
    return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
  },

  async getCourseOverview(courseName: string = 'Entomology'): Promise<CourseOverviewData> {
    const subjects = await this.getSubjects();
    const ento = subjects[0];
    
    // The dynamic units of Entomology (Digestive System, Metamorphosis, Weathering, Pollination) from database
    const unitProgressList: CourseSubjectProgress[] = (ento?.chapters || []).map((ch) => {
      const chProgress = this.calculateChapterProgress(ch);
      return {
        index: ch.number,
        id: `unit_${ch.number}`,
        code: `Unit ${ch.number}`,
        name: ch.name,
        progressPercent: chProgress.percentage,
        statusColor: chProgress.statusColor,
      };
    });

    const overallProgress = ento ? this.calculateSubjectProgress(ento) : 50;

    return {
      courseId: 'ento_131',
      courseName: courseName,
      degree: 'B.Sc Agriculture',
      semester: 'Semester 3',
      overallProgress,
      subjects: unitProgressList,
    };
  },

  async toggleChapterResource(
    subjectId: string,
    chapterNumber: number,
    resourceType: string
  ): Promise<Subject[]> {
    const subjects = await this.getSubjects();
    const subject = subjects.find(
      (s) => s.id === subjectId || s.code.toLowerCase().replace(/\s+/g, '_') === subjectId
    );
    if (subject && subject.chapters) {
      const chapter = subject.chapters.find((c) => c.number === chapterNumber);
      if (chapter) {
        if (!chapter.completed) chapter.completed = [];
        const exists = chapter.completed.includes(resourceType);
        if (exists) {
          chapter.completed = chapter.completed.filter((r) => r !== resourceType);
        } else {
          chapter.completed.push(resourceType);
        }
        subject.progressPercent = this.calculateSubjectProgress(subject);
        await storage.setItem('saral_cached_subjects_v8_strict_webapp', subjects);
      }
    }
    return subjects;
  },

  async getSubject(subjectId: string): Promise<Subject | undefined> {
    const subjects = await this.getSubjects();
    return subjects.find((s) => s.id === subjectId || s.code.toLowerCase().replace(/\s+/g, '_') === subjectId);
  },

  async getChapterResource(
    subjectId: string,
    chapterNumber: number,
    resourceType: string,
    level: string = 'intermediate'
  ): Promise<string> {
    const cacheKey = `saral_res_${subjectId}_ch${chapterNumber}_${resourceType}_${level}`;
    const cached = await storage.getItem<string>(cacheKey);
    if (cached) return cached;

    const chPad = String(chapterNumber).padStart(2, '0');
    const url = `${GCS_API_BASE}/api/content/angrau/entomology/chapter_${chPad}/${resourceType}?level=${level}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const content = await res.text();
        await storage.setItem(cacheKey, content);
        return content;
      }
    } catch {
      // Offline fallback
    }

    // Default mock response when network is not available
    const fallbackText = `# ${subjectId.toUpperCase()} Chapter ${chapterNumber} - ${resourceType.toUpperCase()}\n\n` +
      `### Core Concepts & Examination Focus (${level.toUpperCase()} Level)\n\n` +
      `- **Key Agricultural Relevance**: Detailed anatomical breakdown for ANGRAU entomology.\n` +
      `- **Exam Model Focus**: Important for 2-mark definitions and 5-mark short answers.\n\n` +
      `*Content cached for offline reading.*`;

    return fallbackText;
  },
};

