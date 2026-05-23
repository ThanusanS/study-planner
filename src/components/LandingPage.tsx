import React, { useEffect, useState, useRef } from "react";
import { Button } from "../app/components/ui/button";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  CheckSquare,
  BookOpen,
  Calendar,
  Timer,
  TrendingUp,
  Target,
  Zap,
  Users,
  ArrowRight,
  Star,
  Sparkles,
  Brain,
  Award,
  Rocket,
  Shield,
  BarChart3,
  ChevronDown,
  Play,
  Check,
  Flame,
  Clock,
  Bell,
  MessageSquare,
  X,
  Menu,
  Trophy,
  Lightbulb,
  LayoutDashboard,
} from "lucide-react";
import { LogoFull } from "./branding/LogoFull";

interface LandingPageProps {
  onGetStarted: () => void;
}

// ─── Animated Counter ───────────────────────────────────────────────────────
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({
  end,
  suffix = "",
  duration = 2000,
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ─── FAQ Item ────────────────────────────────────────────────────────────────
const FAQItem: React.FC<{ q: string; a: string; idx: number }> = ({ q, a, idx }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.08 }}
      className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03] backdrop-blur-md hover:border-violet-500/30 transition-colors"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left gap-4"
      >
        <span className="text-white font-semibold text-base sm:text-lg">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 text-violet-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-slate-400 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Landing Page ───────────────────────────────────────────────────────
