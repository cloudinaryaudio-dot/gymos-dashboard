import { useState, useEffect } from 'react';
import * as ds from '@/services/dataService';

export function useSetupDetection() {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    ds.hasAnyData().then(has => {
      setNeedsSetup(!has);
      setChecking(false);
    });
  }, []);

  return { needsSetup, checking };
}
