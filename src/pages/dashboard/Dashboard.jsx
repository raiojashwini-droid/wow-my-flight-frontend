import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={location.state} />;
  }

  const getRolePrefix = () => {
    const role = currentUser.role;
    if (role === 'super_admin') return 'super_admin';
    if (role === 'marketing') return 'marketing-manager';
    if (role === 'admin') return 'admin';
    if (role === 'operations') return 'operations';
    if (role === 'consultant' || role === 'sales_agent') return 'agent';
    if (role === 'finance') return 'finance';
    if (role === 'team_leader') return 'team_leader';
    if (role === 'expert_team_leader') return 'expert_team_leader';
    if (role === 'flight_expert') return 'flight_expert';
    if (role === 'ticketing_agent') return 'ticketing_agent';
    return role || 'agent';
  };

  const prefix = getRolePrefix();

  // Determine the target sub-route based on where they came from
  const currentPath = location.pathname;
  
  if (currentPath.startsWith('/clients') || currentPath.startsWith('/customers')) {
    if (currentUser.role === 'finance') return <Navigate to="/finance/dashboard" replace state={location.state} />;
    if (currentUser.role === 'super_admin') return <Navigate to="/super_admin/clients" replace state={location.state} />;
    if (currentUser.role === 'admin') return <Navigate to="/admin/clients" replace state={location.state} />;
    return <Navigate to={`/${prefix}/customers`} replace state={location.state} />;
  }
  
  if (currentPath.startsWith('/leads')) {
    if (currentUser.role === 'finance') return <Navigate to="/finance/dashboard" replace state={location.state} />;
    if (currentUser.role === 'super_admin') return <Navigate to="/super_admin/leads" replace state={location.state} />;
    if (currentUser.role === 'admin') return <Navigate to="/admin/leads" replace state={location.state} />;
    return <Navigate to={`/${prefix}/leads`} replace state={location.state} />;
  }

  return <Navigate to={`/${prefix}/dashboard`} replace state={location.state} />;
};

export default Dashboard;

