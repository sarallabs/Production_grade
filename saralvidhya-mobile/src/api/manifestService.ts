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
        completed: ['summary', 'detailed_view'],
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
      {
        number: 5,
        name: 'Morphology & Physiology',
        dir: 'chapter_05',
        description: 'Exoskeleton, head orientation, mouthparts, antennae, wings, circulatory and respiratory systems.',
        completed: [],
        resourceCount: 4,
      },
    ],
  },
  {
    id: 'agro_101',
    code: 'AGRO 101',
    name: 'Agronomy',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 50,
    chapters: [
      {
        number: 1,
        name: 'Tillage and Tilth Concepts',
        dir: 'chapter_01',
        description: 'Objectives of tillage, primary vs secondary tillage, zero-tillage principles.',
        completed: ['summary', 'flashcards', 'quiz', 'detailed_view'],
        resourceCount: 4,
      },
      {
        number: 2,
        name: 'Crop Nutrition and Organic Manures',
        dir: 'chapter_02',
        description: 'Essential plant nutrients, biofertilizers, and balanced fertilizer application.',
        completed: ['summary', 'flashcards', 'quiz', 'detailed_view'],
        resourceCount: 4,
      },
      {
        number: 3,
        name: 'Water Management & Irrigation Systems',
        dir: 'chapter_03',
        description: 'Crop water requirements, drip, sprinkler irrigation and drainage methods.',
        completed: ['summary'],
        resourceCount: 4,
      },
      {
        number: 4,
        name: 'Weed Biology & Management',
        dir: 'chapter_04',
        description: 'Classification of weeds, herbicide selectivity, integrated weed control.',
        completed: [],
        resourceCount: 4,
      },
      {
        number: 5,
        name: 'Dryland Farming & Water Conservation',
        dir: 'chapter_05',
        description: 'Drought coping mechanisms, mulching, watershed development.',
        completed: [],
        resourceCount: 4,
      },
      {
        number: 6,
        name: 'Sustainable Cropping Systems',
        dir: 'chapter_06',
        description: 'Crop rotation, mixed cropping, intercropping indices and agroforestry.',
        completed: [],
        resourceCount: 4,
      },
    ],
  },
  {
    id: 'path_101',
    code: 'PATH 101',
    name: 'Plant Pathology',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 50,
    chapters: [
      {
        number: 1,
        name: 'Introduction to Plant Pathogens',
        dir: 'chapter_01',
        description: 'History, concepts of biotic and abiotic causes of plant diseases.',
        completed: ['summary', 'flashcards', 'quiz', 'detailed_view'],
        resourceCount: 4,
      },
      {
        number: 2,
        name: 'Fungal Plant Diseases & Morphology',
        dir: 'chapter_02',
        description: 'Mastigomycotina, Ascomycotina, Basidiomycotina life cycles.',
        completed: ['summary', 'flashcards', 'quiz', 'detailed_view'],
        resourceCount: 4,
      },
      {
        number: 3,
        name: 'Bacterial Phytopathogens',
        dir: 'chapter_03',
        description: 'Symptoms, transmission, survival of Xanthomonas, Ralstonia.',
        completed: ['summary'],
        resourceCount: 4,
      },
      {
        number: 4,
        name: 'Plant Viruses & Fastidious Microbes',
        dir: 'chapter_04',
        description: 'Tobacco mosaic virus, geminiviruses, vector relationships.',
        completed: [],
        resourceCount: 4,
      },
      {
        number: 5,
        name: 'Disease Triangle & Epidemiology',
        dir: 'chapter_05',
        description: 'Infection cycles, inoculum potential, epidemic forecasting.',
        completed: [],
        resourceCount: 4,
      },
      {
        number: 6,
        name: 'Integrated Disease Management',
        dir: 'chapter_06',
        description: 'Fungicides, systemic resistance, biological antagonists.',
        completed: [],
        resourceCount: 4,
      },
    ],
  },
  {
    id: 'soil_101',
    code: 'SOIL 101',
    name: 'Soil Science',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 50,
    chapters: [
      {
        number: 1,
        name: 'Soil Genesis & Formation',
        dir: 'chapter_01',
        description: 'Weathering of rocks, soil forming factors and profile horizonation.',
        completed: ['summary', 'flashcards', 'quiz', 'detailed_view'],
        resourceCount: 4,
      },
      {
        number: 2,
        name: 'Soil Physical Properties',
        dir: 'chapter_02',
        description: 'Soil texture, structure, bulk density, porosity, soil water constants.',
        completed: ['summary', 'flashcards', 'quiz', 'detailed_view'],
        resourceCount: 4,
      },
      {
        number: 3,
        name: 'Soil Chemistry & Colloids',
        dir: 'chapter_03',
        description: 'Cation and anion exchange capacity, base saturation, pH buffer capacity.',
        completed: ['summary'],
        resourceCount: 4,
      },
      {
        number: 4,
        name: 'Soil Organic Matter & Organisms',
        dir: 'chapter_04',
        description: 'Humus formation, carbon nitrogen ratio, mycorrhizae.',
        completed: [],
        resourceCount: 4,
      },
      {
        number: 5,
        name: 'Problem Soils & Reclamation',
        dir: 'chapter_05',
        description: 'Saline, sodic, acid soils and lime/gypsum remediation.',
        completed: [],
        resourceCount: 4,
      },
      {
        number: 6,
        name: 'Soil Survey & Land Capability',
        dir: 'chapter_06',
        description: 'Soil taxonomy orders, fertility evaluation and soil health card.',
        completed: [],
        resourceCount: 4,
      },
    ],
  },
  {
    id: 'gpb_101',
    code: 'GPB 101',
    name: 'Genetics & Breeding',
    credits: '3 (2+1)',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    progressPercent: 50,
    chapters: [
      {
        number: 1,
        name: 'Mendelian Genetics & Heredity',
        dir: 'chapter_01',
        description: 'Monohybrid, dihybrid crosses, gene interaction and epistasis.',
        completed: ['summary', 'flashcards', 'quiz', 'detailed_view'],
        resourceCount: 4,
      },
      {
        number: 2,
        name: 'Chromosomal Basis of Inheritance',
        dir: 'chapter_02',
        description: 'Mitosis, meiosis, chromosome morphology and karyotyping.',
        completed: ['summary', 'flashcards', 'quiz', 'detailed_view'],
        resourceCount: 4,
      },
      {
        number: 3,
        name: 'Linkage & Crossing Over',
        dir: 'chapter_03',
        description: 'Genetic mapping, interference, coefficient of coincidence.',
        completed: ['summary'],
        resourceCount: 4,
      },
      {
        number: 4,
        name: 'Mutation & Polyploidy in Crops',
        dir: 'chapter_04',
        description: 'Spontaneous vs induced mutagenesis, autopolyploids and allopolyploids.',
        completed: [],
        resourceCount: 4,
      },
      {
        number: 5,
        name: 'Plant Breeding Methods',
        dir: 'chapter_05',
        description: 'Mass selection, pure-line selection, pedigree and bulk methods.',
        completed: [],
        resourceCount: 4,
      },
      {
        number: 6,
        name: 'Heterosis & Hybrid Seed Production',
        dir: 'chapter_06',
        description: 'Cytoplasmic genetic male sterility (CGMS), hybrid vigour utilization.',
        completed: [],
        resourceCount: 4,
      },
    ],
  },
];

export const manifestService = {
  async getSubjects(): Promise<Subject[]> {
    const cacheKey = 'saral_cached_subjects_v2';
    const cached = await storage.getItem<Subject[]>(cacheKey);
    if (cached && cached.length >= ANGRAU_SUBJECTS.length && cached[0].chapters?.length === 5 && cached[0].chapters[1]?.name === 'Metamorphosis') {
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
    
    // The 5 units of Entomology (Digestive System, Metamorphosis, Weathering, Pollination, Morphology & Physiology)
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
        await storage.setItem('saral_cached_subjects', subjects);
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

