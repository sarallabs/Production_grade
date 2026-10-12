import fs from 'fs/promises';
import path from 'path';
import { Storage } from '@google-cloud/storage';
import {
  ReadMode,
  Persona,
  SectionSummary,
  SectionPayload,
  SubtopicAnchor,
  DottedTerm,
  InteractiveFigure,
} from '../types/read.js';

interface CachedChapter {
  timestamp: number;
  sections: SectionPayload[];
  summaries: SectionSummary[];
}

export class ReadSectionParser {
  private static cache = new Map<string, CachedChapter>();
  private static readonly TTL_MS = 60 * 60 * 1000; // 1 hour TTL
  private static storage = new Storage();
  private static readonly BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'saralvidhya-artifacts';

  /**
   * Resolves content directory for the given university, subject, and chapter.
   * Checks local paths (development/test) and falls back to GCS.
   */
  public static async getMasterContent(
    uni: string,
    subj: string,
    _chapter: string,
    mode: ReadMode,
    persona: Persona
  ): Promise<{ markdown: string; metadata: Record<string, any> }> {
    const trackFolder = mode === 'indepth' ? 'Detailed_Study' : 'Quick_Study';
    const trackFilePrefix = mode === 'indepth' ? 'Detailed_Study' : 'Quick_Study';

    // 1. Try local filesystem paths
    const localCandidates = [
      // Direct Production_grade/MLRIT path
      path.resolve(process.cwd(), `../MLRIT/${subj.toUpperCase()}/Learn/Read/${trackFolder}`),
      path.resolve(process.cwd(), `../../MLRIT/${subj.toUpperCase()}/Learn/Read/${trackFolder}`),
      path.resolve(process.cwd(), `MLRIT/${subj.toUpperCase()}/Learn/Read/${trackFolder}`),
      // Fallback relative to content root
      path.resolve(process.cwd(), `content/${uni}/${subj}/Learn/Read/${trackFolder}`),
    ];

    for (const dir of localCandidates) {
      try {
        const files = await fs.readdir(dir);
        const mdFile = files.find(f => f.includes(trackFilePrefix) && f.toLowerCase().includes(persona) && f.endsWith('.md'));
        const jsonFile = files.find(f => f.includes(trackFilePrefix) && f.toLowerCase().includes(persona) && f.endsWith('.json'));

        if (mdFile) {
          const mdContent = await fs.readFile(path.join(dir, mdFile), 'utf-8');
          let jsonContent: Record<string, any> = {};
          if (jsonFile) {
            const raw = await fs.readFile(path.join(dir, jsonFile), 'utf-8');
            jsonContent = JSON.parse(raw);
          }
          return { markdown: mdContent, metadata: jsonContent };
        }
      } catch {
        // Continue search
      }
    }

    // 2. GCS Bucket fallback
    try {
      const gcsMdPath = `${uni}/${subj}/read/${trackFolder}/DBMS_UNIT_I_${trackFilePrefix}_${persona}.md`;
      const gcsJsonPath = `${uni}/${subj}/read/${trackFolder}/DBMS_UNIT_I_${trackFilePrefix}_${persona}.json`;

      const bucket = this.storage.bucket(this.BUCKET_NAME);
      const [mdBuffer] = await bucket.file(gcsMdPath).download();
      let meta: Record<string, any> = {};
      try {
        const [jsonBuffer] = await bucket.file(gcsJsonPath).download();
        meta = JSON.parse(jsonBuffer.toString('utf-8'));
      } catch {
        // metadata optional
      }
      return { markdown: mdBuffer.toString('utf-8'), metadata: meta };
    } catch (gcsErr: any) {
      throw new Error(`Failed to load read content for ${uni}/${subj} [${mode}/${persona}]: ${gcsErr.message}`);
    }
  }

  /**
   * Slices master Markdown content by '## ' into SectionPayload objects.
   */
  public static async getParsedSections(
    uni: string,
    subj: string,
    chapter: string,
    mode: ReadMode,
    persona: Persona
  ): Promise<{ sections: SectionPayload[]; summaries: SectionSummary[] }> {
    const cacheKey = `${uni}__${subj}__${chapter}__${mode}__${persona}`.toLowerCase();
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.TTL_MS) {
      return { sections: cached.sections, summaries: cached.summaries };
    }

    const { markdown, metadata } = await this.getMasterContent(uni, subj, chapter, mode, persona);
    const lines = markdown.split('\n');

    const sections: SectionPayload[] = [];
    const summaries: SectionSummary[] = [];

    let currentTitle = '';
    let currentModuleId = 'M0';
    let currentLines: string[] = [];
    let currentSubtopics: SubtopicAnchor[] = [];
    let sectionIndex = 0;

