import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getBackendUrl } from '../../services/dbService';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { useThemeMode } from '../../contexts/ThemeContext';

const quickAccounts = [
  { name: 'Parminder', role: 'Super Admin' },
  { name: 'Xavier', role: 'Admin' },
  { name: 'Issac', role: 'Sales Executive' },
  { name: 'George', role: 'Sales Executive' },
  { name: 'Adam', role: 'Sales Executive' },
  { name: 'Abu', role: 'Sales Executive' },
];

const schema = yup.object().shape({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});


export const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();
  const { showAlert } = useAlert();
  const { mode } = useThemeMode();

  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const hasJustLoggedIn = React.useRef(false);

  useEffect(() => {
    if (isAuthenticated && currentUser && !hasJustLoggedIn.current) {
      let rolePrefix = currentUser.role || 'super_admin';
      if (currentUser.role === 'sales_executive' || currentUser.role === 'sales_agent') rolePrefix = 'agent';
      else if (currentUser.role === 'marketing') rolePrefix = 'marketing-manager';
      navigate(`/${rolePrefix}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);


  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const executeLogin = (userObj, rolePrefix, name) => {
    hasJustLoggedIn.current = true;
    login(userObj);
    showAlert(`Logged in successfully as ${name}`, 'success');
    const targetPath = rolePrefix ? `/${rolePrefix}/dashboard` : '/dashboard';
    navigate(targetPath, { replace: true });
  };

  const onSubmit = async (data) => {
    try {
      const response = await fetch(getBackendUrl() + '/api/users/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email.trim(), password: data.password })
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.token) throw new Error(result.error || 'Login failed');
      const prefix = result.user.role === 'sales_executive' ? 'agent' : result.user.role;
      executeLogin({ ...result.user, token: result.token }, prefix, result.user.name);
    } catch (error) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      showAlert(error.message || 'Unable to reach the server', 'error');
    }
  };

  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.4 }
  };

  const isDark = mode === 'dark';

  return (
    <>
      <motion.div
        key="login-form"
        initial={{ opacity: 0, y: 20 }}
        animate={shake ? shakeAnimation : { opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
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
                type="email"
                autoComplete="username"
                aria-label="Email address"
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
                autoComplete="current-password"
                aria-label="Password"
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

          <section className="mt-6 border-t border-slate-300/30 pt-5" aria-label="Quick account selection">
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick login</p>
            <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Temporary demo access: choose an account to log in.</p>
            <div className="grid grid-cols-2 gap-2">
              {quickAccounts.map(({ name, role }) => {
                const email = `${name.toLowerCase()}@wowmyflight.com`;
                const selected = watch('email') === email;
                return (
                  <button key={name} type="button" disabled={isSubmitting} aria-pressed={selected}
                    onClick={() => {
                      setValue('email', email, { shouldValidate: true, shouldDirty: true });
                      setValue('password', '123456', { shouldValidate: true, shouldDirty: true });
                      setShowPassword(false);
                      void handleSubmit(onSubmit)();
                    }}
                    className={`rounded-xl border px-3 py-2 text-left disabled:opacity-50 ${selected ? 'border-indigo-500 bg-indigo-500/10' : isDark ? 'border-slate-700 hover:border-indigo-400' : 'border-slate-200 hover:border-indigo-400'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className={`block text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{role}</span>
                  </button>
                );
              })}
            </div>
          </section>
      </motion.div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}} />
      </>
    );
};

export default Login;
