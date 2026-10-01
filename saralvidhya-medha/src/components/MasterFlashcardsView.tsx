import { useState } from 'react';
import FlashcardsView from './FlashcardsView';

interface Card {
  front?: string;
  back?: string;
  question?: string;
  answer?: string;
}

interface Props {
  cards: Card[];
  subjectId?: string;
  persona?: "beginner" | "intermediate" | "advanced";
}

export default function MasterFlashcardsView({ cards, subjectId = 'english', persona }: Props) {
  const [masteredCount, setMasteredCount] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, background: 'transparent' }}>
        <FlashcardsView cards={cards} subjectId={subjectId} isPurpleTheme={true} persona={persona} />
      </div>
    </div>
  );
}
