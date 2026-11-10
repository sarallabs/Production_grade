/**
 * Oral Communication (Philippines Senior High School / Board) — Week 1 Mindmap
 * Lesson 1: Foundations, Nature, Elements, and Models of Communication
 *
 * Self-contained interactive HTML/SVG Mindmap Engine & Dataset (`mindmap.js`).
 * - Renders balanced left/right branches, cubic Bezier edges, collapsible nodes,
 *   interactive pan/zoom, Fit-to-screen, search highlight, and rich node details.
 * - Can be loaded directly in any HTML file via `<script src="mindmap.js"></script>`
 *   or imported as a module (`renderMindmap`, `MINDMAP_DATA`, `MINDMAP_MERMAID`, `generateStandaloneHTML`).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.OralCommWeek1Mindmap = api;
    root.MINDMAP_DATA = api.MINDMAP_DATA;
    root.MINDMAP_MERMAID = api.MINDMAP_MERMAID;
    root.renderMindmap = api.renderMindmap;
    root.generateStandaloneHTML = api.generateStandaloneHTML;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── 1. Mermaid Source (Matches mindmap.md) ─────────────────────────────────
  var MINDMAP_MERMAID = [
    'mindmap',
    '  root((Foundations, Nature, Elements, and Models of Communication))',
    '    1. Public Speaking in a Digital Age',
    '      Importance of Studying Communication',
    '        Empowerment: Language of Leadership (Beebe & Beebe; James Humes)',
    '        Employment: Top Attribute Sought by Employers',
    '        Audience-Centered Model: Audience as Core Focal Point',
    '        Public Speaking Apprehension across Speech Milestones',
    '      Liberal Art and Civic Right',
    '        Rooted in Ancient Greece and Rome',
    '        Free Speech as Bedrock of Democratic Governance',
    '        Critical Thinking: How to Think vs. What to Think',
    '      Communication in the Digital Age (ICT)',
    '        Mediated Channels: Videoconferencing, Webinars & Livestreams',
    '        Virtual Presence: Simulated Co-Presence Across Geography',
    '        Blending of Contexts: Public Speaking Meets Mass Media',
    '    2. House Rules, Netiquette & Ethics',
    '      Group Ground Rules',
    '        Punctuality and Technical Readiness',
    '        Disciplined Conversational Turn-Taking',
    '        Attentive Presence (Minimizing Multitasking)',
    '        Constructive Engagement (Critique Ideas, Not People)',
    '      Core Netiquette Guidelines (Verderber et al., 2017)',
    '        Polite Tone & Decorum (Avoid ALL CAPS Shouting)',
    '        Mindful Use of Emojis and Abbreviations',
    '        Brevity and Conciseness',
    '        Avoiding Flaming (No Aggressive Language)',
    '        Accountability and Fact Verification',
    '      Ethical Responsibilities & NCA Credo',
    '        Honesty (Avoid Plagiarism & Cyberplagiarism)',
    '        Integrity (Practicing What One Preaches)',
    '        Fairness (Impartial Evidence & Admitting Biases)',
    '        Respect (Inclusive Language & Honoring Diversity)',
    '        Responsibility (Accountability for Consequences)',
    '    3. Defining Communication',
    '      Scholarly Perspectives',
    '        Process-Centered (McCornack; Sipacio & Balgos): Sharing Messages Across Channels & Cultures',
    '        Relational/Meaning-Centered (Verderber; Beebe): Creating Shared Meaning',
    '        Systemic/Symbolic (Julia T. Wood): Interacting Through Symbols to Create Meaning',
    "      Wood's Systemic Framework (2012)",
    '        Process: Ongoing, Dynamic, and Continuous',
    '        Systemic: Interconnected Web of Environment, Culture & Mood',
    '        Symbols: Arbitrary, Ambiguous, and Abstract',
    '        Meaning Levels: Content Level (Literal) vs. Relationship Level (Status/Warmth)',
    '    4. Nature & Process of Communication',
    '      Fundamental Nature',
    '        Continuous and Dynamic Flow',
    '        Inherently Relational (Self or Others)',
    '        Multimodal (Verbal and Nonverbal Channels)',
    '        Irreversible and Unrepeatable',
    '      Six-Step Communication Cycle',
    '        1. Idea Generation: Speaker Conceives Thought or Intent',
    '        2. Encoding: Translating Ideas into Verbal/Nonverbal Symbols',
    '        3. Transmission: Sending Message Across Chosen Channel',
    '        4. Reception: Receiver Senses Auditory or Visual Signals',
    '        5. Decoding: Interpreting Symbols & Assigning Meaning',
    '        6. Feedback: Verbal or Nonverbal Response (e.g., Daphne & Rico Scenario)',
    '    5. Essential Elements of Communication',
    '      Core Components',
    '        Speaker (Source) & Receiver (Target Audience)',
    '        Message, Encoding & Decoding',
    '        Channel, Feedback, Context & Interference (Noise)',
    '      Types of Noise (Interference)',
    '        Physical (External): Traffic, Loud AC, Poor Connectivity',
    '        Physiological (Internal): Illness, Exhaustion, Hunger, Hearing Loss',
    '        Psychological (Internal): Anxiety, Biases, Stress, Daydreaming',
    '        Semantic: Technical Jargon, Ambiguous Phrasing & Cultural Idioms',
    '      Contextual Levels',
    '        Intrapersonal: Self-Talk and Internal Processing',
    '        Interpersonal: Dyadic Dialogue Between Two People',
    '        Small Group: 3 to 10 Participants Sharing an Objective',
    '        Public Communication: One Speaker Addressing >10 Listeners',
    '        Mass Communication: Institutional Media to Large Anonymous Audiences',
    '      The Rhetorical Situation (Bitzer; Verderber et al.)',
    '        Speaker: Credibility, Background & Motives',
    '        Audience: Audience Analysis and Adaptation',
    '        Occasion & Setting: Purpose, Venue & Time Constraints',
    '        Exigence: Urgent Need or Problem Resolved Through Discourse',
    '    6. Communication Models',
    '      Linear Models (One-Way Action)',
    "        Lasswell's Model (1948): Who, Says What, Channel, To Whom, With What Effect",
    '        Shannon-Weaver Model (1949): Source, Transmitter, Channel, Noise, Receiver, Destination',
    '        Key Limitation: Passive Receiver & Absence of Feedback',
    '      Interactive Models (Circular Interaction)',
    "        Wilbur Schramm's Model (1954): Two-Way Alternating Exchange",
    '        Feedback Loop: Delayed/Turn-Based Receiver Responses',
    '        Field of Experience: Overlapping Cultural & Personal Backgrounds Required',
    '      Transactional Models (Simultaneous Transaction)',
    '        Barnlund (1970), Wood (2012) & Verderber et al. (2017)',
    '        Simultaneous Transceivers: Concurrent Sending and Receiving',
    '        Dynamic Co-Creation of Meaning Within Multilayered Contexts',
    '    7. Effective Communication & Barriers',
    '      The 7 Cs (Cutlip, Center & Broom, 2012)',
    '        Completeness: All Essential Facts and Context',
    '        Conciseness: Direct and Free of Redundancy',
    '        Consideration: Adapted to Audience Background & Mindset',
    '        Concreteness: Backed by Specific Facts and Figures',
    '        Courtesy: Respectful Tone Cultivating Goodwill',
    '        Clearness: Plain, Precise, Focused Language',
    '        Correctness: Accurate Facts, Grammar, and Pronunciation',
    '      Barriers & Strategic Solutions',
    '        Emotional Barriers -> Pause, Regulate Emotions, or Postpone Dialogue',
    "        Use of Jargon -> Use Layman's Terms & Define Technical Concepts",
    '        Lack of Confidence -> Prepare Thoroughly, Rehearse & Focus on Audience',
    '        Environmental Noise -> Relocate, Use Amplification, or Adjust Volume'
  ].join('\n');

  // ─── 2. Rich Hierarchical Mindmap Data ──────────────────────────────────────
  var MINDMAP_DATA = {
    id: 'root',
    label: 'Foundations, Nature, Elements, and Models of Communication',
    summary:
      'Lesson 1 of Oral Communication in Context (Philippines Board): Core definitions, digital etiquette, ethics, the 6-step communication cycle, 9 essential elements, linear/interactive/transactional models, and the 7 Cs.',
    children: [
      {
        id: 'topic_1',
        label: '1. Public Speaking in a Digital Age',
        summary: 'Why oral communication matters for personal empowerment, career success, civic participation, and digital interaction.',
        children: [
          {
            id: 'sub_1_1',
            label: 'Importance of Studying Communication',
            summary: 'Public speaking is a sustained, formal presentation by a speaker to an audience (Verderber et al., 2017).',
            children: [
              { id: 'c_1_1_1', label: 'Empowerment: Language of Leadership (Beebe & Beebe; James Humes)' },
              { id: 'c_1_1_2', label: 'Employment: Top Attribute Sought by Employers' },
              { id: 'c_1_1_3', label: 'Audience-Centered Model: Audience as Core Focal Point' },
              { id: 'c_1_1_4', label: 'Public Speaking Apprehension across Speech Milestones' }
            ]
          },
          {
            id: 'sub_1_2',
            label: 'Liberal Art and Civic Right',
            summary: 'Revered since ancient Greece and Rome as a foundation of democratic life.',
            children: [
              { id: 'c_1_2_1', label: 'Rooted in Ancient Greece and Rome' },
              { id: 'c_1_2_2', label: 'Free Speech as Bedrock of Democratic Governance' },
              { id: 'c_1_2_3', label: 'Critical Thinking: How to Think vs. What to Think' }
            ]
          },
          {
            id: 'sub_1_3',
            label: 'Communication in the Digital Age (ICT)',
            summary: 'Information and Communication Technology transforms how messages travel and how audiences engage.',
            children: [
              { id: 'c_1_3_1', label: 'Mediated Channels: Videoconferencing, Webinars & Livestreams' },
              { id: 'c_1_3_2', label: 'Virtual Presence: Simulated Co-Presence Across Geography' },
              { id: 'c_1_3_3', label: 'Blending of Contexts: Public Speaking Meets Mass Media' }
            ]
          }
        ]
      },
      {
        id: 'topic_2',
        label: '2. House Rules, Netiquette & Ethics',
        summary: 'Behavioral norms, digital civility, and moral standards for speakers and listeners.',
        children: [
          {
            id: 'sub_2_1',
            label: 'Group Ground Rules',
            summary: 'Operational expectations for productive in-person and virtual classroom interaction.',
            children: [
              { id: 'c_2_1_1', label: 'Punctuality and Technical Readiness' },
              { id: 'c_2_1_2', label: 'Disciplined Conversational Turn-Taking' },
              { id: 'c_2_1_3', label: 'Attentive Presence (Minimizing Multitasking)' },
              { id: 'c_2_1_4', label: 'Constructive Engagement (Critique Ideas, Not People)' }
            ]
          },
          {
            id: 'sub_2_2',
            label: 'Core Netiquette Guidelines (Verderber et al., 2017)',
            summary: 'Social and behavioral etiquette rules for communicating over computer networks.',
            children: [
              { id: 'c_2_2_1', label: 'Polite Tone & Decorum (Avoid ALL CAPS Shouting)' },
              { id: 'c_2_2_2', label: 'Mindful Use of Emojis and Abbreviations' },
              { id: 'c_2_2_3', label: 'Brevity and Conciseness' },
              { id: 'c_2_2_4', label: 'Avoiding Flaming (No Aggressive Language)' },
              { id: 'c_2_2_5', label: 'Accountability and Fact Verification' }
            ]
          },
          {
            id: 'sub_2_3',
            label: 'Ethical Responsibilities & NCA Credo',
            summary: 'Five foundational moral standards and the National Communication Association (NCA) Credo.',
            children: [
              { id: 'c_2_3_1', label: 'Honesty (Avoid Plagiarism & Cyberplagiarism)' },
              { id: 'c_2_3_2', label: 'Integrity (Practicing What One Preaches)' },
              { id: 'c_2_3_3', label: 'Fairness (Impartial Evidence & Admitting Biases)' },
              { id: 'c_2_3_4', label: 'Respect (Inclusive Language & Honoring Diversity)' },
              { id: 'c_2_3_5', label: 'Responsibility (Accountability for Consequences)' }
            ]
          }
        ]
      },
      {
        id: 'topic_3',
        label: '3. Defining Communication',
        summary: 'Multidimensional scholarly definitions and Julia T. Wood’s systemic framework.',
        children: [
          {
            id: 'sub_3_1',
            label: 'Scholarly Perspectives',
            summary: 'Three complementary lenses for defining human communication.',
            children: [
              { id: 'c_3_1_1', label: 'Process-Centered (McCornack; Sipacio & Balgos): Sharing Messages Across Channels & Cultures' },
              { id: 'c_3_1_2', label: 'Relational/Meaning-Centered (Verderber; Beebe): Creating Shared Meaning' },
              { id: 'c_3_1_3', label: 'Systemic/Symbolic (Julia T. Wood): Interacting Through Symbols to Create Meaning' }
            ]
          },
          {
            id: 'sub_3_2',
            label: "Wood's Systemic Framework (2012)",
            summary: 'Four interrelated dimensions characterizing human communication.',
            children: [
              { id: 'c_3_2_1', label: 'Process: Ongoing, Dynamic, and Continuous' },
              { id: 'c_3_2_2', label: 'Systemic: Interconnected Web of Environment, Culture & Mood' },
              { id: 'c_3_2_3', label: 'Symbols: Arbitrary, Ambiguous, and Abstract' },
              { id: 'c_3_2_4', label: 'Meaning Levels: Content Level (Literal) vs. Relationship Level (Status/Warmth)' }
            ]
          }
        ]
      },
      {
        id: 'topic_4',
        label: '4. Nature & Process of Communication',
        summary: 'Core characteristics of communication and the sequential 6-step cycle.',
        children: [
          {
            id: 'sub_4_1',
            label: 'Fundamental Nature',
            summary: 'Inherent qualities of every communicative act.',
            children: [
              { id: 'c_4_1_1', label: 'Continuous and Dynamic Flow' },
              { id: 'c_4_1_2', label: 'Inherently Relational (Self or Others)' },
              { id: 'c_4_1_3', label: 'Multimodal (Verbal and Nonverbal Channels)' },
              { id: 'c_4_1_4', label: 'Irreversible and Unrepeatable' }
            ]
          },
          {
            id: 'sub_4_2',
            label: 'Six-Step Communication Cycle',
            summary: 'Illustrated by the Daphne & Rico scenario (Sipacio & Balgos, 2016).',
            children: [
              { id: 'c_4_2_1', label: '1. Idea Generation: Speaker Conceives Thought or Intent' },
              { id: 'c_4_2_2', label: '2. Encoding: Translating Ideas into Verbal/Nonverbal Symbols' },
              { id: 'c_4_2_3', label: '3. Transmission: Sending Message Across Chosen Channel' },
              { id: 'c_4_2_4', label: '4. Reception: Receiver Senses Auditory or Visual Signals' },
              { id: 'c_4_2_5', label: '5. Decoding: Interpreting Symbols & Assigning Meaning' },
              { id: 'c_4_2_6', label: '6. Feedback: Verbal or Nonverbal Response (e.g., Daphne & Rico Scenario)' }
            ]
          }
        ]
      },
      {
        id: 'topic_5',
        label: '5. Essential Elements of Communication',
        summary: 'The 9 building blocks, 4 noise types, 5 contextual levels, and the Rhetorical Situation.',
        children: [
          {
            id: 'sub_5_1',
            label: 'Core Components',
            summary: 'Nine discrete elements interacting to create or impede shared meaning.',
            children: [
              { id: 'c_5_1_1', label: 'Speaker (Source) & Receiver (Target Audience)' },
              { id: 'c_5_1_2', label: 'Message, Encoding & Decoding' },
              { id: 'c_5_1_3', label: 'Channel, Feedback, Context & Interference (Noise)' }
            ]
          },
          {
            id: 'sub_5_2',
            label: 'Types of Noise (Interference)',
            summary: 'Stimuli that distort, interrupt, or impede message fidelity.',
            children: [
              { id: 'c_5_2_1', label: 'Physical (External): Traffic, Loud AC, Poor Connectivity' },
              { id: 'c_5_2_2', label: 'Physiological (Internal): Illness, Exhaustion, Hunger, Hearing Loss' },
              { id: 'c_5_2_3', label: 'Psychological (Internal): Anxiety, Biases, Stress, Daydreaming' },
              { id: 'c_5_2_4', label: 'Semantic: Technical Jargon, Ambiguous Phrasing & Cultural Idioms' }
            ]
          },
          {
            id: 'sub_5_3',
            label: 'Contextual Levels',
            summary: 'Operational scales of human communication from self-talk to mass media.',
            children: [
              { id: 'c_5_3_1', label: 'Intrapersonal: Self-Talk and Internal Processing' },
              { id: 'c_5_3_2', label: 'Interpersonal: Dyadic Dialogue Between Two People' },
              { id: 'c_5_3_3', label: 'Small Group: 3 to 10 Participants Sharing an Objective' },
              { id: 'c_5_3_4', label: 'Public Communication: One Speaker Addressing >10 Listeners' },
              { id: 'c_5_3_5', label: 'Mass Communication: Institutional Media to Large Anonymous Audiences' }
            ]
          },
          {
            id: 'sub_5_4',
            label: 'The Rhetorical Situation (Bitzer; Verderber et al.)',
            summary: 'Convergence of Speaker, Audience, Occasion, and Exigence.',
            children: [
              { id: 'c_5_4_1', label: 'Speaker: Credibility, Background & Motives' },
              { id: 'c_5_4_2', label: 'Audience: Audience Analysis and Adaptation' },
              { id: 'c_5_4_3', label: 'Occasion & Setting: Purpose, Venue & Time Constraints' },
              { id: 'c_5_4_4', label: 'Exigence: Urgent Need or Problem Resolved Through Discourse' }
            ]
          }
        ]
      },
      {
        id: 'topic_6',
        label: '6. Communication Models',
        summary: 'Evolution from one-way signal transmission to circular interaction and simultaneous transaction.',
        children: [
          {
            id: 'sub_6_1',
            label: 'Linear Models (One-Way Action)',
            summary: 'Unidirectional transmission from active source to passive destination.',
            children: [
              { id: 'c_6_1_1', label: "Lasswell's Model (1948): Who, Says What, Channel, To Whom, With What Effect" },
              { id: 'c_6_1_2', label: 'Shannon-Weaver Model (1949): Source, Transmitter, Channel, Noise, Receiver, Destination' },
              { id: 'c_6_1_3', label: 'Key Limitation: Passive Receiver & Absence of Feedback' }
            ]
          },
          {
            id: 'sub_6_2',
            label: 'Interactive Models (Circular Interaction)',
            summary: 'Two-way alternating communication incorporating feedback and shared background.',
            children: [
              { id: 'c_6_2_1', label: "Wilbur Schramm's Model (1954): Two-Way Alternating Exchange" },
              { id: 'c_6_2_2', label: 'Feedback Loop: Delayed/Turn-Based Receiver Responses' },
              { id: 'c_6_2_3', label: 'Field of Experience: Overlapping Cultural & Personal Backgrounds Required' }
            ]
          },
          {
            id: 'sub_6_3',
            label: 'Transactional Models (Simultaneous Transaction)',
            summary: 'Multidirectional, concurrent co-creation of meaning within layered systems.',
            children: [
              { id: 'c_6_3_1', label: 'Barnlund (1970), Wood (2012) & Verderber et al. (2017)' },
              { id: 'c_6_3_2', label: 'Simultaneous Transceivers: Concurrent Sending and Receiving' },
              { id: 'c_6_3_3', label: 'Dynamic Co-Creation of Meaning Within Multilayered Contexts' }
            ]
          }
        ]
      },
      {
        id: 'topic_7',
        label: '7. Effective Communication & Barriers',
        summary: 'The 7 Cs of effective communication and actionable remedies for breakdowns.',
        children: [
          {
            id: 'sub_7_1',
            label: 'The 7 Cs (Cutlip, Center & Broom, 2012)',
            summary: 'Seven foundational principles for clear, audience-centered communication.',
            children: [
              { id: 'c_7_1_1', label: 'Completeness: All Essential Facts and Context' },
              { id: 'c_7_1_2', label: 'Conciseness: Direct and Free of Redundancy' },
              { id: 'c_7_1_3', label: 'Consideration: Adapted to Audience Background & Mindset' },
              { id: 'c_7_1_4', label: 'Concreteness: Backed by Specific Facts and Figures' },
              { id: 'c_7_1_5', label: 'Courtesy: Respectful Tone Cultivating Goodwill' },
              { id: 'c_7_1_6', label: 'Clearness: Plain, Precise, Focused Language' },
              { id: 'c_7_1_7', label: 'Correctness: Accurate Facts, Grammar, and Pronunciation' }
            ]
          },
          {
            id: 'sub_7_2',
            label: 'Barriers & Strategic Solutions',
            summary: 'Diagnosing common communication obstacles and applying targeted fixes.',
            children: [
              { id: 'c_7_2_1', label: 'Emotional Barriers -> Pause, Regulate Emotions, or Postpone Dialogue' },
              { id: 'c_7_2_2', label: "Use of Jargon -> Use Layman's Terms & Define Technical Concepts" },
              { id: 'c_7_2_3', label: 'Lack of Confidence -> Prepare Thoroughly, Rehearse & Focus on Audience' },
              { id: 'c_7_2_4', label: 'Environmental Noise -> Relocate, Use Amplification, or Adjust Volume' }
            ]
          }
        ]
      }
    ]
  };

  // ─── 3. Layout & Rendering Constants (Warm-Academic Forest & Sage Theme) ───
  var LEVEL_0_BG = '#25352C';
  var LEVEL_1_BG = '#375545';
  var LEVEL_2_BG = '#527964';
  var LEVEL_3_BG = '#6E957E';
  var H_GAP = 140;
  var V_GAP = 22;
  var MIN_Z = 0.2;
  var MAX_Z = 2.8;
  var FONT = "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  var _measureCtx = null;
  function measureText(text, font) {
    if (typeof document !== 'undefined') {
      if (!_measureCtx) {
        var c = document.createElement('canvas');
        _measureCtx = c.getContext('2d');
      }
      if (_measureCtx) {
        _measureCtx.font = font;
        return _measureCtx.measureText(text).width;
      }
    }
    return text.length * 7.2;
  }

  function styleForDepth(depth) {
    if (depth === 0) return { font: '700 14px ' + FONT, px: 22, py: 14, lineH: 19, maxW: 250, bg: LEVEL_0_BG };
    if (depth === 1) return { font: '700 13px ' + FONT, px: 16, py: 11, lineH: 17, maxW: 230, bg: LEVEL_1_BG };
    if (depth === 2) return { font: '600 12px ' + FONT, px: 14, py: 9, lineH: 16, maxW: 220, bg: LEVEL_2_BG };
    return { font: '500 11.5px ' + FONT, px: 12, py: 7, lineH: 15, maxW: 240, bg: LEVEL_3_BG };
  }

  function wrapLines(label, font, maxW) {
    var words = String(label || '').split(/\s+/);
    var lines = [];
    var cur = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var candidate = cur ? cur + ' ' + w : w;
      if (cur && measureText(candidate, font) > maxW) {
        lines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  function subtreeWeight(node, collapsedSet) {
    if (collapsedSet.has(node.id) || !node.children || !node.children.length) return 1;
    var total = 1;
    for (var i = 0; i < node.children.length; i++) {
      total += subtreeWeight(node.children[i], collapsedSet);
    }
    return total;
  }

  function computeMindmapLayout(rootNode, collapsedSet) {
    var map = {};
    var kidsOf = {};

    // Balance first-level branches left and right by weight
    var rWeight = 0;
    var lWeight = 0;
    var sideOf = {};
    var topChildren = rootNode.children || [];
    for (var i = 0; i < topChildren.length; i++) {
      var ch = topChildren[i];
      var side = rWeight <= lWeight ? 'r' : 'l';
      sideOf[ch.id] = side;
      var w = subtreeWeight(ch, collapsedSet);
      if (side === 'r') rWeight += w;
      else lWeight += w;
    }

    function walk(n, parentId, depth, side) {
      if (depth === 1) side = sideOf[n.id] || 'r';
      var st = styleForDepth(depth);
      var lines = wrapLines(n.label, st.font, st.maxW);
      var maxLineW = 0;
      for (var i = 0; i < lines.length; i++) {
        var lw = measureText(lines[i], st.font);
        if (lw > maxLineW) maxLineW = lw;
      }
      var w = Math.max(depth === 0 ? 220 : depth === 1 ? 210 : 170, Math.ceil(maxLineW) + st.px * 2);
      var h = Math.ceil(lines.length * st.lineH) + st.py * 2;
      var kids = n.children || [];
      var isCollapsed = collapsedSet.has(n.id);

      var lnode = {
        id: n.id,
        label: n.label,
        summary: n.summary || '',
        lines: lines,
        depth: depth,
        side: side,
        bg: st.bg,
        font: st.font,
        lineH: st.lineH,
        px: st.px,
        py: st.py,
        w: w,
        h: h,
        x: 0,
        y: 0,
        sub: 0,
        parentId: parentId,
        hasKids: kids.length > 0,
        collapsed: isCollapsed,
        kidCount: kids.length
      };
      map[n.id] = lnode;

      var childLayoutNodes = [];
      if (!isCollapsed) {
        for (var j = 0; j < kids.length; j++) {
          walk(kids[j], n.id, depth + 1, side);
          childLayoutNodes.push(map[kids[j].id]);
        }
      }
      kidsOf[n.id] = childLayoutNodes;
    }

    walk(rootNode, null, 0, 'r');

    function sumHeight(list) {
      if (!list || !list.length) return 0;
      var s = 0;
      for (var i = 0; i < list.length; i++) s += list[i].sub;
      return s + V_GAP * Math.max(0, list.length - 1);
    }

    function computeSub(ln) {
      var ks = kidsOf[ln.id] || [];
      for (var i = 0; i < ks.length; i++) computeSub(ks[i]);
      ln.sub = Math.max(ln.h, sumHeight(ks));
      return ln.sub;
    }

    function place(ln, edgeX, centerY, side) {
      ln.x = side === 'r' ? edgeX : edgeX - ln.w;
      ln.y = centerY - ln.h / 2;
      var ks = kidsOf[ln.id] || [];
      var y = centerY - sumHeight(ks) / 2;
      for (var i = 0; i < ks.length; i++) {
        var k = ks[i];
        var nextEdge = side === 'r' ? ln.x + ln.w + H_GAP : ln.x - H_GAP;
        place(k, nextEdge, y + k.sub / 2, side);
        y += k.sub + V_GAP;
      }
    }

    var rootLayout = map[rootNode.id];
    rootLayout.x = -rootLayout.w / 2;
    rootLayout.y = -rootLayout.h / 2;

    var sides = ['r', 'l'];
    for (var sIdx = 0; sIdx < sides.length; sIdx++) {
      var sideKey = sides[sIdx];
      var branchKids = (kidsOf[rootNode.id] || []).filter(function (k) {
        return k.side === sideKey;
      });
      for (var i = 0; i < branchKids.length; i++) computeSub(branchKids[i]);
      var startY = -sumHeight(branchKids) / 2;
      for (var j = 0; j < branchKids.length; j++) {
        var bk = branchKids[j];
        var startEdge = sideKey === 'r' ? rootLayout.x + rootLayout.w + H_GAP : rootLayout.x - H_GAP;
        place(bk, startEdge, startY + bk.sub / 2, sideKey);
        startY += bk.sub + V_GAP;
      }
    }

    var nodes = Object.keys(map).map(function (k) {
      return map[k];
    });
    var edges = [];
    for (var nIdx = 0; nIdx < nodes.length; nIdx++) {
      var m = nodes[nIdx];
      if (!m.parentId) continue;
      var p = map[m.parentId];
      var isRight = m.side === 'r';
      var x1 = isRight ? p.x + p.w : p.x;
      var dy = m.y + m.h / 2 - (p.y + p.h / 2);
      var y1 = p.y + p.h / 2 + Math.max(-14, Math.min(14, dy * 0.08));
      var x2 = isRight ? m.x : m.x + m.w;
      var y2 = m.y + m.h / 2;
      var mx = (x1 + x2) / 2;
      edges.push({
        id: p.id + '__' + m.id,
        fromId: p.id,
        toId: m.id,
        color: m.depth === 1 ? '#5E786A' : '#8FA196',
        sw: m.depth === 1 ? 2 : 1.5,
        d: 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2
      });
    }

    return { nodes: nodes, edges: edges, map: map };
  }

  // ─── 4. Interactive HTML/DOM Mindmap Renderer ──────────────────────────────
  function renderMindmap(target, options) {
    options = options || {};
    var container =
      typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) {
      throw new Error('renderMindmap: target container not found.');
    }

    var data = options.data || MINDMAP_DATA;
    // Start with depth >= 2 collapsed if desired, or all expanded; default: depth 2 collapsed for clean initial view, with "Expand All" button
    var collapsed = new Set(options.initialCollapsed || []);
    var view = { x: 0, y: 0, k: 0.75 };
    var selectedNodeId = null;
    var searchQuery = '';

    container.innerHTML = '';
    container.style.cssText =
      'position:relative;width:100%;height:' +
      (options.height || '100%') +
      ';min-height:620px;background:#F3EFE6;border:1px solid #E4DFD3;border-radius:16px;overflow:hidden;font-family:' +
      FONT +
      ';display:flex;flex-direction:column;box-sizing:border-box;user-select:none;';

    // Header bar
    var header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:12px 18px;background:#FFFFFF;border-bottom:1px solid #E4DFD3;z-index:20;';
    header.innerHTML = [
      '<div style="display:flex;align-items:center;gap:10px;">',
      '  <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;background:#25352C;color:#fff;font-weight:700;font-size:14px;">OC</span>',
      '  <div>',
      '    <div style="font-size:14px;font-weight:700;color:#1E2822;">Oral Communication — Week 1 Mindmap</div>',
      '    <div style="font-size:11.5px;color:#5A655E;">Lesson 1: Foundations, Nature, Elements, and Models of Communication (Philippines Board)</div>',
      '  </div>',
      '</div>',
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">',
      '  <input type="search" data-mm-search placeholder="Search concepts..." style="padding:6px 12px;border:1px solid #D5CEC2;border-radius:8px;font-size:12px;outline:none;width:180px;background:#FAF8F5;color:#1E2822;" />',
      '  <button type="button" data-mm-expand style="padding:6px 10px;border:1px solid #E4DFD3;border-radius:8px;background:#fff;color:#375545;font-size:12px;font-weight:600;cursor:pointer;">Expand All</button>',
      '  <button type="button" data-mm-collapse style="padding:6px 10px;border:1px solid #E4DFD3;border-radius:8px;background:#fff;color:#375545;font-size:12px;font-weight:600;cursor:pointer;">Collapse Subtopics</button>',
      '  <div style="display:inline-flex;align-items:center;background:#FAF8F5;border:1px solid #E4DFD3;border-radius:8px;padding:2px;">',
      '    <button type="button" data-mm-zoom-out style="width:28px;height:26px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:700;color:#375545;">−</button>',
      '    <button type="button" data-mm-fit style="padding:0 10px;height:26px;border:none;background:transparent;cursor:pointer;font-size:12px;font-weight:700;color:#1E2822;">100% · Fit</button>',
      '    <button type="button" data-mm-zoom-in style="width:28px;height:26px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:700;color:#375545;">+</button>',
      '  </div>',
      '</div>'
    ].join('\n');
    container.appendChild(header);

    // Viewport canvas
    var viewport = document.createElement('div');
    viewport.style.cssText =
      'position:relative;flex:1;width:100%;height:100%;overflow:hidden;cursor:grab;touch-action:none;background-image:radial-gradient(circle, #DED8CA 1.1px, transparent 1.1px);background-size:24px 24px;';
    container.appendChild(viewport);

    // Transform stage
    var stage = document.createElement('div');
    stage.style.cssText =
      'position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;';
    viewport.appendChild(stage);

    var svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttribute('width', '1');
    svgLayer.setAttribute('height', '1');
    svgLayer.style.cssText =
      'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;';
    stage.appendChild(svgLayer);

    var nodesLayer = document.createElement('div');
    nodesLayer.style.cssText = 'position:absolute;left:0;top:0;';
    stage.appendChild(nodesLayer);

    // Detail inspector card (bottom-right)
    var detailCard = document.createElement('div');
    detailCard.style.cssText =
      'position:absolute;bottom:16px;right:16px;max-width:340px;background:#FFFFFF;border:1px solid #E4DFD3;border-radius:12px;padding:14px 16px;box-shadow:0 8px 24px rgba(30,40,34,0.12);z-index:15;display:none;font-size:12.5px;color:#1E2822;';
    viewport.appendChild(detailCard);

    // Legend pill (bottom-left)
    var legend = document.createElement('div');
    legend.style.cssText =
      'position:absolute;bottom:16px;left:16px;background:#FFFFFF;border:1px solid #E4DFD3;border-radius:999px;padding:6px 14px;display:inline-flex;align-items:center;gap:8px;font-size:11.5px;color:#5A655E;box-shadow:0 2px 6px rgba(0,0,0,0.04);pointer-events:none;z-index:10;';
    legend.innerHTML =
      '<span>Drag to pan</span><span>·</span><span>Ctrl + Scroll to zoom</span><span>·</span><span>Click node or badge to inspect / toggle</span>';
    viewport.appendChild(legend);

    var currentLayout = null;
    var fitBtn = header.querySelector('[data-mm-fit]');

    function applyTransform() {
      stage.style.transform =
        'translate3d(' + view.x + 'px,' + view.y + 'px,0) scale(' + view.k + ')';
      if (fitBtn) {
        fitBtn.textContent = Math.round(view.k * 100) + '% · Fit';
      }
    }

    function fitToScreen() {
      if (!currentLayout || !currentLayout.nodes.length) return;
      var rect = viewport.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (var i = 0; i < currentLayout.nodes.length; i++) {
        var n = currentLayout.nodes[i];
        x0 = Math.min(x0, n.x - 24);
        y0 = Math.min(y0, n.y - 16);
        x1 = Math.max(x1, n.x + n.w + 24);
        y1 = Math.max(y1, n.y + n.h + 16);
      }
      var padX = 48;
      var padY = 48;
      var k = Math.max(
        MIN_Z,
        Math.min(
          1,
          (rect.width - padX * 2) / Math.max(1, x1 - x0),
          (rect.height - padY * 2) / Math.max(1, y1 - y0)
        )
      );
      view.k = k;
      view.x = rect.width / 2 - ((x0 + x1) / 2) * k;
      view.y = rect.height / 2 - ((y0 + y1) / 2) * k;
      applyTransform();
    }

    function zoomBy(factor, cx, cy) {
      var rect = viewport.getBoundingClientRect();
      var px = cx !== undefined ? cx : rect.width / 2;
      var py = cy !== undefined ? cy : rect.height / 2;
      var nextK = Math.min(MAX_Z, Math.max(MIN_Z, view.k * factor));
      var scaleRatio = nextK / view.k;
      view.x = px - (px - view.x) * scaleRatio;
      view.y = py - (py - view.y) * scaleRatio;
      view.k = nextK;
      applyTransform();
    }

    function updateDetailCard(lnode) {
      if (!lnode) {
        detailCard.style.display = 'none';
        return;
      }
      detailCard.style.display = 'block';
      var parentNode = lnode.parentId && currentLayout ? currentLayout.map[lnode.parentId] : null;
      detailCard.innerHTML = [
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">',
        '  <div style="font-weight:700;font-size:13px;color:#25352C;line-height:1.35;">' + lnode.label + '</div>',
        '  <button type="button" data-mm-close-detail style="border:none;background:transparent;cursor:pointer;color:#5A655E;font-size:14px;line-height:1;padding:0 2px;">✕</button>',
        '</div>',
        parentNode
          ? '<div style="font-size:11px;color:#6E957E;font-weight:600;margin-bottom:6px;">Section: ' + parentNode.label + '</div>'
          : '',
        lnode.summary
          ? '<div style="font-size:12px;color:#45584E;line-height:1.45;margin-bottom:6px;">' + lnode.summary + '</div>'
          : '',
        '<div style="font-size:11px;color:#7A867E;">Level ' +
          lnode.depth +
          (lnode.hasKids ? ' · ' + lnode.kidCount + ' sub-items' : ' · Key Concept') +
          '</div>'
      ].join('');
      var closeBtn = detailCard.querySelector('[data-mm-close-detail]');
      if (closeBtn) {
        closeBtn.onclick = function () {
          selectedNodeId = null;
          detailCard.style.display = 'none';
          draw();
        };
      }
    }

    function draw() {
      currentLayout = computeMindmapLayout(data, collapsed);
      svgLayer.innerHTML = '';
      nodesLayer.innerHTML = '';

      // Render Bezier edges
      for (var i = 0; i < currentLayout.edges.length; i++) {
        var e = currentLayout.edges[i];
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', e.d);
        path.setAttribute('stroke', e.color);
        path.setAttribute('stroke-width', String(e.sw));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('opacity', '0.9');
        svgLayer.appendChild(path);
      }

      var q = searchQuery.trim().toLowerCase();

      // Render nodes
      for (var j = 0; j < currentLayout.nodes.length; j++) {
        (function (m) {
          var isRoot = m.depth === 0;
          var isSelected = selectedNodeId === m.id;
          var isMatch = q && m.label.toLowerCase().indexOf(q) !== -1;

          var el = document.createElement('div');
          el.setAttribute('data-node-id', m.id);
          el.style.cssText = [
            'position:absolute',
            'left:' + m.x + 'px',
            'top:' + m.y + 'px',
            'width:' + m.w + 'px',
            'height:' + m.h + 'px',
            'box-sizing:border-box',
            'display:flex',
            'align-items:center',
            'justify-content:' + (isRoot ? 'center' : 'flex-start'),
            'font:' + m.font,
            'line-height:' + m.lineH + 'px',
            'background:' + (isMatch ? '#BD7D52' : m.bg),
            'color:#FFFFFF',
            'border-radius:' + (isRoot ? '12px' : m.depth === 1 ? '11px' : '9px'),
            'padding:0 ' + m.px + 'px',
            'cursor:pointer',
            'border:' + (isSelected || isMatch ? '2px solid #FFE0B2' : '1.5px solid rgba(255,255,255,0.14)'),
            'box-shadow:' +
              (isSelected
                ? '0 8px 22px rgba(37,53,44,0.34)'
                : isRoot
                ? '0 6px 18px rgba(37,53,44,0.26)'
                : '0 3px 10px rgba(37,53,44,0.14)'),
            'transition:box-shadow 0.18s ease, transform 0.18s ease, filter 0.18s ease'
          ].join(';');

          var textSpan = document.createElement('span');
          textSpan.style.cssText =
            'white-space:pre-wrap;word-break:break-word;width:100%;text-align:' +
            (isRoot ? 'center' : 'left') +
            ';user-select:none;';
          textSpan.textContent = m.lines.join('\n');
          el.appendChild(textSpan);

          el.onmouseenter = function () {
            el.style.filter = 'brightness(1.08)';
          };
          el.onmouseleave = function () {
            el.style.filter = 'none';
          };

          el.onclick = function (ev) {
            ev.stopPropagation();
            if (panState && panState.moved) return;
            selectedNodeId = m.id;
            updateDetailCard(m);
            if (typeof options.onNodeClick === 'function') {
              options.onNodeClick(m);
            }
            draw();
          };

          // Collapse / Expand badge
          if (!isRoot && m.hasKids) {
            var toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            var onRight = m.side === 'r';
            toggleBtn.title = m.collapsed ? 'Expand (' + m.kidCount + ')' : 'Collapse';
            toggleBtn.style.cssText = [
              'position:absolute',
              'top:50%',
              'transform:translateY(-50%)',
              (onRight ? 'right' : 'left') + ':-21px',
              'width:19px',
              'height:19px',
              'border-radius:50%',
              'border:1px solid #CFC3BA',
              'background:#FFFFFF',
              'color:#375545',
              'font-size:10px',
              'font-weight:700',
              'line-height:1',
              'cursor:pointer',
              'padding:0',
              'display:flex',
              'align-items:center',
              'justify-content:center',
              'box-shadow:0 1px 3px rgba(0,0,0,0.15)',
              'z-index:5'
            ].join(';');
            toggleBtn.textContent = m.collapsed ? String(m.kidCount) : '−';
            toggleBtn.onclick = function (ev) {
              ev.stopPropagation();
              if (collapsed.has(m.id)) collapsed.delete(m.id);
              else collapsed.add(m.id);
              draw();
            };
            el.appendChild(toggleBtn);
          }

          nodesLayer.appendChild(el);
        })(currentLayout.nodes[j]);
      }

      applyTransform();
    }

    // Pan & Wheel listeners
    var panState = null;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('[data-node-id]') || e.target.closest('button')) return;
      panState = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
      viewport.style.cursor = 'grabbing';
      if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!panState) return;
      if (Math.hypot(e.clientX - panState.sx, e.clientY - panState.sy) > 4) {
        panState.moved = true;
      }
      if (panState.moved) {
        view.x = panState.vx + (e.clientX - panState.sx);
        view.y = panState.vy + (e.clientY - panState.sy);
        applyTransform();
      }
    });
    function endPan() {
      panState = null;
      viewport.style.cursor = 'grab';
    }
    viewport.addEventListener('pointerup', endPan);
    viewport.addEventListener('pointercancel', endPan);

    viewport.addEventListener(
      'wheel',
      function (e) {
        e.preventDefault();
        var rect = viewport.getBoundingClientRect();
        if (e.ctrlKey || e.metaKey) {
          zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX - rect.left, e.clientY - rect.top);
        } else {
          view.x -= e.deltaX;
          view.y -= e.deltaY;
          applyTransform();
        }
      },
      { passive: false }
    );

    // Toolbar controls
    var zoomInBtn = header.querySelector('[data-mm-zoom-in]');
    var zoomOutBtn = header.querySelector('[data-mm-zoom-out]');
    var expandBtn = header.querySelector('[data-mm-expand]');
    var collapseBtn = header.querySelector('[data-mm-collapse]');
    var searchInput = header.querySelector('[data-mm-search]');

    if (zoomInBtn) zoomInBtn.onclick = function () { zoomBy(1.25); };
    if (zoomOutBtn) zoomOutBtn.onclick = function () { zoomBy(1 / 1.25); };
    if (fitBtn) fitBtn.onclick = function () { fitToScreen(); };
    if (expandBtn) {
      expandBtn.onclick = function () {
        collapsed.clear();
        draw();
        fitToScreen();
      };
    }
    if (collapseBtn) {
      collapseBtn.onclick = function () {
        collapsed.clear();
        function collapseDepth2(n, d) {
          if (d >= 2 && n.children && n.children.length) collapsed.add(n.id);
          (n.children || []).forEach(function (c) { collapseDepth2(c, d + 1); });
        }
        collapseDepth2(data, 0);
        draw();
        fitToScreen();
      };
    }
    if (searchInput) {
      searchInput.oninput = function (e) {
        searchQuery = e.target.value || '';
        if (searchQuery.trim()) {
          collapsed.clear();
        }
        draw();
      };
    }

    draw();
    setTimeout(fitToScreen, 30);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', fitToScreen);
    }

    return {
      fit: fitToScreen,
      zoomBy: zoomBy,
      expandAll: function () {
        collapsed.clear();
        draw();
        fitToScreen();
      },
      getData: function () {
        return data;
      }
    };
  }

  // ─── 5. Standalone HTML Generator ───────────────────────────────────────────
  function generateStandaloneHTML() {
    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="UTF-8" />',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '  <title>Oral Communication Week 1 — Interactive Mindmap</title>',
      '  <style>html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #F3EFE6; } #mindmap { width: 100vw; height: 100vh; border: none; border-radius: 0; }</style>',
      '</head>',
      '<body>',
      '  <div id="mindmap"></div>',
      '  <script src="./mindmap.js"></script>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  // Auto-mount if included via <script src="mindmap.js"> in an HTML document
  if (typeof document !== 'undefined') {
    var autoMount = function () {
      var target =
        document.getElementById('mindmap') ||
        document.getElementById('mindmap-container') ||
        document.querySelector('[data-mindmap]');
      if (!target && document.body && document.body.children.length <= 1) {
        var scriptsOnly = Array.prototype.every.call(document.body.children, function (el) {
          return el.tagName === 'SCRIPT';
        });
        if (scriptsOnly) {
          target = document.createElement('div');
          target.id = 'mindmap';
          target.style.cssText = 'width:100vw;height:100vh;';
          document.body.style.margin = '0';
          document.body.appendChild(target);
        }
      }
      if (target && !target.getAttribute('data-mm-mounted')) {
        target.setAttribute('data-mm-mounted', 'true');
        renderMindmap(target, { height: '100vh' });
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoMount);
    } else {
      setTimeout(autoMount, 0);
    }
  }

  return {
    MINDMAP_DATA: MINDMAP_DATA,
    MINDMAP_MERMAID: MINDMAP_MERMAID,
    renderMindmap: renderMindmap,
    computeMindmapLayout: computeMindmapLayout,
    generateStandaloneHTML: generateStandaloneHTML
  };
});

