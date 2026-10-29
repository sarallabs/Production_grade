import React, { useState, useMemo, useEffect } from "react";
import MarkdownView from "../MarkdownView";
import { cloudStorage } from "@/context/CloudStateContext";

export interface KeyTakeawaysViewProps {
  content: string;
  subjectId: string;
  subjectName?: string;
  chapterNumber: number;
  chapterName?: string;
  isPurpleTheme?: boolean;
}

interface SubBulletItem {
  prefix?: string;
  lead?: string;
  body: string;
  raw: string;
}

interface TakeawayItem {
  id: string;
  lead: string;
  body: string;
  summaryBody: string;
  extendedNote?: string;
  raw: string;
  subItems: SubBulletItem[];
  isHighYield: boolean;
  pyqBadge?: string;
  sectionTitle?: string;
  sectionIndex?: number;
}

interface TakeawaySection {
  id: string;
  index: number;
  title: string;
  subtitle?: string;
  items: TakeawayItem[];
}

interface ParsedTakeaways {
  title: string;
  scopeNote: string;
  sections: TakeawaySection[];
}

const HIGH_YIELD_PATTERNS = [
  /\bpyq\b/i,
  /\bfrequently\s+asked\b/i,
  /\bhigh[-\s]?yield\b/i,
  /\bexam\b/i,
  /\bcore\s+definition\b/i,
  /\bdefinition\b/i,
  /\bacid\b/i,
  /\b3nf\b/i,
  /\bbcnf\b/i,
  /\bnormal\s+form/i,
  /\bindependence\b/i,
  /\barchitecture\b/i,
  /\banomal(?:y|ies)\b/i,
  /\bdifference\b/i,
  /\bvs\.?\b/i,
  /\btheorem\b/i,
  /\bprinciple\b/i,
  /\bclassification\b/i,
  /\bmechanism\b/i,
  /\blifecycle\b/i,
  /\blife\s+cycle\b/i,
  /\bprimary\s+key\b/i,
  /\bforeign\s+key\b/i,
  /\bcandidate\s+key\b/i,
  /\bintegrity\b/i,
  /\bformula\b/i,
  /\blaw\b/i,
];

function deriveLeadFromBody(body: string, fallbackIndex: number): { lead: string; restBody: string } {
  const plain = body.replace(/\*+/g, "").trim();
  const colonIdx = plain.indexOf(":");
  if (colonIdx > 2 && colonIdx <= 48) {
    const candidateLead = plain.slice(0, colonIdx).trim();
    const rest = body.replace(/^[^:]+:\s*/, "").trim();
    if (candidateLead && rest) {
      return { lead: candidateLead, restBody: rest };
    }
  }
  const dashMatch = plain.match(/^([^—–\-]{3,42})\s+[—–\-]\s+([\s\S]+)$/);
  if (dashMatch) {
    return { lead: dashMatch[1].trim(), restBody: dashMatch[2].trim() };
  }
  const words = plain.split(/\s+/).slice(0, 4).join(" ").replace(/[.,;!?]+$/, "");
  return {
    lead: words || `Concept ${fallbackIndex}`,
    restBody: body,
  };
}

function splitLeadAndBody(text: string, fallbackIndex: number = 1): { lead: string; body: string } {
  const cleaned = text.trim();
  const match = cleaned.match(/^\*\*([^*]+?)\*\*\s*:?\s*([\s\S]*)$/);
  if (match) {
    const rawLead = match[1].replace(/:$/, "").trim();
    const rawBody = match[2].replace(/^:\s*/, "").trim();
    if (rawBody) {
      return { lead: rawLead, body: rawBody };
    }
  }
  const derived = deriveLeadFromBody(cleaned, fallbackIndex);
  return { lead: derived.lead, body: derived.restBody };
}

function splitSummaryAndExtended(body: string): { summaryBody: string; extendedNote?: string } {
  const trimmed = (body || "").trim();
  if (!trimmed) return { summaryBody: "" };

  const paragraphs = trimmed.split(/\n{2,}/);
  if (paragraphs.length > 1) {
    return {
      summaryBody: paragraphs[0].trim(),
      extendedNote: paragraphs.slice(1).join("\n\n").trim(),
    };
  }

  // If single paragraph is very long (> 260 chars), split cleanly after the first 1-2 sentences for preview
  if (trimmed.length > 260) {
    const sentenceMatch = trimmed.match(/^([\s\S]{110,230}?[.!?])(\s+[\s\S]+)$/);
    if (sentenceMatch) {
      return {
        summaryBody: sentenceMatch[1].trim(),
        extendedNote: sentenceMatch[2].trim(),
      };
    }
  }

  return { summaryBody: trimmed };
}

function inferHighYield(
  lead: string,
  body: string,
  subItems: SubBulletItem[],
  itemIndexInSection: number,
  explicitFlag?: boolean
): boolean {
  if (typeof explicitFlag === "boolean") return explicitFlag;
  const combined = `${lead} ${body} ${subItems.map((s) => `${s.lead || ""} ${s.body}`).join(" ")}`;
  if (HIGH_YIELD_PATTERNS.some((re) => re.test(combined))) {
    return true;
  }
  if (subItems.length >= 2 && itemIndexInSection === 0) {
    return true;
  }
  return false;
}

