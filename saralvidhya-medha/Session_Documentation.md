# SaralVidhya MVP - Session Documentation & Bug Fix Report

**Date:** June 23, 2026
**Subject:** Frontend bug fixes, TinyMCE configuration, and AI-generated Markdown content patching.

---

## 1. TinyMCE API Key Configuration
**Goal:** Securely add the TinyMCE API key for the `ExpertPanel` without hardcoding it in the repository.
**Action Taken:** 
- Configured Vite to read the API key from the `.env.local` file using the `VITE_TINYMCE_API_KEY` environment variable.
- Verified that during the Cloudflare deployment process (which uses `vite build`), the environment variables present in the local `.env.local` file are automatically baked into the final static build.

## 2. YouTube Video Embedding
**Goal:** Embed a YouTube video into the first chapter of the MBA Management course.
**Action Taken:**
- Located the `video_script.md` files for Chapter 1 (Beginner, Intermediate, and Advanced).
- Injected a responsive HTML `<iframe>` block at the top of the markdown files to seamlessly embed the provided YouTube video.

## 3. Markdown Table Rendering Fix
**Goal:** Fix tables that were appearing as raw text instead of rendering properly.
**Root Cause:** The `ReactMarkdown` component in `MarkdownView.tsx` was lacking the `remark-gfm` (GitHub Flavored Markdown) plugin, which is strictly required to parse markdown tables.
**Action Taken:**
- Installed the `remark-gfm` package.
- Updated `MarkdownView.tsx` to include `remark-gfm` in the `remarkPlugins` array.
- *Future Prevention:* Ensure that any new markdown rendering components in the future always include `remark-gfm` if tables, strikethrough, or autolinks are expected.

## 4. LaTeX vs Table Rendering Conflict
**Goal:** Ensure LaTeX formulas and tables render simultaneously.
**Root Cause:** When `remark-gfm` was added, it conflicted with `remark-math` because the order of plugins in the array matters. 
**Action Taken:**
- Reordered the plugins so that `remark-math` and `remark-gfm` play nicely together.
- *Future Prevention:* Always test mathematical formulas whenever modifying markdown parsing libraries, as they often conflict over special characters like `|` or `$`.

## 5. Mindmap Node Click Handling
**Goal:** Fix the issue where clicking on "Shopping Goods" or parent nodes like "Consumer Goods Categories" in the Mindmap did not open the content modal.
**Root Cause:** In `StudyTable.tsx`, the `onTopicClick` handler was hardcoded to only trigger if the node ID started with `"concept_"`. Clicking on parent nodes (which have IDs starting with `"subtopic_"` or `"topic_"`) was completely ignored by the logic.
**Action Taken:**
- Updated the `if` condition in `StudyTable.tsx` to check for `nodeId.startsWith('concept_') || nodeId.startsWith('subtopic_') || nodeId.startsWith('topic_')`.
- Updated the data-fetching `useEffect` to accommodate fetching markdown files for all three levels of nodes.
- *Future Prevention:* When adding new hierarchical levels to the data structures (like topics/subtopics), ensure the UI event handlers are updated to recognize the new ID prefixes.

## 6. AI Content Generation Bug (LaTeX Syntax)
**Goal:** Fix LaTeX equations appearing as raw text in the frontend (e.g., `Sales Conversion Rate = \frac{...}`).
**Root Cause:** The AI that originally generated the markdown content files occasionally forgot to place an opening `$` sign before LaTeX equations, specifically those starting with `\frac`. Without the opening `$`, the `remark-math` engine could not recognize it as an equation.
**Action Taken:**
- Wrote a Node.js script (`scripts/fix_latex.cjs`) to recursively scan over 2,500 markdown files in the `public/generated_resources` directory.
- Found 392 occurrences of `= \frac` missing a preceding `$`.
- Wrote a secondary revert script (`scripts/fix_latex_revert.cjs`) to safely roll back injections where the math block was *already opened* by a variable name earlier in the line (e.g., `$RMS = \frac`).
- Successfully patched the 138 files that legitimately had this generation error (across Physics, Chemistry, Biology, and MBA courses).
- *Future Prevention:* Update the system prompts for the AI content generator to heavily emphasize valid LaTeX syntax. Consider adding a post-generation validation step in your python/node generator scripts to check for unclosed `$` blocks or naked `\frac` strings.
