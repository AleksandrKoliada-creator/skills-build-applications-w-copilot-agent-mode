import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, loading = false, error = null, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading ? <p role="status">Loading...</p> : null}
        {!loading && error ? <div role="alert" className="alert alert-danger">{error}</div> : null}
        {!loading && !error ? children : null}
      </div>
    </section>
  );
}
