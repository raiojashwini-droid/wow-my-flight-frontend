import React, { createContext, useContext, useEffect, useState } from 'react';
const AuthContext = createContext(null);
const backend = import.meta.env.VITE_BACKEND_URL || 'https://wow-my-flight-backend-production-2ef6.up.railway.app';
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try { const user=JSON.parse(localStorage.getItem('crm-auth-user')); return user?.token ? user : null; } catch { return null; }
  });
  const login = user => { localStorage.setItem('crm-auth-user', JSON.stringify(user)); setCurrentUser(user); };
  const logout = () => { localStorage.removeItem('crm-auth-user'); setCurrentUser(null); };
  useEffect(() => {
    if (!currentUser?.token) return;
    let cancelled=false;
    fetch(backend+'/api/users/me', {headers:{Authorization:'Bearer '+currentUser.token}}).then(async response=>{
      if (response.status===401) { if(!cancelled)logout(); return; }
      if(!response.ok)return;
      const result=await response.json();
      if(!cancelled&&result.success)login({...result.data,token:currentUser.token});
    }).catch(()=>{});
    return ()=>{cancelled=true;};
  }, [currentUser?.token]);
  const refreshUser = updated => {
    if(currentUser?.id===updated.id)login({...currentUser,name:updated.name,email:updated.email,phone:updated.phone,avatar:updated.avatar});
  };
  return <AuthContext.Provider value={{currentUser,isAuthenticated:!!currentUser?.token,login,logout,refreshUser}}>{children}</AuthContext.Provider>;
};
export const useAuthContext=()=>{const value=useContext(AuthContext);if(!value)throw new Error('AuthProvider is required');return value;};
export const useAuth=useAuthContext;
