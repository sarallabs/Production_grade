const fs = require('fs');
const path = require('path');

const MASTERMINDS_MINDMAP_MAP = {
  advanced_financial_management: {
    1:  { folder: 'derivate_futures', prefix: 'futures' },
    2:  { folder: 'options',          prefix: 'options' },
    15: { folder: 'mutual_funds',     prefix: 'mutual_funds' },
  },
  management: {
    1: { prefix: 'ch1', baseTemplate: 'anu/chapter_1/{level}' },
    2: { prefix: 'ch2', baseTemplate: 'anu/chapter_2/{level}' },
  },
  anu_physics: {
    4: { prefix: 'aqm_ch4', baseTemplate: 'chapter_04/{level}' },
  },
  anu_characterization: {
    5: { prefix: 'characterization', baseTemplate: 'chapter_05/{level}' },
  },
};

const DEFAULT_SUBJECT_PATHS = {
  advanced_financial_management: 'master_minds/ca_final/advanced_financial_management',
  management: 'Nagarjuna_University/MBA',
  anu_physics: 'Nagarjuna_University/physics',
  anu_characterization: 'Nagarjuna_University/physics',
};

const LEVELS = ['beginner', 'intermediate', 'advanced'];

function getChapterDir(subjectPath, chapterNum) {
  if (!fs.existsSync(subjectPath)) return null;
  const dirs = fs.readdirSync(subjectPath);
  const padNum = String(chapterNum).padStart(2, '0');
  const candidates = [
    `chapter_${chapterNum}`,
    `chapter_${padNum}`,
  ];
  for (const cand of candidates) {
    if (dirs.includes(cand)) return cand;
  }
  for (const d of dirs) {
    if (d.startsWith(`chapter_${padNum}`) || d.startsWith(`chapter_${chapterNum}`)) {
      return d;
    }
  }
  return null;
}

function topicFileExists(subjectPath, entry, topicN) {
  for (const level of LEVELS) {
    let levelDir;
    if (entry.baseTemplate) {
      levelDir = path.join(subjectPath, entry.baseTemplate.replace('{level}', level));
    } else {
      levelDir = path.join(subjectPath, 'mindmaps-masterminds/mindmaps', entry.folder, level);
    }
    const topicFile = path.join(levelDir, `topic_${entry.prefix}_${topicN}.md`);
    if (fs.existsSync(topicFile)) return true;
  }
  return false;
}

function subtopicFileExists(subjectPath, entry, subtopicN) {
  for (const level of LEVELS) {
    let levelDir;
    if (entry.baseTemplate) {
      levelDir = path.join(subjectPath, entry.baseTemplate.replace('{level}', level));
    } else {
      levelDir = path.join(subjectPath, 'mindmaps-masterminds/mindmaps', entry.folder, level);
    }
    const subtopicFile = path.join(levelDir, `subtopic_${entry.prefix}_${subtopicN}.md`);
    if (fs.existsSync(subtopicFile)) return true;
  }
  return false;
}

