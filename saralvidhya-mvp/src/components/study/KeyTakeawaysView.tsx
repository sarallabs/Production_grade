import React, { useState, useMemo, useEffect } from "react";
import MarkdownView from "../MarkdownView";
import { cloudStorage } from "@/context/CloudStateContext";

// ── Saral Vidhya Muted Sage Palette ─────────────────────────────────────────
const G = {
  dark: "#2D3E36",
  primary: "#365345",
  mid: "#4F7B64",
  mutedText: "#5A6E63",
  light: "#7BA88B",
  pale: "#EEF5F1",
  paleControl: "#EDF3EE",
  paleBorder: "#D5E2D9",
  cardBorder: "#E2EBE5",
  subtleBg: "#F7FAF8",
  white: "#FFFFFF",
} as const;

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
  raw: string;
  subItems: SubBulletItem[];
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

function splitLeadAndBody(text: string): { lead: string; body: string } {
  const cleaned = text.trim();
  const match = cleaned.match(/^\*\*([^*]+?)\*\*\s*:?\s*([\s\S]*)$/);
  if (match) {
    const rawLead = match[1].replace(/:$/, "").trim();
    const rawBody = match[2].replace(/^:\s*/, "").trim();
    return { lead: rawLead, body: rawBody };
  }
  return { lead: "", body: cleaned };
}

