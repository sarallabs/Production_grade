import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import {
  chatHistoryService,
  HistoryConversation,
} from '@/services/chatHistoryService';

const PLANT_BADGE = require('@/assets/images/entomology_plant_badge.png');

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
}

interface AskMeHistoryViewProps {
  onSelectConversation: (item: HistoryConversation) => void;
  onNewConversation: () => void;
  onNavigateBack?: () => void;
  onSendNewQuery: (query: string) => void;
  selectedId?: string;
  chapterNumber?: number;
  subjectId?: string;
  conversations?: HistoryConversation[];
  onDeleteConversation?: (convId: string) => void;
}

export default function AskMeHistoryView({
  onSelectConversation,
  onNewConversation,
  onNavigateBack,
  onSendNewQuery,
  selectedId = '',
  chapterNumber = 1,
  subjectId = 'ento101',
  conversations: propConversations,
  onDeleteConversation,
}: AskMeHistoryViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSelectedId, setActiveSelectedId] = useState(selectedId);
  const [inputQuestion, setInputQuestion] = useState('');
  const [localConversations, setLocalConversations] = useState<HistoryConversation[]>([]);

  // Load conversations from service if not provided via props
  useEffect(() => {
    if (propConversations && propConversations.length > 0) {
      setLocalConversations(propConversations);
    } else {
      chatHistoryService.getConversations(subjectId, chapterNumber).then((data) => {
        setLocalConversations(data);
      });
    }
  }, [propConversations, chapterNumber, subjectId]);

  useEffect(() => {
    setActiveSelectedId(selectedId);
  }, [selectedId]);

  const colors = isDark
    ? {
        screenBg: '#2D3E36',
        headerBg: '#1E2B24',
        divider: '#3D5449',
        logoBoxBg: '#273a31',
        primaryText: '#f0f6f1',
        subText: '#b0c4b6',
        optionsBtnBg: '#2a3b31',
        optionsBtnBorder: '#3D5449',
        newBtnBg: '#2a3b31',
        newBtnBorder: '#3D5449',
        newBtnText: '#459d5c',
        searchBg: '#1E2B24',
        searchBorder: '#3D5449',
        searchPlaceholder: '#93a99a',
        cardDefaultBg: '#1E2B24',
        cardDefaultBorder: '#3D5449',
        cardActiveBg: '#2b4134',
        cardActiveBorder: '#78b68d',
        circleBg: '#2a3b31',
        sparkleColor: '#459d5c',
        timestampColor: '#b0c4b6',
        disclaimerColor: '#b0c4b6',
        bottomBg: '#1E2B24',
        bottomBorder: '#3D5449',
        inputPillBg: '#2a3b31',
        inputPillBorder: '#3D5449',
        inputSparkleBg: '#459d5c',
        inputPlaceholder: '#93a99a',
        inputText: '#f0f6f1',
        micColor: '#b0c4b6',
        micBg: '#1E2B24',
        sendBg: '#459d5c',
        sendIconColor: '#ffffff',
      }
    : {
        screenBg: '#FFF6F1',
        headerBg: '#ffffff',
        divider: '#E5DDD8',
        logoBoxBg: 'rgba(111, 154, 127, 0.2)',
        primaryText: '#263b31',
        subText: '#6d8074',
        optionsBtnBg: '#e8f1eb',
        optionsBtnBorder: '#d5e3d9',
        newBtnBg: '#e8f1eb',
        newBtnBorder: '#d5e3d9',
        newBtnText: '#315b46',
        searchBg: '#ffffff',
        searchBorder: '#d5e3d9',
        searchPlaceholder: '#8a9a8f',
        cardDefaultBg: '#ffffff',
        cardDefaultBorder: '#d5e3d9',
        cardActiveBg: '#e2efe6',
        cardActiveBorder: '#459d5c',
        circleBg: '#e8f1eb',
        sparkleColor: '#315b46',
        timestampColor: '#6d8074',
        disclaimerColor: '#6d8074',
        bottomBg: '#ffffff',
        bottomBorder: '#d5e3d9',
        inputPillBg: '#e8f1eb',
        inputPillBorder: '#d5e3d9',
        inputSparkleBg: '#315b46',
        inputPlaceholder: '#8a9a8f',
        inputText: '#263b31',
        micColor: '#6d8074',
        micBg: '#ffffff',
        sendBg: '#315b46',
        sendIconColor: '#ffffff',
      };

  const filteredHistory = localConversations.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleSelectItem = (item: HistoryConversation) => {
    Haptics.selectionAsync();
    setActiveSelectedId(item.id);
    onSelectConversation(item);
  };

  const handleDeleteItem = async (e: any, item: HistoryConversation) => {
    e.stopPropagation?.();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const updated = await chatHistoryService.deleteConversation(subjectId, chapterNumber, item.id);
    setLocalConversations(updated);
    if (onDeleteConversation) {
      onDeleteConversation(item.id);
    }
  };

  const handleSend = () => {
    const query = inputQuestion.trim();
    if (!query) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setInputQuestion('');
    onSendNewQuery(query);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.screenBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.divider,
            paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 4),
          },
        ]}
      >
        <View style={styles.headerLeft}>
          {onNavigateBack && (
            <TouchableOpacity
              style={styles.backArrowBtn}
              onPress={onNavigateBack}
              activeOpacity={0.7}
              accessibilityLabel="Back to Ask Me welcome"
            >
              <Ionicons name="arrow-back" size={22} color={colors.primaryText} />
            </TouchableOpacity>
          )}

          <View style={[styles.logoBox, { backgroundColor: colors.logoBoxBg }]}>
            <Image source={PLANT_BADGE} style={styles.logoImage} resizeMode="contain" />
          </View>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Ask Me History</Text>
            <Text style={[styles.headerSub, { color: colors.subText }]}>
              {localConversations.length} recorded discussions
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.optionsButton,
            {
              backgroundColor: colors.optionsBtnBg,
              borderColor: colors.optionsBtnBorder,
            },
          ]}
          onPress={onNewConversation}
          activeOpacity={0.75}
          accessibilityLabel="Start New conversation"
        >
          <Ionicons name="add" size={20} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section Heading & + New Button */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.recentTitle, { color: colors.primaryText }]}>
            Recent conversations
          </Text>

          <TouchableOpacity
            style={[
              styles.newButton,
              {
                backgroundColor: colors.newBtnBg,
                borderColor: colors.newBtnBorder,
              },
            ]}
            onPress={onNewConversation}
            activeOpacity={0.8}
            accessibilityLabel="Start new conversation"
          >
            <Text style={[styles.newButtonText, { color: colors.newBtnText }]}>+ New</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.searchBg,
              borderColor: colors.searchBorder,
            },
          ]}
        >
          <Ionicons name="search" size={16} color={colors.searchPlaceholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.primaryText }]}
            placeholder="Search your questions..."
            placeholderTextColor={colors.searchPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.subText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Conversations List */}
        <View style={styles.conversationsList}>
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.subText} />
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                {searchQuery ? 'No matching conversations' : 'No chat history recorded yet'}
              </Text>
            </View>
          ) : (
            filteredHistory.map((item) => {
              const isActive = item.id === activeSelectedId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.conversationCard,
                    {
                      backgroundColor: isActive ? colors.cardActiveBg : colors.cardDefaultBg,
                      borderColor: isActive ? colors.cardActiveBorder : colors.cardDefaultBorder,
                    },
                  ]}
                  onPress={() => handleSelectItem(item)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.sparkleCircle, { backgroundColor: colors.circleBg }]}>
                    <Ionicons name="chatbubble-ellipses" size={15} color={colors.sparkleColor} />
                  </View>

                  <View style={styles.cardContentWrap}>
                    <Text
                      style={[styles.cardTitle, { color: colors.primaryText }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.cardTimestamp, { color: colors.timestampColor }]}>
                      {item.timestamp}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => handleDeleteItem(e, item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.subText} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* AI Grounding Disclaimer */}
      <Text style={[styles.disclaimerText, { color: colors.disclaimerColor }]}>
        AI answers are based on ANGRAU learning materials
      </Text>

      {/* Bottom Sticky Input Bar */}
      <View
        style={[
          styles.bottomInputContainer,
          {
            backgroundColor: colors.bottomBg,
            borderTopColor: colors.bottomBorder,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
      >
        <View
          style={[
            styles.inputPill,
            {
              backgroundColor: colors.inputPillBg,
              borderColor: colors.inputPillBorder,
            },
          ]}
        >
          {/* Sparkle icon circle */}
          <View style={[styles.inputSparkleCircle, { backgroundColor: colors.inputSparkleBg }]}>
            <Text style={styles.inputSparkleText}>✦</Text>
          </View>

          {/* Text Input */}
          <TextInput
            style={[styles.chatInput, { color: colors.inputText }]}
            placeholder="Ask a new question..."
            placeholderTextColor={colors.inputPlaceholder}
            value={inputQuestion}
            onChangeText={setInputQuestion}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.sendBg }]}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Text style={[styles.sendIcon, { color: colors.sendIconColor }]}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backArrowBtn: {
    paddingRight: 4,
    justifyContent: 'center',
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 22,
    height: 28,
  },
  headerTitleWrap: {
    flexDirection: 'column',
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  optionsButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  tabletContainer: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  newButton: {
    width: 84,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchBar: {
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 0,
  },
  conversationsList: {
    flexDirection: 'column',
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  conversationCard: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  sparkleCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContentWrap: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  cardTimestamp: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  bottomInputContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputPill: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  inputSparkleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSparkleText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  chatInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
});