function parseSections(raw) {
  const title = (raw.match(/^# (.+)$/m) ?? [])[1]?.trim() ?? '';
  const pageRef = (raw.match(/\*\*Reference:\*\*\s*([^\n]+)/) ?? [])[1]?.trim() ?? '';
  const summary = (raw.match(/###[^\n]*Summary[^\n]*\n([\s\S]*?)(?=\n###|\n---|\n## )/) ?? [])[1]?.trim() ?? '';
  const detailed = (raw.match(/###[^\n]*Detailed[^\n]*\n([\s\S]*?)(?=\n###|\n---|\n## )/) ?? [])[1]?.trim() ?? '';
  const flashcards = (raw.match(/###[^\n]*Flashcard[^\n]*\n([\s\S]*?)(?=\n## |\n\s*---\s*\n)/) ?? [])[1]?.trim() ?? '';
  return { title, pageRef, summary, detailed, flashcards };
}

// 1. Process Masterminds (JSON and markdown consolidation)
for (const [subjectId, chapters] of Object.entries(MASTERMINDS_MINDMAP_MAP)) {
  const subjectPath = path.join(__dirname, '../public/generated_resources', DEFAULT_SUBJECT_PATHS[subjectId]);
  
  for (const [chNumStr, entry] of Object.entries(chapters)) {
    const chNum = parseInt(chNumStr, 10);
    const chDir = getChapterDir(subjectPath, chNum);
    if (!chDir) {
      console.log(`[Warning] Chapter directory for ${subjectId} Chapter ${chNum} not found.`);
      continue;
    }
    
    const mindmapJsonPath = path.join(subjectPath, chDir, 'mindmap.json');
    if (!fs.existsSync(mindmapJsonPath)) {
      console.log(`[Warning] mindmap.json not found at ${mindmapJsonPath}`);
      continue;
    }
    
    console.log(`Processing Masterminds: ${subjectId} Chapter ${chNum}`);
    
    const mindmapTree = JSON.parse(fs.readFileSync(mindmapJsonPath, 'utf8'));
    
    // Assign IDs if missing in mindmapTree
    (mindmapTree.children || []).forEach((topic, i) => {
      const topicIndex = i + 1;
      if (!topic.id) topic.id = `topic_${topicIndex}`;
      
      const children = topic.children || [];
      const hasSubtopics = children.length > 0 && (children[0].children || children.length > 1 || children[0].id?.startsWith('subtopic_'));
      
      if (hasSubtopics) {
        children.forEach((subtopic, j) => {
          const subtopicIndex = j + 1;
          if (!subtopic.id) subtopic.id = `subtopic_${topicIndex}.${subtopicIndex}`;
        });
      }
    });
    
    // For each difficulty level
    for (const level of LEVELS) {
      let levelDir;
      if (entry.baseTemplate) {
        levelDir = path.join(subjectPath, entry.baseTemplate.replace('{level}', level));
      } else {
        levelDir = path.join(subjectPath, 'mindmaps-masterminds/mindmaps', entry.folder, level);
      }
      
      if (!fs.existsSync(levelDir)) {
        console.log(`  [Info] Level directory ${levelDir} not found, skipping level.`);
        continue;
      }
      
      // Process each Topic in the mindmap
      for (const topic of mindmapTree.children || []) {
        const topicId = topic.id;
        const topicN = topicId.replace(/^topic_/, '');
        
        const children = topic.children || [];
        const hasSubtopics = children.length > 0 && children[0].id.startsWith('subtopic_');
        
        if (hasSubtopics) {
          // Scenario 1: Topic has subtopics. Consolidate concepts into subtopic files, then subtopics into topic files
          const subtopicMergedSummaryList = [];
          const subtopicMergedDetailedList = [];
          const subtopicMergedFlashcardList = [];
          const subtopicMergedDeepDiveList = [];
          
          for (const subtopic of children) {
            const subtopicId = subtopic.id;
            const subtopicN = subtopicId.replace(/^subtopic_/, '');
            
            // Read subtopic file to find concept links dynamically
            const subtopicInPath = path.join(levelDir, `subtopic_${entry.prefix}_${subtopicN}.md`);
            if (!fs.existsSync(subtopicInPath)) {
              console.log(`  [Warning] Subtopic file ${subtopicInPath} not found.`);
              continue;
            }
            
            const subtopicRawContent = fs.readFileSync(subtopicInPath, 'utf8');
            const conceptRegex = new RegExp(`concept_${entry.prefix}_([^\\.\\/\\s\\)]+)\\.md`, 'g');
            const conceptSuffixes = [];
            let match;
            while ((match = conceptRegex.exec(subtopicRawContent)) !== null) {
              conceptSuffixes.push(match[1]);
            }
            
            const conceptSummaries = [];
            const conceptDetaileds = [];
            const conceptFlashcards = [];
            const conceptDeepDives = [];
            let subtopicPageRefs = new Set();
            
            for (const cSuffix of conceptSuffixes) {
              const conceptFile = path.join(levelDir, `concept_${entry.prefix}_${cSuffix}.md`);
              if (fs.existsSync(conceptFile)) {
                const raw = fs.readFileSync(conceptFile, 'utf8');
                const sections = parseSections(raw);
                if (sections.pageRef) subtopicPageRefs.add(sections.pageRef);
                
                conceptSummaries.push(`#### 🔸 ${sections.title || cSuffix}\n${sections.summary}`);
                conceptDetaileds.push(`#### 🔸 ${sections.title || cSuffix}\n${sections.detailed}`);
                if (sections.flashcards) {
                  conceptFlashcards.push(sections.flashcards);
                }
              }
              
              const ddFile = path.join(levelDir, `deep_dive_${entry.prefix}_${cSuffix}.md`);
              if (fs.existsSync(ddFile)) {
                const rawDd = fs.readFileSync(ddFile, 'utf8');
                const cleanDd = rawDd.replace(/^# .*\n+/m, '').trim();
                const conceptTitle = fs.existsSync(conceptFile) ? parseSections(fs.readFileSync(conceptFile, 'utf8')).title : cSuffix;
                conceptDeepDives.push(`#### 🔸 ${conceptTitle}\n${cleanDd}`);
              }
            }
            
            // Build subtopic content
            const subtopicSummary = conceptSummaries.join('\n\n');
            const subtopicDetailed = conceptDetaileds.join('\n\n');
            const subtopicFlashcards = conceptFlashcards.join('\n\n');
            const subtopicPageRefStr = Array.from(subtopicPageRefs).join(', ');
            
            let subtopicContent = [
              `# Sub-Topic ${subtopicN}: ${subtopic.name}`,
              subtopicPageRefStr ? `> **Reference:** ${subtopicPageRefStr}` : '',
              '---',
              '### 📋 Summary View',
              subtopicSummary,
              '---',
              '### 🔍 Detailed View',
              subtopicDetailed,
              '---',
              '### 🎴 Flashcards',
              subtopicFlashcards
            ].filter(p => p !== '').join('\n\n');
            
            if (conceptSuffixes.length > 0) {
              subtopicContent += `\n\n<!-- CONCEPTS: ${conceptSuffixes.map(s => `./concept_${entry.prefix}_${s}.md`).join(', ')} -->`;
            }
            
            // Save subtopic file (overwriting navigation file)
            fs.writeFileSync(subtopicInPath, subtopicContent, 'utf8');
            
            // Build deep dive content if any
            if (conceptDeepDives.length > 0) {
              const ddContent = `# Deep Dive: ${subtopic.name}\n\n${conceptDeepDives.join('\n\n')}`;
              const ddOutPath = path.join(levelDir, `deep_dive_${entry.prefix}_${subtopicN}.md`);
              fs.writeFileSync(ddOutPath, ddContent, 'utf8');
              subtopicMergedDeepDiveList.push(`### 🔹 Sub-topic: ${subtopic.name}\n\n${ddContent.replace(/^# .*\n+/m, '')}`);
            }
            
            // Collect for topic consolidation
            subtopicMergedSummaryList.push(`### 🔹 Sub-topic: ${subtopic.name}\n\n${subtopicSummary}`);
            subtopicMergedDetailedList.push(`### 🔹 Sub-topic: ${subtopic.name}\n\n${subtopicDetailed}`);
            if (subtopicFlashcards) subtopicMergedFlashcardList.push(subtopicFlashcards);
          }
          
          // Build topic content
          const topicContent = [
            `# Topic ${topicN}: ${topic.name}`,
            '---',
            '### 📋 Summary View',
            subtopicMergedSummaryList.join('\n\n'),
            '---',
            '### 🔍 Detailed View',
            subtopicMergedDetailedList.join('\n\n'),
            '---',
            '### 🎴 Flashcards',
            subtopicMergedFlashcardList.join('\n\n')
          ].join('\n\n');
          
          const topicOutPath = path.join(levelDir, `topic_${entry.prefix}_${topicN}.md`);
          fs.writeFileSync(topicOutPath, topicContent, 'utf8');
          
          if (subtopicMergedDeepDiveList.length > 0) {
            const topicDdContent = `# Deep Dive: ${topic.name}\n\n${subtopicMergedDeepDiveList.join('\n\n')}`;
            const topicDdOutPath = path.join(levelDir, `deep_dive_${entry.prefix}_${topicN}.md`);
            fs.writeFileSync(topicDdOutPath, topicDdContent, 'utf8');
          }
        } else {
          // Scenario 2: Topic has no subtopics. Find concepts directly from the topic file
          const topicFile = path.join(levelDir, `topic_${entry.prefix}_${topicN}.md`);
          if (!fs.existsSync(topicFile)) {
            console.log(`  [Warning] Topic file ${topicFile} not found.`);
            continue;
          }
          
          const topicRawContent = fs.readFileSync(topicFile, 'utf8');
          const conceptRegex = new RegExp(`concept_${entry.prefix}_([^\\.\\/\\s\\)]+)\\.md`, 'g');
          const conceptSuffixes = [];
          let match;
          while ((match = conceptRegex.exec(topicRawContent)) !== null) {
            conceptSuffixes.push(match[1]);
          }
          
          const conceptSummaries = [];
          const conceptDetaileds = [];
          const conceptFlashcards = [];
          const conceptDeepDives = [];
          let topicPageRefs = new Set();
          
          for (const cSuffix of conceptSuffixes) {
            const conceptFile = path.join(levelDir, `concept_${entry.prefix}_${cSuffix}.md`);
            if (fs.existsSync(conceptFile)) {
              const raw = fs.readFileSync(conceptFile, 'utf8');
              const sections = parseSections(raw);
              if (sections.pageRef) topicPageRefs.add(sections.pageRef);
              
              conceptSummaries.push(`#### 🔸 ${sections.title || cSuffix}\n${sections.summary}`);
              conceptDetaileds.push(`#### 🔸 ${sections.title || cSuffix}\n${sections.detailed}`);
              if (sections.flashcards) {
                conceptFlashcards.push(sections.flashcards);
              }
            }
            
            const ddFile = path.join(levelDir, `deep_dive_${entry.prefix}_${cSuffix}.md`);
            if (fs.existsSync(ddFile)) {
              const rawDd = fs.readFileSync(ddFile, 'utf8');
              const cleanDd = rawDd.replace(/^# .*\n+/m, '').trim();
              const conceptTitle = fs.existsSync(conceptFile) ? parseSections(fs.readFileSync(conceptFile, 'utf8')).title : cSuffix;
              conceptDeepDives.push(`#### 🔸 ${conceptTitle}\n${cleanDd}`);
            }
          }
          
          const topicPageRefStr = Array.from(topicPageRefs).join(', ');
          
          let topicContent = [
            `# Topic ${topicN}: ${topic.name}`,
            topicPageRefStr ? `> **Reference:** ${topicPageRefStr}` : '',
            '---',
            '### 📋 Summary View',
            conceptSummaries.join('\n\n'),
            '---',
            '### 🔍 Detailed View',
            conceptDetaileds.join('\n\n'),
            '---',
            '### 🎴 Flashcards',
            conceptFlashcards.join('\n\n')
          ].filter(p => p !== '').join('\n\n');
          
          if (conceptSuffixes.length > 0) {
            topicContent += `\n\n<!-- CONCEPTS: ${conceptSuffixes.map(s => `./concept_${entry.prefix}_${s}.md`).join(', ')} -->`;
          }
          
          fs.writeFileSync(topicFile, topicContent, 'utf8');
          
          if (conceptDeepDives.length > 0) {
            const ddContent = `# Deep Dive: ${topic.name}\n\n${conceptDeepDives.join('\n\n')}`;
            const ddOutPath = path.join(levelDir, `deep_dive_${entry.prefix}_${topicN}.md`);
            fs.writeFileSync(ddOutPath, ddContent, 'utf8');
          }
        }
      }
    }
    
    // Prune mindmap.json to only contain Topic & Subtopic levels (remove concept level)
    const filteredTopics = [];
    for (const topic of mindmapTree.children || []) {
      const topicId = topic.id;
      const topicN = topicId.replace(/^topic_/, '');
      
      // Keep topic only if corresponding file exists
      if (!topicFileExists(subjectPath, entry, topicN)) {
        continue;
      }
      
      const subtopics = topic.children || [];
      const isConceptList = subtopics.length > 0 && (subtopics[0].id.startsWith('concept_') || !subtopics[0].id.startsWith('subtopic_'));
      
      if (isConceptList) {
        filteredTopics.push({
          name: topic.name,
          id: topic.id
        });
      } else {
        // Filter subtopics based on file existence
        const filteredSubtopics = subtopics.filter(subtopic => {
          const subtopicN = subtopic.id.replace(/^subtopic_/, '');
          return subtopicFileExists(subjectPath, entry, subtopicN);
        });
        
        if (filteredSubtopics.length === 0) {
          filteredTopics.push({
            name: topic.name,
            id: topic.id
          });
        } else {
          filteredTopics.push({
            name: topic.name,
            id: topic.id,
            children: filteredSubtopics.map(subtopic => ({
              name: subtopic.name,
              id: subtopic.id
            }))
          });
        }
      }
    }

    const prunedTree = {
      name: mindmapTree.name,
      children: filteredTopics
    };
    
    fs.writeFileSync(mindmapJsonPath, JSON.stringify(prunedTree, null, 2), 'utf8');
    console.log(`  Successfully consolidated assets and pruned mindmap.json!`);
  }
}

// 2. Process Standard Subjects (mindmap.md level clamping)
const publicResourcesDir = path.join(__dirname, '../public/generated_resources');
function scanDirForMindmaps(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirForMindmaps(fullPath);
    } else if (entry.isFile() && entry.name === 'mindmap.md') {
      console.log(`Pruning standard mindmap: ${fullPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const prunedLines = [];
      for (const line of lines) {
        const match = line.match(/^(\s*)/);
        const indent = match ? match[1].length : 0;
        // In Mermaid mindmap:
        // mindmap (0 indent)
        //   root(...) (2 indent)
        //     topic (4 indent)
        //       sub-topic (6 indent)
        //         sub-sub-topic (8 indent) - remove this and deeper
        if (indent >= 8) continue;
        prunedLines.push(line);
      }
      fs.writeFileSync(fullPath, prunedLines.join('\n'), 'utf8');
    }
  }
}

console.log('\nScanning for standard subjects mindmap.md files...');
scanDirForMindmaps(publicResourcesDir);
console.log('Finished standard mindmap.md pruning!');
