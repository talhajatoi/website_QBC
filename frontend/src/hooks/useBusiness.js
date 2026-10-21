import { useContext } from 'react';
import { BusinessContext } from '../context/BusinessContext';

export const useBusiness = () => useContext(BusinessContext);
