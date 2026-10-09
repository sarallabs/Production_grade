import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'What are the common 5-mark questions?',
  'Explain the peritrophic membrane simply',
  'What is the function of the proventriculus?',
  'Why does the midgut lack cuticular intima?',
];

export default function AskBotView({
  chapterNumber,
  chapterName,
}: {
  chapterNumber: number;
  chapterName: string;
}) {
  const { persona } = useAuth();
  const { isDark } = useAppTheme();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Namaste! I am your Saral Vidhya AI tutor for ANGRAU Entomology.\n\nI am currently analyzing **Chapter ${chapterNumber}: ${chapterName}** calibrated to your **${persona.toUpperCase()}** persona.\n\nAsk me any concept, exam question, or biological definition!`,
      timestamp: 'Just now',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const getKnowledgeResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('peritrophic') || q.includes('membrane')) {
      return (
        '**The Peritrophic Membrane (Key Exam Concept):**\n\n' +
        '1. **Origin**: Secreted by the midgut epithelial cells or specialized cells at the stomodaeal cardiac valve.\n' +
        '2. **Composition**: A meshwork of chitin fibrils embedded in a protein-carbohydrate matrix.\n' +
        '3. **Functions**:\n' +
        '   - Protects naked midgut microvilli from mechanical abrasion by rough food particles.\n' +
        '   - Barrier preventing bacteria, viruses, and parasites from invading the hemolymph.\n' +
        '   - Allows free diffusion of digestive enzymes into the food bolus and digested nutrients out into the epithelial cells.'
      );
    }

    if (q.includes('proventriculus') || q.includes('gizzard')) {
      return (
        '**Proventriculus / Gizzard (Foregut):**\n\n' +
        '- **Structure**: Muscular posterior portion of the foregut lined with heavy cuticular teeth.\n' +
        '- **Function**: Mechanically grinds and masticates solid food particles into a fine slurry in chewing insects (e.g. Grasshoppers, Cockroaches).\n' +
        '- **Valve**: Contains the stomodaeal (cardiac) valve that regulates food flow into the midgut and prevents backflow.'
      );
    }

    if (q.includes('5-mark') || q.includes('exam') || q.includes('pyq')) {
      return (
        '**Top 5-Mark Questions for Chapter 1 (ANGRAU):**\n\n' +
        '1. *Describe the structure and functions of the insect alimentary canal with a neat labeled diagram.*\n' +
        '2. *Differentiate between the Stomodaeum, Mesenteron, and Proctodaeum based on embryonic origin and cuticular lining.*\n' +
        '3. *Explain the role of Malpighian tubules and rectal papillae in insect water conservation and excretion.*'
      );
    }

    if (q.includes('intima') || q.includes('midgut') || q.includes('cuticular')) {
      return (
        '**Why the Midgut lacks cuticular intima:**\n\n' +
        'The foregut and hindgut arise from embryonic **ectoderm** and are lined with an impermeable cuticular intima that sheds during molting.\n\n' +
        'The midgut (Mesenteron) arises from embryonic **endoderm**. It must remain free of cuticular intima so its microvillar columnar cells can actively secrete digestive enzymes and absorb digested nutrients into the hemolymph.'
      );
    }

    return (
      `Regarding **${query}** in Chapter ${chapterNumber} (${chapterName}):\n\n` +
      `In ANGRAU B.Sc Agriculture curriculum, this concept forms part of the visceral physiological systems. ` +
      `Ensure you master the physiological sequence: Ingestion (Foregut) → Digestion & Absorption (Midgut) → Water reabsorption & Excretion (Hindgut).\n\n` +
      `*Tip: Draw the labeled diagram with foregut, midgut, hindgut, and Malpighian tubules to secure full marks in semester exams!*`
    );
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const botResponseText = getKnowledgeResponse(query);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: botResponseText,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 800);
  };

  return (
    <View style={styles.container}>
      {/* Bot Header Card */}
      <View
        style={[
          styles.botHeaderCard,
          {
            backgroundColor: isDark ? '#23322B' : '#ffffff',
            borderColor: isDark ? '#3D5449' : '#E5DDD8',
          },
        ]}
      >
        <View style={styles.botAvatarBadge}>
          <Ionicons name="sparkles" size={18} color="#22c55e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.botName, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
            Saral AI Study Tutor
          </Text>
          <Text style={styles.botStatus}>Grounded in Entomology Syllabus</Text>
        </View>
      </View>

      {/* Quick Prompts Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickPromptsScroll}
      >
        {QUICK_PROMPTS.map((prompt, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.quickPromptChip, { backgroundColor: isDark ? '#23322B' : '#ffffff', borderColor: isDark ? '#3D5449' : '#E5DDD8', borderWidth: 1 }]}
            onPress={() => handleSend(prompt)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={12} color="#22c55e" />
            <Text style={[styles.quickPromptText, { color: isDark ? '#FFFFFF' : '#1C2E24' }]} numberOfLines={1}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages List */}
      <View style={styles.messagesList}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubbleWrapper,
                isUser ? styles.userBubbleWrapper : styles.botBubbleWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isUser
                    ? styles.userBubble
                    : [
                        styles.botBubble,
                        {
                          backgroundColor: isDark ? '#23322B' : '#ffffff',
                          borderColor: isDark ? '#3D5449' : '#E5DDD8',
                        },
                      ],
                ]}
              >
                {!isUser && (
                  <View style={styles.botTagRow}>
                    <Ionicons name="school" size={12} color="#22c55e" />
                    <Text style={styles.botTag}>TUTOR RESPONSE</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.messageText,
                    isUser
                      ? styles.userMessageText
                      : { color: isDark ? '#FFFFFF' : '#1C2E24' },
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            </View>
          );
        })}

        {isLoading && (
          <View style={styles.botBubbleWrapper}>
            <View
              style={[
                styles.messageBubble,
                styles.botBubble,
                { backgroundColor: isDark ? '#23322B' : '#ffffff', borderColor: isDark ? '#3D5449' : '#E5DDD8' },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color="#22c55e" />
                <Text style={{ color: isDark ? '#A6C5B3' : '#688875', fontSize: 12 }}>Consulting syllabus notes...</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Input Bar */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? '#23322B' : '#ffffff',
            borderColor: isDark ? '#3D5449' : '#E5DDD8',
          },
        ]}
      >
        <TextInput
          style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}
          placeholder="Ask a question about this chapter..."
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  botHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 10,
    marginBottom: Spacing.two,
  },
  botAvatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#064e3b22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botName: {
    fontSize: 14,
    fontWeight: '800',
  },
  botStatus: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  quickPromptsScroll: {
    gap: 8,
    paddingVertical: 6,
    marginBottom: Spacing.three,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22c55e44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    maxWidth: 240,
  },
  quickPromptText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
  },
  messagesList: {
    gap: 12,
    marginBottom: Spacing.three,
  },
  messageBubbleWrapper: {
    width: '100%',
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
  },
  botBubbleWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '90%',
    padding: Spacing.three,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: '#22c55e',
    borderBottomRightRadius: 2,
  },
  botBubble: {
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  botTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  botTag: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userMessageText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
  },
});
