import { useNavigate } from 'react-router-dom';
import { ExternalLink, Rocket, Send } from 'lucide-react';
import { useApplications, useUpdateApplication } from '../../api/queries.js';
import { Avatar, Badge, Card, CardHeader, EmptyState, SkeletonStack, useToast } from '../../components/ui/index.js';
import styles from './Dashboard.module.css';

/**
 * Saved jobs you haven't applied to yet. Highest priority first, then newest.
 * "Applied" flips the status; the backend stamps appliedAt and queues the auto follow-ups.
 */
export function ReadyToApply() {
  const navigate = useNavigate();
  const toast = useToast();
  const update = useUpdateApplication();
  const { data: saved = [], isLoading } = useApplications({ status: 'saved', sort: 'priority', limit: 200 });

  const items = [...saved].sort(
    (a, b) => (b.priority ?? 2) - (a.priority ?? 2) || String(b.createdAt).localeCompare(String(a.createdAt)),
  );

  const markApplied = async (app) => {
    try {
      await update.mutateAsync({ id: app.id, status: 'applied' });
      toast.success(`Applied: ${app.company.name}`, 'Reach-out reminder set for 2 days out.');
    } catch (error) {
      toast.error('Could not update', error.message);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Ready to apply"
        subtitle={items.length ? 'Saved jobs waiting on an application' : undefined}
        actions={items.length > 0 && <Badge tone="applied">{items.length}</Badge>}
      />
      {isLoading ? (
        <div style={{ padding: 'var(--space-5)' }}><SkeletonStack rows={2} height={44} /></div>
      ) : items.length === 0 ? (
        <EmptyState
          compact icon={Rocket} title="Queue is empty"
          description="Save a job (or use the bookmarklet in Tools) and it lands here."
        />
      ) : (
        <div className={styles.list}>
          {items.map((app) => (
            <div key={app.id} className={styles.rowWrap}>
              <button type="button" className={styles.row} onClick={() => navigate(`/applications/${app.id}`)}>
                <Avatar name={app.company.name} size={32} />
                <span className={styles.rowText}>
                  <span className={styles.rowTitle}>{app.role}</span>
                  <span className={styles.rowMeta}>
                    {app.company.name}
                    {app.location ? ` · ${app.location}` : ''}
                    {app.priority === 3 ? ' · ★ high priority' : ''}
                  </span>
                </span>
              </button>
              {app.jobUrl && (
                <a
                  className={styles.applyLink} href={app.jobUrl} target="_blank" rel="noreferrer"
                  title="Open the posting"
                >
                  Open <ExternalLink size={13} />
                </a>
              )}
              <button
                type="button" className={styles.appliedBtn} onClick={() => markApplied(app)}
                disabled={update.isPending} title="Mark as applied"
              >
                <Send size={13} /> Applied
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
