import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { MindmapData, MindmapNode } from '@/services/contentService';
import { BorderRadius, Spacing } from '@/constants/theme';

interface MindmapViewProps {
  data: MindmapData;
  chapterNumber: number;
}

const BRANCH_COLORS = [
  { bg: '#05966918', border: '#10b981', text: '#10b981', tag: 'ANTERIOR' },
  { bg: '#2563eb18', border: '#3b82f6', text: '#3b82f6', tag: 'MEDIAL' },
  { bg: '#d9770618', border: '#f59e0b', text: '#f59e0b', tag: 'POSTERIOR' },
  { bg: '#7c3aed18', border: '#8b5cf6', text: '#8b5cf6', tag: 'PHYSIOLOGY' },
  { bg: '#db277718', border: '#ec4899', text: '#ec4899', tag: 'PATHOLOGY' },
];

export default function MindmapView({ data, chapterNumber }: MindmapViewProps) {
  const { isDark } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});
  const [activeModalNode, setActiveModalNode] = useState<MindmapNode | null>(null);

  const toggleCollapse = (branchId: string) => {
    Haptics.selectionAsync();
    setCollapsedBranches((prev) => ({
      ...prev,
      [branchId]: !prev[branchId],
    }));
  };

  const handleNodeClick = (node: MindmapNode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModalNode(node);
  };

  const branches = data.rootNode.children;

  // Filter branches according to selected tab and search query
  const filteredBranches = branches
    .filter((b) => selectedBranchId === 'all' || b.id === selectedBranchId)
    .filter((b) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inTitle = b.title.toLowerCase().includes(q);
      const inDetails = b.details?.some((d) => d.toLowerCase().includes(q));
      const inKids = b.children.some(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.details?.some((d) => d.toLowerCase().includes(q))
      );
      return inTitle || inDetails || inKids;
    });

  return (
    <View style={styles.container}>
      {/* Search and Filter Ribbon */}
      <View style={styles.searchBarContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
        >
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="Search mindmap nodes, organs, enzymes..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Branch selector filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            selectedBranchId === 'all' && styles.chipActive,
            { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
          ]}
          onPress={() => setSelectedBranchId('all')}
        >
          <Text
            style={[
              styles.chipText,
              selectedBranchId === 'all' && styles.chipTextActive,
              { color: selectedBranchId === 'all' ? '#22c55e' : isDark ? '#94a3b8' : '#64748b' },
            ]}
          >
            All Branches ({branches.length})
          </Text>
        </TouchableOpacity>

        {branches.map((b, idx) => {
          const isSelected = selectedBranchId === b.id;
          const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
          return (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.chip,
                isSelected && { borderColor: color.border, backgroundColor: color.bg },
                { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
              ]}
              onPress={() => setSelectedBranchId(b.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && { color: color.text, fontWeight: '700' },
                  { color: isDark ? '#cbd5e1' : '#475569' },
                ]}
                numberOfLines={1}
              >
                {b.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Mindmap Hierarchical Tree */}
      <ScrollView
        style={styles.treeContainer}
        contentContainerStyle={styles.treeContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Root Core Node Card */}
        <View
          style={[
            styles.rootCard,
            {
              backgroundColor: isDark ? '#064e3b26' : '#ecfdf5',
              borderColor: '#10b981',
            },
          ]}
        >
          <View style={styles.rootBadgeRow}>
            <View style={styles.rootIconWrap}>
              <Ionicons name="git-network" size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rootSubTitle}>CHAPTER {chapterNumber} • CENTRAL CONCEPT</Text>
              <Text
                style={[styles.rootTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                numberOfLines={2}
              >
                {data.rootNode.title}
              </Text>
            </View>
          </View>
        </View>

        {/* Tree Connective Line */}
        <View style={styles.verticalTrunk} />

        {/* Branch Nodes */}
        {filteredBranches.map((branch, bIdx) => {
          const colorTheme = BRANCH_COLORS[bIdx % BRANCH_COLORS.length];
          const isCollapsed = !!collapsedBranches[branch.id];

          return (
            <View key={branch.id} style={styles.branchContainer}>
              {/* Branch Header Card */}
              <TouchableOpacity
                style={[
                  styles.branchCard,
                  {
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: colorTheme.border,
                  },
                ]}
                onPress={() => toggleCollapse(branch.id)}
                activeOpacity={0.8}
              >
                <View style={styles.branchHeaderRow}>
                  <View style={[styles.branchTagPill, { backgroundColor: colorTheme.bg }]}>
                    <Text style={[styles.branchTagText, { color: colorTheme.text }]}>
                      BRANCH {bIdx + 1}
                    </Text>
                  </View>

                  {branch.bloomLevel && (
                    <View style={styles.bloomPill}>
                      <Text style={styles.bloomText}>{branch.bloomLevel}</Text>
                    </View>
                  )}

                  <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={colorTheme.text}
                  />
                </View>

                <Text
                  style={[styles.branchTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                >
                  {branch.title}
                </Text>

                {branch.details && branch.details.length > 0 && (
                  <View style={styles.branchDetailsRow}>
                    {branch.details.map((d, dIdx) => (
                      <View key={dIdx} style={styles.bulletRow}>
                        <View style={[styles.bulletDot, { backgroundColor: colorTheme.border }]} />
                        <Text
                          style={[styles.bulletText, { color: isDark ? '#94a3b8' : '#64748b' }]}
                        >
                          {d}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>

              {/* Sub-branches and Leaves */}
              {!isCollapsed && branch.children.length > 0 && (
                <View style={styles.subBranchesContainer}>
                  {branch.children.map((sub, sIdx) => (
                    <TouchableOpacity
                      key={sub.id || sIdx}
                      style={[
                        styles.subCard,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                        },
                      ]}
                      onPress={() => handleNodeClick(sub)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.subCardHeader}>
                        <View style={styles.subIcon}>
                          <Ionicons name="folder-open" size={16} color={colorTheme.text} />
                        </View>
                        <Text
                          style={[styles.subTitle, { color: isDark ? '#f1f5f9' : '#1e293b' }]}
                        >
                          {sub.title}
                        </Text>
                        <Ionicons name="information-circle-outline" size={16} color="#94a3b8" />
                      </View>

                      {sub.details && sub.details.length > 0 && (
                        <View style={styles.leafTagContainer}>
                          {sub.details.map((leaf, lIdx) => (
                            <View
                              key={lIdx}
                              style={[
                                styles.leafTag,
                                {
                                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                  borderColor: isDark ? '#334155' : '#cbd5e1',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.leafTagText,
                                  { color: isDark ? '#cbd5e1' : '#334155' },
                                ]}
                                numberOfLines={2}
                              >
                                • {leaf}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Node Details Inspection Modal */}
      <Modal
        visible={!!activeModalNode}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveModalNode(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? '#111827' : '#ffffff',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="book" size={20} color="#10b981" />
                <Text style={styles.modalCategory}>ANGRAU CONCEPT INSPECTOR</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModalNode(null)}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {activeModalNode && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text
                  style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                >
                  {activeModalNode.title}
                </Text>

                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoLabel}>Syllabus Depth:</Text>
                  <Text style={styles.modalInfoVal}>
                    {activeModalNode.bloomLevel || 'High Yield Exam Concept'}
                  </Text>
                </View>

                <Text style={styles.modalSectionHeading}>Detailed Principles & Organs:</Text>
                {activeModalNode.details && activeModalNode.details.length > 0 ? (
                  activeModalNode.details.map((item, idx) => (
                    <View key={idx} style={styles.modalPointRow}>
                      <Ionicons name="checkmark-done" size={18} color="#10b981" />
                      <Text
                        style={[
                          styles.modalPointText,
                          { color: isDark ? '#cbd5e1' : '#334155' },
                        ]}
                      >
                        {item}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#94a3b8', fontStyle: 'italic', marginVertical: 8 }}>
                    Examine related chapters and readings for comprehensive anatomical models.
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setActiveModalNode(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseBtnText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  chipsScroll: {
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e18',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#22c55e',
  },
  treeContainer: {
    flex: 1,
  },
  treeContent: {
    paddingBottom: Spacing.xl * 2,
  },
  rootCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
  },
  rootBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rootIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10b98122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootSubTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.8,
  },
  rootTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  verticalTrunk: {
    width: 2,
    height: 20,
    backgroundColor: '#10b98166',
    alignSelf: 'center',
  },
  branchContainer: {
    marginBottom: Spacing.md,
  },
  branchCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  branchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  branchTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  branchTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bloomPill: {
    backgroundColor: '#3b82f618',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  bloomText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  branchTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 4,
  },
  branchDetailsRow: {
    marginTop: 4,
    gap: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    fontSize: 13,
    flex: 1,
  },
  subBranchesContainer: {
    marginLeft: Spacing.lg,
    marginTop: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: '#33415544',
    paddingLeft: Spacing.md,
    gap: Spacing.sm,
  },
  subCard: {
    padding: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 6,
  },
  subIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  leafTagContainer: {
    gap: 4,
  },
  leafTag: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  leafTagText: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
    backgroundColor: '#10b98115',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  modalInfoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  modalSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  modalPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 4,
  },
  modalPointText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  modalCloseBtn: {
    backgroundColor: '#10b981',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
