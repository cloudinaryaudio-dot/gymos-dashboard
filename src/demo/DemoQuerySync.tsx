/**
 * Bridges demo-mode change events → React Query cache.
 * On any demo data mutation OR user/role switch, invalidate every active query
 * so all dashboards/tables re-fetch under the new vendor scope and permissions.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DEMO_CHANGE_EVENT } from './storage';

export function DemoQuerySync() {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = () => {
      qc.invalidateQueries();
    };
    window.addEventListener(DEMO_CHANGE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(DEMO_CHANGE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, [qc]);
  return null;
}
