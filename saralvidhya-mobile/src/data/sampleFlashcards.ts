export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  hint?: string;
  infographicUrl?: string;
}

export const SAMPLE_FLASHCARDS: Record<number, Flashcard[]> = {
  1: [
    {
      id: 'fc_1_1',
      category: 'Anatomy',
      front: 'What are the three primary divisions of the insect alimentary canal?',
      back: '1. Stomodaeum (Foregut)\n2. Mesenteron (Midgut / Ventriculus)\n3. Proctodaeum (Hindgut)',
      hint: 'Think: anterior, middle, posterior embryonic origins',
    },
    {
      id: 'fc_1_2',
      category: 'Embryology',
      front: 'Which gut regions are lined with a chitinous cuticular intima?',
      back: 'The Foregut (Stomodaeum) and Hindgut (Proctodaeum) are ectodermal in origin and lined with cuticular intima shed during each molt. The Midgut lacks intima.',
      hint: 'Only ectodermal regions have cuticular lining',
    },
    {
      id: 'fc_1_3',
      category: 'Physiology',
      front: 'What is the function of the Proventriculus (Gizzard)?',
      back: 'Armed with strong chitinous internal teeth that mechanically grind solid food particles into a fine pulp before it passes into the delicate midgut.',
      hint: 'Mechanical mastication / grinding mill',
    },
    {
      id: 'fc_1_4',
      category: 'Cell Biology',
      front: 'What is the Peritrophic Membrane and why is it essential?',
      back: 'A semi-permeable chitin-protein sheath secreted in the midgut. It protects the microvillar epithelial cells from abrasive food particles and forms a barrier against bacterial pathogens.',
      hint: 'Non-cellular sheath surrounding food bolus',
    },
    {
      id: 'fc_1_5',
      category: 'Excretion',
      front: 'Where are Malpighian Tubules located and what is their role?',
      back: 'Inserted at the junction of the Midgut and Hindgut. They act as kidneys, extracting nitrogenous wastes (principally uric acid) from the hemolymph.',
      hint: 'Insect kidney analogue',
    },
    {
      id: 'fc_1_6',
      category: 'Osmoregulation',
      front: 'What is the physiological role of Rectal Papillae / Pads?',
      back: 'They actively reabsorb water, sodium, potassium, and chloride ions from the fecal pellet back into the hemolymph, preventing fatal desiccation.',
      hint: 'Water conservation in terrestrial insects',
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
