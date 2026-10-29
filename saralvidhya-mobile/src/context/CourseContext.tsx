import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/utils/storage';
import { manifestService, Subject, Chapter } from '@/api/manifestService';
import { GCS_API_BASE } from '@/api/manifestService';
import { useAuth } from '@/context/AuthContext';

export interface Course {
  id: string;
  code: string;
  name: string;
  degree: string;
  semester: string;
  university: string;
  subjectIds: string[];
  subjectsCount: number;
  progressPercent: number;
  icon: string;
  description: string;
  popularTag?: string;
}

export const DEFAULT_COURSES: Course[] = [
  {
    id: 'bsc_agri',
    code: 'BSC-AGRI',
    name: 'B.Sc. Agriculture',
    degree: 'ANGRAU',
    semester: 'Semester 3',
    university: 'Acharya N.G. Ranga Agricultural University',
    subjectIds: ['ento_131'],
    subjectsCount: 1,
    progressPercent: 50,
    icon: 'leaf-outline',
    description: 'Core Entomology (4 Chapters): Digestive system, Metamorphosis, Weathering, and Pollination.',
    popularTag: 'ANGRAU',
  },
];

interface CourseContextType {
  selectedCourse: Course | null;
  selectedSubject: Subject | null;
  selectedChapter: Chapter | null;
  courses: Course[];
  subjects: Subject[];
  isLoading: boolean;
  selectCourse: (course: Course) => void;
  selectCourseById: (courseId: string) => Promise<Course | null>;
  selectSubject: (subject: Subject) => void;
  selectSubjectById: (subjectId: string) => Promise<Subject | null>;
  selectChapter: (chapter: Chapter) => void;
  selectChapterByNumber: (chapterNumber: number) => void;
  markResourceCompleted: (subjectId: string, chapterNumber: number, resourceType: string) => Promise<void>;
  isResourceCompleted: (subjectId: string, chapterNumber: number, resourceType: string) => boolean;
  refreshProgress: () => Promise<void>;
}

