export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  hint?: string;
  infographicUrl?: string;
  personaLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export function getFlashcardsForPersona(
  cards: Flashcard[],
  persona: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Flashcard[] {
  if (!cards || cards.length === 0) return [];
  if (persona === 'beginner') {
    // Beginner: core 5 foundation flashcards including hindgut sub-divisions (card 4)
    return cards.slice(0, 5);
  }
  if (persona === 'intermediate') {
    // Intermediate: standard syllabus (all cards)
    return cards;
  }
  // Advanced: all cards with high-rigor exam depth
  return cards;
}

const GCS_API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://saralvidhya-api-193782571555.asia-south1.run.app';

export const SAMPLE_FLASHCARDS: Record<number, Flashcard[]> = {
  1: [
    {
      id: 'fc_1_1',
      category: 'Anatomy',
      front: 'What are the three primary divisions of the insect alimentary canal?',
      back: '1. Stomodaeum (Foregut)\n2. Mesenteron (Midgut / Ventriculus)\n3. Proctodaeum (Hindgut)',
      hint: 'Think: anterior, middle, posterior embryonic origins',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20%28Stomodaem%29/Anatomy_of_the_Insect_Foregut.png`,
    },
    {
      id: 'fc_1_2',
      category: 'Embryology',
      front: 'Which gut regions are lined with a chitinous cuticular intima?',
      back: 'The Foregut (Stomodaeum) and Hindgut (Proctodaeum) are ectodermal in origin and lined with cuticular intima shed during each molt. The Midgut lacks intima.',
      hint: 'Only ectodermal regions have cuticular lining',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20%28Stomodaem%29/Leaf%20Nodes/4.%20Insect_Ectodermal_Gut_Histology_Blueprint.png`,
    },
    {
      id: 'fc_1_3',
      category: 'Physiology',
      front: 'What is the function of the Proventriculus (Gizzard)?',
      back: 'Armed with strong chitinous internal teeth that mechanically grind solid food particles into a fine pulp before it passes into the delicate midgut.',
      hint: 'Mechanical mastication / grinding mill',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20%28Stomodaem%29/Leaf%20Nodes/3.%20Insect_Foregut_Processing_Engine.png`,
    },
    {
      id: 'fc_1_4',
      category: 'Anatomy',
      front: 'What are the three sequential anatomical sub-divisions of the insect hindgut?',
      back: '1. Ileum (anterior small intestine)\n2. Colon (narrow tubular middle section)\n3. Rectum (expanded sac with 6 rectal pads/papillae for water and salt resorption)',
      hint: 'Proctodaeal sub-regions in anterior-to-posterior sequence',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/3.%20Hindgut%20%28%20Proctodaeum%20%29/Leaf%20Nodes/1.%20Insect_Hindgut_Anatomy_and_Function.png`,
    },
    {
      id: 'fc_1_5',
      category: 'Cell Biology',
      front: 'What is the Peritrophic Membrane and why is it essential?',
      back: 'A semi-permeable chitin-protein sheath secreted in the midgut. It protects the microvillar epithelial cells from abrasive food particles and forms a barrier against bacterial pathogens.',
      hint: 'Non-cellular sheath surrounding food bolus',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20%28Mesenteron%29/Leaf%20Nodes/1.%20Insect_Midgut_Digestive_System.png`,
    },
    {
      id: 'fc_1_6',
      category: 'Excretion',
      front: 'Where are Malpighian Tubules located and what is their role?',
      back: 'Inserted at the junction of the Midgut and Hindgut. They act as kidneys, extracting nitrogenous wastes (principally uric acid) from the hemolymph.',
      hint: 'Insect kidney analogue',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/4.%20Excretory%20Integration/Leaf%20Nodes/01-Malpighian.png`,
    },
    {
      id: 'fc_1_7',
      category: 'Osmoregulation',
      front: 'What is the physiological role of Rectal Papillae / Pads?',
      back: 'They actively reabsorb water, sodium, potassium, and chloride ions from the fecal pellet back into the hemolymph, preventing fatal desiccation.',
      hint: 'Water conservation in terrestrial insects',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/4.%20Excretory%20Integration/Leaf%20Nodes/02-Rectal-Pads.png`,
    },
    {
      id: 'fc_1_8',
      category: 'Histology',
      front: 'Which cell types compose the insect midgut epithelium?',
      back: '1. Columnar cells (digestive enzyme secretion & nutrient absorption)\n2. Regenerative cells (nidi/crypts replacing shed cells)\n3. Endocrine cells (hormone secretion)',
      hint: 'Secretory and stem cell populations',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20%28Mesenteron%29/Leaf%20Nodes/Cellular%20Types/Insect_Midgut_Cellular_Labour_Diagram.png`,
    },
    {
      id: 'fc_1_9',
      category: 'Nutrition',
      front: 'What is the function of Hepatic / Gastric Caeca?',
      back: 'Finger-like diverticula at the anterior end of the ventriculus that increase absorptive surface area and house endosymbiotic microorganisms.',
      hint: 'Surface area expansion at foregut-midgut boundary',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/2.%20Midgut%20%28Mesenteron%29/Leaf%20Nodes/3.%20The_Insect_Midgut_Anatomy_Diagram.png`,
    },
    {
      id: 'fc_1_10',
      category: 'Valves',
      front: 'What is the role of the Cardiac (Stomodaeal) Valve?',
      back: 'An invagination of foregut into the midgut lumen that prevents backward regurgitation of food into the crop during peristaltic contractions.',
      hint: 'One-way flap valve between foregut and midgut',
      infographicUrl: `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/1.Three%20Primary%20Regions/1.%20Foregut%20%28Stomodaem%29/Anatomy_of_the_Insect_Foregut.png`,
    },
  ],
  2: [
    {
      id: 'fc_2_1',
      category: 'Morphology',
      front: 'What are the three tagmata of an insect body?',
      back: 'Head (sensory & ingestion), Thorax (locomotion - 3 pairs of legs, wings), and Abdomen (visceral organs & reproduction).',
      hint: 'Body segmentation',
    },
    {
      id: 'fc_2_2',
      category: 'Mouthparts',
      front: 'What type of mouthparts do honey bees (*Apis mellifera*) possess?',
      back: 'Chewing and Lapping mouthparts — modified glossae form a tongue for nectar imbibition while mandibles knead wax.',
      hint: 'Dual function for wax molding and nectar extraction',
    },
  ],
};
