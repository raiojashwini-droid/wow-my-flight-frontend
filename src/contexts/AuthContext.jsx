import React, { createContext, useContext, useState, useEffect } from 'react';
import { AGENTS } from '../constants/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('crm-auth-user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const isAuthenticated = !!currentUser;

  // Background sync: keep currentUser in sync with crm-agents-list updates
  useEffect(() => {
    if (!currentUser) return;
    try {
      const savedAgents = localStorage.getItem('crm-agents-list');
      if (savedAgents) {
        const agents = JSON.parse(savedAgents);
        const freshUser = agents.find(a => a.id === currentUser.id);
        if (freshUser) {
          // If customPermissions or other profile info changed, update auth session
          if (JSON.stringify(freshUser.customPermissions) !== JSON.stringify(currentUser.customPermissions) ||
              freshUser.name !== currentUser.name ||
              freshUser.email !== currentUser.email) {
            
            const updated = {
              ...currentUser,
              name: freshUser.name,
              email: freshUser.email,
              role: freshUser.role || currentUser.role,
              customPermissions: freshUser.customPermissions
            };
            localStorage.setItem('crm-auth-user', JSON.stringify(updated));
            setCurrentUser(updated);
          }
        }
      }
    } catch (e) {
      console.warn("Error syncing user session with agents list:", e);
    }
  }, [currentUser]);

  const login = (user) => {
    localStorage.setItem('crm-auth-user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('crm-auth-user');
    setCurrentUser(null);
  };

  // Refresh current user from a full updated agent object
  // Called when an admin updates an agent's permissions while they are logged in
  const refreshUser = (updatedAgent) => {
    if (!currentUser || currentUser.id !== updatedAgent.id) return;
    const updatedUser = {
      ...currentUser,
      name: updatedAgent.name,
      email: updatedAgent.email,
      role: updatedAgent.role || currentUser.role,
      avatar: updatedAgent.avatar || currentUser.avatar,
      customPermissions: updatedAgent.customPermissions,
    };
    localStorage.setItem('crm-auth-user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const changeRole = (role) => {
    let user = { 
      id: 'usr-admin', 
      name: 'Alex Turner (GM)', 
      email: 'admin@wowmyflight.com', 
      role: 'admin', 
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' 
    };
    
    if (role === 'super_admin') {
      user = { id: 'usr-super-admin', name: 'Wael Madi (CEO)', email: 'wael.madi@wowmyflight.com', role: 'super_admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' };
    } else if (role === 'marketing') {
      user = { id: 'usr-marketing', name: 'Marcus Sterling (Marketing)', email: 'marketing@wowmyflight.com', role: 'marketing', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
    } else if (role === 'consultant' || role === 'sales_agent') {
      user = { id: 'usr-consultant', name: 'Sofia Rodriguez (Sales)', email: 'sales@wowmyflight.com', role: 'consultant', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' };
    } else if (role === 'finance') {
      user = { id: 'usr-finance', name: 'Elena Rostova (Finance)', email: 'finance@wowmyflight.com', role: 'finance', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150' };
    } else if (role === 'operations') {
      user = { id: 'usr-operations', name: 'Carlos Gomez (Ops)', email: 'ops@wowmyflight.com', role: 'operations', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150' };
    } else if (role === 'team_leader') {
      user = { id: 'usr-team-leader', name: 'David Vance (Sales TL)', email: 'teamleader@wowmyflight.com', role: 'team_leader', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' };
    } else if (role === 'expert_team_leader' || role === 'expert_tl') {
      user = { id: 'usr-expert-tl', name: 'Michael Chang (Escalation TL)', email: 'expertlead@wowmyflight.com', role: 'expert_team_leader', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150' };
    } else if (role === 'flight_expert') {
      user = { id: 'usr-flight-expert', name: 'Priya Sharma (GDS Expert)', email: 'expert@wowmyflight.com', role: 'flight_expert', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' };
    } else if (role === 'ticketing_agent') {
      user = { id: 'usr-ticketing-agent', name: 'Omar Farouq (Ticketing)', email: 'ticketing@wowmyflight.com', role: 'ticketing_agent', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' };
    }

    localStorage.setItem('crm-auth-user', JSON.stringify(user));
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, logout, changeRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export const useAuth = useAuthContext;