export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.9]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = ["Features", "How it works", "Testimonials", "FAQ"];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Tasks",
      desc: "Intelligent task prioritization that learns your study patterns and automatically schedules the right tasks at the right time.",
      gradient: "from-violet-500 to-indigo-600",
      glow: "shadow-violet-500/20",
      highlight: true,
      points: ["Smart deadline prediction", "Auto-priority sorting", "Real-time sync across devices"],
    },
    {
      icon: Timer,
      title: "Pomodoro Focus Timer",
      desc: "Deep work sessions engineered for maximum concentration with customizable intervals and break reminders.",
      gradient: "from-pink-500 to-rose-600",
      glow: "shadow-pink-500/20",
      highlight: false,
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      desc: "Visualize your academic journey with beautiful charts, streak tracking, and performance insights.",
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/20",
      highlight: false,
    },
    {
      icon: Calendar,
      title: "Exam Countdown",
      desc: "Never miss a deadline. Smart reminders adapt to your prep schedule automatically.",
      gradient: "from-orange-500 to-amber-600",
      glow: "shadow-orange-500/20",
      highlight: false,
    },
    {
      icon: Flame,
      title: "Study Streaks",
      desc: "Daily habit building with streak tracking to keep you consistently motivated.",
      gradient: "from-red-500 to-orange-600",
      glow: "shadow-red-500/20",
      highlight: false,
    },
    {
      icon: Lightbulb,
      title: "AI Quiz Generator",
      desc: "Generate custom practice quizzes from your subjects and materials using cutting-edge AI.",
      gradient: "from-cyan-500 to-blue-600",
      glow: "shadow-cyan-500/20",
      highlight: false,
    },
  ];

  const steps = [
    { step: "01", icon: GraduationCap, title: "Create your profile", desc: "Set up your subjects, exam dates, and study goals in under 2 minutes." },
    { step: "02", icon: LayoutDashboard, title: "Add your tasks", desc: "Input assignments, readings, and study sessions. AI arranges them optimally." },
    { step: "03", icon: Timer, title: "Start a focus session", desc: "Use the Pomodoro timer to work in deep-focus sprints and take scheduled breaks." },
    { step: "04", icon: Trophy, title: "Track and improve", desc: "Review your analytics dashboard to see growth and crush your academic goals." },
  ];

  const testimonials = [
    { name: "Sarah Chen", role: "Medical Student, Harvard", text: "StudyPlanner completely changed how I prepare for exams. The AI task manager is like having a personal academic coach. My GPA jumped from 3.2 to 3.9!", rating: 5, avatar: "SC", gradient: "from-violet-400 to-purple-600" },
    { name: "Marcus Johnson", role: "Engineering Student, MIT", text: "The Pomodoro timer combined with streak tracking keeps me focused for hours. I've never been this productive. 10/10 recommend to every student.", rating: 5, avatar: "MJ", gradient: "from-blue-400 to-cyan-600" },
    { name: "Priya Patel", role: "Law Student, Oxford", text: "I manage 8 subjects effortlessly. The exam countdown feature is a lifesaver. The AI quiz generator helped me ace my bar exam prep!", rating: 5, avatar: "PP", gradient: "from-pink-400 to-rose-600" },
    { name: "Alex Rivera", role: "CS Student, Stanford", text: "This is what Notion and Notion cal combined should feel like for students. Clean, fast, and actually intelligent. The progress analytics blew my mind.", rating: 5, avatar: "AR", gradient: "from-emerald-400 to-teal-600" },
    { name: "Yuki Tanaka", role: "Pre-med, Johns Hopkins", text: "Went from barely passing to top of my class in one semester. The AI prioritization makes sure I always work on the most important things first.", rating: 5, avatar: "YT", gradient: "from-orange-400 to-amber-600" },
  ];

  const faqItems = [
    { q: "Is Study Planner really free?", a: "Yes — 100% free, forever. No credit card required, no hidden fees, no premium paywall. All features including AI quiz generation, analytics, and cloud sync are completely free for all students." },
    { q: "How does the AI task manager work?", a: "Our AI analyzes your deadlines, subject difficulty, available study hours, and historical performance to create an optimized study schedule that adapts in real-time as your priorities change." },
    { q: "Can I use it on my phone?", a: "Absolutely! Study Planner is fully responsive and works beautifully on all devices — desktop, tablet, and mobile. Your data syncs instantly across all your devices via cloud." },
    { q: "How does the AI quiz generator work?", a: "Simply select a subject and topic, and our AI generates custom practice questions tailored to your curriculum. It supports multiple-choice, short answer, and essay-style questions." },
    { q: "Is my data safe?", a: "Your data is encrypted end-to-end and stored securely. We never sell your personal information to third parties. You can export or delete your data at any time." },
    { q: "What makes this different from Google Calendar?", a: "Unlike generic calendars, Study Planner is built specifically for students. It understands academic workflows — subjects, assignments, exams — and uses AI to actively optimize your study schedule, not just display it." },
  ];

  const stats = [
    { icon: Users, value: "100K+", label: "Active Students", color: "text-violet-400" },
    { icon: CheckSquare, value: "2M+", label: "Tasks Completed", color: "text-blue-400" },
    { icon: Clock, value: "500K+", label: "Study Hours Logged", color: "text-emerald-400" },
    { icon: Award, value: "98%", label: "Satisfaction Rate", color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        .lp-font-display { font-family: 'Outfit', 'Inter', system-ui, sans-serif; }
        @keyframes lp-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .lp-marquee-track { display: flex; animation: lp-marquee 28s linear infinite; width: max-content; }
        .lp-marquee-track:hover { animation-play-state: paused; }
        @keyframes lp-pulse-ring { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
        .lp-pulse-ring { animation: lp-pulse-ring 4s ease-in-out infinite; }
        @keyframes lp-float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-18px) rotate(1deg); } }
        .lp-float { animation: lp-float 7s ease-in-out infinite; }
        @keyframes lp-float-slow { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .lp-float-slow { animation: lp-float-slow 9s ease-in-out infinite; }
        .lp-gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #818cf8 30%, #67e8f9 60%, #a78bfa 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: lp-text-shine 4s linear infinite;
        }
        @keyframes lp-text-shine { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
        .lp-card-hover { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease; }
        .lp-card-hover:hover { transform: translateY(-6px) scale(1.01); }
        .lp-btn-primary {
          background: linear-gradient(135deg, #7c3aed, #4f46e5, #0ea5e9);
          background-size: 200% auto;
          transition: background-position 0.5s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 0 30px rgba(124,58,237,0.4), 0 4px 20px rgba(0,0,0,0.3);
        }
        .lp-btn-primary:hover {
          background-position: right center;
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(124,58,237,0.6), 0 8px 30px rgba(0,0,0,0.4);
        }
        .lp-btn-secondary {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .lp-btn-secondary:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }
        .lp-grid-bg {
          background-image: linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .lp-noise {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
        .lp-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .lp-testimonial-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
        }
        .lp-pricing-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(20px);
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .lp-pricing-card:hover { transform: translateY(-8px); border-color: rgba(124,58,237,0.5); box-shadow: 0 20px 60px rgba(124,58,237,0.2); }
        .lp-pricing-featured {
          background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.15));
          border: 1px solid rgba(124,58,237,0.5);
          box-shadow: 0 0 40px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .lp-step-line { background: linear-gradient(to bottom, rgba(124,58,237,0.6), transparent); width: 2px; }
        .lp-section-tag {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(124,58,237,0.15); border: 1px solid rgba(124,58,237,0.3);
          padding: 6px 16px; border-radius: 999px;
          font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
          color: #a78bfa; text-transform: uppercase;
        }
        .lp-nav-link {
          color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 500;
          transition: color 0.2s ease; cursor: pointer;
        }
        .lp-nav-link:hover { color: #fff; }
        @keyframes lp-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .lp-spin-slow { animation: lp-spin-slow 20s linear infinite; }
        .lp-badge-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1));
          border: 1px solid rgba(124,58,237,0.35);
          padding: 8px 20px; border-radius: 999px;
          font-size: 13px; font-weight: 500; color: #c4b5fd;
          backdrop-filter: blur(8px);
        }
      `}</style>

      {/* Noise overlay */}
      <div className="lp-noise" />

      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="lp-orb lp-pulse-ring" style={{ top: "-10%", left: "10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
        <div className="lp-orb lp-pulse-ring" style={{ top: "30%", right: "-5%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", animationDelay: "2s" }} />
        <div className="lp-orb" style={{ bottom: "10%", left: "20%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)" }} />
      </div>

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrollY > 50 ? "rgba(5,5,16,0.85)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
          borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <LogoFull animated={true} showAI={true} />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <span
                key={link}
                onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, "-"))}
                className="lp-nav-link cursor-pointer"
              >
                {link}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onGetStarted} className="lp-nav-link px-4 py-2">Sign in</button>
            <button
              onClick={onGetStarted}
              className="lp-btn-primary px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
              style={{ background: "rgba(5,5,16,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="px-4 py-6 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <span
                    key={link}
                    onClick={() => scrollToSection(link.toLowerCase().replace(/\s+/g, "-"))}
                    className="text-white/70 text-base font-medium py-2 border-b border-white/5 cursor-pointer hover:text-white transition-colors"
                  >
                    {link}
                  </span>
                ))}
                <button onClick={onGetStarted} className="lp-btn-primary mt-2 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2">
                  Get started free <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ─── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16 overflow-hidden">
        <div className="absolute inset-0 lp-grid-bg opacity-100" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-8"
            >
              <div className="lp-badge-pill">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>AI-powered academic platform for students</span>
                <span className="bg-violet-500/30 text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full">NEW</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-black leading-[1.05] tracking-tight mb-6 lp-font-display"
            >
              <span className="text-white">Study Smarter.</span>
              <br />
              <span className="lp-gradient-text">Achieve More.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
            >
              The all-in-one academic platform with AI task management, Pomodoro focus sessions, and intelligent analytics — completely free.
            </motion.p>

            {/* CTA Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <button
                onClick={onGetStarted}
                className="lp-btn-primary px-8 py-4 rounded-2xl text-white text-lg font-semibold flex items-center justify-center gap-3 group"
              >
                Start for free — no card needed
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="lp-btn-secondary px-8 py-4 rounded-2xl text-white text-lg font-semibold flex items-center justify-center gap-3 cursor-pointer"
              >
                <Play className="w-5 h-5 text-violet-400" />
                See how it works
              </button>
            </motion.div>

            {/* Social proof row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-10"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[
                    { g: "from-violet-400 to-purple-600", l: "A" },
                    { g: "from-blue-400 to-cyan-500", l: "S" },
                    { g: "from-pink-400 to-rose-600", l: "M" },
                    { g: "from-emerald-400 to-teal-600", l: "J" },
                    { g: "from-amber-400 to-orange-600", l: "K" },
                  ].map((av, i) => (
                    <div
                      key={i}
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${av.g} border-2 flex items-center justify-center text-white text-xs font-bold`}
                      style={{ borderColor: "#050510" }}
                    >
                      {av.l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-400 text-sm mt-0.5"><span className="text-white font-semibold">100,000+</span> students trust us</p>
                </div>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>100% free forever</span>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Setup in 2 minutes</span>
              </div>
            </motion.div>
          </div>

          {/* Dashboard Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="mt-20 relative max-w-5xl mx-auto lp-float"
          >
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1), rgba(14,165,233,0.08))",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 40px 120px rgba(124,58,237,0.3), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Window bar */}
              <div className="flex items-center gap-2 px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <div className="flex-1 mx-4">
                  <div className="bg-white/5 rounded-lg px-4 py-1.5 text-slate-500 text-xs text-center w-full max-w-xs mx-auto">studyplanner.app/dashboard</div>
                </div>
              </div>

              {/* Mock dashboard */}
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stats row */}
                <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Tasks Done", val: "24/30", color: "from-violet-500 to-indigo-600", icon: CheckSquare },
                    { label: "Focus Time", val: "4.5h", color: "from-blue-500 to-cyan-600", icon: Clock },
                    { label: "Study Streak", val: "🔥 14 days", color: "from-orange-500 to-red-600", icon: Flame },
                    { label: "Exam In", val: "3 days", color: "from-pink-500 to-rose-600", icon: Bell },
                  ].map((s, i) => (
                    <div key={i} className="rounded-2xl p-2.5 sm:p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                        <s.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-white font-bold text-sm sm:text-base">{s.val}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Task list */}
                <div className="md:col-span-2 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-semibold text-sm">Today's Tasks</span>
                    <span className="text-violet-400 text-xs">AI optimized</span>
                  </div>
                  {[
                    { t: "Review Chapter 12 — Thermodynamics", d: "Physics", done: true, p: "high" },
                    { t: "Practice integrals problem set", d: "Math", done: true, p: "high" },
                    { t: "Write essay conclusion — History", d: "History", done: false, p: "med" },
                    { t: "Read Chapter 9 — Organic Chemistry", d: "Chemistry", done: false, p: "med" },
                    { t: "Flashcard review — Biology terms", d: "Biology", done: false, p: "low" },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${task.done ? "bg-emerald-500" : "border border-white/20"}`}>
                        {task.done && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs sm:text-sm truncate ${task.done ? "text-slate-500 line-through" : "text-white/80"}`}>{task.t}</p>
                        <p className="text-slate-600 text-xs">{task.d}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${task.p === "high" ? "bg-red-500/20 text-red-400" : task.p === "med" ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400"}`}>
                        {task.p}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress panel */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-white font-semibold text-sm mb-4">Weekly Progress</p>
                  <div className="space-y-3">
                    {[
                      { s: "Physics", p: 82, c: "#7c3aed" },
                      { s: "Math", p: 67, c: "#0ea5e9" },
                      { s: "Chemistry", p: 45, c: "#10b981" },
                      { s: "History", p: 90, c: "#f59e0b" },
                      { s: "Biology", p: 38, c: "#ec4899" },
                    ].map((sub, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{sub.s}</span>
                          <span style={{ color: sub.c }}>{sub.p}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${sub.p}%`, background: sub.c }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 text-sm font-semibold">14-day streak! 🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              className="absolute -left-4 top-1/3 rounded-2xl px-4 py-3 lp-float-slow hidden lg:block"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", backdropFilter: "blur(16px)" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Task completed!</p>
                  <p className="text-emerald-400 text-xs">+25 XP earned</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3 }}
              className="absolute -right-4 top-1/4 rounded-2xl px-4 py-3 lp-float-slow hidden lg:block"
              style={{ animationDelay: "3s", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", backdropFilter: "blur(16px)" }}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-400" />
                <div>
                  <p className="text-white text-xs font-semibold">AI rescheduled</p>
                  <p className="text-violet-400 text-xs">3 tasks optimized</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-2xl px-5 py-3 lp-float-slow hidden sm:flex items-center gap-3"
              style={{ animationDelay: "6s", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", backdropFilter: "blur(16px)" }}
            >
              <Flame className="w-5 h-5 text-amber-400" />
              <p className="text-white text-xs font-semibold">14-day study streak!</p>
              <div className="flex gap-1">
                {Array(7).fill(0).map((_,i) => (
                  <div key={i} className="w-2 h-5 rounded-full bg-amber-500" style={{ opacity: 0.5 + i * 0.07 }} />
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="flex justify-center mt-24 pb-8"
          >
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <span className="text-xs font-medium tracking-widest uppercase">Scroll to explore</span>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── MARQUEE / LOGOS ─────────────────────────────────────────────────── */}
      <section className="py-14 overflow-hidden relative z-10">
        <div className="text-center mb-10">
          <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">Trusted by students at top universities worldwide</p>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #050510, transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, #050510, transparent)" }} />
          <div className="lp-marquee-track">
            {["Harvard", "MIT", "Stanford", "Oxford", "Cambridge", "ETH Zürich", "Caltech", "Princeton", "Yale", "Columbia", "Harvard", "MIT", "Stanford", "Oxford", "Cambridge", "ETH Zürich", "Caltech", "Princeton", "Yale", "Columbia"].map((uni, i) => (
              <div key={i} className="flex items-center gap-3 mx-10 flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-slate-600" />
                <span className="text-slate-500 font-semibold text-sm whitespace-nowrap">{uni}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-12 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-3xl p-6 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.05))", border: "1px solid rgba(124,58,237,0.2)", backdropFilter: "blur(20px)" }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                <div className={`text-2xl sm:text-3xl md:text-4xl font-black ${stat.color} lp-font-display mb-1`}>
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="lp-section-tag mb-6">
              <Zap className="w-3.5 h-3.5" /> Features
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-6 lp-font-display">
              Everything you need to
              <br />
              <span className="lp-gradient-text">excel academically</span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              From intelligent task management to AI-generated quizzes, every feature is crafted to maximize your academic performance.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Large hero feature */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-2 md:row-span-2 lp-card-hover"
            >
              <div
                className="relative h-full min-h-[380px] rounded-3xl p-6 sm:p-8 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.08) 100%)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  boxShadow: "0 0 60px rgba(124,58,237,0.1)",
                }}
              >
                {/* BG decorative */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full lp-pulse-ring" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div className="lp-section-tag mb-4 self-start" style={{ fontSize: "11px" }}>
                    <Sparkles className="w-3 h-3" /> AI-Powered
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white mb-4 lp-font-display">Smart Task Manager</h3>
                  <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md">
                    Our AI continuously analyzes your workload, deadlines, and study patterns to intelligently prioritize tasks — so you always work on what matters most, when it matters most.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-auto">
                    {["Intelligent scheduling", "Priority management", "Deadline prediction", "Cross-device sync", "Habit learning", "Smart reminders"].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-violet-400" />
                        </div>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Smaller features */}
            {features.slice(1).map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 * (i + 2) }}
                className="lp-card-hover"
              >
                <div
                  className="h-full min-h-[180px] rounded-3xl p-6 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-30" style={{ background: `radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <feat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="lp-section-tag mb-6">
              <Rocket className="w-3.5 h-3.5" /> How it works
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 lp-font-display">
              Up and running in <span className="lp-gradient-text">2 minutes</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Four simple steps to transform your academic performance.</p>
          </motion.div>

          <div className="relative">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 lp-step-line hidden md:block" style={{ marginLeft: "-1px" }} />

            <div className="space-y-8 md:space-y-16">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className={`flex flex-col md:flex-row items-start md:items-center gap-6 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                >
                  {/* Card */}
                  <div className="flex-1 lp-card-hover">
                    <div
                      className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="absolute top-4 right-4 text-6xl font-black text-white/[0.04] lp-font-display">{step.step}</div>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-2">Step {step.step}</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 lp-font-display">{step.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex w-14 h-14 rounded-full flex-shrink-0 items-center justify-center z-10" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 30px rgba(124,58,237,0.5)" }}>
                    <span className="text-white font-black text-sm lp-font-display">{parseInt(step.step)}</span>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 py-16 sm:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 lp-orb" style={{ top: "20%", left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="lp-section-tag mb-6">
              <MessageSquare className="w-3.5 h-3.5" /> Testimonials
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 lp-font-display">
              Students love <span className="lp-gradient-text">StudyPlanner</span>
            </h2>
            <div className="flex items-center justify-center gap-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              <span className="text-slate-400 ml-2">4.9 / 5 from 12,400+ reviews</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`lp-testimonial-card rounded-3xl p-6 lp-card-hover ${i === 0 ? "lg:row-span-2" : ""}`}
              >
                <div className="flex items-center gap-2 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className={`text-slate-300 leading-relaxed mb-6 ${i === 0 ? "text-lg" : "text-sm"}`}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="lp-section-tag mb-6">
              <Shield className="w-3.5 h-3.5" /> Pricing
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 lp-font-display">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">No subscriptions. No hidden fees. Free for everyone, forever.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Free",
                price: "$0",
                period: "forever",
                desc: "Everything you need to get started",
                features: ["Unlimited tasks & subjects", "Pomodoro focus timer", "Exam countdown tracker", "Basic analytics", "Study streaks", "Cloud sync"],
                cta: "Get started free",
                featured: false,
              },
              {
                name: "Pro",
                price: "$0",
                period: "always free",
                badge: "Most Popular",
                desc: "All features, zero cost — seriously",
                features: ["Everything in Free", "AI task prioritization", "AI quiz generator", "Advanced analytics", "Progress insights", "Priority support"],
                cta: "Start now — it's free",
                featured: true,
              },
              {
                name: "Campus",
                price: "Custom",
                period: "for institutions",
                desc: "For universities and schools",
                features: ["All Pro features", "Bulk student accounts", "Admin dashboard", "Usage analytics", "LMS integrations", "Dedicated support"],
                cta: "Contact us",
                featured: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`rounded-3xl p-6 sm:p-8 relative flex flex-col ${plan.featured ? "lp-pricing-featured" : "lp-pricing-card"}`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="lp-btn-primary px-4 py-1.5 rounded-full text-white text-xs font-bold whitespace-nowrap">
                      {plan.badge}
                    </div>
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">{plan.name}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-black text-white lp-font-display">{plan.price}</span>
                    <span className="text-slate-500 text-sm">/ {plan.period}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{plan.desc}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-sm text-slate-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.featured ? "bg-violet-500" : "bg-white/10"}`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onGetStarted}
                  className={`w-full py-3 rounded-2xl font-semibold transition-all text-sm ${plan.featured ? "lp-btn-primary text-white" : "lp-btn-secondary text-white"}`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="lp-section-tag mb-6">
              <MessageSquare className="w-3.5 h-3.5" /> FAQ
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 lp-font-display">
              Frequently asked questions
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">Have a question? We have answers.</p>
          </motion.div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} idx={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* BG gradient */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(79,70,229,0.2) 50%, rgba(14,165,233,0.15) 100%)" }}
            />
            <div className="absolute inset-0" style={{ border: "1px solid rgba(124,58,237,0.4)", borderRadius: "1.5rem" }} />
            <div className="absolute inset-0 lp-pulse-ring" style={{ background: "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />

            <div className="relative z-10 text-center px-6 py-12 sm:px-8 sm:py-20">
              <div className="w-16 h-16 rounded-3xl mx-auto mb-8 flex items-center justify-center lp-spin-slow" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5, #0ea5e9)" }}>
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-6 lp-font-display">
                Ready to transform
                <br />
                <span className="lp-gradient-text">your academic life?</span>
              </h2>
              <p className="text-slate-400 text-lg sm:text-xl mb-10 max-w-xl mx-auto">
                Join 100,000+ students already achieving academic excellence with StudyPlanner.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onGetStarted}
                  className="lp-btn-primary px-10 py-4 rounded-2xl text-white text-lg font-semibold flex items-center justify-center gap-3 group"
                >
                  Get started — it's free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <p className="text-slate-600 text-sm mt-6">No credit card • Free forever • Setup in 2 minutes</p>

              {/* Mini social proof */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <div className="flex -space-x-2">
                  {[
                    "from-violet-400 to-purple-600",
                    "from-blue-400 to-cyan-500",
                    "from-pink-400 to-rose-600",
                  ].map((g, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${g} border-2`} style={{ borderColor: "#050510" }} />
                  ))}
                </div>
                <p className="text-slate-400 text-sm"><span className="text-white font-semibold">2,840</span> students joined this week</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t py-16 px-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <LogoFull animated={false} showAI={true} />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">The AI-powered academic platform helping students worldwide achieve excellence.</p>
            </div>

            {[
              { title: "Product", links: ["Features", "How it works", "AI Quiz", "Analytics"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { title: "Support", links: ["Help center", "Privacy", "Terms", "Contact"] },
            ].map((col, i) => (
              <div key={i}>
                <p className="text-white font-semibold text-sm mb-4">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <span
                        onClick={() => {
                          const id = link.toLowerCase().replace(/\s+/g, "-");
                          const element = document.getElementById(id);
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          } else {
                            onGetStarted();
                          }
                        }}
                        className="text-slate-500 text-sm hover:text-white transition-colors cursor-pointer"
                      >
                        {link}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-slate-600 text-sm">© 2026 StudyPlanner. Built with ❤️ for students worldwide.</p>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-500 text-sm">Secure • Private • Free forever</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