function parseTakeawaysContent(
  rawContent: string,
  fallbackChapterName?: string,
  subjectId?: string,
  chapterNumber?: number
): ParsedTakeaways {
  const trimmed = (rawContent || "").trim();
  const defaultTitle = fallbackChapterName || "Takeaways";

  if (!trimmed) {
    return {
      title: defaultTitle,
      scopeNote: "Rapid conceptual revision sheet.",
      sections: [],
    };
  }

  // 1. Check if JSON format (supports multiple DB/GCS JSON schemas)
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawSections: any[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.topics)
        ? parsed.topics
        : Array.isArray(parsed?.sections)
        ? parsed.sections
        : Array.isArray(parsed?.key_takeaways)
        ? parsed.key_takeaways
        : [];

      if (rawSections.length > 0) {
        const sections: TakeawaySection[] = rawSections.map((t: any, sIdx: number) => {
          const rawBullets: any[] = Array.isArray(t.bullets)
            ? t.bullets
            : Array.isArray(t.items)
            ? t.items
            : Array.isArray(t.takeaways)
            ? t.takeaways
            : Array.isArray(t.cards)
            ? t.cards
            : Array.isArray(t.points)
            ? t.points
            : [];

          const secTitle = String(
            t.topic_title || t.title || t.heading || t.section_title || t.name || `Topic ${sIdx + 1}`
          )
            .replace(/^📌\s*/, "")
            .replace(/^\d+[\.\)]\s*/, "")
            .trim();

          const items: TakeawayItem[] = rawBullets.map((b: any, bIdx: number) => {
            if (typeof b === "string") {
              const { lead, body } = splitLeadAndBody(b, bIdx + 1);
              const { summaryBody, extendedNote } = splitSummaryAndExtended(body);
              const isHighYield = inferHighYield(lead, body, [], bIdx);
              return {
                id: `${t.topic_id || t.id || `sec-${sIdx + 1}`}-item-${bIdx + 1}`,
                lead,
                body,
                summaryBody,
                extendedNote,
                raw: b,
                subItems: [],
                isHighYield,
                pyqBadge: isHighYield ? "★ PYQ-repeat" : undefined,
                sectionTitle: secTitle,
                sectionIndex: sIdx + 1,
              };
            }

            const rawText = String(b.body || b.text || b.summary || b.content || b.description || "");
            const explicitLead = String(b.lead || b.title || b.heading || b.term || "").trim();
            const { lead, body } = explicitLead
              ? { lead: explicitLead, body: rawText }
              : splitLeadAndBody(rawText, bIdx + 1);

            const subItems: SubBulletItem[] = Array.isArray(b.subItems || b.sub_bullets || b.details_list)
              ? (b.subItems || b.sub_bullets || b.details_list).map((sub: any) => {
                  if (typeof sub === "string") {
                    const sp = splitLeadAndBody(sub);
                    return { lead: sp.lead, body: sp.body, raw: sub };
                  }
                  return {
                    lead: sub.lead || sub.title,
                    body: String(sub.body || sub.text || ""),
                    raw: String(sub.raw || sub.body || sub.text || ""),
                  };
                })
              : [];

            const { summaryBody, extendedNote: splitExt } = splitSummaryAndExtended(body);
            const explicitExtended = b.full_note || b.fullNote || b.extended_note || b.explanation || b.details;
            const extendedNote = explicitExtended ? String(explicitExtended).trim() : splitExt;

            const explicitHighYield =
              typeof b.isHighYield === "boolean"
                ? b.isHighYield
                : typeof b.high_yield === "boolean"
                ? b.high_yield
                : typeof b.pyq_repeat === "boolean"
                ? b.pyq_repeat
                : typeof b.is_pyq === "boolean"
                ? b.is_pyq
                : b.importance
                ? String(b.importance).toLowerCase() === "high"
                : undefined;

            const isHighYield = inferHighYield(lead, body, subItems, bIdx, explicitHighYield);

            return {
              id: b.id || `${t.topic_id || t.id || `sec-${sIdx + 1}`}-item-${bIdx + 1}`,
              lead,
              body,
              summaryBody,
              extendedNote,
              raw: rawText,
              subItems,
              isHighYield,
              pyqBadge: b.badge || b.pyq_tag || (isHighYield ? "★ PYQ-repeat" : undefined),
              sectionTitle: secTitle,
              sectionIndex: sIdx + 1,
            };
          });

          return {
            id: String(t.topic_id || t.id || `sec-${sIdx + 1}`),
            index: sIdx + 1,
            title: secTitle,
            subtitle: t.mindmap_node || t.subtitle ? String(t.mindmap_node || t.subtitle) : undefined,
            items,
          };
        });

        const rawTitle = String(parsed.chapter || parsed.title || defaultTitle)
          .replace(/^Key Takeaways:\s*/i, "")
          .trim();

        return {
          title: formatHeaderTitle(rawTitle, fallbackChapterName, subjectId, chapterNumber),
          scopeNote: String(parsed.scope_note || parsed.subtitle || "Rapid conceptual revision sheet."),
          sections: ensureMinimumHighYield(sections),
        };
      }
    } catch {
      // Fall through to markdown parser
    }
  }

  // 2. Parse Markdown format from DB / GCS / local files
  const lines = trimmed.split(/\r?\n/);
  let title = defaultTitle;
  let scopeNote = "";
  const sections: TakeawaySection[] = [];
  let currentSection: TakeawaySection | null = null;
  let currentItem: TakeawayItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine === "---") continue;

    const h1Match = trimmedLine.match(/^#\s+(.+)$/);
    if (h1Match && sections.length === 0 && !currentSection) {
      title = h1Match[1]
        .replace(/^Key Takeaways:\s*/i, "")
        .replace(/\*+/g, "")
        .trim();
      continue;
    }

    if (trimmedLine.startsWith(">") && sections.length === 0 && !currentSection) {
      const cleanedQuote = trimmedLine
        .replace(/^>\s*/, "")
        .replace(/^\*\*[^*]+\*\*\s*:\s*/i, "")
        .replace(/\*\*/g, "")
        .trim();
      scopeNote = scopeNote ? `${scopeNote} ${cleanedQuote}` : cleanedQuote;
      continue;
    }

    const h2Match = trimmedLine.match(/^#{2,3}\s+(.+)$/);
    if (h2Match) {
      const rawSecTitle = h2Match[1]
        .replace(/^📌\s*/, "")
        .replace(/\*+/g, "")
        .replace(/^\d+[\.\)]\s*/, "")
        .trim();
      currentSection = {
        id: `sec-${sections.length + 1}`,
        index: sections.length + 1,
        title: rawSecTitle,
        items: [],
      };
      sections.push(currentSection);
      currentItem = null;
      continue;
    }

    const indentMatch = line.match(/^(\s*)([*\-+]|(?:\d+\.))\s+(.+)$/);
    if (indentMatch) {
      const indent = indentMatch[1].length;
      const marker = indentMatch[2];
      const itemContent = indentMatch[3].trim();

      if (!currentSection) {
        currentSection = {
          id: `sec-1`,
          index: 1,
          title: "Core Concepts & Definitions",
          items: [],
        };
        sections.push(currentSection);
      }

      if (indent >= 2 && currentItem) {
        const { lead, body } = splitLeadAndBody(itemContent, currentItem.subItems.length + 1);
        currentItem.subItems.push({
          prefix: /^\d+\./.test(marker) ? marker : undefined,
          lead,
          body,
          raw: itemContent,
        });
      } else {
        const itemIdx = currentSection.items.length + 1;
        const { lead, body } = splitLeadAndBody(itemContent, itemIdx);
        const { summaryBody, extendedNote } = splitSummaryAndExtended(body);
        currentItem = {
          id: `${currentSection.id}-item-${itemIdx}`,
          lead,
          body,
          summaryBody,
          extendedNote,
          raw: itemContent,
          subItems: [],
          isHighYield: false,
          sectionTitle: currentSection.title,
          sectionIndex: currentSection.index,
        };
        currentSection.items.push(currentItem);
      }
      continue;
    }

    if (currentSection) {
      if (currentItem) {
        currentItem.body = currentItem.body ? `${currentItem.body}\n${trimmedLine}` : trimmedLine;
        const { summaryBody, extendedNote } = splitSummaryAndExtended(currentItem.body);
        currentItem.summaryBody = summaryBody;
        currentItem.extendedNote = extendedNote;
      } else {
        const itemIdx = currentSection.items.length + 1;
        const { lead, body } = splitLeadAndBody(trimmedLine, itemIdx);
        const { summaryBody, extendedNote } = splitSummaryAndExtended(body);
        currentItem = {
          id: `${currentSection.id}-item-${itemIdx}`,
          lead,
          body,
          summaryBody,
          extendedNote,
          raw: trimmedLine,
          subItems: [],
          isHighYield: false,
          sectionTitle: currentSection.title,
          sectionIndex: currentSection.index,
        };
        currentSection.items.push(currentItem);
      }
    }
  }

  // Finalize high-yield inference across markdown sections
  sections.forEach((sec) => {
    sec.items.forEach((item, idx) => {
      const hy = inferHighYield(item.lead, item.body, item.subItems, idx);
      item.isHighYield = hy;
      if (hy && !item.pyqBadge) {
        item.pyqBadge = "★ PYQ-repeat";
      }
    });
  });

  return {
    title: formatHeaderTitle(title, fallbackChapterName, subjectId, chapterNumber),
    scopeNote: scopeNote || "Rapid conceptual revision sheet.",
    sections: ensureMinimumHighYield(sections),
  };
}

