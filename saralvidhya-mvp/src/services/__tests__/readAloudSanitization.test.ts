import { describe, it, expect } from "vitest";
import { stripMarkdown, preprocessSummaryText } from "@/components/study/ReadAloudBar";

describe("stripMarkdown and preprocessSummaryText Sanitization", () => {
  it("removes Persona, D_target, and Word count metadata headers", () => {
    const raw = `### Persona: Intermediate | D_target: 5 | Word Count: ~918\n\nDatabase systems manage data safely.\n\n*Persona: Intermediate | D_target: 5 | 37 visual refs*`;
    const clean = stripMarkdown(raw);
    expect(clean).not.toContain("Persona");
    expect(clean).not.toContain("D_target");
    expect(clean).not.toContain("Word Count");
    expect(clean).toBe("Database systems manage data safely.");
  });

  it("removes YAML frontmatter at the top of markdown documents", () => {
    const raw = `---\ntitle: DBMS Overview\nunit: 1\n---\n\nRelational algebra defines query operations.`;
    const clean = stripMarkdown(raw);
    expect(clean).not.toContain("title:");
    expect(clean).not.toContain("unit: 1");
    expect(clean).toBe("Relational algebra defines query operations.");
  });

  it("cleans markdown tables without leaving divider colons or pipes", () => {
    const raw = `| Concept | Remedy |\n| :--- | :--- |\n| Data Redundancy | Centralized Normalization |`;
    const clean = stripMarkdown(raw);
    // Divider row should be completely removed, no stray colons
    expect(clean).not.toContain("---");
    expect(clean).not.toContain(":");
    expect(clean).not.toContain("|");
    expect(clean).toContain("Concept");
    expect(clean).toContain("Remedy");
    expect(clean).toContain("Data Redundancy");
    expect(clean).toContain("Centralized Normalization");
  });

  it("removes embedded base64 images and html tags", () => {
    const raw = `<figure><img src="data:image/webp;base64,UklGRvrhAwBXRUJQVlA4IO7hAwBQuw+dASrACgAGPm0ylUgkIq4lo7IrscANiWdLmXQD3nc5dX/k" /></figure>\n\nSafe database design minimizes redundancy.`;
    const clean = stripMarkdown(raw);
    expect(clean).not.toContain("data:image");
    expect(clean).not.toContain("figure");
    expect(clean).toBe("Safe database design minimizes redundancy.");
  });
});
