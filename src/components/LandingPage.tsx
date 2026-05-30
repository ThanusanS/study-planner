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
  FileText,
  Map,
  HelpCircle,
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

  // Interactive dashboard states
  const [activeTab, setActiveTab] = useState<'planner' | 'pomodoro' | 'analytics'>('planner');
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25:00
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [aiMessage, setAiMessage] = useState("Hi! I'm your AI Study Assistant. Click 'Reschedule with AI' to optimize your day.");
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Custom mock task list
  const [mockTasks, setMockTasks] = useState([
    { id: 1, t: "Review Chapter 12 — Thermodynamics", d: "Physics", done: false, p: "high", time: "2:00 PM" },
    { id: 2, t: "Practice integrals problem set", d: "Math", done: false, p: "high", time: "4:30 PM" },
    { id: 3, t: "Write essay conclusion — History", d: "History", done: false, p: "med", time: "11:00 AM" },
    { id: 4, t: "Read Chapter 9 — Organic Chemistry", d: "Chemistry", done: false, p: "med", time: "3:30 PM" },
    { id: 5, t: "Flashcard review — Biology terms", d: "Biology", done: true, p: "low", time: "9:00 AM" },
  ]);

  // Floating particles
  const particles = [
    { left: "12%", top: "25%", size: "w-3 h-3", delay: 0, duration: 8 },
    { left: "82%", top: "18%", size: "w-4 h-4", delay: 1, duration: 10 },
    { left: "78%", top: "68%", size: "w-2 h-2", delay: 2, duration: 7 },
    { left: "14%", top: "62%", size: "w-5 h-5", delay: 0.5, duration: 12 },
    { left: "48%", top: "12%", size: "w-3 h-3", delay: 1.5, duration: 9 },
    { left: "92%", top: "48%", size: "w-2 h-2", delay: 3, duration: 6 },
    { left: "6%", top: "42%", size: "w-4 h-4", delay: 2.5, duration: 11 },
  ];

  useEffect(() => {
    let interval: any = null;
    if (timerIsRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerIsRunning(false);
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerIsRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAiReschedule = () => {
    if (rescheduling) return;
    setRescheduling(true);
    setAiMessage("Analyzing deadlines & subjects difficulty...");
    
    setTimeout(() => {
      setAiMessage("Re-prioritizing tasks: Physics exam is coming up soon.");
      setTimeout(() => {
        setMockTasks([
          { id: 1, t: "Review Chapter 12 — Thermodynamics", d: "Physics", done: false, p: "high", time: "10:00 AM" },
          { id: 4, t: "Read Chapter 9 — Organic Chemistry", d: "Chemistry", done: false, p: "high", time: "12:00 PM" },
          { id: 2, t: "Practice integrals problem set", d: "Math", done: false, p: "med", time: "2:00 PM" },
          { id: 3, t: "Write essay conclusion — History", d: "History", done: false, p: "med", time: "4:00 PM" },
          { id: 5, t: "Flashcard review — Biology terms", d: "Biology", done: true, p: "low", time: "9:00 AM" },
        ]);
        setAiMessage("Schedule optimized! Shifted higher priority chemistry and physics tasks earlier.");
        setRescheduling(false);
      }, 1500);
    }, 1000);
  };

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = ["Features", "AI Tools", "How it works", "Testimonials", "FAQ"];

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
      icon: Sparkles,
      title: "AI Quiz Studio",
      desc: "Generate exam-ready quizzes with MCQ, short answer, and mixed modes. Evaluate answers with AI-powered teacher-style feedback and detailed scoring.",
      gradient: "from-indigo-500 to-blue-600",
      glow: "shadow-indigo-500/20",
      highlight: true,
      points: ["MCQ, Short & Mixed modes", "AI Answer Evaluation", "Quiz History & PDF Export"],
    },
    {
      icon: FileText,
      title: "AI Notes Generator",
      desc: "Create short revision notes or detailed study notes from any topic. Perfect for last-minute preparation or deep concept understanding.",
      gradient: "from-teal-500 to-emerald-600",
      glow: "shadow-teal-500/20",
      highlight: true,
      points: ["Short Notes (Quick Revision)", "Full Notes (Deep Learning)", "Beautiful PDF Download"],
    },
    {
      icon: Map,
      title: "AI Roadmap Generator",
      desc: "Get phase-based overviews or week-by-week study plans for any learning goal. Your personalized path to mastering any subject.",
      gradient: "from-orange-500 to-amber-600",
      glow: "shadow-orange-500/20",
      highlight: true,
      points: ["Quick Phase-based Roadmap", "Detailed Week-by-Week Plan", "Milestone Tracking"],
    },
    {
      icon: GraduationCap,
      title: "AI Tutor (Explain Mode)",
      desc: "Get crystal-clear explanations with simple analogies, comprehensive deep dives, or instant doubt solving — like having a private tutor 24/7.",
      gradient: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/20",
      highlight: true,
      points: ["Simple Explain with Analogies", "Deep Explain with Examples", "Instant Doubt Solver"],
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
      gradient: "from-amber-500 to-yellow-600",
      glow: "shadow-amber-500/20",
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
    { name: "Sarah C.", role: "CS Undergraduate", text: "The AI Quiz Studio is a game-changer! I generate practice quizzes before every exam and the evaluation feedback is incredibly detailed — like having a real teacher grade my work.", rating: 5, avatar: "SC", gradient: "from-violet-400 to-purple-600" },
    { name: "Marcus J.", role: "Engineering Student", text: "AI Roadmap Generator planned my entire semester learning path in seconds. The week-by-week breakdown with milestones keeps me on track and motivated.", rating: 5, avatar: "MJ", gradient: "from-blue-400 to-cyan-600" },
    { name: "Priya P.", role: "Law Student", text: "The AI Notes Generator saves me hours. I get short revision notes for quick reviews before class and detailed notes for deep study sessions — all in beautiful PDF format.", rating: 5, avatar: "PP", gradient: "from-pink-400 to-rose-600" },
    { name: "Alex R.", role: "High School Senior", text: "AI Tutor's Explain Mode is like having a private tutor 24/7. The simple explanations with analogies make even complex physics concepts click instantly.", rating: 5, avatar: "AR", gradient: "from-emerald-400 to-teal-600" },
    { name: "Yuki T.", role: "Pre-med Student", text: "I use all 4 AI tools daily — Quiz for testing, Notes for revision, Roadmap for planning, and Tutor for doubt-solving. This platform replaced 5 different apps for me.", rating: 5, avatar: "YT", gradient: "from-orange-400 to-amber-600" },
  ];

  const faqItems = [
    { q: "What AI tools are included?", a: "Study Planner includes 4 powerful AI tools: AI Quiz Studio (generate & evaluate quizzes), AI Notes Generator (short revision & full detailed notes), AI Roadmap Generator (phase-based & week-by-week plans), and AI Tutor Explain Mode (simple explanations, deep dives & doubt solving). All tools include PDF download and history." },
    { q: "How do AI Credits work?", a: "AI Credits are a shared pool used across all AI tools. Simple/quick modes cost 1 credit, detailed/deep modes cost 2 credits. Free plan includes 10 credits/month, Pro plan has 500 credits/month, and Premium has 3,000 credits/month. Credits reset monthly on your renewal date." },
    { q: "Can I download my AI-generated content?", a: "Yes! Every AI tool includes a beautiful PDF download feature. Quizzes, notes, roadmaps, and tutor explanations can all be exported as professionally formatted, color-coded PDF documents perfect for offline study and printing." },
    { q: "Is my data saved?", a: "Absolutely. All AI-generated content is automatically saved to your history in Appwrite cloud. You can view, edit, delete, and re-download any saved quiz, note, roadmap, or explanation anytime. Your data syncs across all devices." },
    { q: "Can I use it on my phone?", a: "Yes! Study Planner is fully responsive and works beautifully on all devices — desktop, tablet, and mobile. Your data syncs instantly across all your devices via cloud." },
    { q: "What makes this different from ChatGPT?", a: "Unlike generic AI chatbots, Study Planner is purpose-built for students. Each AI tool has specialized prompts optimized for academic output — structured quizzes with answer evaluation, formatted study notes, milestone-tracked roadmaps, and pedagogically-designed explanations. Plus, everything saves to your history with beautiful PDF export." },
  ];

  const stats = [
    { icon: Users, value: "Free", label: "No Subscriptions or Ads", color: "text-violet-400" },
    { icon: CheckSquare, value: "AI", label: "Smart Task Prioritization", color: "text-blue-400" },
    { icon: Clock, value: "2 Min", label: "Quick Academic Setup", color: "text-emerald-400" },
    { icon: Award, value: "100%", label: "Encrypted & Private Data", color: "text-amber-400" },
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
        
        {/* Floating particles background layer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className={`absolute ${p.size} rounded-full bg-violet-500/30 blur-[1px]`}
              style={{ left: p.left, top: p.top }}
              animate={{
                y: [0, -40, 0],
                x: [0, 20, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-5"
            >
              <div className="lp-badge-pill">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>4 AI Study Tools • Quiz • Notes • Roadmap • Tutor</span>
                <span className="bg-violet-500/30 text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-full">NEW</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-black leading-[1.05] tracking-tight mb-4 lp-font-display"
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
              className="text-lg sm:text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto leading-relaxed mb-7"
            >
              The all-in-one AI study platform — Quiz Generator, Notes Builder, Roadmap Planner, AI Tutor, Pomodoro Timer, and smart analytics. Everything a student needs.
            </motion.p>

            {/* CTA Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <button
                onClick={onGetStarted}
                className="lp-btn-primary px-8 py-4 rounded-2xl text-white text-lg font-semibold flex items-center justify-center gap-3 group animate-in zoom-in-95 duration-500"
              >
                Create My Study Plan
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
              className="flex flex-col items-center justify-center gap-4 mb-12"
            >
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[
                      { g: "from-violet-400 to-purple-600", l: "S" },
                      { g: "from-blue-400 to-cyan-500", l: "M" },
                      { g: "from-pink-400 to-rose-600", l: "A" },
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
                    <p className="text-slate-300 text-sm mt-0.5"><span className="text-white font-semibold">Join the early beta</span> of ambitious learners</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>100% free & open</span>
                </div>
                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Setup in 2 minutes</span>
                </div>
              </div>

              {/* Success Quote / Micro Testimonial */}
              <div className="max-w-xl bg-white/[0.03] border border-white/[0.08] rounded-2xl py-2.5 px-4 backdrop-blur-md flex items-center gap-2.5 mt-2 text-left shadow-lg shadow-black/35">
                <span className="text-violet-400 text-xl font-serif leading-none">“</span>
                <p className="text-slate-200 text-xs sm:text-sm leading-snug">
                  <span className="text-white font-semibold">Our mission:</span> A distraction-free study space with no ads, no paywalls, and no credit cards. Designed entirely to help students succeed.
                  <span className="text-slate-400 block sm:inline sm:ml-2">— The StudyPlanner Team</span>
                </p>
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
            {/* Ambient animated gradient glow backdrop */}
            <div className="absolute -inset-1 rounded-[2.1rem] bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 opacity-20 blur-xl group-hover:opacity-30 transition duration-1000" />

            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, rgba(16,16,36,0.92) 0%, rgba(10,10,22,0.88) 100%)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 40px 120px rgba(5,5,16,0.95), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.15)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Window bar */}
              <div className="flex flex-col sm:flex-row items-center gap-4 px-6 py-4 border-b border-white/[0.12] bg-white/[0.02]">
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                </div>
                
                {/* Tabs switcher inside window title area (Responsive & compact for 390px mobile) */}
                <div className="flex bg-white/[0.08] p-1 rounded-xl w-full sm:w-auto sm:mx-auto max-w-md border border-white/[0.08]">
                  {[
                    { id: 'planner', label: 'AI Planner', icon: Brain },
                    { id: 'pomodoro', label: 'Focus Mode', icon: Timer },
                    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-white/10 text-white shadow-md border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/[0.02]'}`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="hidden md:block">
                  <div className="bg-white/5 rounded-lg px-4 py-1 text-slate-300 text-xs text-center">studyplanner.app/dashboard</div>
                </div>
              </div>

              {/* Main Tab Content */}
              <div className="p-4 sm:p-6 min-h-[350px]">
                {activeTab === 'planner' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {/* Left: Interactive Task List */}
                    <div className="md:col-span-2 rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-white font-black text-sm block">Today's Tasks</span>
                          <span className="text-slate-350 text-xs font-medium">Sorted by priority</span>
                        </div>
                        <button
                          onClick={handleAiReschedule}
                          disabled={rescheduling}
                          className="lp-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className={`w-3 h-3 ${rescheduling ? 'animate-spin' : ''}`} />
                          <span>{rescheduling ? 'Optimizing...' : 'Reschedule with AI'}</span>
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {mockTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
                            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${task.done ? "bg-emerald-500" : "border-2 border-white/40"}`}>
                              {task.done && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs sm:text-sm font-semibold truncate ${task.done ? "text-slate-500 line-through" : "text-white"}`}>{task.t}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-300 text-[10px] font-semibold">{task.d}</span>
                                <span className="text-slate-400 text-[9px]">•</span>
                                <span className="text-slate-300 text-[10px] font-semibold">{task.time}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 uppercase ${task.p === "high" ? "bg-red-500/20 text-red-300 border border-red-500/30" : task.p === "med" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-500/20 text-slate-300 border border-slate-500/30"}`}>
                              {task.p}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: AI Assistant panel */}
                    <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                            <Brain className="w-4 h-4 text-violet-400" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-xs">AI Study Coach</p>
                            <p className="text-emerald-400 text-[10px] flex items-center gap-1 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</p>
                          </div>
                        </div>
                        
                        <div className="rounded-xl p-3 bg-violet-500/[0.08] border border-violet-500/30 mb-4 min-h-[120px] flex flex-col justify-center">
                          <p className="text-xs text-violet-100 leading-relaxed italic font-medium">
                            "{aiMessage}"
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mt-auto">
                        <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Auto-Suggestions</div>
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer text-[11px] text-slate-200 font-medium" onClick={handleAiReschedule}>
                          ⚡ Physics exam date updated. Let's reschedule.
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors cursor-pointer text-[11px] text-slate-200 font-medium" onClick={() => setActiveTab('pomodoro')}>
                          🍅 Set a 25-min Pomodoro for thermodynamics.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pomodoro' && (
                  <div className="flex flex-col md:flex-row items-center justify-center gap-10 animate-in fade-in duration-300 max-w-3xl mx-auto py-4">
                    {/* Left: Circular Countdown Timer */}
                    <div className="relative w-52 h-52 flex items-center justify-center flex-shrink-0">
                      {/* Timer background SVG ring */}
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle
                          cx="104"
                          cy="104"
                          r="92"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="104"
                          cy="104"
                          r="92"
                          stroke="url(#timerGradient)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 92}
                          animate={{
                            strokeDashoffset: (2 * Math.PI * 92) * (1 - timerSeconds / 1500)
                          }}
                          transition={{ duration: 1, ease: "linear" }}
                        />
                        <defs>
                          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Center Time Display */}
                      <div className="text-center z-10">
                        <div className="text-4xl font-black tracking-tight text-white lp-font-display">
                          {formatTime(timerSeconds)}
                        </div>
                        <p className="text-[10px] font-bold text-pink-400 tracking-widest uppercase mt-1">Focus Session</p>
                      </div>
                    </div>

                    {/* Right: Controls & Info */}
                    <div className="space-y-4 text-center md:text-left flex-1">
                      <div>
                        <h4 className="text-xl font-bold text-white lp-font-display">Focus Sprint</h4>
                        <p className="text-xs text-slate-300 mt-1 max-w-sm font-medium">Work in uninterrupted, intense blocks. Clicking the play/pause button below simulates the real timer.</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <button
                          onClick={() => setTimerIsRunning(!timerIsRunning)}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-pink-500/10 animate-pulse-ring"
                        >
                          {timerIsRunning ? (
                            <>
                              <div className="w-2.5 h-2.5 bg-white rounded-sm animate-pulse" />
                              <span>Pause Timer</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 text-white fill-white" />
                              <span>Start Timer</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => { setTimerIsRunning(false); setTimerSeconds(1500); }}
                          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Interval</p>
                          <p className="text-sm font-black text-white mt-1">25 min</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center">
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Break</p>
                          <p className="text-sm font-black text-white mt-1">5 min</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {/* Charts */}
                    <div className="md:col-span-2 rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-white font-bold text-sm block">Study Distribution</span>
                          <span className="text-slate-350 text-xs font-semibold">Minutes logged per subject</span>
                        </div>
                        <span className="text-emerald-400 text-xs font-bold">+18% vs last week</span>
                      </div>

                      {/* Mock Chart using CSS and Flex */}
                      <div className="h-44 flex items-end gap-3 sm:gap-6 pt-4 pb-2 px-2">
                        {[
                          { label: "Mon", val: 75, color: "bg-violet-500" },
                          { label: "Tue", val: 95, color: "bg-indigo-500" },
                          { label: "Wed", val: 55, color: "bg-cyan-500" },
                          { label: "Thu", val: 120, color: "bg-pink-500" },
                          { label: "Fri", val: 80, color: "bg-rose-500" },
                          { label: "Sat", val: 40, color: "bg-emerald-500" },
                          { label: "Sun", val: 65, color: "bg-amber-500" },
                        ].map((bar, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                            <div className="text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold">{bar.val}m</div>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(bar.val / 120) * 100}%` }}
                              transition={{ delay: i * 0.05, duration: 0.8, ease: "easeOut" }}
                              className={`w-full rounded-t-lg ${bar.color} hover:brightness-115 transition-all shadow-lg`}
                            />
                            <span className="text-[10px] text-slate-300 font-semibold">{bar.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Streak & Achievements stats */}
                    <div className="space-y-4">
                      {/* Daily streak */}
                      <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Active Streak</p>
                          <p className="text-xl font-black text-orange-400 lp-font-display mt-1">14 Days 🔥</p>
                          <p className="text-[10px] text-slate-300 font-semibold mt-0.5">Top 5% of students this week</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                          <Flame className="w-5 h-5 text-orange-400" />
                        </div>
                      </div>

                      {/* Productivity score */}
                      <div className="rounded-2xl p-4 bg-white/[0.04] border border-white/[0.08]">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Weekly Target</p>
                          <span className="text-xs text-white font-extrabold">85% Complete</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: "85%" }} />
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium mt-2">Awesome! You logged 18 focus hours this week.</p>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* ─── GLASSMORPHISM FEATURE CARDS ────────────────────────────────────────── */}
      <section className="relative z-10 py-12 px-4 max-w-7xl mx-auto -mt-10 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Study Assistant */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/10 hover:border-violet-500/30 transition-all duration-300 group shadow-lg shadow-black/30"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 lp-font-display">AI Study Assistant</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Generate custom practice quizzes from your study files, get instant lecture summaries, and adaptive explanation guides custom-tailored to your learning speed.
            </p>
          </motion.div>

          {/* Card 2: Smart Task Planner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all duration-300 group shadow-lg shadow-black/30"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-6">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 lp-font-display">Smart Task Planner</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Never stress about prioritizing. Our intelligent algorithm auto-orders your assignments based on weightage, difficulty, and upcoming deadlines in real-time.
            </p>
          </motion.div>

          {/* Card 3: Focus Mode + Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl bg-white/[0.02] border border-white/10 hover:border-rose-500/30 transition-all duration-300 group shadow-lg shadow-black/30"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20 transition-all duration-500" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center mb-6">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 lp-font-display">Focus Mode + Analytics</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Block distractions with the Pomodoro timer while collecting granular focus data. Gain deep insights into your study habits, streaks, and subject completion trends.
            </p>
          </motion.div>
        </div>
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
              4 powerful AI study tools, smart task management, focus timer, and analytics — all crafted to maximize your academic performance.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Large hero feature — AI Task Manager */}
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
                    Our AI continuously analyzes your workload, deadlines, and study patterns to intelligently prioritize tasks — so you always work on what matters most.
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

            {/* Smaller utility features: Pomodoro, Analytics, Exam Countdown */}
            {features.filter(f => !f.highlight).map((feat, i) => (
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

      {/* ─── AI TOOLS SHOWCASE ─────────────────────────────────────────────── */}
      <section id="ai-tools" className="relative z-10 py-16 sm:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="lp-section-tag mb-6">
              <Sparkles className="w-3.5 h-3.5" /> AI Tools
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-6 lp-font-display">
              4 AI Study Tools,
              <br />
              <span className="lp-gradient-text">One Platform</span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Every tool includes cloud history, PDF export, and is powered by cutting-edge AI — purpose-built for students.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.filter(f => f.highlight && f.points).slice(1).map((tool, i) => {
              const gradientMap: Record<number, string> = {
                0: "rgba(99,102,241,0.15), rgba(59,130,246,0.08)",
                1: "rgba(20,184,166,0.15), rgba(16,185,129,0.08)",
                2: "rgba(249,115,22,0.15), rgba(245,158,11,0.08)",
                3: "rgba(244,63,94,0.15), rgba(236,72,153,0.08)",
              };
              const borderMap: Record<number, string> = {
                0: "rgba(99,102,241,0.35)",
                1: "rgba(20,184,166,0.35)",
                2: "rgba(249,115,22,0.35)",
                3: "rgba(244,63,94,0.35)",
              };
              const glowMap: Record<number, string> = {
                0: "rgba(99,102,241,0.12)",
                1: "rgba(20,184,166,0.12)",
                2: "rgba(249,115,22,0.12)",
                3: "rgba(244,63,94,0.12)",
              };

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="lp-card-hover group"
                >
                  <div
                    className="h-full rounded-3xl p-6 sm:p-8 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${gradientMap[i]})`,
                      border: `1px solid ${borderMap[i]}`,
                      boxShadow: `0 0 50px ${glowMap[i]}`,
                    }}
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 lp-pulse-ring" style={{ background: `radial-gradient(circle, ${borderMap[i]} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />

                    <div className="relative z-10">
                      <div className="flex items-start gap-4 mb-5">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <tool.icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-white lp-font-display">{tool.title}</h3>
                          <p className="text-slate-400 text-sm leading-relaxed mt-1">{tool.desc}</p>
                        </div>
                      </div>

                      <div className="space-y-2.5 mt-4">
                        {tool.points?.map((point, pi) => (
                          <div key={pi} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm text-slate-300 font-medium">{point}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-400">Cloud History</span>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-400">PDF Export</span>
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-slate-400">AI Powered</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA beneath AI tools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={onGetStarted}
              className="lp-btn-primary px-8 py-4 rounded-2xl text-white text-lg font-semibold inline-flex items-center gap-3 group"
            >
              Try All AI Tools Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-slate-500 text-sm mt-3">10 free AI credits • No credit card required</p>
          </motion.div>
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
            <p className="text-slate-400 text-base sm:text-lg">Choose the perfect volume plan to supercharge your academic workflows.</p>
          </motion.div>

          {/* Monthly / Yearly cycle selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${billingCycle === "monthly" ? "lp-btn-primary text-white shadow-md shadow-violet-500/20" : "text-slate-400 hover:text-white"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${billingCycle === "yearly" ? "lp-btn-primary text-white shadow-md shadow-violet-500/20" : "text-slate-400 hover:text-white"}`}
              >
                <span>Yearly</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-extrabold text-[9px]">Save 33%</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mb-10 flex items-center justify-center gap-2">
            <span>🛡️ No hidden fees</span>
            <span>•</span>
            <span>Cancel anytime</span>
            <span>•</span>
            <span>Secure payments</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Free Plan",
                price: "Free",
                period: "forever",
                bestFor: "Students getting started",
                desc: "Essential core study tools",
                features: ["Subject & Task Management", "Basic Pomodoro Timer", "Exam Countdown Tracking", "Weekly Study Analytics", "10 AI Credits / Month"],
                cta: "Start Free",
                featured: false,
              },
              {
                name: "Pro Plan ⭐",
                price: billingCycle === "monthly" ? "LKR 1,500" : "LKR 12,000",
                period: billingCycle === "monthly" ? "Month" : "Year",
                bestFor: "University students & learners",
                badge: "Most Popular",
                savings: "Only LKR 50/day",
                desc: "Full AI powers & productivity features",
                features: ["Everything in Free +", "AI Study Planner & Notes", "AI Tutor (Explain Mode)", "AI Roadmap Generator", "Unlimited AI Quiz Generation", "Cloud Sync & Export PDF Reports", "500 AI Credits / Month"],
                cta: "Upgrade to Pro",
                featured: true,
              },
              {
                name: "Premium Plan 👑",
                price: billingCycle === "monthly" ? "LKR 2,500" : "LKR 20,000",
                period: billingCycle === "monthly" ? "Month" : "Year",
                bestFor: "Competitive exams & power users",
                badge: "Best Value",
                savings: "Less than LKR 85/day",
                desc: "Smart revision & adaptive learning",
                features: ["Everything in Pro +", "Smart Revision Suggestions", "Adaptive Study Planning", "Smart Learning Roadmaps", "Group Study Collaboration", "3,000 AI Credits / Month"],
                cta: "Go Premium",
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
                  <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-1">{plan.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium mb-2">Best for: <span className="text-slate-350">{plan.bestFor}</span></p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-black text-white lp-font-display">{plan.price}</span>
                    <span className="text-slate-500 text-sm">/ {plan.period}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-xs text-emerald-400 font-bold mb-2">💡 {plan.savings}</p>
                  )}
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