function parseTakeawaysContent(rawContent: string, fallbackChapterName?: string): ParsedTakeaways {
  const trimmed = (rawContent || "").trim();
  if (!trimmed) {
    return {
      title: fallbackChapterName || "Key Takeaways",
      scopeNote: "Rapid conceptual revision sheet.",
      sections: [],
    };
  }

  // 1. Check if JSON format
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.topics)) {
        const sections: TakeawaySection[] = parsed.topics.map((t: any, sIdx: number) => {
          const bullets: string[] = Array.isArray(t.bullets) ? t.bullets : [];
          const items: TakeawayItem[] = bullets.map((b: string, bIdx: number) => {
            const { lead, body } = splitLeadAndBody(b);
            return {
              id: `${t.topic_id || `sec-${sIdx + 1}`}-item-${bIdx + 1}`,
              lead,
              body,
              raw: b,
              subItems: [],
            };
          });
          return {
            id: t.topic_id || `sec-${sIdx + 1}`,
            index: sIdx + 1,
            title: String(t.topic_title || `Topic ${sIdx + 1}`).replace(/^📌\s*/, "").trim(),
            subtitle: t.mindmap_node ? String(t.mindmap_node) : undefined,
            items,
          };
        });
        return {
          title: String(parsed.chapter || fallbackChapterName || "Key Takeaways").replace(
            /^Key Takeaways:\s*/i,
            ""
          ),
          scopeNote: "Rapid conceptual revision sheet.",
          sections,
        };
      }
    } catch {
      // Fall through to markdown parser
    }
  }

  // 2. Parse Markdown format
  const lines = trimmed.split(/\r?\n/);
  let title = fallbackChapterName || "Key Takeaways";
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

    const indentMatch = line.match(/^(\s*)([*\-+]|\d+\.)\s+(.+)$/);
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
        const { lead, body } = splitLeadAndBody(itemContent);
        currentItem.subItems.push({
          prefix: /^\d+\./.test(marker) ? marker : undefined,
          lead,
          body,
          raw: itemContent,
        });
      } else {
        const { lead, body } = splitLeadAndBody(itemContent);
        currentItem = {
          id: `${currentSection.id}-item-${currentSection.items.length + 1}`,
          lead,
          body,
          raw: itemContent,
          subItems: [],
        };
        currentSection.items.push(currentItem);
      }
      continue;
    }

    if (currentSection) {
      if (currentItem) {
        currentItem.body = currentItem.body ? `${currentItem.body}\n${trimmedLine}` : trimmedLine;
      } else {
        const { lead, body } = splitLeadAndBody(trimmedLine);
        currentItem = {
          id: `${currentSection.id}-item-${currentSection.items.length + 1}`,
          lead,
          body,
          raw: trimmedLine,
          subItems: [],
        };
        currentSection.items.push(currentItem);
      }
    }
  }

  return {
    title,
    scopeNote: scopeNote || "Rapid conceptual revision sheet.",
    sections,
  };
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
  const [filterMode, setFilterMode] = useState<"all" | "unreviewed" | "mastered">("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [layoutMode, setLayoutMode] = useState<"bento" | "list">("bento");

  useEffect(() => {
    try {
      const savedM = cloudStorage.getItem(storageKeyMastered);
      setMasteredIds(savedM ? JSON.parse(savedM) : {});
    } catch {
      setMasteredIds({});
    }
    setSelectedSectionId("all");
  }, [storageKeyMastered]);

  const saveMastered = (next: Record<string, boolean>) => {
    setMasteredIds(next);
    try {
      cloudStorage.setItem(storageKeyMastered, JSON.stringify(next));
    } catch {}
  };

  const parsed = useMemo(
    () => parseTakeawaysContent(content, chapterName),
    [content, chapterName]
  );

  const allItems = useMemo(
    () => parsed.sections.flatMap((s) => s.items),
    [parsed.sections]
  );

  const totalCount = allItems.length;
  const masteredCount = useMemo(
    () => allItems.filter((item) => masteredIds[item.id]).length,
    [allItems, masteredIds]
  );

  const toggleItemMastered = (id: string) => {
    saveMastered({ ...masteredIds, [id]: !masteredIds[id] });
  };

  const toggleSectionMastered = (section: TakeawaySection) => {
    const allSectionDone = section.items.every((item) => masteredIds[item.id]);
    const next = { ...masteredIds };
    section.items.forEach((item) => {
      next[item.id] = !allSectionDone;
    });
    saveMastered(next);
  };

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return parsed.sections
      .filter((sec) => selectedSectionId === "all" || sec.id === selectedSectionId)
      .map((sec) => {
        const matchingItems = sec.items.filter((item) => {
          if (filterMode === "unreviewed" && masteredIds[item.id]) return false;
          if (filterMode === "mastered" && !masteredIds[item.id]) return false;
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

  return (
    <div
      style={{
        maxWidth: "1260px",
        margin: "0 auto",
        padding: "0 4px 32px",
        fontFamily: "inherit",
        color: G.dark,
      }}
    >
      {/* ── Slim, Subtle Top Header & Control Bar (Saral Vidhya Sage Theme) ── */}
      <div
        style={{
          background: G.white,
          border: `1px solid ${G.paleBorder}`,
          borderRadius: "12px",
          padding: "10px 16px",
          marginBottom: "14px",
          boxShadow: "0 1px 3px rgba(45, 62, 54, 0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          {/* Left: Compact Icon + Title + Count */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "220px", flex: "1 1 auto" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: G.pale,
                border: `1px solid ${G.paleBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: G.primary,
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "0.98rem",
                  fontWeight: 700,
                  color: G.dark,
                  letterSpacing: "-0.01em",
                }}
              >
                {parsed.title}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: G.mutedText,
                  background: G.subtleBg,
                  border: `1px solid ${G.cardBorder}`,
                  padding: "2px 8px",
                  borderRadius: "999px",
                }}
              >
                {parsed.sections.length} Topics · {masteredCount}/{totalCount} Reviewed
              </span>
            </div>
          </div>

          {/* Right: Search + Segmented Filter + View Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", width: "220px" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={G.mutedText}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  left: "10px",
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
                placeholder="Search key terms…"
                style={{
                  width: "100%",
                  padding: "5px 24px 5px 30px",
                  borderRadius: "8px",
                  border: `1px solid ${G.paleBorder}`,
                  fontSize: "0.78rem",
                  fontFamily: "inherit",
                  color: G.dark,
                  background: G.subtleBg,
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
                    right: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: G.mutedText,
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: "2px",
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div
              style={{
                display: "inline-flex",
                background: G.paleControl,
                padding: "2px",
                borderRadius: "8px",
                border: `1px solid ${G.paleBorder}`,
              }}
            >
              {(
                [
                  { id: "all", label: `All (${totalCount})` },
                  { id: "unreviewed", label: `To Review (${totalCount - masteredCount})` },
                  { id: "mastered", label: `Reviewed (${masteredCount})` },
                ] as const
              ).map((tab) => {
                const active = filterMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterMode(tab.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: active ? G.white : "transparent",
                      color: active ? G.dark : G.mutedText,
                      fontSize: "0.75rem",
                      fontWeight: active ? 600 : 500,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      boxShadow: active ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Layout Toggle */}
            <div
              style={{
                display: "inline-flex",
                background: G.paleControl,
                padding: "2px",
                borderRadius: "8px",
                border: `1px solid ${G.paleBorder}`,
              }}
            >
              <button
                type="button"
                onClick={() => setLayoutMode("bento")}
                style={{
                  padding: "4px 9px",
                  borderRadius: "6px",
                  border: "none",
                  background: layoutMode === "bento" ? G.white : "transparent",
                  color: layoutMode === "bento" ? G.dark : G.mutedText,
                  fontSize: "0.75rem",
                  fontWeight: layoutMode === "bento" ? 600 : 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: layoutMode === "bento" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("list")}
                style={{
                  padding: "4px 9px",
                  borderRadius: "6px",
                  border: "none",
                  background: layoutMode === "list" ? G.white : "transparent",
                  color: layoutMode === "list" ? G.dark : G.mutedText,
                  fontSize: "0.75rem",
                  fontWeight: layoutMode === "list" ? 600 : 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  boxShadow: layoutMode === "list" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Subtle Horizontal Topic Filter Pills */}
        {parsed.sections.length > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflowX: "auto",
              paddingTop: "6px",
              borderTop: `1px solid ${G.cardBorder}`,
              scrollbarWidth: "thin",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedSectionId("all")}
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                border: `1px solid ${selectedSectionId === "all" ? G.primary : G.cardBorder}`,
                background: selectedSectionId === "all" ? G.primary : G.subtleBg,
                color: selectedSectionId === "all" ? G.white : G.dark,
                fontSize: "0.73rem",
                fontWeight: selectedSectionId === "all" ? 600 : 500,
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              All ({parsed.sections.length})
            </button>
            {parsed.sections.map((sec) => {
              const isSelected = selectedSectionId === sec.id;
              const secDoneCount = sec.items.filter((i) => masteredIds[i.id]).length;
              const isAllSecDone = sec.items.length > 0 && secDoneCount === sec.items.length;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSectionId(isSelected ? "all" : sec.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    border: `1px solid ${isSelected ? G.primary : G.cardBorder}`,
                    background: isSelected
                      ? G.primary
                      : isAllSecDone
                      ? G.pale
                      : G.subtleBg,
                    color: isSelected ? G.white : G.dark,
                    fontSize: "0.73rem",
                    fontWeight: isSelected ? 600 : 500,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span style={{ opacity: 0.7, fontSize: "0.68rem", fontWeight: 600 }}>
                    {sec.index}.
                  </span>
                  <span>{sec.title.length > 34 ? `${sec.title.slice(0, 34)}…` : sec.title}</span>
                  {isAllSecDone && <span>✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Empty Filter State ── */}
      {filteredSections.length === 0 ? (
        <div
          style={{
            background: G.white,
            borderRadius: "12px",
            border: `1px dashed ${G.paleBorder}`,
            padding: "36px 20px",
            textAlign: "center",
            color: G.mutedText,
          }}
        >
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: G.dark, marginBottom: "4px" }}>
            No matching takeaways found
          </div>
          <div style={{ fontSize: "0.82rem", marginBottom: "12px" }}>
            Try clearing your search query or switching the filter tab.
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setFilterMode("all");
              setSelectedSectionId("all");
            }}
            style={{
              padding: "6px 14px",
              borderRadius: "7px",
              border: "none",
              background: G.primary,
              color: G.white,
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* ── Section Cards ── */
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredSections.map((section) => {
            const secDoneCount = section.items.filter((i) => masteredIds[i.id]).length;
            const allSecDone = section.items.length > 0 && secDoneCount === section.items.length;

            return (
              <section
                key={section.id}
                style={{
                  background: G.white,
                  borderRadius: "12px",
                  border: `1px solid ${G.cardBorder}`,
                  overflow: "hidden",
                }}
              >
                {/* Subtle Section Header */}
                <div
                  style={{
                    padding: "11px 16px",
                    background: G.subtleBg,
                    borderBottom: `1px solid ${G.cardBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "6px",
                        background: allSecDone ? G.mid : G.pale,
                        border: `1px solid ${G.paleBorder}`,
                        color: allSecDone ? G.white : G.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        flexShrink: 0,
                      }}
                    >
                      {allSecDone ? "✓" : section.index}
                    </div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "0.94rem",
                        fontWeight: 700,
                        color: G.dark,
                      }}
                    >
                      {section.title}
                    </h2>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        color: G.mutedText,
                      }}
                    >
                      {secDoneCount}/{section.items.length} reviewed
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSectionMastered(section)}
                      style={{
                        padding: "3px 9px",
                        borderRadius: "6px",
                        border: `1px solid ${G.paleBorder}`,
                        background: allSecDone ? G.pale : G.white,
                        color: G.primary,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {allSecDone ? "Done ✓" : "Mark All"}
                    </button>
                  </div>
                </div>

                {/* Concept Items Grid / List */}
                <div
                  style={{
                    padding: "14px 16px",
                    display: "grid",
                    gridTemplateColumns:
                      layoutMode === "bento" && section.items.length > 1
                        ? "repeat(auto-fit, minmax(360px, 1fr))"
                        : "1fr",
                    gap: "12px",
                  }}
                >
                  {section.items.map((item) => {
                    const isMastered = Boolean(masteredIds[item.id]);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: isMastered ? G.subtleBg : G.white,
                          border: `1px solid ${isMastered ? G.paleBorder : G.cardBorder}`,
                          borderRadius: "10px",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
                          <button
                            type="button"
                            onClick={() => toggleItemMastered(item.id)}
                            aria-label={isMastered ? "Mark as unreviewed" : "Mark as reviewed"}
                            style={{
                              marginTop: "2px",
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              border: isMastered ? "none" : `1.5px solid ${G.light}`,
                              background: isMastered ? G.mid : G.white,
                              color: G.white,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              flexShrink: 0,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                            }}
                          >
                            {isMastered ? "✓" : ""}
                          </button>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            {item.lead && (
                              <div
                                style={{
                                  fontSize: "0.88rem",
                                  fontWeight: 700,
                                  color: G.dark,
                                  marginBottom: "4px",
                                  lineHeight: 1.35,
                                }}
                              >
                                {item.lead}
                              </div>
                            )}

                            {item.body && (
                              <div
                                style={{
                                  fontSize: "0.84rem",
                                  lineHeight: 1.55,
                                  color: "#334155",
                                }}
                                className="kt-markdown-body"
                              >
                                <MarkdownView content={item.body} />
                              </div>
                            )}

                            {item.subItems.length > 0 && (
                              <div
                                style={{
                                  marginTop: item.body ? "8px" : "2px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                }}
                              >
                                {item.subItems.map((sub, sIdx) => (
                                  <div
                                    key={sIdx}
                                    style={{
                                      background: G.subtleBg,
                                      borderLeft: `2.5px solid ${G.mid}`,
                                      borderRadius: "0 6px 6px 0",
                                      padding: "6px 10px",
                                      fontSize: "0.81rem",
                                      lineHeight: 1.5,
                                      color: "#334155",
                                    }}
                                  >
                                    {sub.lead && (
                                      <div
                                        style={{
                                          fontWeight: 600,
                                          color: G.dark,
                                          marginBottom: "2px",
                                        }}
                                      >
                                        {sub.prefix ? `${sub.prefix} ` : ""}
                                        {sub.lead}
                                      </div>
                                    )}
                                    <div className="kt-markdown-sub">
                                      <MarkdownView content={sub.body || sub.raw} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <style>{`
        .kt-markdown-body p,
        .kt-markdown-sub p {
          margin: 0 0 4px 0 !important;
        }
        .kt-markdown-body p:last-child,
        .kt-markdown-sub p:last-child {
          margin-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default KeyTakeawaysView;
