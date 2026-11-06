import { AssessmentQuestion } from './assessmentTypes';

export const MOCK_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'q1',
    type: 'mcq',
    q: 'Under continuous compounding, what is the fair value formula of an index futures contract?',
    options: [
      'F = S * e^((r - d) * T)',
      'F = S * e^((r + d) * T)',
      'F = S * e^(r * T) - D',
      'F = S * (1 + r)^T'
    ],
    answer: 0,
    explanation: 'The fair value formula with continuous compounding and a dividend yield d is F = S * e^((r - d) * T).'
  },
  {
    id: 'q2',
    type: 'true_false',
    q: 'For a short futures position, the investor gains when the spot price rises and loses when the spot price falls.',
    answer: false,
    explanation: 'For a short position, the investor gains when the price falls and loses when the price rises.'
  },
  {
    id: 'q3',
    type: 'fill_blanks',
    q: 'To reduce a portfolio\'s beta from 1.40 to 0.60 using index futures, the fund manager needs to [blank] contracts, because reducing beta requires a [blank] position in index futures.',
    correctAnswers: ['sell', 'short'],
    explanation: 'To decrease portfolio risk/beta, the manager needs to sell or short futures contracts, establishing a short position.'
  },
  {
    id: 'q4',
    type: 'msq',
    q: 'Which of the following are primary functions of the Endoplasmic Reticulum in a cell? (Select all that apply)',
    options: [
      'Protein synthesis and folding (Rough ER)',
      'Lipid metabolism and synthesis (Smooth ER)',
      'Generating ATP through cellular respiration',
      'Calcium ion storage'
    ],
    answer: [0, 1, 3],
    explanation: 'The Rough ER is responsible for protein synthesis and folding, while the Smooth ER is involved in lipid metabolism/synthesis and calcium storage. Generating ATP is the function of Mitochondria.'
  }
];
