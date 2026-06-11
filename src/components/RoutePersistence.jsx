import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_PATHS = ['/', '/login/mentee', '/login/mentor', '/login/admin'];

export default function RoutePersistence() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !PUBLIC_PATHS.includes(location.pathname)) {
      sessionStorage.setItem('eccp_last_path', location.pathname + location.search);
    }
  }, [location.pathname, location.search, user]);

  return null;
}

export function getSavedPath() {
  return sessionStorage.getItem('eccp_last_path');
}