function formatHeaderTitle(
  parsedTitle: string,
  fallbackChapterName?: string,
  subjectId?: string,
  chapterNumber?: number
): string {
  const clean = (parsedTitle || fallbackChapterName || "Takeaways").trim();
  if (/unit\s*[—–\-:]?\s*[ivx\d]+/i.test(clean) || /lecture\s*\d+/i.test(clean)) {
    return clean.replace(/\s*-\s*Unit\s+/i, " Unit — ").replace(/:\s+/, " · ");
  }
  const subjUpper = (subjectId || "").toUpperCase();
  const romanUnits = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  if (subjUpper.includes("DBMS") && chapterNumber) {
    const roman = romanUnits[(chapterNumber || 1) - 1] || String(chapterNumber);
    return `DBMS Unit — ${roman} · ${clean}`;
  }
  return clean;
}

function ensureMinimumHighYield(sections: TakeawaySection[]): TakeawaySection[] {
  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  if (totalItems === 0) return sections;

  const currentHighYield = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.isHighYield).length,
    0
  );

  // If heuristic matched too few (< 20%) or too many (> 65%), calibrate so top foundational items per section are marked
  if (currentHighYield === 0) {
    sections.forEach((sec) => {
      if (sec.items[0]) {
        sec.items[0].isHighYield = true;
        sec.items[0].pyqBadge = "★ PYQ-repeat";
      }
    });
  }
  return sections;
}

