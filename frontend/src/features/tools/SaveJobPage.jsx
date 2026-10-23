import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApplicationFormModal } from '../applications/ApplicationFormModal.jsx';
import { sourceFromHost } from './bookmarklet.js';

/** Landing page for the "Save to Trail" bookmarklet: opens the add form, pre-filled. */
export function SaveJobPage() {
  const navigate = useNavigate();
  const initialValues = useMemo(() => {
    try {
      const data = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
      return {
        role: data.role ?? '',
        companyName: data.company ?? '',
        jobUrl: data.url ?? '',
        source: sourceFromHost(data.host),
        jobDescription: data.description ?? '',
        status: 'saved',
      };
    } catch { return { status: 'saved' }; }
  }, []);

  return (
    <ApplicationFormModal
      open
      initialValues={initialValues}
      onClose={(created) => navigate(created?.id ? `/applications/${created.id}` : '/board', { replace: true })}
    />
  );
}
