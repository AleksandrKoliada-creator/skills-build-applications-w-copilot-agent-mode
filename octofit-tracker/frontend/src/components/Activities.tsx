import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type?: string;
  minutes?: number;
  points?: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        const payload = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        setActivities(payload.activities ?? []);
      } catch {
        setError('Unable to load activities.');
      } finally {
        setLoading(false);
      }
    }

    void loadActivities();
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." loading={loading} error={error}>
      {activities.length === 0 ? <p>No activities</p> : (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
              <strong>{activity.type ?? 'Activity'}</strong> · {activity.minutes ?? 0} minutes · {activity.points ?? 0} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
