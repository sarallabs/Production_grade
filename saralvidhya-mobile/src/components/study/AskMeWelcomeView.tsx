import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  Dimensions,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import AskMeHistoryView from './AskMeHistoryView';
import VoiceInputModal from './VoiceInputModal';
import { askGemini } from '@/services/askService';
import { speechService } from '@/services/speechService';
import { chatHistoryService, HistoryConversation } from '@/services/chatHistoryService';

const PLANT_BADGE = require('@/assets/images/entomology_plant_badge.png');

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const TRY_ASKING_PROMPTS = [
  'Explain insect digestion simply',
  'Summarize this chapter',
  'Give me 5 practice questions',
];

const HISTORY_DETAILS: Record<string, { user: string; bot: string }> = {
  conv_1: {
    user: 'How to kill cockroach?',
    bot: 'In agricultural entomology and domestic pest management, German & American cockroaches (*Periplaneta americana*) are managed using Integrated Pest Management (IPM):\n\n1. **Chemical Baits**: Fipronil or Hydramethylnon gel baits that act as GABA inhibitors and metabolic disruptors.\n2. **Desiccant Dusts**: Boric acid (H₃BO₃) and diatomaceous earth, which abrade the cuticular wax layer leading to fatal desiccation.\n3. **Insect Growth Regulators (IGRs)**: Pyriproxyfen and Hydroprene, preventing nymphal moults into reproductive adults.\n4. **Cultural Sanitation**: Eliminating moisture leaks and sealing cracks in wall voids.',
  },
  conv_2: {
    user: 'How long can a cockroach live?',
    bot: 'An adult American cockroach (*Periplaneta americana*) can survive for **1 to 2 years** under favorable conditions.\n\n**Notable survival capacities:**\n• **Without food**: Up to 1 month, sustained by rich lipid reserves in their fat body (*corpus adiposum*).\n• **Without water**: Approximately 1 week, as water loss occurs via spiracular respiration and excretion.\n• **Decapitation**: Can survive for about a week headless because their decentralized ventral nerve cord mediates reflexes, and respiration is through lateral thoracic/abdominal spiracles rather than a mouth or lungs.',
  },
  conv_3: {
    user: 'What is the life cycle of a cockroach?',
    bot: 'Cockroaches undergo **Hemimetabolous (gradual/paurometabolous) metamorphosis** comprising three main stages:\n\n1. **Egg**: Deposited in a dark, sclerotized purse-like capsule termed the **Ootheca**, containing 14–16 eggs arranged in bilateral rows.\n2. **Nymph**: Emerges after 30–60 days incubation. Resembles a miniature adult but is apterous (wingless) and sexually immature. Undergoes 6 to 13 instars over 6–12 months.\n3. **Adult (Imago)**: Exhibits fully formed tegmina (forewings), membranous flight hindwings, and complete reproductive apparatus.',
  },
  conv_4: {
    user: 'Explain respiratory system of insects',
    bot: 'The insect respiratory mechanism is **tracheal**, transporting gaseous O₂ directly to tissues without pigmentary blood transport:\n\n• **Spiracles**: Typically 10 pairs (2 thoracic, 8 abdominal) with cuticular peritremes and valve-closing apparatus.\n• **Tracheae**: Tough branching internal tubules lined with spiral cuticular thickenings called **Taenidia** to prevent collapse under negative pressure.\n• **Tracheoles**: Microscopic terminal tubules (<1 µm diameter) containing tissue fluid where actual molecular diffusion occurs.\n• **Ventilation**: Driven by dorsoventral abdominal muscle contractions and rhythmic spiracle opening.',
  },
  conv_5: {
    user: 'How do cockroaches breathe?',
    bot: 'Cockroaches breathe through a network of **10 pairs of spiracles** situated laterally along their pleura (mesothorax, metathorax, and the first 8 abdominal segments).\n\nWhen resting, oxygen diffuses passively down concentration gradients. During active locomotion or flight, telescoping movements of the tergo-sternal abdominal muscles expand and compress abdominal air sacs, driving unidirectional air currents through anterior spiracles and out posterior spiracles.',
  },
  conv_6: {
    user: 'What are the mouthparts of insects?',
    bot: 'Insect mouthparts are adapted from ancestral paired appendages on cephalic segments:\n\n1. **Labrum**: Upper flap-like lip covering the preoral cavity.\n2. **Mandibles**: Heavily sclerotized jaws with incisor teeth for cuticular biting and chewing.\n3. **Maxillae**: Paired sensory and masticatory appendages equipped with 5-segmented maxillary palps, galea, and lacinia.\n4. **Labium**: Lower lip formed by fused second maxillae with 3-segmented labial palps.\n5. **Hypopharynx**: Median tongue-like structure containing the salivarium outlet.',
  },
  conv_7: {
    user: 'Economic importance of insects',
    bot: 'Insects play dual, vital roles in agro-ecosystems and human economies:\n\n**Beneficial Insects:**\n• **Pollinators**: *Apis cerana indica*, bumblebees, syrphid flies facilitating 80%+ crop fruit set.\n• **Commercial Producers**: *Bombyx mori* (silk), *Apis mellifera* (honey & beeswax), *Kerria lacca* (lac shellac).\n• **Biocontrol Agents**: Predators like *Coccinella septempunctata* (aphid predator) and parasitoids like *Trichogramma chilonis*.\n\n**Injurious Insects:**\n• **Field Crop Pests**: Yellow stem borer (*Scirpophaga incertulas*), Brown planthopper (*Nilaparvata lugens*).\n• **Storage Pests**: Rice weevil (*Sitophilus oryzae*), Rust-red flour beetle (*Tribolium castaneum*).\n• **Disease Vectors**: Mosquitoes (*Anopheles*, *Aedes*), Aphids transmitting plant viruses.',
  },
};

