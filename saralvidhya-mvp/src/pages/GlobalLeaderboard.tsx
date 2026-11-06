import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  cloudStorage,
  CLOUD_API_BASE,
  getCloudAuthHeaders,
} from '@/context/CloudStateContext';
import { detectTenantId } from '@/tenant/TenantProvider';

export default function GlobalLeaderboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<{ name: string; points: number; isMe: boolean }[]>([]);

  useEffect(() => {
    let cancelled = false;
    const dummyUsers = [
      { name: 'Rahul Sharma', points: 8500, isMe: false },
      { name: 'Aisha Khan', points: 9200, isMe: false },
      { name: 'Tariq Ali', points: 6400, isMe: false },
      { name: 'Sneha Reddy', points: 7100, isMe: false },
      { name: 'Rohan Patel', points: 5300, isMe: false },
    ];

    let myTotalPoints = 0;
    for (let i = 0; i < cloudStorage.length; i++) {
      const key = cloudStorage.key(i);
      if (key && key.startsWith('ekam_quiz_score_')) {
        myTotalPoints += parseInt(cloudStorage.getItem(key) || '0', 10);
      }
    }
    myTotalPoints = myTotalPoints * 5;

    const fallbackList = [
      ...dummyUsers,
      { name: 'You (Student)', points: myTotalPoints, isMe: true },
    ].sort((a, b) => b.points - a.points);
    setUsers(fallbackList);

    const activeTenant = detectTenantId() || cloudStorage.getItem('current_tenant_id');
    if (activeTenant) {
      fetch(`${CLOUD_API_BASE}/v2/t/${activeTenant}/leaderboard`, {
        method: 'GET',
        headers: getCloudAuthHeaders(activeTenant),
        credentials: 'include',
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled || !Array.isArray(data?.leaderboard) || data.leaderboard.length === 0) {
            return;
          }
          const cloudEntries = data.leaderboard.map((entry: any) => ({
            name: String(entry.name || 'Student'),
            points: entry.isMe
              ? Math.max(Number(entry.points || 0), myTotalPoints)
              : Number(entry.points || 0),
            isMe: Boolean(entry.isMe),
          }));
          cloudEntries.sort((a: any, b: any) => b.points - a.points);
          setUsers(cloudEntries);
        })
        .catch(() => {
          // Keep local cloudStorage-computed leaderboard on network error
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);
  const topThree = useMemo(() => users.slice(0, 3), [users]);
  const rest = useMemo(() => users.slice(3), [users]);

  const medalForRank = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', label: 'Gold' };
    if (rank === 2) return { emoji: '🥈', label: 'Silver' };
    if (rank === 3) return { emoji: '🥉', label: 'Bronze' };
    return null;
  };

  const initials = (name: string) => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase()).join('');
  };

  return (
    <div className="page glb-page">
      <div className="glb-topbar">
        <button onClick={() => navigate(-1)} className="glb-back-btn" type="button">
          ‹ Back
        </button>
      </div>

      <div className="glb-hero card">
        <div>
          <h1 className="glb-title">Global Leaderboard</h1>
          <p className="glb-subtitle">Your total performance across all subjects compared to peers.</p>
        </div>
        <div className="glb-badge">🏆</div>
      </div>

      {topThree.length > 0 && (
        <div className="glb-podium">
          {[2, 1, 3].map((rank) => {
            const u = topThree[rank - 1];
            if (!u) return <div key={rank} />;
            const medal = medalForRank(rank);
            return (
              <div key={rank} className={`glb-podium-card rank-${rank} ${u.isMe ? 'is-me' : ''}`}>
                <div className="glb-podium-medal" aria-label={medal?.label || `Rank ${rank}`}>
                  {medal?.emoji}
                </div>
                <div className="glb-avatar" aria-hidden="true">{initials(u.name)}</div>
                <div className="glb-name" title={u.name}>{u.name}</div>
                <div className="glb-points">{u.points} pts</div>
                <div className="glb-rank">#{rank}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="glb-list card">
        {rest.map((u, idx) => {
          const rank = idx + 4;
          return (
            <div key={`${u.name}-${rank}`} className={`glb-row ${u.isMe ? 'is-me' : ''}`}>
              <div className="glb-row-left">
                <div className="glb-row-rank">#{rank}</div>
                <div className="glb-row-avatar" aria-hidden="true">{initials(u.name)}</div>
                <div className="glb-row-name" title={u.name}>{u.name}</div>
              </div>
              <div className="glb-row-points">{u.points} pts</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
