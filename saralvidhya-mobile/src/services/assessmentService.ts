export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  isMultipleSelect: boolean;
  options: string[];
  correctAnswers: number[]; // indices of correct options
  explanation: string;
}

export const SAMPLE_ASSESSMENT_QUESTIONS: Record<number, AssessmentQuestion[]> = {
  1: [
    {
      id: 'q_1_1',
      question: 'Which of the following gut regions is endodermal in origin and lacks a chitinous intima?',
      isMultipleSelect: false,
      options: [
        'Stomodaeum (Foregut)',
        'Mesenteron (Midgut)',
        'Proctodaeum (Hindgut)',
        'Proventriculus (Gizzard)',
      ],
      correctAnswers: [1],
      explanation: 'The Mesenteron (midgut) is derived from embryonic endoderm and lacks a chitinous cuticular lining, allowing enzyme secretion and nutrient absorption.',
    },
    {
      id: 'q_1_2',
      question: 'Which of the following structures belong to the Stomodaeum (Foregut)?',
      isMultipleSelect: true,
      options: [
        'Crop (Ingluvies)',
        'Gastric Caeca',
        'Proventriculus (Gizzard)',
        'Oesophagus',
      ],
      correctAnswers: [0, 2, 3],
      explanation: 'The Foregut includes the preoral cavity, pharynx, oesophagus, crop, and proventriculus. Gastric caeca belong to the anterior midgut.',
    },
    {
      id: 'q_1_3',
      question: 'What is the primary biological function of the Peritrophic Membrane?',
      isMultipleSelect: false,
      options: [
        'Pumping hemolymph through the dorsal vessel',
        'Protecting midgut epithelial cells from abrasive food and pathogen invasion',
        'Excreting uric acid into the rectal lumen',
        'Grinding solid grains in chewing insects',
      ],
      correctAnswers: [1],
      explanation: 'The peritrophic membrane is a semi-permeable sheath of chitin and protein that encases the food bolus, protecting delicate microvilli from mechanical abrasion and micro-organisms.',
    },
    {
      id: 'q_1_4',
      question: 'Which features are true regarding Malpighian Tubules in insects?',
      isMultipleSelect: true,
      options: [
        'They are inserted at the midgut-hindgut junction',
        'They extract uric acid and waste from the hemolymph',
        'They are lined with heavy sclerotized teeth',
        'They play a central role in osmoregulation and water balance',
      ],
      correctAnswers: [0, 1, 3],
      explanation: 'Malpighian tubules arise at the junction of the midgut and hindgut, filtering nitrogenous waste (chiefly uric acid) and participating in ionic balance. They do not have teeth.',
    },
    {
      id: 'q_1_5',
      question: 'In dry terrestrial insects, which organ is responsible for reabsorbing up to 95% of water from fecal matter?',
      isMultipleSelect: false,
      options: [
        'Rectal Papillae / Pads',
        'Gastric Caeca',
        'Salivary Glands',
        'Crop',
      ],
      correctAnswers: [0],
      explanation: 'Rectal pads (or papillae) in the hindgut contain highly active ion pumps that reclaim water and electrolytes back into the hemolymph, producing dry frass.',
    },
  ],
};
