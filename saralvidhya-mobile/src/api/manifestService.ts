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

const DEFAULT_ENTOMOLOGY_CHAPTERS: Chapter[] = [
  {
    number: 1,
    name: 'Digestive System',
    title: 'Digestive System',
    dir: 'chapter_01',
    description: 'Authoritative course content for Digestive System from ANGRAU Cloud Repository.',
    completed: [],
    availableResources: ['summary', 'detailed', 'audio', 'videos', 'flashcards', 'quiz'],
    resourceCount: 4,
    topicCount: 5,
    topics: [],
    estimatedMinutes: 50,
    estimatedTime: '50min',
    heroImage: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/media/hero.png`,
    heroImageUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/media/hero.png`,
  },
  {
    number: 2,
    name: 'Metamorphosis',
    title: 'Metamorphosis',
    dir: 'chapter_02',
    description: 'Authoritative course content for Metamorphosis from ANGRAU Cloud Repository.',
    completed: [],
    availableResources: ['summary', 'detailed', 'audio', 'videos', 'flashcards', 'quiz'],
    resourceCount: 4,
    topicCount: 6,
    topics: [],
    estimatedMinutes: 60,
    estimatedTime: '60min',
    heroImage: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_02/media/hero.png`,
    heroImageUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_02/media/hero.png`,
  },
  {
    number: 3,
    name: 'Weathering',
    title: 'Weathering',
    dir: 'chapter_03',
    description: 'Authoritative course content for Weathering from ANGRAU Cloud Repository.',
    completed: [],
    availableResources: ['summary', 'detailed', 'audio', 'videos', 'flashcards', 'quiz'],
    resourceCount: 4,
    topicCount: 5,
    topics: [],
    estimatedMinutes: 50,
    estimatedTime: '50min',
    heroImage: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_03/media/hero.png`,
    heroImageUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_03/media/hero.png`,
  },
  {
    number: 4,
    name: 'Pollination',
    title: 'Pollination',
    dir: 'chapter_04',
    description: 'Authoritative course content for Pollination from ANGRAU Cloud Repository.',
    completed: [],
    availableResources: ['summary', 'detailed', 'audio', 'videos', 'flashcards', 'quiz'],
    resourceCount: 4,
    topicCount: 6,
    topics: [],
    estimatedMinutes: 60,
    estimatedTime: '60min',
    heroImage: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_04/media/hero.png`,
    heroImageUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_04/media/hero.png`,
  },
];

export let ANGRAU_SUBJECTS: Subject[] = [
  {
    id: 'ento_131',
    code: 'ENTO 131',
    name: 'Entomology',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 0,
    chapters: DEFAULT_ENTOMOLOGY_CHAPTERS,
  },
];

const USER_PROGRESS_KEY = 'saral_student_progress_v2';
const SUBJECTS_CACHE_KEY = 'saral_pure_api_cached_subjects_v2';
let hasFetchedLiveMetadataInSession = false;

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

