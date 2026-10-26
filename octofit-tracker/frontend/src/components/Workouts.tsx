import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const payload = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        setSuggestions(payload.suggestions ?? []);
      } catch {
        setError('Unable to load workout suggestions.');
      } finally {
        setLoading(false);
      }
    }

    void loadSuggestions();
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error}>
      {suggestions.length === 0 ? <p>No workout suggestions</p> : (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item">
              <strong>{suggestion.title ?? 'Workout'}</strong>
              <div>{suggestion.focus ?? 'General'} · {suggestion.minutes ?? 0} minutes · {suggestion.difficulty ?? 'moderate'}</div>
              <small>{suggestion.reason ?? 'Build activity.'}</small>
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
