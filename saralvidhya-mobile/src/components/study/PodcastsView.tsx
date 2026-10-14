import React from 'react';
import ListenScreen from './ListenScreen';

export default function PodcastsView({
  chapterNumber,
  chapterName,
  onNavigateToRead,
}: {
  chapterNumber: number;
  chapterName: string;
  onNavigateToRead?: (moduleNumber?: number) => void;
}) {
  return (
    <ListenScreen
      chapterNumber={chapterNumber}
      chapterTitle={chapterName}
      initialMode="detailed"
      onNavigateToRead={onNavigateToRead}
    />
  );
}
