import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const payload = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        setLeaderboard(payload.leaderboard ?? []);
      } catch {
        setError('Unable to load leaderboard.');
      } finally {
        setLoading(false);
      }
    }

    void loadLeaderboard();
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error}>
      {leaderboard.length === 0 ? <p>No leaderboard</p> : (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li key={`${entry.teamName ?? 'team'}-${entry.rank ?? 'unknown'}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{entry.teamName ?? 'Unknown team'}</span>
              <span>{entry.totalPoints ?? 0}</span>
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
