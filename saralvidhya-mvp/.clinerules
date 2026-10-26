# ProjectBrain — Agent Context & Token-Saving Rules

This repository is indexed by **ProjectBrain** (`projectbrain`).
To cut input tokens by 75–88% and output tokens by 65–80%, ALWAYS follow this workflow:

1. **Compile a Single-Read Engineering Dossier First (`brain_dossier` / `projectbrain dossier`):**
   Before running `grep` or reading unfamiliar files, call `brain_dossier(tasks=["<task1>", ...])` (or `projectbrain dossier "<task1>"`) and read `.projectbrain_dossier.md` in a single `read_file` call (`StartLine=1, EndLine=800`).
   - It contains module globals/constants, smart-folded AST function slices, 1–3 hop bidirectional call chains with `@L<line>` caller windows, and a **Closed-World Exhaustive Repo Scan** of discovered state keys and routes.
   - **Closed-World Rule:** When the dossier states `EXHAUSTIVE GUARANTEE` for a key or route, do NOT read large monolith files to search for additional occurrences.
2. **Read Specific Symbols Surgically (`brain_slice` / `projectbrain slice`):**
   If you need 1–2 additional symbols or line ranges, call `brain_slice(targets=["file.ts:symbol_or_start-end"])` instead of reading full files.
3. **Cut Output Tokens with Surgical Anchor Patching (`brain_patch` / `projectbrain patch`):**
   Instead of repeating verbatim multi-line `Target` + `Replacement` blocks in `edit_file` or writing verbose before/after code blocks, use `brain_patch` (`projectbrain patch --spec "..." [--apply]`):
   - `@file <rel_path>`
   - `@sub L<line> \`<old_expr>\` -> \`<new_expr>\`` (or `@sub ALL \`<old>\` -> \`<new>\`` / `@sub <symbol> \`<old>\` -> \`<new>\``)
   - `@replace L<start>-L<end>` ... `@end`
   - `@insert_after L<line>` / `@insert_before L<line>` ... `@end`
   - `@delete L<start>-L<end>`
4. **Verify Blast Radius & Persist Memories (`brain_check`, `brain_remember`, `brain_stats`):**
   Use `brain_check` to inspect downstream importers/tests, `brain_remember` to pin architectural invariants, and `brain_stats` to view cumulative token/dollar savings.