type AskMeViewMode = 'welcome' | 'chat';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.90, 395);

interface AskMeWelcomeViewProps {
  chapterNumber?: number;
  chapterName?: string;
  onNavigateBack?: () => void;
}

export default function AskMeWelcomeView({
  chapterNumber = 1,
  chapterName = 'Insect Digestive System & Anatomy',
  onNavigateBack,
}: AskMeWelcomeViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { persona } = useAuth();
  const { isTablet } = useDeviceLayout();

  const [viewMode, setViewMode] = useState<AskMeViewMode>('welcome');
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv_2');
  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<HistoryConversation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat history from SQLite / AsyncStorage & ANGRAU curriculum DB records
  useEffect(() => {
    chatHistoryService.getConversations('ento101', chapterNumber).then((data) => {
      setConversations(data);
    });
  }, [chapterNumber]);

  // Auto-scroll and keep input bar lifted above Android/iOS keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 60);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto scroll to latest bot answer
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, isGenerating]);

  // Left slide drawer state and animation
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const isDrawerOpenRef = useRef(false);
  isDrawerOpenRef.current = isDrawerOpen;

  // Exact color palettes from Figma DevMode CSS exports
  const colors = isDark
    ? {
        screenBg: '#2D3E36',
        headerBg: '#1E2B24',
        divider: '#3D5449',
        logoBoxBg: '#273a31',
        primaryText: '#f0f6f1',
        subText: '#b0c4b6',
        optionsBtnBg: '#2a3b31',
        cardBg: '#1E2B24',
        cardBorder: '#3D5449',
        avatarBg: '#2a3b31',
        avatarText: '#459d5c',
        primaryButtonBg: '#459d5c',
        primaryButtonText: '#ffffff',
        secondaryButtonBg: '#2a3b31',
        secondaryButtonBorder: '#3D5449',
        secondaryButtonText: '#f0f6f1',
        sparkleBg: '#355044',
        sparkleColor: '#459d5c',
        promptCardBg: '#1E2B24',
        promptCardBorder: '#3D5449',
        arrowColor: '#459d5c',
        infoBannerBg: '#2a3b31',
        infoBannerTitle: '#459d5c',
        infoBannerSub: '#b0c4b6',
        inputBarBg: '#2a3b31',
        inputBarBorder: '#3D5449',
        inputPlaceholder: '#93a99a',
        inputText: '#f0f6f1',
        micBg: '#1E2B24',
        micColor: '#b0c4b6',
        sendBg: '#459d5c',
        sendColor: '#ffffff',
        chatBubbleUser: '#2a3b31',
        chatBubbleBot: '#1E2B24',
      }
    : {
        screenBg: '#FFF6F1',
        headerBg: '#ffffff',
        divider: '#E5DDD8',
        logoBoxBg: 'rgba(111, 154, 127, 0.2)',
        primaryText: '#263b31',
        subText: '#6d8074',
        optionsBtnBg: '#e8f1eb',
        cardBg: '#ffffff',
        cardBorder: '#d5e3d9',
        avatarBg: '#e8f1eb',
        avatarText: '#315b46',
        primaryButtonBg: '#315b46',
        primaryButtonText: '#ffffff',
        secondaryButtonBg: '#e8f1eb',
        secondaryButtonBorder: '#d5e3d9',
        secondaryButtonText: '#263b31',
        sparkleBg: '#d7e7dc',
        sparkleColor: '#315b46',
        promptCardBg: '#ffffff',
        promptCardBorder: '#d5e3d9',
        arrowColor: '#315b46',
        infoBannerBg: '#e8f1eb',
        infoBannerTitle: '#315b46',
        infoBannerSub: '#6d8074',
        inputBarBg: '#e8f1eb',
        inputBarBorder: '#d5e3d9',
        inputPlaceholder: '#8a9a8f',
        inputText: '#263b31',
        micBg: '#ffffff',
        micColor: '#315b46',
        sendBg: '#315b46',
        sendColor: '#ffffff',
        chatBubbleUser: '#e8f1eb',
        chatBubbleBot: '#ffffff',
      };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.spring(drawerX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 3,
      speed: 14,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerX, {
      toValue: -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  };

  // PanResponder to allow holding and dragging or clicking the slide bar arrow
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 4,
      onPanResponderMove: (_, gestureState) => {
        const base = isDrawerOpenRef.current ? 0 : -DRAWER_WIDTH;
        let nextX = base + gestureState.dx;
        if (nextX > 0) nextX = 0;
        if (nextX < -DRAWER_WIDTH) nextX = -DRAWER_WIDTH;
        drawerX.setValue(nextX);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Click / Tap detection (barely moved) -> toggle drawer open/close
        if (Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8) {
          Haptics.selectionAsync();
          if (isDrawerOpenRef.current) {
            closeDrawer();
          } else {
            openDrawer();
          }
          return;
        }

        // Drag detection:
        if (!isDrawerOpenRef.current) {
          if (gestureState.dx > 45 || gestureState.vx > 0.3) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openDrawer();
          } else {
            closeDrawer();
          }
        } else {
          if (gestureState.dx < -45 || gestureState.vx < -0.3) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            closeDrawer();
          } else {
            openDrawer();
          }
        }
      },
    })
  ).current;

  const getKnowledgeResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('digestion') || q.includes('digestive') || q.includes('simply')) {
      return (
        `**Insect Digestion Simplified (${chapterName}):**\n\n` +
        `1. **Foregut (Stomodaeum)**: Ingestion & mechanical chewing (Proventriculus gizzard with 6 cuticular teeth).\n` +
        `2. **Midgut (Mesenteron)**: True enzymatic digestion & nutrient absorption across naked endodermal microvilli protected by the peritrophic membrane.\n` +
        `3. **Hindgut (Proctodaeum)**: Waste excretion and 90%+ water reabsorption through specialized rectal pads (papillae).\n\n` +
        `*Key Rule: Foregut & Hindgut shed cuticles during moults; Midgut does not!*`
      );
    }

    if (q.includes('summarize') || q.includes('summary')) {
      return (
        `**Chapter ${chapterNumber} High-Yield Summary:**\n\n` +
        `• **Tripartite Division**: Stomodaeum (ectodermal), Mesenteron (endodermal), Proctodaeum (ectodermal).\n` +
        `• **Peritrophic Membrane**: Ultrafilter matrix of chitin and glycoprotein shielding midgut cells from coarse food.\n` +
        `• **Histology Layers**: Cuticular intima -> Epithelium -> Circular Muscle -> Longitudinal Muscle -> Peritoneal Sheath.\n` +
        `• **Key Enzymes**: Amylase, Invertase, Proteases, and Lipases primarily secreted in ventriculus caeca.`
      );
    }

    if (q.includes('question') || q.includes('practice') || q.includes('5')) {
      return (
        `**Top 5 ANGRAU Semester Exam Questions for Ch ${chapterNumber}:**\n\n` +
        `1. **[2 Marks]** Name the three embryonic divisions of the insect alimentary canal and their germ layer origins.\n` +
        `2. **[2 Marks]** What is the function of the gastric caeca?\n` +
        `3. **[5 Marks]** Draw and label the histological cross-section of the insect proventriculus.\n` +
        `4. **[5 Marks]** Distinguish between Type-I and Type-II peritrophic membranes.\n` +
        `5. **[10 Marks]** Describe the complete anatomy, histology, and physiological mechanism of insect digestion with a neat diagram.`
      );
    }

    if (q.includes('cockroach') || q.includes('kill') || q.includes('live')) {
      return (
        `**ANGRAU Entomology Study Notes (*Periplaneta americana*):**\n\n` +
        `• **Lifespan**: Adults survive 1–2 years; up to 1 month without food, 1 week without water.\n` +
        `• **Respiration**: Tracheal system with 10 pairs of spiracles. Taenidia keep tubes open.\n` +
        `• **Management**: Gel baits (Fipronil / Hydramethylnon), desiccant dusts (Boric acid), and IGRs.`
      );
    }

    return (
      `**Saral AI Response (${persona.toUpperCase()} Mode):**\n\n` +
      `Regarding "${query}":\n\n` +
      `In ANGRAU Entomology (${chapterName}), the physiological anatomy functions as an integrated survival pipeline. Foregut handles mechanical processing, midgut accomplishes enzymatic digestion, and the tracheal spiracles regulate respiration independently of blood hemolymph.\n\n` +
      `Would you like a step-by-step breakdown or related practice questions?`
    );
  };

  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Subscribe to speechService updates to guarantee sync across all state changes
  useEffect(() => {
    const unsubscribe = speechService.subscribe(
      (isSpeaking, _isPaused, _cur, _tot, activeMsgId) => {
        setSpeakingMsgId(isSpeaking ? activeMsgId || null : null);
      },
    );
    return () => {
      unsubscribe();
      speechService.stop();
    };
  }, []);

  const handleToggleSpeakMessage = async (msg: ChatMessage) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (speakingMsgId === msg.id) {
      await speechService.stop();
    } else {
      await speechService.speakMessage(msg.id, msg.text, 1.0);
    }
  };

  const handleSendQuery = async (textToSend?: string, autoSpeak: boolean = false) => {
    Keyboard.dismiss();
    speechService.stop();
    const query = (textToSend || inputQuestion).trim();
    if (!query || isGenerating) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode('chat');
    setInputQuestion('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    try {
      const res = await askGemini(
        query,
        'ento101',
        chapterName,
        chapterNumber,
        persona,
      );

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: res.answer,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Record to persistent History like Web App and update History Drawer
      chatHistoryService.recordConversation('ento101', chapterNumber, query, res.answer, persona).then((recorded) => {
        setConversations((prev) => [recorded, ...prev.filter((c) => c.title !== recorded.title)]);
      });

      // Live TTS: Automatically speak the answer aloud when requested via voice/mic
      if (autoSpeak) {
        setTimeout(() => {
          speechService.speakMessage(botMsg.id, res.answer, 1.0);
        }, 300);
      }
    } catch (err) {
      console.warn('[AskMeWelcomeView] askGemini call error:', err);
      const fallbackText = getKnowledgeResponse(query);
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: fallbackText,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, botMsg]);

      // Record fallback knowledge answer to History
      chatHistoryService.recordConversation('ento101', chapterNumber, query, fallbackText, persona).then((recorded) => {
        setConversations((prev) => [recorded, ...prev.filter((c) => c.title !== recorded.title)]);
      });

      if (autoSpeak) {
        setTimeout(() => {
          speechService.speakMessage(botMsg.id, fallbackText, 1.0);
        }, 300);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistoryConversation = (item: HistoryConversation) => {
    setSelectedConversationId(item.id);
    if (item.messages && item.messages.length > 0) {
      setMessages(
        item.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          timestamp: m.timestamp,
        }))
      );
    } else {
      const detail = HISTORY_DETAILS[item.id];
      if (detail) {
        setMessages([
          {
            id: `${item.id}_user`,
            sender: 'user',
            text: detail.user,
            timestamp: item.timestamp,
          },
          {
            id: `${item.id}_bot`,
            sender: 'bot',
            text: detail.bot,
            timestamp: item.timestamp,
          },
        ]);
      } else {
        setMessages([
          {
            id: `${item.id}_user`,
            sender: 'user',
            text: item.title,
            timestamp: item.timestamp,
          },
          {
            id: `${item.id}_bot`,
            sender: 'bot',
            text: getKnowledgeResponse(item.title),
            timestamp: item.timestamp,
          },
        ]);
      }
    }
    setViewMode('chat');
  };

  const handleResetToWelcome = () => {
    Haptics.selectionAsync();
    setMessages([]);
    setInputQuestion('');
    setViewMode('welcome');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.screenBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header Bar */}
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
          {viewMode === 'chat' && (
            <TouchableOpacity
              style={styles.backArrowBtn}
              onPress={() => {
                Haptics.selectionAsync();
                setViewMode('welcome');
              }}
              activeOpacity={0.7}
              accessibilityLabel="Back to welcome"
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

        {/* Options button (⋯) - Exactly matches Figma! */}
        <TouchableOpacity
          style={[
            styles.optionsButton,
            {
              backgroundColor: colors.optionsBtnBg,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            openDrawer();
          }}
          activeOpacity={0.75}
          accessibilityLabel="Options and History"
        >
          <Text style={[styles.optionsDots, { color: colors.primaryText }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {viewMode === 'welcome' ? (
          /* Welcome View */
          <View style={styles.welcomeStack}>
            {/* Hi there card */}
            <View
              style={[
                styles.welcomeCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.avatarRow}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.avatarBg }]}>
                  <Text style={[styles.avatarLetter, { color: colors.avatarText }]}>S</Text>
                </View>

                <View style={styles.greetingWrap}>
                  <Text style={[styles.greetingTitle, { color: colors.primaryText }]}>
                    Hi there! I'm Saral,
                  </Text>
                  <Text style={[styles.greetingSub, { color: colors.subText }]}>
                    Let's explore together.
                  </Text>
                </View>
              </View>

              <Text style={[styles.askMeDesc, { color: colors.primaryText }]}>
                Ask me anything about your course, or get a simple step-by-step explanation.
              </Text>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: colors.primaryButtonBg }]}
                  onPress={() => handleSendQuery('What are the key concepts of this unit?')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionSparkleCircle, { backgroundColor: colors.sparkleBg }]}>
                    <Text style={[styles.sparkleIcon, { color: colors.sparkleColor }]}>✦</Text>
                  </View>
                  <Text style={[styles.primaryActionText, { color: colors.primaryButtonText }]}>
                    Ask questions
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: colors.secondaryButtonBg,
                      borderColor: colors.secondaryButtonBorder,
                    },
                  ]}
                  onPress={() => handleSendQuery('Explain this chapter step by step')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionSparkleCircle, { backgroundColor: colors.sparkleBg }]}>
                    <Text style={[styles.sparkleIcon, { color: colors.sparkleColor }]}>✧</Text>
                  </View>
                  <Text style={[styles.secondaryActionText, { color: colors.secondaryButtonText }]}>
                    Explain a topic
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Try Asking Section */}
            <View style={styles.tryAskingSection}>
              <Text style={[styles.tryAskingTitle, { color: colors.primaryText }]}>
                Try asking
              </Text>

              <View style={styles.promptsList}>
                {TRY_ASKING_PROMPTS.map((promptText, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.promptCard,
                      {
                        backgroundColor: colors.promptCardBg,
                        borderColor: colors.promptCardBorder,
                      },
                    ]}
                    onPress={() => handleSendQuery(promptText)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.promptText, { color: colors.primaryText }]}>
                      {promptText}
                    </Text>
                    <Text style={[styles.promptArrow, { color: colors.arrowColor }]}>↗</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Study Smarter Banner Card */}
            <View
              style={[
                styles.infoBannerCard,
                { backgroundColor: colors.infoBannerBg },
              ]}
            >
              <Text style={[styles.infoBannerTitle, { color: colors.infoBannerTitle }]}>
                Study smarter with Saral
              </Text>
              <Text style={[styles.infoBannerSub, { color: colors.infoBannerSub }]}>
                Answers grounded in your course material.
              </Text>
            </View>
          </View>
        ) : (
          /* Active Chat Conversation */
          <View style={styles.chatConversationWrap}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowBot,
                  ]}
                >
                  {!isUser && (
                    <View style={[styles.botAvatarMini, { backgroundColor: colors.avatarBg }]}>
                      <Text style={[styles.botAvatarMiniText, { color: colors.avatarText }]}>S</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isUser
                        ? [styles.userBubble, { backgroundColor: colors.chatBubbleUser }]
                        : [
                            styles.botBubble,
                            {
                              backgroundColor: colors.chatBubbleBot,
                              borderColor: colors.cardBorder,
                            },
                          ],
                    ]}
                  >
                    {isUser ? (
                      <Text style={[styles.messageText, { color: colors.primaryText }]}>
                        {msg.text}
                      </Text>
                    ) : (
                      <Markdown
                        style={{
                          body: {
                            color: colors.primaryText,
                            fontSize: 14.5,
                            lineHeight: 22,
                          },
                          paragraph: {
                            marginTop: 2,
                            marginBottom: 8,
                          },
                          strong: {
                            fontWeight: '700',
                            color: isDark ? '#FFFFFF' : '#1C2E24',
                          },
                          em: {
                            fontStyle: 'italic',
                            color: colors.primaryText,
                          },
                          bullet_list: {
                            marginTop: 4,
                            marginBottom: 8,
                          },
                          ordered_list: {
                            marginTop: 4,
                            marginBottom: 8,
                          },
                          list_item: {
                            marginVertical: 2,
                          },
                          heading1: {
                            fontSize: 17,
                            fontWeight: '800',
                            color: isDark ? '#4ADE80' : '#147A43',
                            marginVertical: 6,
                          },
                          heading2: {
                            fontSize: 16,
                            fontWeight: '700',
                            color: isDark ? '#4ADE80' : '#147A43',
                            marginVertical: 4,
                          },
                          heading3: {
                            fontSize: 15,
                            fontWeight: '700',
                            color: isDark ? '#4ADE80' : '#147A43',
                            marginVertical: 4,
                          },
                        }}
                      >
                        {msg.text}
                      </Markdown>
                    )}

                    {!isUser && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor:
                              speakingMsgId === msg.id
                                ? (isDark ? '#147A43' : '#E8F5ED')
                                : (isDark ? '#2D3E36' : '#F1F5F2'),
                            borderWidth: 1,
                            borderColor: speakingMsgId === msg.id ? '#22c55e' : colors.cardBorder,
                          }}
                          onPress={() => handleToggleSpeakMessage(msg)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={speakingMsgId === msg.id ? 'pause-circle' : 'volume-high-outline'}
                            size={15}
                            color={speakingMsgId === msg.id ? '#22c55e' : colors.subText}
                          />
                          <Text
                            style={{
                              fontSize: 11.5,
                              fontWeight: '700',
                              color: speakingMsgId === msg.id ? '#22c55e' : colors.subText,
                            }}
                          >
                            {speakingMsgId === msg.id ? 'Playing Voice Over • Tap to Stop' : 'Voice Over'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isGenerating && (
              <View style={styles.botThinkingRow}>
                <View style={[styles.botAvatarMini, { backgroundColor: colors.avatarBg }]}>
                  <Text style={[styles.botAvatarMiniText, { color: colors.avatarText }]}>S</Text>
                </View>
                <View
                  style={[
                    styles.botBubble,
                    {
                      backgroundColor: colors.chatBubbleBot,
                      borderColor: colors.cardBorder,
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <ActivityIndicator size="small" color={colors.primaryButtonBg} />
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* AI Grounding Disclaimer */}
      <Text style={[styles.disclaimerText, { color: colors.subText }]}>
        AI answers are based on your learning material
      </Text>

      {/* Bottom Sticky Input Bar */}
      <View
        style={[
          styles.bottomInputContainer,
          {
            backgroundColor: colors.headerBg,
            borderTopColor: colors.divider,
            paddingBottom: keyboardHeight > 0 ? 8 : (insets.bottom > 0 ? insets.bottom : 12),
            marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
          },
        ]}
      >
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.inputBarBg,
              borderColor: colors.inputBarBorder,
            },
          ]}
        >
          {/* Sparkle icon */}
          <View style={[styles.inputSparkleCircle, { backgroundColor: colors.primaryButtonBg }]}>
            <Text style={styles.inputSparkleText}>✦</Text>
          </View>

          {/* Text Input */}
          <TextInput
            style={[styles.chatInput, { color: colors.inputText }]}
            placeholder="Type your question..."
            placeholderTextColor={colors.inputPlaceholder}
            value={inputQuestion}
            onChangeText={setInputQuestion}
            onSubmitEditing={() => handleSendQuery()}
            returnKeyType="send"
          />

          {/* Voice Mic Button */}
          <TouchableOpacity
            style={[styles.micButton, { backgroundColor: colors.micBg }]}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync();
              Keyboard.dismiss();
              setIsVoiceModalOpen(true);
            }}
          >
            <Ionicons name="mic-outline" size={18} color={colors.micColor} />
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.sendBg }]}
            onPress={() => handleSendQuery()}
            activeOpacity={0.8}
          >
            <Text style={[styles.sendIcon, { color: colors.sendColor }]}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backdrop overlay when history drawer is open */}
      {isDrawerOpen && (
        <Animated.View
          style={[
            styles.drawerBackdrop,
            {
              opacity: drawerX.interpolate({
                inputRange: [-DRAWER_WIDTH, 0],
                outputRange: [0, 0.55],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeDrawer}
          />
        </Animated.View>
      )}

      {/* Sliding Drawer Container on Left Side */}
      <Animated.View
        style={[
          styles.drawerWrapper,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX: drawerX }],
            backgroundColor: colors.screenBg,
            borderRightColor: colors.divider,
          },
        ]}
      >
        {/* Drawer Content: Full History Screen */}
        <View style={styles.drawerInner}>
          <AskMeHistoryView
            selectedId={selectedConversationId}
            chapterNumber={chapterNumber}
            subjectId="ento101"
            conversations={conversations}
            onSelectConversation={(item) => {
              closeDrawer();
              handleSelectHistoryConversation(item);
            }}
            onNewConversation={() => {
              closeDrawer();
              handleResetToWelcome();
            }}
            onNavigateBack={closeDrawer}
            onSendNewQuery={(query) => {
              closeDrawer();
              handleSendQuery(query);
            }}
            onDeleteConversation={(convId) => {
              setConversations((prev) => prev.filter((c) => c.id !== convId));
            }}
          />
        </View>

        {/* Slide Bar Arrow Handle - Pinned to the Left side when closed, moves with drawer */}
        <View
          style={[
            styles.slideBarHandle,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.slideBarGripIndicator}>
            <View style={[styles.gripLine, { backgroundColor: colors.divider }]} />
            <View style={[styles.gripLine, { backgroundColor: colors.divider }]} />
          </View>
          <Ionicons
            name={isDrawerOpen ? 'chevron-back' : 'chevron-forward'}
            size={18}
            color={colors.arrowColor}
          />
        </View>
      </Animated.View>

      {/* Voice Recognition Modal */}
      <VoiceInputModal
        visible={isVoiceModalOpen}
        chapterNumber={chapterNumber}
        chapterName={chapterName}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscript={(spokenText) => {
          setIsVoiceModalOpen(false);
          handleSendQuery(spokenText, true /* Live TTS enabled */);
        }}
      />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  tabletContainer: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  welcomeStack: {
    flexDirection: 'column',
    gap: 16,
  },
  welcomeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'column',
    gap: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
  },
  greetingWrap: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  greetingTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  askMeDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  primaryActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  actionSparkleCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleIcon: {
    fontSize: 13,
    fontWeight: '800',
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  tryAskingSection: {
    flexDirection: 'column',
    gap: 10,
  },
  tryAskingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  promptsList: {
    flexDirection: 'column',
    gap: 10,
  },
  promptCard: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  promptText: {
    fontSize: 12,
    fontWeight: '500',
  },
  promptArrow: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoBannerCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'column',
    gap: 4,
  },
  infoBannerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  infoBannerSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  disclaimerText: {
    fontSize: 9.5,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  bottomInputContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  inputBar: {
    height: 58,
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
    fontSize: 14,
    fontWeight: '800',
  },
  chatConversationWrap: {
    flexDirection: 'column',
    gap: 14,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  botAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarMiniText: {
    fontSize: 13,
    fontWeight: '800',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '82%',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  botThinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Sliding drawer styles
  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    zIndex: 90,
  },
  drawerWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: 1,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  drawerInner: {
    flex: 1,
  },
  slideBarHandle: {
    position: 'absolute',
    right: -32,
    top: '42%',
    width: 32,
    height: 68,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
    paddingRight: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 3, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  slideBarGripIndicator: {
    flexDirection: 'column',
    gap: 3,
  },
  gripLine: {
    width: 3,
    height: 10,
    borderRadius: 1.5,
  },
});
