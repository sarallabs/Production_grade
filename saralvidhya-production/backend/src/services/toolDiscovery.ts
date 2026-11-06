import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try standard relative paths from src/services/ or dist/services/
const CONTRACT_PATHS = [
  path.resolve(__dirname, '../../../contract/v1/tools.json'),
  path.resolve(__dirname, '../../contract/v1/tools.json'),
  path.resolve(process.cwd(), 'contract/v1/tools.json'),
  path.resolve(process.cwd(), '../contract/v1/tools.json'),
];


export interface ToolDef {
  id: string;
  section: string;
  label: string;
  order: number;
  hidden?: boolean;
  patterns: string[];
}

export interface ToolsContract {
  contractVersion: string;
  params: Record<string, string[]>;
  tools: ToolDef[];
  assets?: Record<string, any>;
  chapterMetaFiles?: string[];
}

let cachedContract: ToolsContract | null = null;
let cachedMatchers: Array<{ id: string; regex: RegExp }> | null = null;

export function loadToolsContract(): ToolsContract {
  if (cachedContract) return cachedContract;

  for (const p of CONTRACT_PATHS) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedContract = JSON.parse(raw);
        return cachedContract!;
      } catch (err) {
        console.error(`[ToolsContract] Failed to read ${p}:`, err);
      }
    }
  }

  throw new Error('Unable to find contract/v1/tools.json. Searched paths: ' + CONTRACT_PATHS.join(', '));
}

function compilePattern(pattern: string, params: Record<string, string[]>): RegExp {
  let out = '';
  let pos = 0;
  const regex = /\{(\w+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(pattern)) !== null) {
    out += escapeRegex(pattern.substring(pos, match.index));
    const paramName = match[1];
    const allowed = params[paramName];
    if (allowed && allowed.length > 0) {
      out += `(${allowed.map(escapeRegex).join('|')})`;
    } else {
      out += `([A-Za-z0-9_-]+)`;
    }
    pos = match.index + match[0].length;
  }
  out += escapeRegex(pattern.substring(pos));
  return new RegExp(`^${out}$`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMatchers(): Array<{ id: string; regex: RegExp }> {
  if (cachedMatchers) return cachedMatchers;
  const contract = loadToolsContract();
  const params: Record<string, string[]> = { ...contract.params };
  const allowedAudio = contract.assets?.allowedAudio || ['m4a', 'mp3'];
  params['ext'] = allowedAudio;

  const matchers: Array<{ id: string; regex: RegExp }> = [];
  for (const tool of contract.tools) {
    for (const pat of tool.patterns) {
      matchers.push({
        id: tool.id,
        regex: compilePattern(pat, params),
      });
    }
  }

  cachedMatchers = matchers;
  return cachedMatchers;
}

/**
 * Given a list of chapter-relative file paths (e.g. ['read/quick/beginner.md', 'practice/mcq/easy.json']),
 * detects all active tools according to tools.json.
 * Returns a dictionary of active tool IDs with metadata.
 */
export function detectTools(chapterRelativeFiles: string[]): Record<string, { id: string; section: string; label: string; order: number }> {
  const matchers = getMatchers();
  const contract = loadToolsContract();
  const toolDefs = new Map<string, ToolDef>();
  for (const t of contract.tools) {
    toolDefs.set(t.id, t);
  }

  const detected: Record<string, { id: string; section: string; label: string; order: number }> = {};

  for (const file of chapterRelativeFiles) {
    for (const m of matchers) {
      if (m.regex.test(file)) {
        const def = toolDefs.get(m.id);
        if (def && !def.hidden) {
          detected[def.id] = {
            id: def.id,
            section: def.section,
            label: def.label,
            order: def.order,
          };
        }
        break;
      }
    }
  }

  return detected;
}
