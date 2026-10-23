import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, connectSocket } from '../lib/api.js';

const AppContext = createContext(null);

const portalRole = (user) => ({
  super_admin: 'admin',
  hospital_admin: 'hospital',
  blood_bank_admin: 'bank',
  user: 'patient',
}[user?.role] || null);

function toCurrentUser(user) {
  const organization = user?.organization || null;
  return {
    ...user,
    id: user?.id || user?._id,
    apiRole: user?.role,
    role: portalRole(user),
    organization,
    hospitalId: user?.role === 'hospital_admin' ? organization?.id || organization?._id : null,
    bankId: user?.role === 'blood_bank_admin' ? organization?.id || organization?._id : null,
  };
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((title, message, tone = 'success') => {
    const id = ++toastId.current;
    setToasts((items) => [...items.slice(-2), { id, title, message, tone }]);
    window.setTimeout(() => dismissToast(id), 5000);
  }, [dismissToast]);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const data = await api.notifications();
    setNotifications(data.notifications || []);
  }, [currentUser]);

  const refreshSession = useCallback(async () => {
    setSessionLoading(true);
    try {
      const data = await api.me();
      setCurrentUser(toCurrentUser(data.user));
      setConnectionError('');
    } catch (error) {
      if (error.status === 401) {
        setCurrentUser(null);
        setConnectionError('');
      } else {
        setConnectionError(error.message);
      }
    } finally {
      setSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleUnauthorized = () => refreshSession();
    window.addEventListener('bloodbridge:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bloodbridge:unauthorized', handleUnauthorized);
  }, [refreshSession]);

  useEffect(() => {
    if (!currentUser) {
      setSocket(null);
      setNotifications([]);
      return undefined;
    }

    let active = true;
    api.notifications()
      .then((data) => {
        if (active) setNotifications(data.notifications || []);
      })
      .catch((error) => {
        if (active) pushToast('Notifications unavailable', error.message, 'error');
      });

    const connection = connectSocket();
    connection.on('notification:new', (notification) => {
      if (!active) return;
      setNotifications((items) => [notification, ...items.filter((item) => item._id !== notification._id)].slice(0, 50));
    });
    connection.on('connect_error', () => {
      if (active) pushToast('Live updates unavailable', 'The API is reachable, but the authenticated Socket.IO connection could not be established.', 'warning');
    });
    setSocket(connection);

    return () => {
      active = false;
      connection.disconnect();
      setSocket(null);
    };
  }, [currentUser, pushToast]);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    const user = toCurrentUser(data.user);
    setCurrentUser(user);
    setConnectionError('');
    return user;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setCurrentUser(null);
    setNotifications([]);
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    const data = await api.markNotificationRead(id);
    setNotifications((items) => items.map((item) => (item._id === id ? data.notification : item)));
  }, []);

  const value = useMemo(() => ({
    currentUser,
    sessionLoading,
    connectionError,
    refreshSession,
    notifications,
    refreshNotifications,
    markNotificationRead,
    socket,
    toasts,
    dismissToast,
    pushToast,
    login,
    logout,
  }), [
    currentUser,
    sessionLoading,
    connectionError,
    refreshSession,
    notifications,
    refreshNotifications,
    markNotificationRead,
    socket,
    toasts,
    dismissToast,
    pushToast,
    login,
    logout,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
