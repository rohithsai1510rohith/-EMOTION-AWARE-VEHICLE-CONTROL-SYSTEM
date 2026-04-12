import React from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Volume2, Lightbulb, Activity, Gauge, Thermometer, Shield, Eye, Zap, AlertCircle } from 'lucide-react';

export default function HardwarePanel() {
  const hardwareState = useStore((state) => state.hardwareState);
  const theme = useStore((state) => state.theme);
  const { mode, speed, pwm, buzzer, led, espStatus, score, emotion } = hardwareState;

  const isDark = theme === 'dark';
  const statusColor = espStatus === 'ONLINE' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="h-full flex flex-col justify-between py-2 overflow-y-auto custom-scrollbar pr-2">
      
      {/* Header Status */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
           <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-slate-600'}`} />
           </div>
           <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Telemetry</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shadow-[0_0_10px_currentColor] animate-pulse`} />
          <span className={`text-[8px] font-black tracking-widest uppercase ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{espStatus}</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="space-y-4">
        {/* Safety Score Card */}
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          className={`relative p-6 rounded-[2rem] border group transition-all duration-500 overflow-hidden backdrop-blur-xl ${
            isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/30 border-white/40 shadow-sm hover:shadow-lg'
          }`}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
             <Shield className="w-20 h-20 -mr-6 -mt-6 rotate-12" />
          </div>
          
          <div className="flex items-center gap-3 mb-4">
             <Shield className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
             <span className={`text-[8px] font-black uppercase tracking-widest opacity-40`}>Safety Index</span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
             <span className="text-6xl font-display font-black tracking-tighter italic">{Math.round(score)}</span>
             <span className={`text-[10px] font-black tracking-widest uppercase opacity-20`}>% SAFE</span>
          </div>

          <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
             <motion.div 
               animate={{ 
                 width: `${score}%`,
                 backgroundColor: score > 70 ? '#38BDF8' : score > 30 ? '#facc15' : '#ef4444'
               }}
               className="h-full shadow-[0_0_15px_rgba(56,189,248,0.5)]"
             />
          </div>
        </motion.div>

        {/* Driver Emotion Card */}
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          className={`relative p-6 rounded-[2rem] border group transition-all duration-500 overflow-hidden backdrop-blur-xl ${
            isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/30 border-white/40 shadow-sm hover:shadow-lg'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
             <Eye className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
             <span className={`text-[8px] font-black uppercase tracking-widest opacity-40`}>Driver Emotion</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={emotion}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-4"
            >
               <span className="text-4xl font-display font-black tracking-tighter uppercase italic">{emotion}</span>
               {mode !== 'CALM' && (
                 <motion.div 
                   animate={{ scale: [1, 1.2, 1] }}
                   transition={{ repeat: Infinity, duration: 1 }}
                   className="p-1 rounded-full bg-red-500/20"
                 >
                   <AlertCircle className="w-4 h-4 text-red-500" />
                 </motion.div>
               )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap gap-2">
             <div className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border backdrop-blur-sm ${
               mode === 'CRITICAL' || mode === 'FATIGUED' 
                 ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                 : 'bg-green-500/10 border-green-500/20 text-green-400'
             }`}>
                {mode} STATE
             </div>
             {pwm > 150 && (
               <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase backdrop-blur-sm">
                  High Performance
               </div>
             )}
          </div>
        </motion.div>
      </div>

      {/* Auxiliary Systems */}
      <div className="mt-10 space-y-3">
         {[
           { icon: Lightbulb, label: "Hologram LED", value: led, color: isDark ? "text-blue-400" : "text-blue-600" },
           { icon: Volume2, label: "Audio Warning", value: buzzer ? "Active" : "Silent", color: buzzer ? "text-red-400" : "opacity-30" },
           { icon: Zap, label: "PWM Output", value: `${Math.round((pwm/255)*100)}%`, color: "opacity-30" }
         ].map((item, i) => (
           <motion.div 
             key={i} 
             whileHover={{ x: 5 }}
             className={`flex items-center justify-between p-4 rounded-2xl border transition-all backdrop-blur-xl ${
               isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white/20 border-white/40 hover:bg-white/30 shadow-sm'
             }`}
           >
              <div className="flex items-center gap-3">
                 <item.icon className={`w-4 h-4 ${item.color}`} />
                 <span className={`text-[9px] font-black uppercase tracking-widest opacity-40`}>{item.label}</span>
              </div>
              <span className={`text-[10px] font-black tracking-widest uppercase ${item.value === 'Active' ? 'text-red-400 animate-pulse' : ''}`}>
                {item.value}
              </span>
           </motion.div>
         ))}
      </div>

    </div>
  );
}
