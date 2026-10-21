import { createContext, useCallback, useEffect, useState } from 'react';
import { getBusinessSettings, updateBusinessSettings } from '../services/business.service';
import { DEFAULT_BUSINESS } from '../config/business';

export const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(DEFAULT_BUSINESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshBusiness = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getBusinessSettings();
      setBusiness(response.data.business);
      setError(null);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBusiness();
  }, [refreshBusiness]);

  const saveBusiness = async (settings) => {
    const response = await updateBusinessSettings(settings);
    setBusiness(response.data.business);
    setError(null);
    return response.data.business;
  };

  return (
    <BusinessContext.Provider value={{ business, loading, error, refreshBusiness, saveBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}