function syncSubjectsWithUserProgress(
  subjects: Subject[],
  userProgress: Record<string, string[]>
): Subject[] {
  return subjects.map((subj) => {
    const baseChapters =
      subj.chapters && subj.chapters.length > 0 ? subj.chapters : DEFAULT_ENTOMOLOGY_CHAPTERS;
    const chaptersWithProgress = baseChapters.map((ch) => {
      const chPad = String(ch.number).padStart(2, '0');
      const key = `${subj.id}_chapter_${chPad}`;
      const completedPillars = userProgress[key] || ch.completed || [];
      return {
        ...ch,
        completed: [...completedPillars],
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
          name: meta.chapter_name || DEFAULT_ENTOMOLOGY_CHAPTERS[ch - 1]?.name || `Chapter ${ch}`,
          title: meta.chapter_name || DEFAULT_ENTOMOLOGY_CHAPTERS[ch - 1]?.title || `Chapter ${ch}`,
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
  async getSubjects(forceNetwork: boolean = false): Promise<Subject[]> {
    const userProgress = await getStudentChapterProgress();

    // Fast path: if we already have all 4 chapters in memory, sync with latest userProgress immediately
    if (!forceNetwork && hasFetchedLiveMetadataInSession && ANGRAU_SUBJECTS[0]?.chapters?.length === 4) {
      const immediate = syncSubjectsWithUserProgress(ANGRAU_SUBJECTS, userProgress);
      ANGRAU_SUBJECTS = immediate;
      return immediate;
    }

    const cached = await storage.getItem<Subject[]>(SUBJECTS_CACHE_KEY);
    if (!forceNetwork && cached && cached.length > 0 && cached[0]?.chapters?.length === 4) {
      const synced = syncSubjectsWithUserProgress(cached, userProgress);
      ANGRAU_SUBJECTS = synced;
      if (!hasFetchedLiveMetadataInSession) {
        hasFetchedLiveMetadataInSession = true;
        // Refresh metadata in the background without blocking UI rendering
        fetchLiveChapters()
          .then(async (liveChapters) => {
            if (liveChapters.length === 4) {
              const latestProgress = await getStudentChapterProgress();
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
              const updated = syncSubjectsWithUserProgress([liveSubject], latestProgress);
              ANGRAU_SUBJECTS = updated;
              await storage.setItem(SUBJECTS_CACHE_KEY, updated);
            }
          })
          .catch(() => {});
      }
      return synced;
    }

    try {
      const liveChapters = await fetchLiveChapters();
      if (liveChapters.length > 0) {
        hasFetchedLiveMetadataInSession = true;
        const latestProgress = await getStudentChapterProgress();
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
        const result = syncSubjectsWithUserProgress([liveSubject], latestProgress);
        ANGRAU_SUBJECTS = result;
        await storage.setItem(SUBJECTS_CACHE_KEY, result);
        return result;
      }
    } catch (err) {
      console.warn('[ManifestService] Failed live fetch, checking local cache:', err);
    }

    if (cached && cached.length > 0) {
      const synced = syncSubjectsWithUserProgress(cached, userProgress);
      ANGRAU_SUBJECTS = synced;
      return synced;
    }

    const fallbackSynced = syncSubjectsWithUserProgress(ANGRAU_SUBJECTS, userProgress);
    ANGRAU_SUBJECTS = fallbackSynced;
    return fallbackSynced;
  },

  calculateChapterProgress(chapter: Chapter): { percentage: number; statusColor: string } {
    if (!chapter.completed || chapter.completed.length === 0) {
      return { percentage: 0, statusColor: '#9CA3AF' };
    }

    // Track distinct learning milestones as the user goes through the chapter
    const milestones = new Set<string>();
    for (const item of chapter.completed) {
      const lower = item.toLowerCase();
      if (lower === 'read' || lower === 'read_visit' || lower === 'read_essentials') {
        milestones.add('read');
      } else if (lower === 'read_scrolled') {
        milestones.add('read_scrolled');
      } else if (lower === 'read_indepth' || lower === 'detailed_view' || lower === 'detailed') {
        milestones.add('read_indepth');
      } else if (lower === 'quick_check' || lower.startsWith('quick_check_')) {
        milestones.add('quick_check');
      } else if (lower === 'summary' || lower === 'notes' || lower === 'read_complete') {
        milestones.add('summary');
      } else if (lower === 'audio' || lower === 'listen' || lower === 'podcast' || lower === 'listen_essentials' || lower === 'listen_indepth') {
        milestones.add('listen');
      } else if (lower === 'microcast' || lower === 'microcasts') {
        milestones.add('microcasts');
      } else if (lower === 'videos' || lower === 'watch' || lower === 'video') {
        milestones.add('watch');
      } else if (lower === 'practice' || lower === 'flashcards' || lower === 'revise') {
        milestones.add('revise');
      } else if (lower === 'quiz' || lower === 'assessment' || lower === 'assessments' || lower === 'question_bank') {
        milestones.add('assessments');
      } else if (lower === 'prepare' || lower === 'pyq' || lower === 'prep_exam' || lower === 'study_plan') {
        milestones.add('prepare');
      } else if (lower === 'resources' || lower === 'mindmaps' || lower === 'key_takeaways' || lower === 'ask_me') {
        milestones.add('resources');
      } else {
        milestones.add(lower);
      }
    }

    // 8 milestones represent 100% mastery of a unit (~12.5% per milestone as the student goes through the chapter)
    const total = 8;
    const completedCount = milestones.size;
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

    const overallProgress = ento ? manifestService.calculateSubjectProgress(ento) : 0;

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

    // Immediately sync in-memory and cached subjects without blocking on network metadata calls
    const baseSubjects =
      ANGRAU_SUBJECTS && ANGRAU_SUBJECTS.length > 0 && ANGRAU_SUBJECTS[0]?.chapters?.length > 0
        ? ANGRAU_SUBJECTS
        : (await storage.getItem<Subject[]>(SUBJECTS_CACHE_KEY)) || ANGRAU_SUBJECTS;

    const updatedSubjects = syncSubjectsWithUserProgress(baseSubjects, userProgress);
    ANGRAU_SUBJECTS = updatedSubjects;
    await storage.setItem(SUBJECTS_CACHE_KEY, updatedSubjects);
    return updatedSubjects;
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
