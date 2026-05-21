import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Chrome,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Clock,
  Brain,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface AuthProps {
  onBackToHome?: () => void;
}

// Left Side Mock Showcase Slide 1: Subjects Organizer
const SubjectSlide = () => (
  <div className="space-y-4 w-full max-w-sm mx-auto animate-fade-in">
    <div className="grid grid-cols-2 gap-3">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 backdrop-blur-md hover:border-blue-500/40 transition-all duration-300 shadow-lg">
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
          <BookOpen className="w-5 h-5 text-blue-400" />
        </div>
        <div className="font-bold text-sm text-white">Mathematics</div>
        <div className="text-[10px] text-gray-400 mt-1">Calculus & Algebra</div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Syllabus Completed</span>
            <span className="text-blue-400 font-bold">85%</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full" style={{ width: "85%" }} />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 backdrop-blur-md hover:border-purple-500/40 transition-all duration-300 shadow-lg">
        <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div className="font-bold text-sm text-white">Computer Science</div>
        <div className="text-[10px] text-gray-400 mt-1">Data Structures</div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Syllabus Completed</span>
            <span className="text-purple-400 font-bold">92%</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" style={{ width: "92%" }} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Left Side Mock Showcase Slide 2: Pomodoro Focus
const PomodoroSlide = () => (
  <div className="flex flex-col items-center justify-center py-2 space-y-4 w-full max-w-sm mx-auto animate-fade-in">
    <div className="relative w-36 h-36 flex items-center justify-center">
      {/* Glow Backing */}
      <div className="absolute inset-2 bg-indigo-500/10 rounded-full blur-xl animate-pulse" />
      {/* Circle background */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="72"
          cy="72"
          r="64"
          className="stroke-white/5 fill-none"
          strokeWidth="5"
        />
        <circle
          cx="72"
          cy="72"
          r="64"
          className="stroke-indigo-500 fill-none filter drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]"
          strokeWidth="5"
          strokeDasharray={402}
          strokeDashoffset={110}
          strokeLinecap="round"
        />
      </svg>
      {/* Timer text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-white tracking-wider tabular-nums">21:40</span>
        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Focus Session</span>
      </div>
    </div>
    
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-md">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </div>
      <span className="text-xs text-gray-300 font-medium border-l border-white/10 pl-3">Session 2/4</span>
    </div>
  </div>
);

// Left Side Mock Showcase Slide 3: AI Quizzes
const QuizSlide = () => (
  <div className="space-y-3.5 w-full max-w-sm mx-auto text-left bg-zinc-900/50 border border-white/10 p-5 rounded-2xl backdrop-blur-md shadow-xl">
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-extrabold text-pink-400 uppercase tracking-wider bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
        AI Generated
      </span>
      <span className="text-[11px] text-gray-400 font-medium">Question 3 of 10</span>
    </div>
    <div className="text-sm font-semibold text-white leading-snug">
      Which data structure operates on a First-In, First-Out (FIFO) basis?
    </div>
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/5 text-[11px] text-gray-400">
        <span>A) Stack (LIFO)</span>
      </div>
      <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-400 font-semibold shadow-inner shadow-emerald-500/5">
        <span>B) Queue (FIFO)</span>
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      </div>
      <div className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/5 text-[11px] text-gray-400">
        <span>C) Binary Search Tree</span>
      </div>
    </div>
  </div>
);

export const Auth: React.FC<AuthProps> = ({ onBackToHome }) => {
  const { login, loginWithGoogle, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Feature slideshow data
  const slides = [
    {
      title: "Interactive Study Organiser",
      description: "Organise subject material, prioritize tasks, and visualize learning progress in beautiful streaks.",
      component: <SubjectSlide />,
      color: "from-blue-500/20 to-indigo-500/20",
    },
    {
      title: "Custom Pomodoro Focus Timer",
      description: "Boost productivity and lock in focus periods using customized, break-friendly interval timers.",
      component: <PomodoroSlide />,
      color: "from-indigo-500/20 to-purple-500/20",
    },
    {
      title: "AI-Powered Study Assistant",
      description: "Generate intelligent mock tests, diagnostic questions, and subject notes instantly using AI.",
      component: <QuizSlide />,
      color: "from-pink-500/20 to-rose-500/20",
    },
  ];

  // Auto slide rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Spotlight mouse track
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await login(email, password);
      toast.success("Welcome back to Study Planner!");
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await register(email, password, name);
      toast.success("Account created successfully! Welcome onboard.");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      toast.error(error.message || "Google Authentication failed.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-black text-white selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Decorative background mesh for the entire viewport */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      {/* Back to Home Glass Floating Button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full transition-all duration-300 backdrop-blur-md shadow-lg group cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
      )}

      {/* LEFT SIDE: Animated Feature Showcase (Hidden on Mobile) */}
      <div 
        className="lg:col-span-5 hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-zinc-950/40 border-r border-white/5 z-10"
        onMouseMove={handleMouseMove}
      >
        {/* Spotlight overlay tracking the cursor */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-300"
          style={{
            background: `radial-gradient(500px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.12), transparent 80%)`
          }}
        />

        {/* Custom grid layout background */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Floating Academic symbols */}
        <div className="absolute top-24 right-16 text-white/10 animate-float pointer-events-none" style={{ animationDelay: "1.5s" }}>
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="absolute bottom-20 left-12 text-white/5 animate-float pointer-events-none" style={{ animationDelay: "0.5s" }}>
          <Clock className="w-16 h-16" />
        </div>
        <div className="absolute top-1/2 left-8 text-white/5 animate-float pointer-events-none" style={{ animationDelay: "2.5s" }}>
          <BookOpen className="w-12 h-12" />
        </div>

        {/* App Title Section */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Study Planner
          </span>
        </div>

        {/* Animated Carousel Slides */}
        <div className="relative z-10 my-auto py-12 flex flex-col items-center text-center">
          <div className="h-[210px] w-full flex items-center justify-center mb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="w-full"
              >
                {slides[currentSlide].component}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-3.5 max-w-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {slides[currentSlide].title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mt-2">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slide Navigation Dots */}
            <div className="flex justify-center gap-2 pt-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === index ? "w-6 bg-indigo-500" : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium relative z-10">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          Join over 100,000+ students organizing today
        </div>
      </div>

      {/* RIGHT SIDE: Elegant Authentication Form */}
      <div className="lg:col-span-7 col-span-12 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 z-10 relative min-h-screen">
        <div className="w-full max-w-[420px] my-auto py-12 lg:py-6 space-y-6">
          
          {/* Card Container with custom ambient shadow and border */}
          <div className="relative group/card">
            
            {/* Outer soft glowing backdrop */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-[28px] blur-xl opacity-75 group-hover/card:opacity-100 transition duration-1000 pointer-events-none" />
            
            {/* Main glass card */}
            <div className="relative bg-zinc-950/70 border border-white/10 hover:border-white/15 transition-all duration-300 rounded-[22px] sm:rounded-3xl p-5 sm:p-8 backdrop-blur-2xl shadow-2xl">
              
              {/* Header inside the form card */}
              <div className="text-center space-y-2 mb-6">
                <div className="flex justify-center mb-4 lg:hidden">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {activeTab === "login" ? "Welcome Back" : "Create Your Account"}
                </h1>
                <p className="text-xs text-gray-400">
                  {activeTab === "login" 
                    ? "Enter your credentials to access your planner dashboard" 
                    : "Fill in the details below to begin organizing your studies"}
                </p>
              </div>

              {/* Slider tabs selector */}
              <div className="relative flex bg-white/5 p-1 rounded-xl border border-white/5 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setShowPassword(false);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg relative z-10 transition-colors duration-300 ${
                    activeTab === "login" ? "text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setShowPassword(false);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg relative z-10 transition-colors duration-300 ${
                    activeTab === "register" ? "text-black" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Register
                </button>

                {/* Sliding Indicator */}
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute top-1 bottom-1 left-1 bg-white rounded-lg shadow-md pointer-events-none"
                  style={{
                    width: "calc(50% - 4px)",
                    left: activeTab === "login" ? "4px" : "calc(50% + 0px)",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              </div>

              {/* Animated Login Form */}
              <AnimatePresence mode="wait">
                {activeTab === "login" ? (
                  <motion.form
                    key="login-form"
                    onSubmit={handleLogin}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Email Address
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-indigo-400 transition-colors">
                          <Mail className="h-4 w-4" />
                        </div>
                        <Input
                          id="login-email"
                          name="email"
                          type="email"
                          placeholder="student@example.com"
                          required
                          disabled={isLoading}
                          className="pl-10 pr-4 bg-white/5 border-white/10 hover:border-white/15 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-gray-600 transition-all rounded-xl h-11 w-full text-sm font-normal"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          Password
                        </Label>
                      </div>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-indigo-400 transition-colors">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          id="login-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          disabled={isLoading}
                          className="pl-10 pr-10 bg-white/5 border-white/10 hover:border-white/15 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-gray-600 transition-all rounded-xl h-11 w-full text-sm font-normal"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gray-100 font-bold h-11 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Sign In
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                ) : (
                  /* Animated Register Form */
                  <motion.form
                    key="register-form"
                    onSubmit={handleRegister}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Full Name
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-indigo-400 transition-colors">
                          <User className="h-4 w-4" />
                        </div>
                        <Input
                          id="register-name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          required
                          disabled={isLoading}
                          className="pl-10 pr-4 bg-white/5 border-white/10 hover:border-white/15 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-gray-600 transition-all rounded-xl h-11 w-full text-sm font-normal"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Email Address
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-indigo-400 transition-colors">
                          <Mail className="h-4 w-4" />
                        </div>
                        <Input
                          id="register-email"
                          name="email"
                          type="email"
                          placeholder="student@example.com"
                          required
                          disabled={isLoading}
                          className="pl-10 pr-4 bg-white/5 border-white/10 hover:border-white/15 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-gray-600 transition-all rounded-xl h-11 w-full text-sm font-normal"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                        Password
                      </Label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-indigo-400 transition-colors">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          id="register-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          minLength={8}
                          disabled={isLoading}
                          className="pl-10 pr-10 bg-white/5 border-white/10 hover:border-white/15 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder:text-gray-600 transition-all rounded-xl h-11 w-full text-sm font-normal"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gray-100 font-bold h-11 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-6"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* SSO Delimiter line */}
              <div className="relative py-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="bg-zinc-950 px-3.5 text-gray-500">
                    Or connection with
                  </span>
                </div>
              </div>

              {/* Google Integration */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full relative group/google flex items-center justify-center gap-3 h-11 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 overflow-hidden cursor-pointer"
              >
                {/* Background Glow Ring on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover/google:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Shimmer light sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover/google:animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {/* Authentic colorful Google SVG G-Logo */}
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-4 h-4 transition-transform duration-300 group-hover/google:scale-110 shrink-0" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span className="text-xs font-bold tracking-wide text-gray-200 group-hover/google:text-white transition-colors duration-300">
                      Continue with Google
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
