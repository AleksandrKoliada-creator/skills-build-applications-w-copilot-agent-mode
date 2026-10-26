import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  mascot?: string;
  members?: Array<string | { _id?: string; name?: string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeams() {
      try {
        const payload = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        setTeams(payload.teams ?? []);
      } catch {
        setError('Unable to load teams.');
      } finally {
        setLoading(false);
      }
    }

    void loadTeams();
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error}>
      {teams.length === 0 ? <p>No teams</p> : (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
              <strong>{team.name ?? 'Unknown team'}</strong> ({team.mascot ?? 'Mascot'})
              <div>{(team.members ?? []).length} members</div>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
