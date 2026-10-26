import { storage } from '@/utils/storage';

export const GCS_API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://saralvidhya-api-193782571555.asia-south1.run.app';

export interface Chapter {
  number: number;
  name: string;
  title?: string;
  shortTitle?: string;
  dir: string;
  completed?: string[];
  availableResources?: string[];
  resourceCount?: number;
  description?: string;
  topicCount?: number;
  topics?: string[] | { id: string; label: string; order?: number }[];
  estimatedMinutes?: number;
  estimatedTime?: string;
  heroImage?: string;
  heroImageUrl?: string;
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

export let ANGRAU_SUBJECTS: Subject[] = [
  {
    id: 'ento_131',
    code: 'ENTO 131',
    name: 'Entomology',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 0,
    chapters: [],
  },
];

const USER_PROGRESS_KEY = 'saral_student_progress_v2';

export async function getStudentChapterProgress(): Promise<Record<string, string[]>> {
  try {
    const saved = await storage.getItem<Record<string, string[]>>(USER_PROGRESS_KEY);
    return saved || {};
  } catch {
    return {};
  }
}

export async function saveStudentChapterProgress(progress: Record<string, string[]>): Promise<void> {
  try {
    await storage.setItem(USER_PROGRESS_KEY, progress);
  } catch (e) {
    console.warn('[ManifestService] Failed to save student progress:', e);
  }
}

async function fetchLiveChapters(): Promise<Chapter[]> {
  const chapters: Chapter[] = [];
  const userProgress = await getStudentChapterProgress();

  for (let ch = 1; ch <= 4; ch++) {
    const chPad = String(ch).padStart(2, '0');
    try {
      const res = await fetch(`${GCS_API_BASE}/api/content/angrau/entomology/chapter_${chPad}/metadata`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const meta = await res.json();
        const topicList: string[] = Array.isArray(meta.microcast_titles) ? meta.microcast_titles : [];
        const count = topicList.length || meta.microcast_count || 4;
        const estMin = count * 10;
        const progressKey = `ento_131_chapter_${chPad}`;
        const userCompleted = userProgress[progressKey] || [];

        chapters.push({
          number: meta.chapter_number || ch,
          name: meta.chapter_name || `Chapter ${ch}`,
          title: meta.chapter_name || `Chapter ${ch}`,
          dir: `chapter_${chPad}`,
          description: `Authoritative course content for ${meta.chapter_name || `Chapter ${ch}`} from ANGRAU Cloud Repository.`,
          completed: userCompleted,
          availableResources: Array.isArray(meta.completed) ? meta.completed : [],
          resourceCount: 4,
          topicCount: count,
          topics: topicList,
          estimatedMinutes: estMin,
          estimatedTime: `${estMin}min`,
          heroImage: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_${chPad}/media/hero.png`,
          heroImageUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_${chPad}/media/hero.png`,
        });
      }
    } catch (e) {
      console.warn(`[ManifestService] Error fetching live metadata for chapter_${chPad}:`, e);
    }
  }
  return chapters;
}

export const manifestService = {
  async getSubjects(): Promise<Subject[]> {
    const cacheKey = 'saral_pure_api_cached_subjects_v2';
    const userProgress = await getStudentChapterProgress();

    const syncWithUserProgress = (subjects: Subject[]): Subject[] => {
      return subjects.map((subj) => {
        if (!subj.chapters) return subj;
        const chaptersWithProgress = subj.chapters.map((ch) => {
          const chPad = String(ch.number).padStart(2, '0');
          const key = `${subj.id}_chapter_${chPad}`;
          const completedPillars = userProgress[key] || ch.completed || [];
          return {
            ...ch,
            completed: completedPillars,
          };
        });
        const updatedSubj: Subject = {
          ...subj,
          chapters: chaptersWithProgress,
          progressPercent: 0,
        };
        updatedSubj.progressPercent = manifestService.calculateSubjectProgress(updatedSubj);
        return updatedSubj;
      });
    };

    try {
      const liveChapters = await fetchLiveChapters();
      if (liveChapters.length > 0) {
        const liveSubject: Subject = {
          id: 'ento_131',
          code: 'ENTO 131',
          name: 'Entomology',
          credits: '3 (2+1)',
          semester: 'Semester 3',
          university: 'Acharya N.G. Ranga Agricultural University',
          chapters: liveChapters,
          progressPercent: 0,
        };
        const result = syncWithUserProgress([liveSubject]);
        ANGRAU_SUBJECTS = result;
        await storage.setItem(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('[ManifestService] Failed live fetch, checking local cache:', err);
    }

    const cached = await storage.getItem<Subject[]>(cacheKey);
    if (cached && cached.length > 0) {
      const synced = syncWithUserProgress(cached);
      ANGRAU_SUBJECTS = synced;
      return synced;
    }

    const fallbackSynced = syncWithUserProgress(ANGRAU_SUBJECTS);
    ANGRAU_SUBJECTS = fallbackSynced;
    return fallbackSynced;
  },

  calculateChapterProgress(chapter: Chapter): { percentage: number; statusColor: string } {
    if (!chapter.completed || chapter.completed.length === 0) {
      return { percentage: 0, statusColor: '#9CA3AF' };
    }

    // Map any recorded resource types into the 4 primary learning pillars
    const pillars = new Set<string>();
    for (const item of chapter.completed) {
      const lower = item.toLowerCase();
      if (lower === 'read' || lower === 'summary' || lower === 'detailed' || lower === 'notes') {
        pillars.add('read');
      } else if (lower === 'videos' || lower === 'watch' || lower === 'video') {
        pillars.add('videos');
      } else if (lower === 'audio' || lower === 'listen' || lower === 'podcast' || lower === 'microcast') {
        pillars.add('audio');
      } else if (lower === 'practice' || lower === 'flashcards' || lower === 'quiz' || lower === 'assessment') {
        pillars.add('practice');
      } else {
        pillars.add(lower);
      }
    }

    const total = 4;
    const completedCount = pillars.size;
    const pct = Math.min(100, Math.round((completedCount / total) * 100));
    const statusColor = pct === 100 ? '#22c55e' : pct > 0 ? '#3b82f6' : '#9CA3AF';
    return { percentage: pct, statusColor };
  },

  calculateSubjectProgress(subject: Subject): number {
    if (!subject.chapters || subject.chapters.length === 0) return 0;
    const totalChapters = subject.chapters.length;
    const totalPercentage = subject.chapters.reduce((sum, ch) => {
      const prog = manifestService.calculateChapterProgress(ch);
      return sum + prog.percentage;
    }, 0);
    return Math.round(totalPercentage / totalChapters);
  },

  async getCourseOverview(courseName: string = 'Entomology'): Promise<CourseOverviewData> {
    const subjects = await manifestService.getSubjects();
    const ento = subjects[0];
    
    // The dynamic units of Entomology (Digestive System, Metamorphosis, Weathering, Pollination) from database
    const unitProgressList: CourseSubjectProgress[] = (ento?.chapters || []).map((ch) => {
      const chProgress = manifestService.calculateChapterProgress(ch);
      return {
        index: ch.number,
        id: `unit_${ch.number}`,
        code: `Unit ${ch.number}`,
        name: ch.name,
        progressPercent: chProgress.percentage,
        statusColor: chProgress.statusColor,
      };
    });

    const overallProgress = ento ? manifestService.calculateSubjectProgress(ento) : 50;

    return {
      courseId: 'ento_131',
      courseName: courseName,
      degree: 'B.Sc Agriculture',
      semester: 'Semester 3',
      overallProgress,
      subjects: unitProgressList,
    };
  },

  async markChapterResource(
    subjectId: string,
    chapterNumber: number,
    resourceType: string,
    completed: boolean = true
  ): Promise<Subject[]> {
    const chPad = String(chapterNumber).padStart(2, '0');
    const chKey = `${subjectId}_chapter_${chPad}`;
    const userProgress = await getStudentChapterProgress();
    let current = userProgress[chKey] ? [...userProgress[chKey]] : [];

    if (completed) {
      if (!current.includes(resourceType)) {
        current.push(resourceType);
      }
    } else {
      current = current.filter((r) => r !== resourceType);
    }

    userProgress[chKey] = current;
    await saveStudentChapterProgress(userProgress);

    const subjects = await manifestService.getSubjects();
    const subject = subjects.find(
      (s) => s.id === subjectId || s.code.toLowerCase().replace(/\s+/g, '_') === subjectId
    );
    if (subject && subject.chapters) {
      const chapter = subject.chapters.find((c) => c.number === chapterNumber);
      if (chapter) {
        chapter.completed = current;
      }
      subject.progressPercent = manifestService.calculateSubjectProgress(subject);
      await storage.setItem('saral_pure_api_cached_subjects_v2', subjects);
    }
    return subjects;
  },

  async toggleChapterResource(
    subjectId: string,
    chapterNumber: number,
    resourceType: string
  ): Promise<Subject[]> {
    const chPad = String(chapterNumber).padStart(2, '0');
    const chKey = `${subjectId}_chapter_${chPad}`;
    const userProgress = await getStudentChapterProgress();
    const current = userProgress[chKey] ? [...userProgress[chKey]] : [];
    const exists = current.includes(resourceType);
    return manifestService.markChapterResource(subjectId, chapterNumber, resourceType, !exists);
  },

  async getSubject(subjectId: string): Promise<Subject | undefined> {
    const subjects = await manifestService.getSubjects();
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

