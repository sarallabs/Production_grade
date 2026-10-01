/**
 * Topics to be covered for each chapter, extracted from mindmap top-level branches.
 * Used in the Study Plan / Study Table view.
 */

export interface ChapterTopics {
  subject: string;
  chapterNumber: number;
  topics: string[];
}

export const CHAPTER_TOPICS: ChapterTopics[] = [
  // ── Acharya Nagarjuna University - Management (MBA) ──────────────────────
  {
    subject: 'management',
    chapterNumber: 1,
    topics: [
      'Foundations of Markets',
      'Goods and Products',
      'Core Marketing Concepts',
      'Marketing Philosophies',
    ],
  },
  {
    subject: 'management',
    chapterNumber: 2,
    topics: [
      'Customer Relationship Management (CRM)',
      'E-Marketing Foundations',
      'Social, Societal & Cause-Related Marketing',
    ],
  },
  {
    subject: 'management',
    chapterNumber: 3,
    topics: [
      'Understanding Product Levels & Classification',
      'The Product Life Cycle (PLC) Strategies',
      'Product Mix & Line Management',
      'Branding Strategies & Brand Equity',
      'New Product Development Process',
    ],
  },
  {
    subject: 'management',
    chapterNumber: 4,
    topics: [
      'Pricing Concepts and the 6-Step Pricing Process',
      'Price Adaptation and Promotional Strategies',
      'Marketing Channels, Value Networks and Channel Systems',
      'Promotion Mix, IMC and Global Pricing',
    ],
  },
  {
    subject: 'management',
    chapterNumber: 5,
    topics: [
      'Integrated Marketing Communications and Communication Process',
      'Advertising, Sales Promotion, PR and Event Management',
      'Personal Selling, Sales Force Management and Digital Strategy',
      'Marketing Metrics, Ethics and Strategic Control',
    ],
  },

  // ── Acharya Nagarjuna University - M.Sc Physics (Quantum Mechanics) ──────
  {
    subject: 'anu_physics',
    chapterNumber: 1,
    topics: [
      'Relativistic Quantum Mechanics & Energy-Momentum Relation',
      'Klein-Gordon Equation Derivation & Operator Interpretation',
      'Squaring Approach & Negative Energy Solutions',
      'Dirac Equation Formulation & Gamma Matrices',
      'Spinors, Probability Current & Lorentz Covariance',
      'S-Matrix, Scattering Processes & Quantum Electrodynamics',
    ],
  },
  {
    subject: 'anu_physics',
    chapterNumber: 4,
    topics: [
      'Hamiltonian in the Radiation Field',
      'Quantization of the Radiation Field',
      'Covariant Perturbation Theory & S-Matrix',
      'Scattering Processes',
      'Feynman Diagrams and QED Rules',
      'Klein-Gordon & Maxwell Fields',
    ],
  },

  // ── Acharya Nagarjuna University - M.Sc Physics (Characterization Techniques) ──
  {
    subject: 'anu_characterization',
    chapterNumber: 5,
    topics: [
      'X-ray Diffraction (XRD)',
      'Scanning Probe Microscopy (SPM)',
      'Electron Microscopy',
      'Spectroscopy',
      'Thermal Analysis',
    ],
  },
  // ── Acharya N.G. Ranga Agricultural University - Entomology (ento_131) ─────
  {
    subject: 'ento_131',
    chapterNumber: 1,
    topics: [
      'Three Primary Gut Regions (Foregut, Midgut, Hindgut)',
      'Salivary Glands & External Digestion',
      'Filter Chamber & Osmotic Bypass Mechanisms',
      'Symbiotic Digestion & Wood Degradation',
      'Excretory Integration & Malpighian Tubules',
    ],
  },
  {
    subject: 'ento_131',
    chapterNumber: 11,
    topics: [
      'Ametabolous Development (No Metamorphosis)',
      'Hemimetabolous Development (Incomplete Metamorphosis)',
      'Holometabolous Development (Complete Metamorphosis)',
      'Hormonal Control of Metamorphosis',
      'Diapause & Environmental Adaptations',
    ],
  },
];

export function getTopicsForChapter(subject: string, chapterNumber: number): string[] {
  const normSub = subject?.toLowerCase() === 'entomology' ? 'ento_131' : subject;
  const entry = CHAPTER_TOPICS.find(
    (ct) => (ct.subject === normSub || ct.subject === subject) && ct.chapterNumber === chapterNumber,
  );
  return entry?.topics ?? [];
}
