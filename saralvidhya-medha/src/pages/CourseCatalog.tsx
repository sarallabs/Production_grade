import React, { useEffect, useState, useMemo } from 'react';
import { getCourses, type Course } from '@/data/contentRepository';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CourseCard from '@/components/CourseCard';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Toggle filter drawer on mobile
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    getCourses().then((data) => {
      setCourses(data);
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

  const getDurationBucket = (hours: number) => {
    if (hours <= 30) return 'Under 30 Hours';
    if (hours <= 40) return '30-40 Hours';
    return '40+ Hours';
  };

  const getHours = (c: Course) =>
    c.meta.durationHours || (c.chapterCount ? c.chapterCount * 4 : 30);

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

  const matchesDurations = (c: Course) =>
    selectedDurations.length === 0 ||
    selectedDurations.includes(getDurationBucket(getHours(c)));

  const facets = useMemo(() => {
    const programmeCounts = new Map<string, number>();
    const disciplineCounts = new Map<string, number>();
    const durationCounts = new Map<string, number>();

    courses.forEach((c) => {
      if (!matchesSearch(c)) return;
      const prog = matchesProgrammes(c);
      const disc = matchesDisciplines(c);
      const dur = matchesDurations(c);

      if (disc && dur && c.className) {
        programmeCounts.set(c.className, (programmeCounts.get(c.className) || 0) + 1);
      }
      if (prog && dur && c.meta.discipline) {
        disciplineCounts.set(c.meta.discipline, (disciplineCounts.get(c.meta.discipline) || 0) + 1);
      }
      if (prog && disc) {
        const bucket = getDurationBucket(getHours(c));
        durationCounts.set(bucket, (durationCounts.get(bucket) || 0) + 1);
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
      durations: toOptions(durationCounts, selectedDurations),
    };
    // The match helpers close over exactly these states.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, searchQuery, selectedProgrammes, selectedDisciplines, selectedDurations]);

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
    setSelectedDurations([]);
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedProgrammes.length > 0 || 
    selectedDisciplines.length > 0 || 
    selectedDurations.length > 0;

  // Filtered & Sorted Courses — the same predicates the facets use.
  const processedCourses = useMemo(() => {
    const result = courses.filter(
      (c) =>
        matchesSearch(c) &&
        matchesProgrammes(c) &&
        matchesDisciplines(c) &&
        matchesDurations(c),
    );

    result.sort((a, b) => {
      if (sortBy === 'featured') {
        const featA = a.meta.featured ? 1 : 0;
        const featB = b.meta.featured ? 1 : 0;
        return featB - featA; // featured first
      }
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'duration') {
        return getHours(a) - getHours(b);
      }
      return 0;
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, searchQuery, selectedProgrammes, selectedDisciplines, selectedDurations, sortBy]);

  return (
    <div className="sv-catalog">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="sv-catalog-hero">
        <div className="sv-catalog-hero-container">
          <h1 className="sv-catalog-hero-title">Explore Public Courses</h1>
          <p className="sv-catalog-hero-subtitle">
            Enhance your knowledge with structured online units and sessions taught by university experts.
          </p>
          <div className="sv-catalog-search-wrapper">
            <svg className="sv-catalog-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by course name, discipline, tag, or instructor..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="sv-catalog-search-input"
            />
            {searchQuery && (
              <button 
                className="sv-catalog-search-clear" 
                onClick={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
              >
                &times;
              </button>
            )}

            {/* Autofill Search Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="sv-catalog-search-dropdown">
                {searchSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="sv-catalog-search-suggestion-item"
                    onMouseDown={() => {
                      setSearchQuery(item.text);
                      setShowSuggestions(false);
                    }}
                  >
                    <span>🔍 {item.text}</span>
                    <span className="sv-catalog-suggestion-badge">{item.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <div className="sv-catalog-main-container">
        {/* Sidebar / Filter Rail (Desktop) */}
        <aside className={`sv-catalog-filters-rail ${mobileFiltersOpen ? 'sv-catalog-filters-rail--open' : ''}`}>
          <div className="sv-catalog-filters-header">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button className="sv-catalog-clear-btn" onClick={clearAllFilters}>
                Clear all
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



          {/* Facet: Duration */}
          {facets.durations.length > 0 && (
            <div className="sv-catalog-filter-group">
              <h4>Duration</h4>
              <div className="sv-catalog-filter-options">
                {facets.durations.map(({ value, count }) => (
                  <label key={value} className="sv-catalog-filter-label">
                    <input
                      type="checkbox"
                      checked={selectedDurations.includes(value)}
                      onChange={() => toggleFilter(value, selectedDurations, setSelectedDurations)}
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
            <div className="sv-catalog-results-count">
              {loading ? (
                <span>Loading courses...</span>
              ) : (
                <span>
                  Showing <strong>{processedCourses.length}</strong> {processedCourses.length === 1 ? 'course' : 'courses'}
                </span>
              )}
            </div>

            <div className="sv-catalog-toolbar-actions">
              <button 
                className="sv-catalog-mobile-filter-trigger"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
              </button>

              <div className="sv-catalog-sort-wrapper">
                <label htmlFor="sv-catalog-sort">Sort By:</label>
                <select
                  id="sv-catalog-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sv-catalog-sort-select"
                >
                  <option value="featured">Featured</option>
                  <option value="alphabetical">Name (A-Z)</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Chips row on mobile/tablet */}
          {hasActiveFilters && (
            <div className="sv-catalog-active-chips">
              {searchQuery && (
                <span className="sv-catalog-chip">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>&times;</button>
                </span>
              )}
              {selectedProgrammes.map((prog) => (
                <span key={prog} className="sv-catalog-chip">
                  {prog}
                  <button onClick={() => toggleFilter(prog, selectedProgrammes, setSelectedProgrammes)}>&times;</button>
                </span>
              ))}
              {selectedDisciplines.map((disc) => (
                <span key={disc} className="sv-catalog-chip">
                  {disc}
                  <button onClick={() => toggleFilter(disc, selectedDisciplines, setSelectedDisciplines)}>&times;</button>
                </span>
              ))}

              {selectedDurations.map((dur) => (
                <span key={dur} className="sv-catalog-chip">
                  {dur}
                  <button onClick={() => toggleFilter(dur, selectedDurations, setSelectedDurations)}>&times;</button>
                </span>
              ))}
              <button className="sv-catalog-chip-clear-all" onClick={clearAllFilters}>
                Clear all
              </button>
            </div>
          )}

          {/* Catalog Course Grid */}
          {loading ? (
            <div className="sv-catalog-loading-state">
              <div className="sv-catalog-spinner"></div>
              <p>Loading course offerings...</p>
            </div>
          ) : processedCourses.length > 0 ? (
            <div className="sv-catalog-grid">
              {processedCourses.map((course, idx) => (
                <CourseCard key={course.id} course={course} index={idx} />
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

      <SiteFooter />
    </div>
  );
}
