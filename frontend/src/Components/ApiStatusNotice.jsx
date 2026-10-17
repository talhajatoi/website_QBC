import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { healthCheck } from '../services/api';

export default function ApiStatusNotice() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let current = true;
    healthCheck().then(() => { if (current) setOffline(false); }).catch(() => { if (current) setOffline(true); });
    return () => { current = false; };
  }, []);
  if (!offline) return null;
  return <div role="alert" className="bg-red-700 px-4 py-3 text-center text-sm font-bold text-white"><span className="inline-flex items-center gap-2"><WifiOff className="h-4 w-4" />Store services are currently unavailable. You can browse cached pages, but cart and checkout requests cannot be completed.</span></div>;
}
