import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalAudioProgress } from '@/hooks/useAudioProgress';
import { cloudStorage, useCloudState } from '@/context/CloudStateContext';
import './ResumePodcastToast.css';

export default function ResumePodcastToast() {
  const [resumeData, setResumeData] = useState<GlobalAudioProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { cloudState, isHydrated } = useCloudState();

  useEffect(() => {
    const userId = cloudStorage.getItem('app_user_id') || cloudState?.user?.userId || 'anonymous';
    let progress: GlobalAudioProgress | null = null;

    const rawStr = cloudStorage.getItem(`global_last_podcast_${userId}`);
    if (rawStr) {
      try {
        progress = JSON.parse(rawStr);
      } catch (e) {
        console.error(e);
      }
    }

    if (progress && progress.currentTime > 0 && progress.wasPaused) {
      setResumeData(progress);
      setIsVisible(true);
    }
  }, [cloudState, isHydrated]);

  if (!isVisible || !resumeData) return null;

  const handleResume = () => {
    setIsVisible(false);
    const { subjectId, chapterNumber, chapterName, persona, track } = resumeData;

    const baseParams = `cId=${subjectId}&className=Resumed&sId=${subjectId}&subjectName=${encodeURIComponent(subjectId)}`;

    navigate(`/chapters?${baseParams}&persona=${persona}`, {
      state: {
        autoPlayPodcast: true,
        resumeTrack: track,
        chapterNumber,
        chapterName,
      },
    });
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  return (
    <div className="sv-resume-toast" onClick={handleResume}>
      <div className="sv-resume-icon">🎧</div>
      <div className="sv-resume-content">
        <h4>Welcome back!</h4>
        <p>
          Continue listening to{' '}
          <strong>{resumeData.chapterName || `Chapter ${resumeData.chapterNumber}`}</strong>
        </p>
      </div>
      <button className="sv-resume-close" onClick={handleDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