const CourseContext = createContext<CourseContextType>({
  selectedCourse: DEFAULT_COURSES[0],
  selectedSubject: null,
  selectedChapter: null,
  courses: DEFAULT_COURSES,
  subjects: [],
  isLoading: true,
  selectCourse: () => {},
  selectCourseById: async () => null,
  selectSubject: () => {},
  selectSubjectById: async () => null,
  selectChapter: () => {},
  selectChapterByNumber: () => {},
  markResourceCompleted: async () => {},
  isResourceCompleted: () => false,
  refreshProgress: async () => {},
});

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(DEFAULT_COURSES[0]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCatalogAndProgress();
  }, [user]);

  const loadCatalogAndProgress = async () => {
    setIsLoading(true);
    try {
      // 1. Load subjects from manifest service (cached or backend API)
      const loadedSubjects = await manifestService.getSubjects();
      setSubjects(loadedSubjects);

      // 2. Calculate dynamic progress for each course based on its subjects
      const updatedCourses = DEFAULT_COURSES.map((course) => {
        const courseSubjs = loadedSubjects.filter((s) => course.subjectIds.includes(s.id));
        const totalProgress = courseSubjs.reduce((sum, s) => sum + (s.progressPercent || 0), 0);
        const avg = courseSubjs.length > 0 ? Math.round(totalProgress / courseSubjs.length) : 0;
        return {
          ...course,
          progressPercent: avg,
          subjectsCount: courseSubjs.length,
        };
      });
      setCourses(updatedCourses);

      // 3. Restore last selected course, subject & chapter from storage
      const [savedCourseId, savedSubjectId, savedChapterNum] = await Promise.all([
        storage.getItem<string>('saral_selected_course_id'),
        storage.getItem<string>('saral_selected_subject_id'),
        storage.getItem<number>('saral_selected_chapter_num'),
      ]);

      const activeCourse =
        updatedCourses.find((c) => c.id === savedCourseId) || updatedCourses[0];
      setSelectedCourse(activeCourse);

      const activeSubject =
        loadedSubjects.find((s) => s.id === savedSubjectId) ||
        loadedSubjects.find((s) => activeCourse.subjectIds.includes(s.id)) ||
        loadedSubjects[0];
      setSelectedSubject(activeSubject);

      if (activeSubject && activeSubject.chapters?.length > 0) {
        setSelectedChapter((prev) => {
          const targetNum = prev?.number || savedChapterNum || 1;
          return (
            activeSubject.chapters.find((c) => c.number === targetNum) ||
            activeSubject.chapters[0]
          );
        });
      }
    } catch (e) {
      console.warn('[CourseContext] Failed to load catalog', e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCourse = async (course: Course) => {
    setSelectedCourse(course);
    await storage.setItem('saral_selected_course_id', course.id);

    // Pick first subject belonging to this course
    const firstSubject = subjects.find((s) => course.subjectIds.includes(s.id)) || subjects[0];
    if (firstSubject) {
      setSelectedSubject(firstSubject);
      if (firstSubject.chapters?.length > 0) {
        setSelectedChapter((prev) => {
          const matched = prev ? firstSubject.chapters.find((c) => c.number === prev.number) : null;
          return matched || firstSubject.chapters[0];
        });
      }
      await storage.setItem('saral_selected_subject_id', firstSubject.id);
    }
  };

  const selectCourseById = async (courseId: string): Promise<Course | null> => {
    const course = courses.find((c) => c.id === courseId) || null;
    if (course) {
      await selectCourse(course);
    }
    return course;
  };

  const selectSubject = async (subject: Subject) => {
    const isSameSubject = selectedSubject?.id === subject.id;
    setSelectedSubject(subject);
    if (subject.chapters?.length > 0) {
      setSelectedChapter((prev) => {
        if (prev) {
          const matched = subject.chapters.find((c) => c.number === prev.number);
          if (matched && (isSameSubject || subject.chapters.some((c) => c.name === prev.name))) {
            return matched;
          }
        }
        return subject.chapters[0];
      });
    }
    await storage.setItem('saral_selected_subject_id', subject.id);
  };

  const selectSubjectById = async (subjectId: string): Promise<Subject | null> => {
    const subject =
      subjects.find((s) => s.id === subjectId || s.code.toLowerCase().replace(/\s+/g, '_') === subjectId) ||
      null;
    if (subject) {
      await selectSubject(subject);
    }
    return subject;
  };

  const selectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    storage.setItem('saral_selected_chapter_num', chapter.number).catch(() => {});
  };

  const selectChapterByNumber = (chapterNumber: number) => {
    const activeSubj = selectedSubject || subjects[0];
    const found = activeSubj?.chapters?.find((c) => c.number === chapterNumber);
    if (found) {
      setSelectedChapter(found);
    } else {
      setSelectedChapter((prev) =>
        prev?.number === chapterNumber
          ? prev
          : {
              number: chapterNumber,
              dir: `chapter_${String(chapterNumber).padStart(2, '0')}`,
              name:
                chapterNumber === 1
                  ? 'Digestive System'
                  : chapterNumber === 2
                  ? 'Metamorphosis'
                  : chapterNumber === 3
                  ? 'Weathering'
                  : chapterNumber === 4
                  ? 'Pollination'
                  : `Chapter ${chapterNumber}`,
              description: '',
              completed: [],
            }
      );
    }
    storage.setItem('saral_selected_chapter_num', chapterNumber).catch(() => {});
  };

  const markResourceCompleted = async (
    subjectId: string,
    chapterNumber: number,
    resourceType: string
  ) => {
    try {
      const updatedSubjects = await manifestService.markChapterResource(
        subjectId,
        chapterNumber,
        resourceType,
        true
      );
      setSubjects(updatedSubjects);

      // Update current selected subject and chapter in memory
      const cur = updatedSubjects.find((s) => s.id === subjectId);
      if (cur) {
        setSelectedSubject({ ...cur });
        const updatedCh = cur.chapters?.find((c) => c.number === chapterNumber);
        if (updatedCh) {
          setSelectedChapter((prev) => (prev?.number === chapterNumber ? { ...updatedCh } : prev));
        }
      }

      // Update courses progress
      setCourses((prevCourses) =>
        prevCourses.map((c) => {
          const cSubjs = updatedSubjects.filter((s) => c.subjectIds.includes(s.id));
          const totalProgress = cSubjs.reduce((sum, s) => sum + (s.progressPercent || 0), 0);
          const avg = cSubjs.length > 0 ? Math.round(totalProgress / cSubjs.length) : 0;
          return { ...c, progressPercent: avg };
        })
      );

      // Sync progress to backend in background if authenticated
      if (user?.id) {
        fetch(`${GCS_API_BASE}/api/users/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            university: 'angrau',
            subject: subjectId,
            chapter: `chapter_${String(chapterNumber).padStart(2, '0')}`,
            level: 'intermediate',
            tool: resourceType,
            completed: true,
          }),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[CourseContext] Failed to update progress', e);
    }
  };

  const isResourceCompleted = (
    subjectId: string,
    chapterNumber: number,
    resourceType: string
  ): boolean => {
    const subj = subjects.find((s) => s.id === subjectId);
    if (!subj) return false;
    const ch = subj.chapters?.find((c) => c.number === chapterNumber);
    return Boolean(ch?.completed?.includes(resourceType));
  };

  const refreshProgress = async () => {
    await loadCatalogAndProgress();
  };

  return (
    <CourseContext.Provider
      value={{
        selectedCourse,
        selectedSubject,
        selectedChapter,
        courses,
        subjects,
        isLoading,
        selectCourse,
        selectCourseById,
        selectSubject,
        selectSubjectById,
        selectChapter,
        selectChapterByNumber,
        markResourceCompleted,
        isResourceCompleted,
        refreshProgress,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourseContext = () => useContext(CourseContext);
