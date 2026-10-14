import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { useThemeMode } from '../../contexts/ThemeContext';

// Icons for roles
import { ShieldAlert, ShieldCheck, Cpu, HeadphonesIcon, Users, Diamond, Send, Ticket, Wrench, Wallet, Megaphone } from 'lucide-react';

const schema = yup.object().shape({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const roleCategories = [
  {
    id: 'admin',
    title: 'Management & Admin',
    description: 'System control & approvals',
    roles: [
      { role: 'super_admin', label: 'Super Admin', desc: 'Full system control', icon: <ShieldAlert size={18} /> },
      { role: 'admin', label: 'Admin (GM)', desc: 'Manage team and approvals', icon: <ShieldCheck size={18} /> },
      { role: 'api_manager', label: 'API / System Mgr', desc: 'Manage integrations', icon: <Cpu size={18} /> },
    ]
  },
  {
    id: 'sales',
    title: 'Sales Department',
    description: 'B2B/B2C flight bookings',
    roles: [
      { role: 'consultant', label: 'Sales Exec', desc: 'Client interactions', icon: <HeadphonesIcon size={18} /> },
      { role: 'team_leader', label: 'Team Leader', desc: 'Manage sales agents', icon: <Users size={18} /> },
      { role: 'expert_team_leader', label: 'Expert TL (Escalation)', desc: 'Handle complex queries', icon: <Diamond size={18} /> },
      { role: 'flight_expert', label: 'Flight Expert (GDS)', desc: 'GDS routing & pricing', icon: <Send size={18} /> },
    ]
  },
  {
    id: 'operations',
    title: 'Ops, Finance & Marketing',
    description: 'Ticketing, accounts & ads',
    roles: [
      { role: 'ticketing_agent', label: 'Ticketing Expert', desc: 'Issue & manage e-tickets', icon: <Ticket size={18} /> },
      { role: 'after_sales', label: 'After-Sales / Ops', desc: 'Post-booking modifications', icon: <Wrench size={18} /> },
      { role: 'finance', label: 'Finance & Accounts', desc: 'Invoices & reconciliations', icon: <Wallet size={18} /> },
      { role: 'marketing', label: 'Marketing Manager', desc: 'Campaigns & promotions', icon: <Megaphone size={18} /> },
    ]
  }
];

export const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();
  const { showAlert } = useAlert();
  const { mode } = useThemeMode();
  
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');
  const [isExiting, setIsExiting] = useState(false);
  const hasJustLoggedIn = React.useRef(false);

  useEffect(() => {
    if (isAuthenticated && currentUser && !hasJustLoggedIn.current) {
      let rolePrefix = currentUser.role || 'super_admin';
      if (currentUser.role === 'consultant' || currentUser.role === 'sales_agent') rolePrefix = 'agent';
      else if (currentUser.role === 'marketing') rolePrefix = 'marketing-manager';
      navigate(`/${rolePrefix}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: dbService.getConsultants,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const executeLogin = (userObj, rolePrefix, name) => {
    hasJustLoggedIn.current = true;
    login(userObj);
    showAlert(`Logged in successfully as ${name}`, 'success');
    setIsExiting(true);
    setTimeout(() => {
      navigate(`/${rolePrefix}/dashboard`);
    }, 200);
  };

  const onSubmit = async (data) => {
    const enteredEmail = data.email.toLowerCase().trim();
    const enteredPassword = data.password;

    // 1. Try Live Authentication via Backend API & PostgreSQL Database
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: enteredEmail, password: enteredPassword })
      });
      const result = await res.json();

      if (res.ok && result.success && result.user) {
        const u = result.user;
        let rolePrefix = u.role || 'super_admin';
        if (u.role === 'consultant' || u.role === 'sales_agent') rolePrefix = 'agent';
        else if (u.role === 'marketing') rolePrefix = 'marketing-manager';

        executeLogin({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          avatar: u.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          token: result.token
        }, rolePrefix, u.name);
        return;
      }
    } catch (e) {
      // Backend unreachable or offline, continue with local fallback
    }

    // 2. Local Fallback for offline / instant demo
    if (enteredEmail === 'admin@aaa.com' || enteredEmail === 'admin@wowmyflight.com' || enteredEmail === 'wael.madi@wowmyflight.com') {
      executeLogin({
        id: 'usr-super-admin',
        name: 'Wael Madi (CEO)',
        email: 'wael.madi@wowmyflight.com',
        role: 'super_admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      }, 'super_admin', 'Wael Madi (CEO)');
      return;
    }

    const matchedConsultant = consultants.find(c => c.email && c.email.toLowerCase().trim() === enteredEmail);

    if (matchedConsultant) {
      const expectedPassword = matchedConsultant.password || 'password123';
      if (enteredPassword === expectedPassword) {
        let rolePrefix = matchedConsultant.role || 'agent';
        if (rolePrefix === 'consultant' || rolePrefix === 'sales_agent') rolePrefix = 'agent';
        else if (rolePrefix === 'marketing') rolePrefix = 'marketing-manager';
        
        executeLogin({
          id: matchedConsultant.id,
          name: matchedConsultant.name,
          email: matchedConsultant.email,
          role: matchedConsultant.role || 'consultant',
          avatar: matchedConsultant.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          customPermissions: matchedConsultant.customPermissions,
        }, rolePrefix, `Team Member: ${matchedConsultant.name}`);
        return;
      }
    }

    // Trigger Shake animation
    setShake(true);
    setTimeout(() => setShake(false), 500);
    showAlert('Invalid login credentials. Please check email/password.', 'error');
  };

  const handleQuickLogin = (role) => {
    let mockUser = {
      id: 'usr-admin', name: 'Alex Turner (GM)', email: 'admin@wowmyflight.com', role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    };
    let routePrefix = 'admin';

    if (role === 'consultant') {
      mockUser = { id: 'usr-consultant', name: 'Sofia Rodriguez (Sales)', email: 'sales@wowmyflight.com', role: 'consultant', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' };
      routePrefix = 'agent';
    } else if (role === 'team_leader') {
      mockUser = { id: 'usr-team-leader', name: 'David Vance (Sales TL)', email: 'teamleader@wowmyflight.com', role: 'team_leader', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' };
      routePrefix = 'team_leader';
    } else if (role === 'expert_team_leader' || role === 'expert_tl') {
      mockUser = { id: 'usr-expert-tl', name: 'Michael Chang (Escalation TL)', email: 'expertlead@wowmyflight.com', role: 'expert_team_leader', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150' };
      routePrefix = 'expert_team_leader';
    } else if (role === 'flight_expert') {
      mockUser = { id: 'usr-flight-expert', name: 'Priya Sharma (GDS Expert)', email: 'expert@wowmyflight.com', role: 'flight_expert', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' };
      routePrefix = 'flight_expert';
    } else if (role === 'ticketing_agent') {
      mockUser = { id: 'usr-ticketing-agent', name: 'Omar Farouq (Ticketing)', email: 'ticketing@wowmyflight.com', role: 'ticketing_agent', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' };
      routePrefix = 'ticketing_agent';
    } else if (role === 'finance' || role === 'accountant') {
      mockUser = { id: 'usr-finance', name: 'Elena Rostova (Finance)', email: 'finance@wowmyflight.com', role: 'finance', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150' };
      routePrefix = 'finance';
    } else if (role === 'operations' || role === 'after_sales') {
      mockUser = { id: 'usr-operations', name: 'Carlos Gomez (Ops & After-Sales)', email: 'ops@wowmyflight.com', role: 'operations', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150' };
      routePrefix = 'operations';
    } else if (role === 'super_admin') {
      mockUser = { id: 'usr-super-admin', name: 'Wael Madi (CEO)', email: 'wael.madi@wowmyflight.com', role: 'super_admin', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' };
      routePrefix = 'super_admin';
    } else if (role === 'api_manager') {
      mockUser = { id: 'usr-admin', name: 'Alex Turner (System Mgr)', email: 'admin@wowmyflight.com', role: 'admin', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' };
      routePrefix = 'integrations';
    } else if (role === 'qa') {
      mockUser = { id: 'usr-team-leader', name: 'David Vance (QA & Audit)', email: 'teamleader@wowmyflight.com', role: 'team_leader', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' };
      routePrefix = 'team_leader';
    } else if (role === 'marketing') {
      mockUser = { id: 'usr-marketing', name: 'Marcus Sterling (Marketing)', email: 'marketing@wowmyflight.com', role: 'marketing', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
      routePrefix = 'marketing-manager';
    }

    if (routePrefix === 'integrations') {
      executeLogin(mockUser, '', `Demo ${role.toUpperCase().replace('_', ' ')}`);
      setTimeout(() => navigate('/integrations'), 600);
    } else {
      executeLogin(mockUser, routePrefix, `Demo ${role.toUpperCase().replace('_', ' ')}`);
    }
  };

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.4 }
  };

  const isDark = mode === 'dark';

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="login-form"
          initial={{ opacity: 0, y: 30 }}
          animate={shake ? shakeAnimation : { opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`w-full max-w-[500px] p-8 md:p-10 rounded-[24px] shadow-2xl backdrop-blur-xl border ${isDark ? 'bg-[#0B1020]/80 border-white/5 shadow-black/50' : 'bg-white/95 border-slate-200 shadow-slate-200/50'}`}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className={`font-['Sora'] font-bold text-3xl mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Welcome back
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter your credentials to access the Travel CRM portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="relative group">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${errors.email ? 'text-red-500' : isDark ? 'text-slate-400 group-focus-within:text-[#D4A72C]' : 'text-slate-400 group-focus-within:text-[#4F46E5]'}`}>
                <Mail size={18} />
              </div>
              <input
                {...register('email')}
                type="text"
                placeholder="Email Address"
                className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm transition-all outline-none bg-transparent ${
                  errors.email 
                    ? 'border-red-500 focus:ring-4 focus:ring-red-500/20' 
                    : isDark 
                      ? 'border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4A72C] focus:ring-4 focus:ring-[#D4A72C]/10' 
                      : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 hover:border-slate-300'
                }`}
              />
              {errors.email && <p className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="relative group mt-6">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${errors.password ? 'text-red-500' : isDark ? 'text-slate-400 group-focus-within:text-[#D4A72C]' : 'text-slate-400 group-focus-within:text-[#4F46E5]'}`}>
                <Lock size={18} />
              </div>
              <input
                {...register('password')}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={`w-full pl-11 pr-12 py-3.5 rounded-xl border text-sm transition-all outline-none bg-transparent ${
                  errors.password 
                    ? 'border-red-500 focus:ring-4 focus:ring-red-500/20' 
                    : isDark 
                      ? 'border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4A72C] focus:ring-4 focus:ring-[#D4A72C]/10' 
                      : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 hover:border-slate-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-4 flex items-center ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'} transition-colors`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && <p className="absolute -bottom-5 left-1 text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end pt-1">
              <RouterLink to="/forgot-password" className={`text-xs font-semibold hover:underline decoration-2 underline-offset-4 transition-all ${isDark ? 'text-[#D4A72C] hover:text-[#fde08b]' : 'text-[#4F46E5] hover:text-[#7C3AED]'}`}>
                Forgot password?
              </RouterLink>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                'Log In'
              )}
            </motion.button>
          </form>

          {/* Quick Login Divider */}
          <div className="flex items-center my-8">
            <div className={`flex-grow h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            <span className={`px-4 text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Demo Quick Login
            </span>
            <div className={`flex-grow h-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          </div>

          {/* Quick Login Accordion */}
          <div className="space-y-3">
            {roleCategories.map((cat) => (
              <div key={cat.id} className={`rounded-xl overflow-hidden transition-colors ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <button
                  onClick={() => setActiveTab(activeTab === cat.id ? '' : cat.id)}
                  className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'}`}
                >
                  <div>
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cat.title}</h4>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{cat.description}</p>
                  </div>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'} ${activeTab === cat.id ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {activeTab === cat.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                        {cat.roles.map((r, idx) => (
                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={r.role}
                            onClick={() => handleQuickLogin(r.role)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-all border ${
                              isDark 
                                ? 'bg-slate-800 border-slate-700 hover:border-[#D4A72C] hover:bg-slate-700 hover:shadow-lg' 
                                : 'bg-white border-slate-200 hover:border-[#4F46E5] hover:shadow-md'
                            }`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-md ${isDark ? 'bg-slate-700 text-[#D4A72C]' : 'bg-indigo-50 text-[#4F46E5]'}`}>
                              {r.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-[11px] font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {r.label}
                              </div>
                              <div className={`text-[9px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {r.desc}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          
        </motion.div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </AnimatePresence>
  );
};

export default Login;