export const KeyTakeawaysView: React.FC<KeyTakeawaysViewProps> = ({
  content,
  subjectId,
  chapterNumber,
  chapterName,
}) => {
  const storageKeyMastered = `sv_kt_mastered_${subjectId}_ch${chapterNumber}`;

  const [masteredIds, setMasteredIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = cloudStorage.getItem(storageKeyMastered);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "unreviewed" | "mastered" | "high_yield">("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [layoutMode, setLayoutMode] = useState<"bento" | "list">("bento");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [rapidReviewOpen, setRapidReviewOpen] = useState(false);
  const [rapidReviewIndex, setRapidReviewIndex] = useState(0);
  const [cloudRev, setCloudRev] = useState(0);
  useEffect(() => {
    return cloudStorage.subscribe(() => {
      setCloudRev((r) => r + 1);
      try {
        const savedM = cloudStorage.getItem(storageKeyMastered);
        if (savedM) {
          setMasteredIds(JSON.parse(savedM));
        }
      } catch {}
    });
  }, [storageKeyMastered]);

  const parsed = useMemo(() => {
    const base = parseTakeawaysContent(content, chapterName, subjectId, chapterNumber);
    try {
      const savedKey = `sv_kt_saved_from_ask_${subjectId}_ch${chapterNumber}`;
      const rawSaved = cloudStorage.getItem(savedKey);
      const savedItems: Array<{ id: string; lead: string; body: string }> = rawSaved
        ? JSON.parse(rawSaved)
        : [];
      if (Array.isArray(savedItems) && savedItems.length > 0) {
        const askSectionIndex = base.sections.length + 1;
        const askSection: TakeawaySection = {
          id: `sec-ask-saved`,
          index: askSectionIndex,
          title: "Saved from Ask Me",
          items: savedItems.map((si, idx) => {
            const { summaryBody, extendedNote } = splitSummaryAndExtended(si.body || "");
            return {
              id: si.id || `ask-item-${idx + 1}`,
              lead: si.lead || `Saved Note ${idx + 1}`,
              body: si.body || "",
              summaryBody,
              extendedNote,
              raw: `${si.lead}: ${si.body}`,
              subItems: [],
              isHighYield: true,
              pyqBadge: "★ Saved from Ask Me",
              sectionTitle: "Saved from Ask Me",
              sectionIndex: askSectionIndex,
            };
          }),
        };
        return {
          ...base,
          sections: [...base.sections, askSection],
        };
      }
    } catch {
      // ignore parse errors
    }
    return base;
  }, [content, chapterName, subjectId, chapterNumber, cloudRev]);

  // Default Section 1 expanded, others collapsed (matching the mockup)
  useEffect(() => {
    try {
      const savedM = cloudStorage.getItem(storageKeyMastered);
      setMasteredIds(savedM ? JSON.parse(savedM) : {});
    } catch {
      setMasteredIds({});
    }
    setSelectedSectionId("all");
    setExpandedNotes({});
    if (parsed.sections.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      parsed.sections.forEach((sec, idx) => {
        initialExpanded[sec.id] = idx === 0;
      });
      setExpandedSections(initialExpanded);
    }
  }, [storageKeyMastered, parsed.sections.length]);
  const saveMastered = (next: Record<string, boolean>) => {
    setMasteredIds(next);
    try {
      cloudStorage.setItem(storageKeyMastered, JSON.stringify(next));
    } catch {}
  };

  const allItems = useMemo(
    () => parsed.sections.flatMap((s) => s.items),
    [parsed.sections]
  );

  const totalCount = allItems.length;
  const masteredCount = useMemo(
    () => allItems.filter((item) => masteredIds[item.id]).length,
    [allItems, masteredIds]
  );
  const highYieldItems = useMemo(
    () => allItems.filter((item) => item.isHighYield),
    [allItems]
  );
  const highYieldCount = highYieldItems.length;
  const estRapidMinutes = Math.max(2, Math.ceil(highYieldCount * 0.6));

  const toggleItemMastered = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    saveMastered({ ...masteredIds, [id]: !masteredIds[id] });
  };

  const toggleSectionMastered = (section: TakeawaySection, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const allSectionDone = section.items.every((item) => masteredIds[item.id]);
    const next = { ...masteredIds };
    section.items.forEach((item) => {
      next[item.id] = !allSectionDone;
    });
    saveMastered(next);
  };

  const toggleSectionExpanded = (secId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  const toggleFullNote = (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNotes((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parsed.sections
      .filter((sec) => selectedSectionId === "all" || sec.id === selectedSectionId)
      .map((sec) => {
        const matchingItems = sec.items.filter((item) => {
          if (filterMode === "unreviewed" && masteredIds[item.id]) return false;
          if (filterMode === "mastered" && !masteredIds[item.id]) return false;
          if (filterMode === "high_yield" && !item.isHighYield) return false;
          if (!q) return true;
          const inSectionTitle = sec.title.toLowerCase().includes(q);
          const inLead = item.lead.toLowerCase().includes(q);
          const inBody = item.body.toLowerCase().includes(q);
          const inSub = item.subItems.some(
            (sub) => sub.lead?.toLowerCase().includes(q) || sub.body.toLowerCase().includes(q)
          );
          return inSectionTitle || inLead || inBody || inSub;
        });
        return { ...sec, items: matchingItems };
      })
      .filter((sec) => sec.items.length > 0);
  }, [parsed.sections, selectedSectionId, filterMode, searchQuery, masteredIds]);

  const rapidDeck = useMemo(() => {
    return highYieldItems.length > 0 ? highYieldItems : allItems;
  }, [highYieldItems, allItems]);

  const handleStartRapidReview = () => {
    setRapidReviewIndex(0);
    setRapidReviewOpen(true);
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: '#F7F3EB',
        color: "#1E2822",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── ROW 1: Top Unit / Chapter Header Bar ── */}
      <div
        style={{
          background: "#FAF7F2",
          borderBottom: "1px solid #EAE3D5",
          padding: "11px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "7px",
              background: "#F5E4D3",
              border: "1px solid #E5C9AE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            🔑
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "14.5px",
              fontWeight: 700,
              color: "#1E2822",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {chapterName || parsed.title}
          </h1>
        </div>

        <div
          style={{
            fontSize: "12.5px",
            fontWeight: 500,
            color: "#6C736D",
            whiteSpace: "nowrap",
          }}
        >
          <strong style={{ fontWeight: 700, color: "#1E2822" }}>{parsed.sections.length}</strong> topics
          <span style={{ margin: "0 6px", opacity: 0.6 }}>·</span>
          <strong style={{ fontWeight: 700, color: "#1E2822" }}>{masteredCount}</strong> / {totalCount} reviewed
        </div>
      </div>

      {/* ── ROW 2: Search, Status Filter Pills, View Switcher & Rapid Review CTA ── */}
      <div
        style={{
          background: "#FAF7F2",
          borderBottom: "1px solid #EAE3D5",
          padding: "10px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Search + Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: "1 1 auto" }}>
          {/* Search Input */}
          <div style={{ position: "relative", width: "215px" }}>
            <svg
              width="13.5"
              height="13.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8A8E87"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search key terms..."
              style={{
                width: "100%",
                padding: "6px 26px 6px 31px",
                borderRadius: "9px",
                border: "1px solid #E3DDD1",
                background: "#FFFFFF",
                fontSize: "12.5px",
                color: "#1E2822",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "7px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#8A8E87",
                  cursor: "pointer",
                  fontSize: "11px",
                  padding: "2px",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          {(
            [
              { id: "all", label: "All", count: totalCount, star: false },
              { id: "unreviewed", label: "To review", count: totalCount - masteredCount, star: false },
              { id: "mastered", label: "Reviewed", count: masteredCount, star: false },
              { id: "high_yield", label: "High-yield", count: highYieldCount, star: true },
            ] as const
          ).map((pill) => {
            const active = filterMode === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterMode(pill.id)}
                style={{
                  padding: "5.5px 12px",
                  borderRadius: "9px",
                  border: active ? '1.5px solid #D9A382' : '1px solid #E3DDD1',
                  background: active ? 'rgba(217, 163, 130, 0.22)' : '#FFFFFF',
                  color: active ? '#18221D' : '#5B635D',
                  fontSize: "12.5px",
                  fontWeight: active ? 700 : 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.15s ease",
                }}
              >
                {pill.star && <span style={{ color: "#C27844", fontSize: "12px" }}>★</span>}
                <span>{pill.label}</span>
                <span style={{ opacity: 0.55 }}>·</span>
                <span style={{ color: active ? "#B86B35" : "#7A807A", fontWeight: 700 }}>
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Grid/List Toggle + Rapid Review Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              background: "#FFFFFF",
              border: "1px solid #E3DDD1",
              borderRadius: "9px",
              padding: "2px",
            }}
          >
            <button
              type="button"
              onClick={() => setLayoutMode("bento")}
              style={{
                padding: "4.5px 10px",
                borderRadius: "7px",
                border: "none",
                background: layoutMode === "bento" ? "#F3EFE6" : "transparent",
                color: layoutMode === "bento" ? "#1E2822" : "#6C736D",
                fontSize: "12px",
                fontWeight: layoutMode === "bento" ? 700 : 500,
                fontFamily: "inherit",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span style={{ fontSize: "11px" }}>⊞</span> Grid
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("list")}
              style={{
                padding: "4.5px 10px",
                borderRadius: "7px",
                border: "none",
                background: layoutMode === "list" ? "#F3EFE6" : "transparent",
                color: layoutMode === "list" ? "#1E2822" : "#6C736D",
                fontSize: "12px",
                fontWeight: layoutMode === "list" ? 700 : 500,
                fontFamily: "inherit",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span style={{ fontSize: "12px" }}>≡</span> List
            </button>
          </div>

          <button
            type="button"
            onClick={handleStartRapidReview}
            style={{
              padding: "7px 14px",
              borderRadius: "9px",
              border: "none",
              background: '#D9A382',
              color: '#18221D',
              fontSize: "12.5px",
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(189, 125, 82, 0.25)",
            }}
          >
            <span>⚡</span> Rapid review
          </button>
        </div>
      </div>

      {/* ── MAIN BODY CONTENT ── */}
      <div
        style={{
          maxWidth: "1360px",
          width: "100%",
          margin: "0 auto",
          padding: "18px 28px 44px",
          boxSizing: "border-box",
        }}
      >

        {/* ── Horizontal Topic Filter Pills ── */}
        {parsed.sections.length > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "6px",
              marginBottom: "16px",
              scrollbarWidth: "none",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedSectionId("all")}
              style={{
                padding: "6px 13px",
                borderRadius: "999px",
                border: selectedSectionId === "all" ? "1px solid #C88A5A" : "1px solid #E3DDD1",
                background: selectedSectionId === "all" ? "#FBF3EB" : "#FFFFFF",
                color: "#1E2822",
                fontSize: "12.5px",
                fontWeight: selectedSectionId === "all" ? 700 : 500,
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>All</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span style={{ color: selectedSectionId === "all" ? "#B86B35" : "#6C736D", fontWeight: 700 }}>
                {parsed.sections.length}
              </span>
            </button>

            {parsed.sections.map((sec) => {
              const isSelected = selectedSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    const nextId = isSelected ? "all" : sec.id;
                    setSelectedSectionId(nextId);
                    if (nextId !== "all") {
                      setExpandedSections((prev) => ({ ...prev, [sec.id]: true }));
                    }
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "999px",
                    border: isSelected ? "1px solid #C88A5A" : "1px solid #E3DDD1",
                    background: isSelected ? "#FBF3EB" : "#FFFFFF",
                    color: isSelected ? "#1E2822" : "#49524C",
                    fontSize: "12.5px",
                    fontWeight: isSelected ? 700 : 500,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: isSelected ? "#B86B35" : "#7A807A", fontWeight: 600 }}>
                    {sec.index} ·
                  </span>
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty Filter State ── */}
        {filteredSections.length === 0 ? (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "14px",
              border: "1px dashed #D8D0C2",
              padding: "42px 24px",
              textAlign: "center",
              color: "#6C736D",
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1E2822", marginBottom: "6px" }}>
              No matching takeaways found
            </div>
            <div style={{ fontSize: "13px", marginBottom: "14px" }}>
              Try clearing your search query or switching the filter pill above.
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterMode("all");
                setSelectedSectionId("all");
              }}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#1E352B",
                color: "#FFFFFF",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          /* ── Topic Accordion Sections ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredSections.map((section) => {
              const secDoneCount = section.items.filter((i) => masteredIds[i.id]).length;
              const allSecDone = section.items.length > 0 && secDoneCount === section.items.length;
              const isExpanded =
                Boolean(searchQuery.trim()) ||
                selectedSectionId !== "all" ||
                filterMode !== "all" ||
                Boolean(expandedSections[section.id]);

              if (!isExpanded) {
                /* ── COLLAPSED SECTION BAR (Matches Sections 2 & 3 in Mockup) ── */
                return (
                  <div
                    key={section.id}
                    onClick={() => toggleSectionExpanded(section.id)}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5DFD3",
                      borderRadius: "13px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      cursor: "pointer",
                      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "7px",
                          background: allSecDone ? "#1E352B" : "#EAF0EC",
                          color: allSecDone ? "#FFFFFF" : "#1E352B",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "12.5px",
                          flexShrink: 0,
                        }}
                      >
                        {allSecDone ? "✓" : section.index}
                      </div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "14.5px",
                          fontWeight: 700,
                          color: "#1E2822",
                        }}
                      >
                        {section.title}
                      </h2>
                    </div>

                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 500,
                        color: "#7A807A",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {secDoneCount} / {section.items.length} reviewed
                    </div>
                  </div>
                );
              }

              /* ── EXPANDED SECTION + 3-COLUMN BENTO GRID (Matches Section 1 in Mockup) ── */
              return (
                <section
                  key={section.id}
                  style={{
                    marginBottom: "6px",
                  }}
                >
                  {/* Section Header Row */}
                  <div
                    onClick={() => toggleSectionExpanded(section.id)}
                    style={{
                      padding: "6px 2px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "7px",
                          background: "#1E352B",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "12.5px",
                          flexShrink: 0,
                        }}
                      >
                        {allSecDone ? "✓" : section.index}
                      </div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "15.5px",
                          fontWeight: 700,
                          color: "#1E2822",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {section.title}
                      </h2>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12.5px",
                      }}
                    >
                      <span style={{ color: "#7A807A", fontWeight: 500 }}>
                        {secDoneCount} / {section.items.length} reviewed
                      </span>
                      <span style={{ color: "#C5BEB2" }}>·</span>
                      <button
                        type="button"
                        onClick={(e) => toggleSectionMastered(section, e)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "#B86B35",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        {allSecDone ? "↺ Unmark all" : "✓ Mark all reviewed"}
                      </button>
                    </div>
                  </div>

                  {/* 3-Column Bento Grid / List */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        layoutMode === "bento"
                          ? "repeat(auto-fill, minmax(340px, 1fr))"
                          : "1fr",
                      gap: "14px",
                    }}
                  >
                    {section.items.map((item) => {
                      const isMastered = Boolean(masteredIds[item.id]);
                      const isNoteExpanded = Boolean(expandedNotes[item.id]);
                      const hasExtraContent =
                        Boolean(item.extendedNote) ||
                        item.subItems.length > 0 ||
                        item.body.length > 140;

                      return (
                        <div
                          key={item.id}
                          style={{
                            background: item.isHighYield ? "#FCF8F2" : "#FFFFFF",
                            border: item.isHighYield
                              ? "1px solid #EAD6C3"
                              : "1px solid #E5DFD3",
                            borderRadius: "14px",
                            padding: "18px 20px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "10px",
                            transition: "box-shadow 0.15s ease, border-color 0.15s ease",
                            opacity: isMastered ? 0.88 : 1,
                          }}
                        >
                          <div>
                            {/* Card Top Header: Title + PYQ-repeat pill + Checkbox */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "10px",
                                marginBottom: "10px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                  minWidth: 0,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "14.5px",
                                    fontWeight: 700,
                                    color: "#1E2822",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {item.lead}
                                </span>
                                {item.isHighYield && (
                                  <span
                                    style={{
                                      background: "#F5E4D4",
                                      color: "#B56833",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      padding: "2px 8px",
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {item.pyqBadge || "★ PYQ-repeat"}
                                  </span>
                                )}
                              </div>

                              {/* Right Checkbox */}
                              <button
                                type="button"
                                onClick={(e) => toggleItemMastered(item.id, e)}
                                aria-label={isMastered ? "Mark as unreviewed" : "Mark as reviewed"}
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "5px",
                                  border: isMastered
                                    ? "1.5px solid #1E352B"
                                    : "1.5px solid #D5CEC2",
                                  background: isMastered ? "#1E352B" : "#FFFFFF",
                                  color: "#FFFFFF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: 0,
                                  marginTop: "1px",
                                }}
                              >
                                {isMastered ? "✓" : ""}
                              </button>
                            </div>

                            {/* Card Summary Body */}
                            {item.summaryBody && (
                              <div
                                className="kt-card-body"
                                style={{
                                  fontSize: "13.2px",
                                  lineHeight: 1.6,
                                  color: "#4A524C",
                                }}
                              >
                                <MarkdownView
                                  content={isNoteExpanded ? item.body : item.summaryBody}
                                />
                              </div>
                            )}

                            {/* Expanded Full Note / Sub-bullets from DB */}
                            {isNoteExpanded && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  paddingTop: "10px",
                                  borderTop: "1px dashed #E5DDD0",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                }}
                              >
                                {item.subItems.length > 0 ? (
                                  item.subItems.map((sub, sIdx) => (
                                    <div
                                      key={sIdx}
                                      style={{
                                        background: "#F7F4EE",
                                        borderLeft: "2.5px solid #BD7D52",
                                        borderRadius: "0 7px 7px 0",
                                        padding: "7px 11px",
                                        fontSize: "12.5px",
                                        lineHeight: 1.55,
                                        color: "#3A423D",
                                      }}
                                    >
                                      {sub.lead && (
                                        <div
                                          style={{
                                            fontWeight: 700,
                                            color: "#1E2822",
                                            marginBottom: "2px",
                                          }}
                                        >
                                          {sub.prefix ? `${sub.prefix} ` : ""}
                                          {sub.lead}
                                        </div>
                                      )}
                                      <div className="kt-card-body">
                                        <MarkdownView content={sub.body || sub.raw} />
                                      </div>
                                    </div>
                                  ))
                                ) : !item.extendedNote ? (
                                  <div
                                    style={{
                                      background: "#F7F4EE",
                                      borderLeft: "2.5px solid #BD7D52",
                                      borderRadius: "0 7px 7px 0",
                                      padding: "8px 11px",
                                      fontSize: "12.2px",
                                      lineHeight: 1.5,
                                      color: "#5B635D",
                                    }}
                                  >
                                    <strong style={{ color: "#1E2822" }}>Topic context:</strong>{" "}
                                    {section.title}
                                    {section.subtitle ? ` · ${section.subtitle}` : ""}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {/* Card Footer: Full note ↓ */}
                          {hasExtraContent || item.body ? (
                            <div style={{ marginTop: "4px" }}>
                              <button
                                type="button"
                                onClick={(e) => toggleFullNote(item.id, e)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  color: "#B86B35",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  fontFamily: "inherit",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {isNoteExpanded ? "Hide note ↑" : "Full note ↓"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Interactive Rapid Review Modal (Triggered by Rapid Review buttons) ── */}
      {rapidReviewOpen && rapidDeck.length > 0 && (
        <div
          onClick={() => setRapidReviewOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(22, 32, 26, 0.55)",
            backdropFilter: "blur(3px)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          {(() => {
            const currentCard = rapidDeck[rapidReviewIndex] || rapidDeck[0];
            const isCardMastered = Boolean(masteredIds[currentCard.id]);
            return (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #E5DACB",
                  borderRadius: "18px",
                  maxWidth: "640px",
                  width: "100%",
                  padding: "24px 28px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: "#F5E4D4",
                        color: "#B56833",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "999px",
                      }}
                    >
                      ⚡ Rapid Review · {rapidReviewIndex + 1} of {rapidDeck.length}
                    </span>
                    {currentCard.sectionTitle && (
                      <span style={{ fontSize: "12px", color: "#6C736D", fontWeight: 500 }}>
                        {currentCard.sectionTitle}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRapidReviewOpen(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "16px",
                      color: "#6C736D",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #EAD6C3",
                    borderRadius: "14px",
                    padding: "22px 24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1E2822" }}>
                      {currentCard.lead}
                    </h3>
                    {currentCard.isHighYield && (
                      <span
                        style={{
                          background: "#F5E4D4",
                          color: "#B56833",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        ★ PYQ-repeat
                      </span>
                    )}
                  </div>
                  <div
                    className="kt-card-body"
                    style={{ fontSize: "14px", lineHeight: 1.65, color: "#3A423D" }}
                  >
                    <MarkdownView content={currentCard.body} />
                  </div>
                  {currentCard.subItems.length > 0 && (
                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {currentCard.subItems.map((sub, i) => (
                        <div
                          key={i}
                          style={{
                            background: "#F7F4EE",
                            borderLeft: "2.5px solid #BD7D52",
                            borderRadius: "0 6px 6px 0",
                            padding: "6px 10px",
                            fontSize: "12.5px",
                          }}
                        >
                          {sub.lead && <strong>{sub.lead}: </strong>}
                          <MarkdownView content={sub.body || sub.raw} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    disabled={rapidReviewIndex === 0}
                    onClick={() => setRapidReviewIndex((i) => Math.max(0, i - 1))}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "9px",
                      border: "1px solid #E3DDD1",
                      background: "#FFFFFF",
                      color: rapidReviewIndex === 0 ? "#B5B9B4" : "#1E2822",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: rapidReviewIndex === 0 ? "default" : "pointer",
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => toggleItemMastered(currentCard.id)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "9px",
                        border: isCardMastered ? "1px solid #1E352B" : "1px solid #C88A5A",
                        background: isCardMastered ? "#1E352B" : "#FBF3EB",
                        color: isCardMastered ? "#FFFFFF" : "#B86B35",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isCardMastered ? "✓ Reviewed" : "Mark reviewed"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (rapidReviewIndex < rapidDeck.length - 1) {
                          setRapidReviewIndex((i) => i + 1);
                        } else {
                          setRapidReviewOpen(false);
                        }
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "9px",
                        border: "none",
                        background: "#BD7D52",
                        color: "#FFFFFF",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {rapidReviewIndex < rapidDeck.length - 1 ? "Next →" : "Finish"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <style>{`
        .kt-card-body p {
          margin: 0 0 4px 0 !important;
        }
        .kt-card-body p:last-child {
          margin-bottom: 0 !important;
        }
        .kt-card-body strong {
          color: #1E2822;
          font-weight: 700;
          text-decoration: underline;
          text-decoration-style: dotted;
          text-decoration-color: #B87340;
          text-underline-offset: 3px;
        }
      `}</style>
    </div>
  );
};

export default KeyTakeawaysView;
