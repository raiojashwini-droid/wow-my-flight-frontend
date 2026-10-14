import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Plane, Moon, Sun, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';
import CustomerChatWidget from '../components/chat/CustomerChatWidget';

// Particles Component
const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white/20 rounded-full blur-sm"
          initial={{
            width: Math.random() * 10 + 5,
            height: Math.random() * 10 + 5,
            x: Math.random() * 100 + 'vw',
            y: Math.random() * 100 + 'vh',
            opacity: Math.random() * 0.3 + 0.1
          }}
          animate={{
            y: [null, Math.random() * -100 - 50],
            x: [null, Math.random() * 100 - 50],
            opacity: [null, Math.random() * 0.4 + 0.2, 0]
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Flight Path Animation
const FlightPath = () => (
  <svg className="absolute w-full h-full inset-0 pointer-events-none z-0 opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
    <path
      id="flightPath"
      d="M-10,80 Q30,60 50,40 T110,20"
      fill="transparent"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="0.5"
      strokeDasharray="2, 2"
    />
    <motion.g
      initial={{ offsetDistance: "0%" }}
      animate={{ offsetDistance: "100%" }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      style={{ offsetPath: "path('M-10,80 Q30,60 50,40 T110,20')" }}
    >
      <Plane className="w-4 h-4 text-[#D4A72C] drop-shadow-[0_0_8px_rgba(212,167,44,0.8)]" fill="currentColor" />
    </motion.g>
  </svg>
);

// Stat Card
const StatCard = ({ title, value, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col gap-1"
    >
      <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">{title}</span>
      <span className="text-white text-2xl font-bold tracking-tight">{value}</span>
    </motion.div>
  );
};

export const AuthLayout = () => {
  const theme = useTheme();
  const { mode, toggleTheme } = useThemeMode();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    // Subtle parallax effect on mouse move
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 15;
    const y = (clientY / window.innerHeight - 0.5) * 15;
    setMousePos({ x, y });
  };

  return (
    <Box
      onMouseMove={handleMouseMove}
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: mode === 'light' ? '#f8fafc' : '#0B1020',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Left Pane: Premium Hero Banner */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: { md: '45%', lg: '50%' },
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 6, lg: 8 },
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Animated Background Image (Ken Burns) */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            inset: -20,
            backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1400")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: -2,
            x: mousePos.x,
            y: mousePos.y,
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1020]/90 via-[#0B1020]/70 to-[#4F46E5]/40 z-[-1]" />

        <Particles />
        <FlightPath />

        <div className="z-10 flex flex-col h-full">
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-['Sora'] font-bold text-white text-xl tracking-wide leading-none">WOW MY FLIGHT</h1>
              <p className="text-[#D4A72C] font-semibold text-xs tracking-[0.15em] mt-1 uppercase">Travel Agency CRM</p>
            </div>
          </motion.div>

          {/* Hero Content */}
          <div className="mt-auto mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-['Sora'] font-bold text-4xl lg:text-5xl text-white leading-[1.1] mb-6 tracking-tight"
            >
              Your Global Partner for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A72C] to-[#fde08b]">
                Seamless Flight Bookings.
              </span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-slate-300 text-lg leading-relaxed max-w-xl font-light"
            >
              Specializing in International Flight Reservations, GDS Pricing & Margin Optimization, PNR Tracking, Corporate Travel Management, and Automated E-Ticket Issuance.
            </motion.p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard title="PNRs Managed" value="10K+" delay={0.7} />
            <StatCard title="Uptime" value="99.9%" delay={0.8} />
            <StatCard title="Support" value="24/7" delay={0.9} />
          </div>

          {/* Footer */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="text-slate-400 text-sm font-medium mt-auto"
          >
            © {new Date().getFullYear()} WOW MY FLIGHT. Travel Agency CRM Portal.
          </motion.p>
        </div>
      </Box>

      {/* Right Pane: Login Card & Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Mobile Header (Shows only on small screens) */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 2, p: 3, background: '#0B1020' }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-['Sora'] font-bold text-white text-lg tracking-wide leading-none">WOW MY FLIGHT</h1>
            <p className="text-[#D4A72C] font-semibold text-[10px] tracking-wider mt-1 uppercase">Travel Agency CRM</p>
          </div>
        </Box>

        <div className="w-full flex justify-end p-4 md:p-6 absolute top-0 right-0 z-50">
          <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
            <IconButton
              onClick={toggleTheme}
              className={`backdrop-blur-md transition-all duration-300 ${mode === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              sx={{ width: 44, height: 44 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-[#D4A72C]" />}
                </motion.div>
              </AnimatePresence>
            </IconButton>
          </Tooltip>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:p-8 w-full max-w-2xl mx-auto overflow-y-auto custom-scrollbar">
          <Outlet />
          
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1 }}
            className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <ShieldCheck size={14} className="text-slate-400" />
            Protected System • Authorized Personnel Only
          </motion.div>
        </div>
      </Box>
      
      {/* Customer Support Live Chat Widget */}
      <CustomerChatWidget />

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.4);
        }
      `}} />
    </Box>
  );
};

export default AuthLayout;
