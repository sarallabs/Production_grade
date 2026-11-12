import React, { useEffect, useState, useMemo } from 'react';
import {
  getCourses,
  getManifest,
  getChapters,
  type Course,
  type Chapter,
} from '@/data/contentRepository';
import SiteHeader from '@/components/SiteHeader';
import CourseCard from '@/components/CourseCard';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [chaptersByCourse, setChaptersByCourse] = useState<Record<string, Chapter[]>>({});
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);

  // Toggle filter drawer on mobile
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    Promise.all([getCourses(), getManifest()])
      .then(([coursesData, manifestData]) => {
        setCourses(coursesData);
        const map: Record<string, Chapter[]> = {};
        for (const c of coursesData) {
          map[c.id] = getChapters(manifestData, c.id);
        }
        setChaptersByCourse(map);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Autofill search suggestions
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    
    const results: { text: string; category: string }[] = [];
    const seen = new Set<string>();

    courses.forEach((c) => {
      if (c.name.toLowerCase().includes(q) && !seen.has(c.name)) {
        seen.add(c.name);
        results.push({ text: c.name, category: 'Course' });
      }
      if (c.meta.discipline && c.meta.discipline.toLowerCase().includes(q) && !seen.has(c.meta.discipline)) {
        seen.add(c.meta.discipline);
        results.push({ text: c.meta.discipline, category: 'Discipline' });
      }
      if (c.className && c.className.toLowerCase().includes(q) && !seen.has(c.className)) {
        seen.add(c.className);
        results.push({ text: c.className, category: 'Programme' });
      }
      c.meta.tags?.forEach((t) => {
        if (t.toLowerCase().includes(q) && !seen.has(t)) {
          seen.add(t);
          results.push({ text: t, category: 'Tag' });
        }
      });
    });

    return results.slice(0, 6);
  }, [courses, searchQuery]);

  // ── Faceted filter logic ──────────────────────────────────────────────
  // A course must match the search box plus every facet group; within a
  // group, checked values are OR'd. Each group's options and counts are
  // computed against the OTHER groups' selections, so picking the MBA
  // programme narrows Discipline to what MBA actually offers (and vice
  // versa), while a group never filters its own choices away. Options that
  // match nothing are dropped from the list — unless still checked, so they
  // can be unchecked — which makes incompatible combinations unselectable.


  const matchesSearch = (c: Course) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const words = q.split(/\s+/).filter(Boolean);
    return words.every(
      (w) =>
        c.name.toLowerCase().includes(w) ||
        c.className?.toLowerCase().includes(w) ||
        !!c.meta.discipline?.toLowerCase().includes(w) ||
        !!c.meta.tags?.some((t) => t.toLowerCase().includes(w)) ||
        !!c.meta.instructor?.name.toLowerCase().includes(w)
    );
  };

  const matchesProgrammes = (c: Course) =>
    selectedProgrammes.length === 0 || selectedProgrammes.includes(c.className);

  const matchesDisciplines = (c: Course) =>
    selectedDisciplines.length === 0 ||
    (!!c.meta.discipline && selectedDisciplines.includes(c.meta.discipline));

  const facets = useMemo(() => {
    const programmeCounts = new Map<string, number>();
    const disciplineCounts = new Map<string, number>();
    courses.forEach((c) => {
      if (!matchesSearch(c)) return;
      const prog = matchesProgrammes(c);
      const disc = matchesDisciplines(c);

      if (disc && c.className) {
        programmeCounts.set(c.className, (programmeCounts.get(c.className) || 0) + 1);
      }
      if (prog && c.meta.discipline) {
        disciplineCounts.set(c.meta.discipline, (disciplineCounts.get(c.meta.discipline) || 0) + 1);
      }
    });

    const toOptions = (counts: Map<string, number>, selected: string[]) => {
      // Checked values stay listed even at zero so they can be unchecked.
      selected.forEach((v) => {
        if (!counts.has(v)) counts.set(v, 0);
      });
      return Array.from(counts, ([value, count]) => ({ value, count })).sort(
        (a, b) => a.value.localeCompare(b.value),
      );
    };

    return {
      programmes: toOptions(programmeCounts, selectedProgrammes),
      disciplines: toOptions(disciplineCounts, selectedDisciplines),
    };
    // The match helpers close over exactly these states.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, searchQuery, selectedProgrammes, selectedDisciplines]);

  // Handle checking/unchecking filters
  const toggleFilter = (value: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(value)) {
      setList(list.filter((x) => x !== value));
    } else {
      setList([...list, value]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedProgrammes([]);
    setSelectedDisciplines([]);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedProgrammes.length > 0 ||
    selectedDisciplines.length > 0;

  // Filtered & Sorted Courses — the same predicates the facets use.
  const processedCourses = useMemo(() => {
    const result = courses.filter(
      (c) =>
        matchesSearch(c) &&
        matchesProgrammes(c) &&
        matchesDisciplines(c),
    );

    result.sort((a, b) => {
      const featA = a.meta.featured ? 1 : 0;
      const featB = b.meta.featured ? 1 : 0;
      return featB - featA;
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, searchQuery, selectedProgrammes, selectedDisciplines]);

  return (
    <div className="sv-catalog sv-catalog--explore">
      <SiteHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        suggestions={searchSuggestions}
        onSelectSuggestion={(text) => setSearchQuery(text)}
      />

      {/* Main Catalog Area */}
      <div className="sv-catalog-main-container">
        {/* Compact Left Filter Rail */}
        <aside className={`sv-catalog-filters-rail ${mobileFiltersOpen ? 'sv-catalog-filters-rail--open' : ''}`}>
          <div className="sv-catalog-filters-header">
            <span className="sv-catalog-filters-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
            </span>
            {hasActiveFilters && (
              <button className="sv-catalog-clear-btn" onClick={clearAllFilters}>
                Reset
              </button>
            )}
            <button className="sv-catalog-close-mobile-filters" onClick={() => setMobileFiltersOpen(false)}>
              &times;
            </button>
          </div>

          {/* Facet: Programme */}
          {facets.programmes.length > 0 && (
            <div className="sv-catalog-filter-group">
              <h4>Programme</h4>
              <div className="sv-catalog-filter-options">
                {facets.programmes.map(({ value, count }) => (
                  <label key={value} className="sv-catalog-filter-label">
                    <input
                      type="checkbox"
                      checked={selectedProgrammes.includes(value)}
                      onChange={() => toggleFilter(value, selectedProgrammes, setSelectedProgrammes)}
                    />
                    <span className="sv-catalog-filter-name">{value}</span>
                    <span className="sv-catalog-filter-count">({count})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Facet: Discipline */}
          {facets.disciplines.length > 0 && (
            <div className="sv-catalog-filter-group">
              <h4>Discipline</h4>
              <div className="sv-catalog-filter-options">
                {facets.disciplines.map(({ value, count }) => (
                  <label key={value} className="sv-catalog-filter-label">
                    <input
                      type="checkbox"
                      checked={selectedDisciplines.includes(value)}
                      onChange={() => toggleFilter(value, selectedDisciplines, setSelectedDisciplines)}
                    />
                    <span className="sv-catalog-filter-name">{value}</span>
                    <span className="sv-catalog-filter-count">({count})</span>
                  </label>
                ))}
              </div>
            </div>
          )}



        </aside>

        {/* Results Pane */}
        <main className="sv-catalog-results-pane">
          <div className="sv-catalog-results-toolbar">
            <div className="sv-catalog-results-left">
              <div className="sv-catalog-results-count">
                {loading ? (
                  <span>Loading courses...</span>
                ) : (
                  <span>
                    Showing <strong>{processedCourses.length}</strong> {processedCourses.length === 1 ? 'course' : 'courses'}
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <div className="sv-catalog-active-chips">
                  {searchQuery && (
                    <span className="sv-catalog-chip">
                      “{searchQuery}”
                      <button type="button" onClick={() => setSearchQuery('')}>&times;</button>
                    </span>
                  )}
                  {selectedProgrammes.map((prog) => (
                    <span key={prog} className="sv-catalog-chip">
                      {prog}
                      <button type="button" onClick={() => toggleFilter(prog, selectedProgrammes, setSelectedProgrammes)}>&times;</button>
                    </span>
                  ))}
                  {selectedDisciplines.map((disc) => (
                    <span key={disc} className="sv-catalog-chip">
                      {disc}
                      <button type="button" onClick={() => toggleFilter(disc, selectedDisciplines, setSelectedDisciplines)}>&times;</button>
                    </span>
                  ))}
                  <button type="button" className="sv-catalog-chip-clear-all" onClick={clearAllFilters}>
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="sv-catalog-toolbar-actions">
              <button
                type="button"
                className="sv-catalog-mobile-filter-trigger"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
              </button>
            </div>
          </div>

          {/* Catalog Course Grid */}
          {loading ? (
            <div className="sv-catalog-loading-state">
              <div className="sv-catalog-spinner"></div>
              <p>Loading course offerings...</p>
            </div>
          ) : processedCourses.length > 0 ? (
            <div className="sv-catalog-grid">
              {processedCourses.map((course, idx) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  chapters={chaptersByCourse[course.id] || []}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            <div className="sv-catalog-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <h3>No courses found</h3>
              <p>Try adjusting your keyword search or clear some filters to discover available courses.</p>
              <button className="sv-catalog-primary-btn" onClick={clearAllFilters}>
                Reset Filters
              </button>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