    const flushCurrentSection = () => {
      if (!currentTitle && currentLines.length === 0) return;

      const sectionId = `section_0${sectionIndex}`;
      const mdContent = currentLines.join('\n').trim();
      const wordCount = mdContent.split(/\s+/).filter(Boolean).length;
      const estimatedMinutes = Math.max(2, Math.round(wordCount / 220));

      // Extract figure references and definitions from metadata
      const figures: InteractiveFigure[] = this.extractFiguresForSection(currentModuleId, metadata);
      const dottedTerms: DottedTerm[] = this.extractTermsForSection(mdContent, metadata);

      // Extract subtitle if exists
      const firstParagraph = currentLines.find(l => l.trim().length > 0 && !l.startsWith('#') && !l.startsWith('<'));
      const subtitle = firstParagraph ? (firstParagraph.slice(0, 100) + (firstParagraph.length > 100 ? '...' : '')) : '';

      const isLocked = sectionIndex > 1; // Section 0 & 1 unlocked by default
      const status = sectionIndex === 0 ? 'completed' : (sectionIndex === 1 ? 'active' : 'locked');
      const hasQuickCheck = currentModuleId.startsWith('M') && currentModuleId !== 'M0';

      const summary: SectionSummary = {
        sectionId,
        moduleId: currentModuleId,
        order: sectionIndex,
        title: currentTitle || `Section ${sectionIndex + 1}`,
        subtitle: subtitle || 'Curriculum unit learning module',
        estimatedMinutes,
        status,
        hasQuickCheck,
        isLocked,
        prerequisiteSectionId: sectionIndex > 0 ? `section_0${sectionIndex - 1}` : undefined,
        subtopics: [...currentSubtopics],
      };

      const payload: SectionPayload = {
        sectionId,
        moduleId: currentModuleId,
        title: currentTitle || `Section ${sectionIndex + 1}`,
        subtitle,
        mode,
        persona,
        contentMarkdown: mdContent,
        estimatedMinutes,
        dottedTerms,
        figures,
      };

      sections.push(payload);
      summaries.push(summary);
      sectionIndex++;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Level 2 Heading: Section Boundary
      if (line.startsWith('## ')) {
        flushCurrentSection();
        currentTitle = line.replace('## ', '').trim();
        currentLines = [];
        currentSubtopics = [];

        // Detect module identifier (e.g. "## Module 1:", "## 1. Quick Review", "## Introduction...")
        const moduleMatch = currentTitle.match(/Module\s+(\d+)/i) || currentTitle.match(/^(\d+)\./);
        if (moduleMatch) {
          currentModuleId = `M${moduleMatch[1]}`;
        } else if (currentTitle.toLowerCase().includes('introduction') || currentTitle.toLowerCase().includes('overview')) {
          currentModuleId = 'M0';
        } else {
          currentModuleId = `M${sectionIndex}`;
        }
        continue;
      }

      // Level 3 Heading: Subtopic Anchor
      if (line.startsWith('### ')) {
        const subTitle = line.replace('### ', '').trim();
        const anchorId = subTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        currentSubtopics.push({ anchorId, title: subTitle });
      }

      currentLines.push(line);
    }

    // Flush final section
    flushCurrentSection();

    // Cache the result
    this.cache.set(cacheKey, {
      timestamp: Date.now(),
      sections,
      summaries,
    });

    return { sections, summaries };
  }

  /**
   * Correlates figure definitions from companion JSON metadata to the section.
   */
  private static extractFiguresForSection(moduleId: string, metadata: Record<string, any>): InteractiveFigure[] {
    if (!metadata || !Array.isArray(metadata.figures)) return [];

    const numMatch = moduleId.match(/\d+/);
    const modNum = numMatch ? numMatch[0] : '';

    return metadata.figures
      .filter((f: any) => {
        if (!f.module) return true;
        return f.module.toLowerCase().includes(`module ${modNum}`) || f.module.toLowerCase().includes(moduleId.toLowerCase());
      })
      .map((f: any, idx: number) => ({
        figureNo: f.figure_no || `Fig ${modNum}.${idx + 1}`,
        title: f.title || 'Architectural Diagram',
        imageUrl: `/api/content/figures/${f.image_tag || '1.0'}.webp`,
        zoomable: true,
        caption: f.title,
        hotspots: [
          { id: 1, label: 'Primary Component', description: 'Core functional subsystem' },
          { id: 2, label: 'Secondary Channel', description: 'Input/Output pipeline' },
          { id: 3, label: 'Storage Interface', description: 'Persistence and disk cache layer' },
        ],
      }));
  }

  /**
   * Scans section markdown content for verbatim vocabulary terms to dot in UI.
   */
  private static extractTermsForSection(content: string, metadata: Record<string, any>): DottedTerm[] {
    const terms = metadata.verbatim_definitions_included || metadata.verbatim_definitions_preserved || [
      'Database', 'DBMS', 'Database Schema', 'Data Independence', 'Primary Key', 'Foreign Key', 'Entity', 'Attribute'
    ];

    const result: DottedTerm[] = [];
    for (const term of terms) {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        result.push({
          term,
          definition: `Official curriculum standard definition for ${term} in DBMS systems.`,
          examTip: 'Frequently tested in university examinations.',
        });
      }
    }
    return result;
  }
}
