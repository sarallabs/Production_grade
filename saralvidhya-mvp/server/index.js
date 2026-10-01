import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { watch } from 'fs';
import { exec } from 'child_process';
import { 
  getGitHubResourceTree, 
  getGitHubFileContent, 
  commitGitHubFile, 
  createGitHubBranch, 
  createGitHubPR,
  getFileSHA
} from './githubHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
import apiProxyRouter from './apiProxy.js';

// Root dir is public/generated_resources
const rootDir = path.join(__dirname, '../public/generated_resources');

// Mount proxy routes
app.use('/api/proxy', apiProxyRouter);

// Helper to safely get path
function getSafePath(reqPath) {
  const safePath = path.normalize(reqPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(rootDir, safePath);
}

// Build file tree
async function buildTree(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const tree = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // skip hidden files like .DS_Store
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        tree.push({
          type: 'directory',
          name: entry.name,
          path: relativePath,
          children: await buildTree(fullPath)
        });
      } else {
        tree.push({
          type: 'file',
          name: entry.name,
          path: relativePath
        });
      }
    }
    return tree;
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(rootDir, { recursive: true });
      return [];
    }
    throw err;
  }
}

app.get('/api/resources/tree', async (req, res) => {
  try {
    if (process.env.GITHUB_PAT) {
      console.log('[API] Loading tree from GitHub...');
      const tree = await getGitHubResourceTree();
      return res.json(tree);
    }
    const tree = await buildTree(rootDir);
    res.json(tree);
  } catch (err) {
    console.error('[API] Error in /api/resources/tree:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources/file', async (req, res) => {
  try {
    const filePath = req.body.path;
    if (!filePath) return res.status(400).json({ error: 'Missing path parameter' });
    
    if (process.env.GITHUB_PAT) {
      console.log(`[API] Loading file content from GitHub: ${filePath}`);
      const content = await getGitHubFileContent(`public/generated_resources/${filePath}`);
      return res.send(content);
    }

    const absolutePath = getSafePath(filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    res.send(content);
  } catch (err) {
    console.error('[API] Error in /api/resources/file:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources/save', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'Missing path or content' });
    }
    
    if (process.env.GITHUB_PAT) {
      const fullPath = `public/generated_resources/${filePath}`;
      const targetBranch = process.env.GITHUB_TARGET_BRANCH || 'abhi';
      const autoPR = process.env.GITHUB_AUTO_PR === 'true';
      
      console.log(`[API] Saving file content to GitHub (Branch: ${targetBranch}, Auto-PR: ${autoPR}): ${filePath}`);

      if (autoPR) {
        const timestamp = Date.now();
        const filename = filePath.split('/').pop().replace(/[^a-zA-Z0-9.-]/g, '_');
        const newBranch = `expert/update-${filename}-${timestamp}`;
        
        console.log(`[API] Creating new branch: ${newBranch}`);
        await createGitHubBranch(newBranch, targetBranch);
        
        console.log(`[API] Committing to branch: ${newBranch}`);
        await commitGitHubFile(fullPath, content, newBranch);
        
        console.log(`[API] Creating Pull Request...`);
        const prTitle = `content(expert): update ${filePath.split('/').pop()}`;
        const prBody = `This PR contains updates to the resource file:\n\`${filePath}\`\n\nSubmitted via the Expert Panel.`;
        const pr = await createGitHubPR(prTitle, newBranch, targetBranch, prBody);
        
        return res.json({ 
          success: true, 
          branch: newBranch, 
          prNumber: pr.number, 
          prUrl: pr.html_url,
          prCreated: true
        });
      } else {
        await commitGitHubFile(fullPath, content, targetBranch);
        return res.json({ success: true, branch: targetBranch, prCreated: false });
      }
    }

    const absolutePath = getSafePath(filePath);
    await fs.writeFile(absolutePath, content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Error in /api/resources/save:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources/create-file', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Missing path parameter' });
    
    const allowedExtensions = ['.md', '.json', '.txt', '.html', '.pdf', '.csv'];
    const ext = path.extname(filePath).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return res.status(400).json({
        error: 'Only .md, .json, .txt, .html, .pdf, and .csv files are allowed.'
      });
    }

    if (process.env.GITHUB_PAT) {
      const fullPath = `public/generated_resources/${filePath}`;
      const targetBranch = process.env.GITHUB_TARGET_BRANCH || 'abhi';
      
      console.log(`[API] Creating file on GitHub: ${filePath}`);
      const sha = await getFileSHA(fullPath, targetBranch);
      if (sha) {
        return res.status(400).json({ error: 'File already exists' });
      }
      
      await commitGitHubFile(fullPath, '', targetBranch, `content(expert): create file ${filePath}`);
      return res.json({ success: true });
    }

    const absolutePath = getSafePath(filePath);
    // Check if it already exists
    try {
      await fs.access(absolutePath);
      return res.status(400).json({ error: 'File already exists' });
    } catch (e) {
      // File doesn't exist, proceed
    }
    
    await fs.writeFile(absolutePath, '', 'utf-8');
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Error in /api/resources/create-file:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources/create-directory', async (req, res) => {
  try {
    const { path: dirPath } = req.body;
    if (!dirPath) return res.status(400).json({ error: 'Missing path parameter' });
    
    if (process.env.GITHUB_PAT) {
      const targetBranch = process.env.GITHUB_TARGET_BRANCH || 'abhi';
      const keepPath = `public/generated_resources/${dirPath}/.gitkeep`;
      
      console.log(`[API] Creating directory on GitHub (via .gitkeep): ${dirPath}`);
      await commitGitHubFile(keepPath, '', targetBranch, `content(expert): create directory ${dirPath}`);
      return res.json({ success: true });
    }

    const absolutePath = getSafePath(dirPath);
    await fs.mkdir(absolutePath, { recursive: true });
    res.json({ success: true });
  } catch (err) {
    console.error('[API] Error in /api/resources/create-directory:', err);
    res.status(500).json({ error: err.message });
  }
});

// Automatically watch generated_resources for any file changes and regenerate the manifests
function startFolderWatcher() {
  let debounceTimeout = null;
  const generateManifestScript = path.join(__dirname, '../scripts/generate-manifest.js');
  const buildLargeFilesScript = path.join(__dirname, '../scripts/build-large-files-manifest.cjs');

  function regenerateManifests() {
    console.log('[Watcher] Regenerating manifests...');
    
    // 1. Run generate-manifest.js
    exec(`node "${generateManifestScript}"`, (err, stdout, stderr) => {
      if (err) {
        console.error(`[Watcher] Error running generate-manifest: ${err.message}`);
        return;
      }
      console.log(`[Watcher] generate-manifest: ${stdout.trim()}`);
      
      // 2. Run build-large-files-manifest.cjs
      exec(`node "${buildLargeFilesScript}"`, (err2, stdout2, stderr2) => {
        if (err2) {
          console.error(`[Watcher] Error running build-large-files-manifest: ${err2.message}`);
          return;
        }
        console.log(`[Watcher] build-large-files-manifest: ${stdout2.trim()}`);
      });
    });
  }

  try {
    console.log(`[Watcher] Starting file watcher for ${rootDir}`);
    watch(rootDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      const normalizedFilename = filename.replace(/\\/g, '/');
      
      // Ignore manifest files and hidden files to avoid recursive loops
      if (
        normalizedFilename === 'manifest.json' || 
        normalizedFilename === 'large-files-manifest.json' ||
        normalizedFilename.endsWith('/manifest.json') ||
        normalizedFilename.endsWith('/large-files-manifest.json') ||
        normalizedFilename.startsWith('.')
      ) {
        return;
      }

      console.log(`[Watcher] Change detected: ${eventType} in ${normalizedFilename}`);

      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        regenerateManifests();
      }, 1000); // 1s debounce
    });
  } catch (err) {
    console.error(`[Watcher] Failed to start folder watcher: ${err.message}`);
  }
}

const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Expert Admin API running on http://127.0.0.1:${PORT}`);
  startFolderWatcher();
});
