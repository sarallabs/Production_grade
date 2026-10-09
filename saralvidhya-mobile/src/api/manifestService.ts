import { storage } from '@/utils/storage';

export const GCS_API_BASE = 'https://saralvidhya-api-193782571555.asia-south1.run.app';

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

export const ANGRAU_SUBJECTS: Subject[] = [
  {
    id: 'ento_131',
    code: 'ENTO 131',
    name: 'Fundamentals of Entomology',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 65,
    chapters: [
      {
        number: 1,
        name: 'Insect Digestive System & Anatomy',
        dir: 'chapter_01',
        description: 'Alimentary canal, foregut, midgut, hindgut, digestive enzymes and nutrient absorption in insects.',
        completed: ['summary', 'detailed_view', 'flashcards', 'quiz', 'podcasts', 'videos', 'mindmap'],
        resourceCount: 7,
      },
      {
        number: 2,
        name: 'Insect Morphology & Structural Taxonomy',
        dir: 'chapter_02',
        description: 'Exoskeleton, head orientation, mouthparts (chewing, siphoning, piercing), antennae, and wing modifications.',
        completed: ['summary', 'detailed_view', 'flashcards', 'quiz', 'podcasts', 'mindmap'],
        resourceCount: 6,
      },
      {
        number: 3,
        name: 'Weathering & Pest Ecology',
        dir: 'chapter_03',
        description: 'Abiotic factors influencing insect population dynamics, temperature thresholds, diapause, and photoperiodism.',
        completed: ['summary', 'detailed_view', 'flashcards', 'quiz', 'podcasts', 'videos', 'mindmap'],
        resourceCount: 7,
      },
      {
        number: 4,
        name: 'Pollination & Beneficial Insects',
        dir: 'chapter_04',
        description: 'Apiculture basics, honey bee species, silkworm biology, lac insects, and agricultural biocontrol parasitoids.',
        completed: ['summary', 'detailed_view', 'flashcards', 'quiz', 'podcasts', 'videos', 'mindmap'],
        resourceCount: 7,
      },
    ],
  },
  {
    id: 'agro_101',
    code: 'AGRO 101',
    name: 'Fundamentals of Agronomy',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 40,
    chapters: [
      {
        number: 1,
        name: 'Tillage and Tilth',
        dir: 'chapter_01',
        description: 'Objectives of tillage, primary vs secondary tillage, modern zero-tillage concepts and soil conservation.',
        completed: ['summary', 'flashcards'],
        resourceCount: 5,
      },
      {
        number: 2,
        name: 'Crop Nutrition and Manures',
        dir: 'chapter_02',
        description: 'Essential plant nutrients, organic manures, biofertilizers, and balanced fertilizer application techniques.',
        completed: ['summary'],
        resourceCount: 4,
      },
    ],
  },
  {
    id: 'soil_101',
    code: 'SOIL 101',
    name: 'Introduction to Soil Science',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 20,
    chapters: [
      {
        number: 1,
        name: 'Soil Genesis & Formation',
        dir: 'chapter_01',
        description: 'Weathering of rocks, soil forming processes, profile characteristics and soil horizons.',
        completed: [],
        resourceCount: 5,
      },
    ],
  },
];

export const manifestService = {
  async getSubjects(): Promise<Subject[]> {
    const cacheKey = 'saral_cached_subjects';
    const cached = await storage.getItem<Subject[]>(cacheKey);
    if (cached && cached.length > 0) {
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
