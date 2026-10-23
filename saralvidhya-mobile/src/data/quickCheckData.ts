import { GCS_API_BASE, fetchWithTimeout } from '@/services/contentService';

export interface QuickCheckOption {
  key: string;
  text: string;
  is_correct?: boolean;
}

export interface QuickCheckQuestion {
  module_id: string;
  module_title: string;
  type?: string;
  prompt_type?: string;
  stem: string;
  options: QuickCheckOption[];
  correct_answer: string;
  rationale: string;
  bloom_level?: string;
}

export interface SectionQuickCheckMap {
  [moduleId: string]: QuickCheckQuestion[];
}

/**
 * Curated offline fallback bank for Entomology Chapter 1-4 ensuring instant,
 * 100% offline-ready Quick Check questions matching the authoritative ANGRAU syllabus.
 */
export const FALLBACK_QUICK_CHECK_BANK: Record<number, QuickCheckQuestion[]> = {
  // CHAPTER 1: Insect Digestive System & Anatomy
  1: [
    // Module 1: Regional Organization & Morphology
    {
      module_id: 'M1',
      module_title: 'Regional Organization & Morphology',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'Where are the Gastric Caeca (enteric caeca) anatomically located in the insect alimentary canal, and what is their primary function?',
      options: [
        {
          key: 'A',
          text: 'At the anterior end of the Midgut (Mesenteron), where they expand surface area for enzyme secretion and nutrient/water absorption',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'At the posterior end of the Hindgut (Proctodaeum), where they grind solid food with chitinous teeth',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Inside the Foregut pharynx, where they pump air into the tracheal system',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'Gastric caeca are blind tubular diverticula arising at the anterior junction of the midgut (mesenteron) immediately behind the cardiac valve, vastly expanding secretory surface area for digestive enzymes and nutrient uptake.',
      bloom_level: 'Understand',
    },
    {
      module_id: 'M1',
      module_title: 'Regional Organization & Morphology',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'Which primary gut regions are ectodermal in embryonic origin and therefore shed their chitinous cuticular lining (intima) during each molt?',
      options: [
        {
          key: 'A',
          text: 'Midgut (Mesenteron) only',
          is_correct: false,
        },
        {
          key: 'B',
          text: 'Foregut (Stomodaeum) and Hindgut (Proctodaeum)',
          is_correct: true,
        },
        {
          key: 'C',
          text: 'Midgut and Gastric Caeca',
          is_correct: false,
        },
      ],
      correct_answer: 'B',
      rationale:
        'Both the foregut (stomodaeum) and hindgut (proctodaeum) invaginate from embryonic ectoderm and possess a chitinous cuticular intima that is shed at ecdysis, whereas the endodermal midgut lacks an intima.',
      bloom_level: 'Understand',
    },
    {
      module_id: 'M1',
      module_title: 'Regional Organization & Morphology',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'Which sphincter valve regulates the one-way passage of partially processed food from the foregut into the midgut while preventing retrograde reflux?',
      options: [
        {
          key: 'A',
          text: 'Pyloric valve',
          is_correct: false,
        },
        {
          key: 'B',
          text: 'Cardiac (Stomodaeal) valve',
          is_correct: true,
        },
        {
          key: 'C',
          text: 'Rectal papillae valve',
          is_correct: false,
        },
      ],
      correct_answer: 'B',
      rationale:
        'The cardiac (stomodaeal) valve sits at the junction of the foregut and midgut to prevent regurgitation into the foregut, while the pyloric valve guards the midgut-hindgut junction.',
      bloom_level: 'Remember',
    },
    {
      module_id: 'M1',
      module_title: 'Regional Organization & Morphology',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'Why does the Midgut (Mesenteron) secrete a semi-permeable Peritrophic Membrane around the food bolus instead of having a permanent cuticular intima?',
      options: [
        {
          key: 'A',
          text: 'Because the midgut only stores water and never digests food',
          is_correct: false,
        },
        {
          key: 'B',
          text: 'To protect delicate microvillar enterocytes from mechanical abrasion and pathogens while still allowing digestive enzymes and nutrients to diffuse across',
          is_correct: true,
        },
        {
          key: 'C',
          text: 'To grind hard seeds using sclerotized chitinous teeth',
          is_correct: false,
        },
      ],
      correct_answer: 'B',
      rationale:
        'Lacking an ectodermal cuticular intima, the endodermal midgut synthesizes a delicate chitin-protein peritrophic envelope that compartmentalizes digestion and shields enterocytes without impeding nutrient absorption.',
      bloom_level: 'Understand',
    },

    // Module 2: Foregut Morpho Histology & Cuticular Intima
    {
      module_id: 'M2',
      module_title: 'Foregut Morpho Histology & Cuticular Intima',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'What is the primary mechanical function of the proventriculus (gizzard) in solid-feeding mandibulate insects like orthopterans and blattodeans?',
      options: [
        {
          key: 'A',
          text: 'Macerating food particles with sclerotized chitinous cuticular teeth before passage into the delicate midgut',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'Reabsorbing 95% of water from liquid fecal matter',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Secreting saliva and amylase directly into the hemolymph',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'The proventriculus is armed with internal longitudinal folds containing heavily sclerotized cuticular teeth and a powerful circular muscle coat to grind solid food boluses into fine slurry.',
      bloom_level: 'Understand',
    },
    {
      module_id: 'M2',
      module_title: 'Foregut Morpho Histology & Cuticular Intima',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'Why does the crop (ingluvies) exhibit a folded, distensible wall in insects?',
      options: [
        {
          key: 'A',
          text: 'To serve as a high-capacity expandable reservoir for ingested food prior to slow, regulated mechanical processing',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'To absorb glucose directly into flight muscles',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'To produce uric acid crystals during dehydration',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'The crop is a thin-walled, highly expandable pouch lined with folded intima that holds large volumes of food ingested rapidly during feeding bouts.',
      bloom_level: 'Understand',
    },

    // Module 3: Midgut Architecture & Epithelium
    {
      module_id: 'M3',
      module_title: 'Midgut Architecture & Epithelium',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'What is the biological role of regenerative cells (nidi) situated at the base of the midgut epithelium?',
      options: [
        {
          key: 'A',
          text: 'Continuously dividing to replace worn-out or sloughed columnar enterocytes damaged by enzyme secretion and digestion',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'Pumping primary urine into the Malpighian tubules',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Generating the insect exoskeleton during pupation',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'Regenerative cells (nidi / stem cell clusters) lie in crypts or along the basement membrane, undergoing rapid mitosis to renew the high-turnover columnar epithelial lining.',
      bloom_level: 'Understand',
    },
    {
      module_id: 'M3',
      module_title: 'Midgut Architecture & Epithelium',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'How does the Type I Peritrophic Matrix differ in origin from the Type II Peritrophic Matrix?',
      options: [
        {
          key: 'A',
          text: 'Type I is delaminated from the entire midgut epithelial surface, whereas Type II is continuously spun as a seamless tube by a specialized annular ring of cells at the cardia',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'Type I is made of pure bone, while Type II is made of keratin',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Type I exists only in pupae, while Type II exists only in eggs',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'Type I peritrophic membrane (found in orthopterans, coleopterans) is secreted by cells across the entire length of the midgut, whereas Type II (found in dipterans, dermapterans) is extruded continuously by the anterior proventricular ring.',
      bloom_level: 'Analyze',
    },

    // Module 4: Hindgut Compartments & Osmoregulation
    {
      module_id: 'M4',
      module_title: 'Hindgut Compartments & Osmoregulation',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'What is the vital physiological role of the 6 Rectal Pads (papillae) in terrestrial insects facing desiccation stress?',
      options: [
        {
          key: 'A',
          text: 'Actively pumping water, sodium, potassium, and chloride from the rectal lumen back into hemolymph against strong osmotic gradients',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'Synthesizing digestive amylases for wood breakdown',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Anchoring wings to the abdominal segments',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'Rectal pads contain elongated prismatic epithelial cells packed with mitochondria and folded intercellular channels that create high local osmotic pressures to recover up to 95% of water, producing dry fecal pellets.',
      bloom_level: 'Apply',
    },
    {
      module_id: 'M4',
      module_title: 'Hindgut Compartments & Osmoregulation',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'Where do the Malpighian tubules insert into the insect digestive tract?',
      options: [
        {
          key: 'A',
          text: 'At the junction between the Midgut (Mesenteron) and Hindgut (Proctodaeum) demarcated by the pyloric valve',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'At the mouthparts adjacent to the labrum',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Inside the crop chamber of the foregut',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'Malpighian tubules discharge primary urine containing uric acid, ions, and toxins into the digestive tract precisely at the midgut-hindgut boundary.',
      bloom_level: 'Remember',
    },

    // Module 5: Salivary Systems & Special Adaptations
    {
      module_id: 'M5',
      module_title: 'Salivary Systems & Special Adaptations',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'How does the Filter Chamber in sap-sucking Hemiptera (aphids, cicadas, planthoppers) solve the challenge of excessive dietary water intake?',
      options: [
        {
          key: 'A',
          text: 'By anatomically wrapping the posterior midgut and hindgut tightly around the anterior midgut, creating an osmotic shunt that expels excess water directly without diluting midgut digestive enzymes',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'By evaporating water out of the antennae through spiracles',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'By freezing ingested sap into solid pellets in the salivary gland',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'The filter chamber forms a physiological counter-current bypass where dilute plant sap short-circuits directly to the proctodaeum, concentrating scarce amino acids in the midgut.',
      bloom_level: 'Analyze',
    },
  ],

  // CHAPTER 2: Insect Metamorphosis & Life Cycles
  2: [
    {
      module_id: 'M1',
      module_title: 'Morphogenesis Framework & Post-Embryonic Growth',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: "What does Przibram's Rule state regarding insect growth at each successive molt?",
      options: [
        {
          key: 'A',
          text: 'Body weight approximately doubles due to a doubling of cell number, while linear dimensions increase by a factor of ~1.26',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'Body weight decreases by half at every ecdysis while wing length triples',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Head capsule width shrinks until the adult stage',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        "Przibram's rule links volumetric cell-number doubling (weight x 2) at each molt with linear growth by 2^(1/3) ~ 1.26, complementing Dyar's geometric progression rule.",
      bloom_level: 'Understand',
    },
    {
      module_id: 'M1',
      module_title: 'Morphogenesis Framework & Post-Embryonic Growth',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'During the molting process, what is the precise distinction between Apolysis and Ecdysis?',
      options: [
        {
          key: 'A',
          text: 'Apolysis is the enzymatic detachment of old cuticle from the epidermis, whereas Ecdysis is the final physical casting off of the exuviae',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'Apolysis is egg hatching, whereas Ecdysis is adult copulation',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Apolysis is cuticle tanning, whereas Ecdysis is cell division',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'Molting begins with apolysis (detachment of epidermal cells from old endocuticle) and culminates with ecdysis (physical escape from the shed cuticular skeleton).',
      bloom_level: 'Understand',
    },
  ],

  // CHAPTER 3: Weathering of Rocks & Minerals
  3: [
    {
      module_id: 'M1',
      module_title: 'Fundamentals & Regolith Genesis',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'In a vertical weathering profile above unweathered bedrock (R), which horizons constitute the "Solum" vs. the "Regolith"?',
      options: [
        {
          key: 'A',
          text: 'The Solum comprises the pedogenically active upper horizons (O, A, E, B), whereas Regolith encompasses the entire unconsolidated mantle (Solum + weathered C horizon)',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'The Solum consists strictly of unweathered consolidated R bedrock layer',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Regolith includes only surface leaf litter, whereas Solum is molten magma',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'Regolith is the loose, unconsolidated weathered mantle above solid bedrock, whereas Solum refers to the true genetic soil horizons (A + E + B) shaped by pedogenesis.',
      bloom_level: 'Understand',
    },
  ],

  // CHAPTER 4: Insect Pollination & Floral Biology
  4: [
    {
      module_id: 'M1',
      module_title: 'Fundamentals of Floral Biology & Pollination Anatomy',
      type: 'mcq_3_option',
      prompt_type: 'Scenario / Concept Check',
      stem: 'In angiosperm double fertilization, what are the direct products of Syngamy and Triple Fusion inside the embryo sac?',
      options: [
        {
          key: 'A',
          text: 'One haploid sperm (n) fuses with the egg (n) to form the diploid Zygote (2n), while the second sperm (n) fuses with two polar nuclei (n+n) to form triploid Endosperm (3n)',
          is_correct: true,
        },
        {
          key: 'B',
          text: 'Both sperm nuclei fuse with the sepal to form the fruit skin',
          is_correct: false,
        },
        {
          key: 'C',
          text: 'Two pollen grains fuse outside the stigma to form a tetraploid tube',
          is_correct: false,
        },
      ],
      correct_answer: 'A',
      rationale:
        'Double fertilization is unique to angiosperms: syngamy yields the 2n embryo, while triple fusion produces the 3n nutritive endosperm essential for seed and fruit development.',
      bloom_level: 'Understand',
    },
  ],
};

/**
 * Fetches Quick Check questions from Cloud Run API endpoint with fallback to local bank.
 */
export async function fetchQuickCheckQuestions(
  chapterNumber: number,
  track: 'quick' | 'detailed' = 'quick',
  persona: string = 'intermediate',
  signal?: AbortSignal
): Promise<QuickCheckQuestion[]> {
  const chNum = chapterNumber < 10 ? `0${chapterNumber}` : `${chapterNumber}`;
  const trackFolder = track === 'detailed' ? 'detailed' : 'quick';
  const normPersona =
    persona === 'beginner' || persona === 'easy'
      ? 'beginner'
      : persona === 'advanced' || persona === 'hard'
      ? 'advanced'
      : 'intermediate';

  const endpoint = `${GCS_API_BASE}/api/content/angrau/entomology/chapter_${chNum}/read/quick_check/${trackFolder}/${normPersona}.json`;

  try {
    const res = await fetchWithTimeout(endpoint, 8000, signal);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch {
    // Graceful fallback to offline curated dataset
  }

  return FALLBACK_QUICK_CHECK_BANK[chapterNumber] || FALLBACK_QUICK_CHECK_BANK[1] || [];
}

/**
 * Groups an array of Quick Check questions by section / module ID (e.g. M1, M2, M3).
 */
export function groupQuestionsByModule(
  questions: QuickCheckQuestion[]
): SectionQuickCheckMap {
  const map: SectionQuickCheckMap = {};
  for (const q of questions) {
    const modId = q.module_id || 'M1';
    if (!map[modId]) {
      map[modId] = [];
    }
    map[modId].push(q);
  }
  return map;
}
