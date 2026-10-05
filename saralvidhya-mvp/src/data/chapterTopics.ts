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
  // ── ANGRAU B.Sc. Agriculture - Entomology (ento_131) ──
  {
    subject: 'ento_131',
    chapterNumber: 1,
    topics: [
      'Foregut / Stomodaeum Anatomy',
      'Proventriculus Cuticular Teeth',
      'Symbiotic Digestion & Microflora',
      'Termite Hindgut Fermentation',
      'Alkaline Midgut in Lepidoptera',
      'Bt Cry Toxin Receptor Binding',
      'Peritrophic Membrane Barrier',
      'Malpighian Tubules Excretion',
      'Cryptonephridial Water Extraction',
      'Rectal Pads & Osmoregulation',
      'Protease & Amylase Secretion',
      'Endocrine Control of Digestion',
    ],
  },
  {
    subject: 'ento_131',
    chapterNumber: 2,
    topics: [
      'Post-Embryonic Morphogenesis Phases',
      'Ametabolous & Hemimetabolous Systems',
      'Holometabolous Metamorphosis',
      'Apolysis & Ecdysis Cycle',
      'Histolysis & Histogenesis in Pupae',
      'Imaginal Discs Morphogenesis',
      'Prothoracicotropic Hormone (PTTH)',
      'Ecdysone & Juvenile Hormone (JH)',
      'Bursicon Cuticle Tanning Cascade',
      'Photoperiodic Induction of Diapause',
      'Supercooling & Cryoprotectants',
      'Termination of Diapause Signaling',
    ],
  },
  {
    subject: 'ento_131',
    chapterNumber: 3,
    topics: [
      'Regolith Formation & Bedrock Mantle',
      'Mechanical & Physical Disintegration',
      'Thermal Expansion & Frost Wedging',
      'Biological Weathering by Arthropods',
      'Organic Acid Secretion & Chelation',
      'Soil Pedogenesis & Soil Horizons',
      'Burrowing Insects & Bioturbation',
      'Master Metric Reference Matrix',
    ],
  },
  {
    subject: 'ento_131',
    chapterNumber: 4,
    topics: [
      'Floral Biology & Pollination Anatomy',
      'Autogamy & Inbreeding Depression',
      'Allogamy & Outcrossing Adaptations',
      'Dichogamy & Herkogamy Systems',
      'Entomophilous Pollinators & Vectors',
      'Apis Cerana & Honeybee Foraging',
      'Solitary Bees & Syrphid Vectors',
      'Pollinizers & Orchard Layout Design',
      'Pollen Trapping & Hive Density',
      'Parthenocarpy & Fruit Set Physiology',
    ],
  },
  {
    subject: 'ento_131',
    chapterNumber: 11,
    topics: [
      'Post-Embryonic Morphogenesis Phases',
      'Ametabolous & Hemimetabolous Systems',
      'Holometabolous Metamorphosis',
      'Apolysis & Ecdysis Cycle',
      'Histolysis & Histogenesis in Pupae',
      'Imaginal Discs Morphogenesis',
      'Prothoracicotropic Hormone (PTTH)',
      'Ecdysone & Juvenile Hormone (JH)',
      'Bursicon Cuticle Tanning Cascade',
      'Photoperiodic Induction of Diapause',
      'Supercooling & Cryoprotectants',
      'Termination of Diapause Signaling',
    ],
  },
  // ── NEB Nepal - Class 12 Biology ──────────────────────
  {
    subject: 'neb_xii_biology',
    chapterNumber: 6,
    topics: [
      'History & Fundamentals of Histology',
      'Epithelial Tissue',
      'Connective Tissue',
      'Muscular Tissue',
      'Nervous Tissue',
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
