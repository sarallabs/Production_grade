import React, { useState } from 'react';
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

const PLANT_BADGE = require('@/assets/images/entomology_plant_badge.png');

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
}

export const MOCK_HISTORY_CONVERSATIONS: HistoryItem[] = [
  {
    id: 'conv_1',
    title: 'How to kill cockroach?',
    timestamp: 'Today · 9:42 AM',
  },
  {
    id: 'conv_2',
    title: 'How long can a cockroach live?',
    timestamp: 'Today · 9:18 AM',
  },
  {
    id: 'conv_3',
    title: 'What is the life cycle of a cockroach?',
    timestamp: 'Yesterday',
  },
  {
    id: 'conv_4',
    title: 'Explain respiratory system of insects',
    timestamp: 'Yesterday',
  },
  {
    id: 'conv_5',
    title: 'How do cockroaches breathe?',
    timestamp: 'Oct 14',
  },
  {
    id: 'conv_6',
    title: 'What are the mouthparts of insects?',
    timestamp: 'Oct 13',
  },
  {
    id: 'conv_7',
    title: 'Economic importance of insects',
    timestamp: 'Oct 12',
  },
];

interface AskMeHistoryViewProps {
  onSelectConversation: (item: HistoryItem) => void;
  onNewConversation: () => void;
  onNavigateBack?: () => void;
  onSendNewQuery: (query: string) => void;
  selectedId?: string;
}

export default function AskMeHistoryView({
  onSelectConversation,
  onNewConversation,
  onNavigateBack,
  onSendNewQuery,
  selectedId = 'conv_2',
}: AskMeHistoryViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSelectedId, setActiveSelectedId] = useState(selectedId);
  const [inputQuestion, setInputQuestion] = useState('');

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

  const filteredHistory = MOCK_HISTORY_CONVERSATIONS.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const handleSelectItem = (item: HistoryItem) => {
    Haptics.selectionAsync();
    setActiveSelectedId(item.id);
    onSelectConversation(item);
  };

  const handleSend = () => {
    const query = inputQuestion.trim();
    if (!query) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Ask Me</Text>
            <Text style={[styles.headerSub, { color: colors.subText }]}>
              Saral Vidhya assistant
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
          accessibilityLabel="Options or New conversation"
        >
          <Text style={[styles.optionsDots, { color: colors.primaryText }]}>⋯</Text>
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
          <Text style={[styles.searchIcon, { color: colors.searchPlaceholder }]}>⌕</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.primaryText }]}
            placeholder="Search your questions"
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
          {filteredHistory.map((item) => {
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
                  <Text style={[styles.sparkleIcon, { color: colors.sparkleColor }]}>✦</Text>
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
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* AI Grounding Disclaimer */}
      <Text style={[styles.disclaimerText, { color: colors.disclaimerColor }]}>
        AI answers are based on your learning material
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
            placeholder="Type your question..."
            placeholderTextColor={colors.inputPlaceholder}
            value={inputQuestion}
            onChangeText={setInputQuestion}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          {/* Voice Mic Button */}
          <TouchableOpacity
            style={[styles.micButton, { backgroundColor: colors.micBg }]}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync();
              onSendNewQuery('Explain the respiratory system of insects');
            }}
          >
            <Ionicons name="mic-outline" size={18} color={colors.micColor} />
          </TouchableOpacity>

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
    fontSize: 10,
    fontWeight: '500',
  },
  optionsButton: {
    width: 50,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsDots: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
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
  searchIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 0,
  },
  conversationsList: {
    flexDirection: 'column',
    gap: 11,
  },
  conversationCard: {
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  sparkleCircle: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardContentWrap: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTimestamp: {
    fontSize: 10,
    fontWeight: '500',
  },
  disclaimerText: {
    fontSize: 9,
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
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  inputSparkleCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSparkleText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '800',
  },
  chatInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 15,
    fontWeight: '800',
  },
});
