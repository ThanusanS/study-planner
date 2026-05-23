import React, { useEffect, useState } from "react";
import { 
  CreditCard, 
  Zap, 
  Sparkles, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  Shield,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Flame,
  Check
} from "lucide-react";
import planService, { UserPlan, UsageLog, Invoice } from "../services/planService";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Badge } from "../app/components/ui/badge";
import { Progress } from "../app/components/ui/progress";
import { toast } from "sonner";

export const Billing: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.$id || (user as any)?.id || "test-user";
  const userName = user?.name || "Achiever student";
  const userEmail = user?.email || "student@studyplanner.app";

  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payment toggle & modal state
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<"pro" | "premium" | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Credit Card Form States
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    loadBillingData();

    // Listen for real-time subscription changes
    const handlePlanChange = (e: any) => {
      setPlan(e.detail);
      loadBillingData();
    };

    window.addEventListener("studyPlanChanged", handlePlanChange);
    return () => {
      window.removeEventListener("studyPlanChanged", handlePlanChange);
    };
  }, [userId]);

  const loadBillingData = async () => {
    try {
      const planData = await planService.getUserPlan(userId);
      const logData = await planService.getUsageLogs(userId);
      const invoiceData = await planService.getInvoices(userId);

      setPlan(planData);
      setLogs(logData);
      setInvoices(invoiceData);
    } catch (err) {
      console.error("Error loading billing details:", err);
      toast.error("Failed to sync subscription details");
    } finally {
      setLoading(false);
    }
  };

  // ========== ESTIMATORS ==========
  const estimators = React.useMemo(() => {
    if (!plan) return null;
    const credits = plan.aiCredits;
    return {
      quizzes: Math.floor(credits / 2),
      shortNotes: Math.floor(credits / 2),
      fullNotes: Math.floor(credits / 5),
      tutor: Math.floor(credits / 3),
      roadmaps: Math.floor(credits / 4),
    };
  }, [plan]);

  // ========== WARNING LEVELS (GREEN, YELLOW, RED) ==========
  const usagePercentage = plan 
    ? Math.round(((plan.maxCredits - plan.aiCredits) / plan.maxCredits) * 100) 
    : 0;

  const creditStatus = React.useMemo(() => {
    if (usagePercentage >= 95) return { color: "bg-red-500", text: "Critical Alert: Credits Exhausted", textColor: "text-red-500", border: "border-red-500/20" };
    if (usagePercentage >= 80) return { color: "bg-amber-500", text: "Warning: Low AI Credits Balance", textColor: "text-amber-500", border: "border-amber-500/20" };
    return { color: "bg-emerald-500", text: "Healthy Balance", textColor: "text-emerald-500", border: "border-emerald-500/20" };
  }, [usagePercentage]);

  // ========== STRIPE SECURE PAYMENT ACTIONS ==========
  const handleUpgradeClick = (planType: "pro" | "premium") => {
    setSelectedUpgradePlan(planType);
    setIsStripeModalOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;

    setCheckoutLoading(true);
    toast.info("Connecting to Stripe Secure Gateway...");

    setTimeout(() => {
      toast.info("Authorizing payment and creating subscription ledger...");
      
      setTimeout(async () => {
        try {
          const updatedPlan = await planService.upgradePlan(userId, selectedUpgradePlan, billingCycle);
          setPlan(updatedPlan);
          setIsStripeModalOpen(false);
          setCardNumber("");
          setExpiry("");
          setCvc("");
          toast.success(`🎉 Purchase Complete! You are now subscribed to ${selectedUpgradePlan === "pro" ? "Scholar Pro" : "Elite Premium"}!`);
        } catch (err) {
          toast.error("Stripe gateway returned a verification timeout.");
        } finally {
          setCheckoutLoading(false);
        }
      }, 1500);
    }, 1200);
  };

  const handleDowngradeAction = async () => {
    try {
      await planService.downgradeToFree(userId);
      toast.success("Downgraded to Free Plan. Your premium notes remain locked and preserved safely.");
    } catch (err) {
      toast.error("Failed to request plan change.");
    }
  };

  const triggerFreeTrial = async () => {
    try {
      const limits = { maxCredits: 500 };
      const trialPlan: UserPlan = {
        userId,
        plan: "pro",
        status: "trial",
        maxCredits: limits.maxCredits,
        aiCredits: limits.maxCredits,
        billingCycle: "monthly",
        renewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days trial
      };
      
      localStorage.setItem(`study_planner_plan_${userId}`, JSON.stringify(trialPlan));
      window.dispatchEvent(new CustomEvent("studyPlanChanged", { detail: trialPlan }));
      toast.success("🚀 Active: 7-Day Scholar Pro Trial Activated! No credit card required.");
    } catch (err) {
      toast.error("Failed to start free trial");
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    toast.info(`Generating receipt document ${invoice.invoiceId}...`);
    await planService.downloadInvoicePDF(invoice, userName, userEmail);
    toast.success("Receipt downloaded successfully!");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading Billing details...</p>
      </div>
    );
  }

  const currentPlan = plan?.plan || "free";
  const statusType = plan?.status || "active";

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ─── HEADER / CURRENT SUBSCRIPTION CARD ─── */}
      <Card className="relative overflow-hidden border border-border/80 shadow-lg dark:shadow-indigo-950/20 glass-effect">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/5 dark:from-indigo-950/30" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />
        <CardContent className="p-6 sm:p-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {currentPlan === "free" && <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 font-bold px-3 py-1">Starter Free</Badge>}
                {currentPlan === "pro" && <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 font-black px-3 py-1">⭐ Scholar Pro Member</Badge>}
                {currentPlan === "premium" && <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-black px-3 py-1">👑 Elite Premium Member</Badge>}
                
                {statusType === "trial" && (
                  <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 uppercase font-black tracking-widest text-[9px] animate-pulse">7-Day Free Trial</Badge>
                )}
                <Badge variant="outline" className="text-xs text-muted-foreground">Stripe Verified</Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Manage your <span className="text-gradient font-black">Plan & Credits</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-xl">
                {currentPlan === "free" 
                  ? "Unlock advanced AI Study planners, customizable roadmaps, and full notes engines." 
                  : "Your academic workspace is fully unlocked with premium AI learning engines."}
              </p>

              {/* Reset date info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium pt-1">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Next Credit Refill Date: </span>
                <span className="font-bold text-foreground">
                  {plan ? new Date(plan.renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                </span>
              </div>
            </div>

            {/* AI Credits Meter Circle/KPI */}
            <div className="flex flex-wrap items-center gap-4 bg-background/55 dark:bg-zinc-900/40 p-5 rounded-3xl border border-border/80 backdrop-blur-md shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block opacity-75">AI Credit Balance</span>
                <div className="text-3xl font-black flex items-baseline gap-1">
                  <span className="text-indigo-600 dark:text-indigo-400">{plan?.aiCredits}</span>
                  <span className="text-slate-400 text-sm font-semibold">/ {plan?.maxCredits}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`w-2.5 h-2.5 rounded-full ${usagePercentage >= 95 ? "bg-red-500" : usagePercentage >= 80 ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
                  <span>{creditStatus.text}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Credits Bar with Warnings */}
          <div className="mt-8 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground">Credits Consumed ({usagePercentage}%)</span>
              <span className="font-black text-foreground">{plan?.maxCredits && plan.maxCredits - plan.aiCredits} used</span>
            </div>
            <div className="h-3.5 rounded-full bg-white/5 border border-white/10 p-0.5 overflow-hidden flex">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${creditStatus.color}`} 
                style={{ width: `${usagePercentage}%` }} 
              />
            </div>

            {/* Warnings Alerts with quick CTAs */}
            {usagePercentage >= 80 && (
              <div className={`flex items-center justify-between p-3 rounded-xl bg-background/50 border ${creditStatus.border} mt-3 text-xs`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${creditStatus.textColor}`} />
                  <span className={`${creditStatus.textColor} font-bold`}>{creditStatus.text}. Upgrade now to avoid service disruptions.</span>
                </div>
                {currentPlan !== "premium" && (
                  <button 
                    onClick={() => handleUpgradeClick(currentPlan === "free" ? "pro" : "premium")}
                    className="px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[11px] transition-colors"
                  >
                    Quick Upgrade
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── TRIAL PROMO (IF FREE) ─── */}
      {currentPlan === "free" && (
        <div className="rounded-3xl p-5 border border-indigo-500/20 bg-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Want to test drive our Scholar Pro tools?</h4>
              <p className="text-xs text-muted-foreground">Activate a 7-day Pro Free Trial instantly. No credit card required. Cancel anytime.</p>
            </div>
          </div>
          <Button onClick={triggerFreeTrial} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shrink-0">
            Start Pro Trial Free
          </Button>
        </div>
      )}

      {/* ─── PLAN COMPARISON PRICING ROW ─── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" />
              Compare Pricing & Plans
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">Choose the correct volume subscription to match your academic schedule.</p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10 max-w-xs shrink-0 self-start sm:self-center">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${billingCycle === "monthly" ? "bg-indigo-600 text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${billingCycle === "yearly" ? "bg-indigo-600 text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              <span>Yearly</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-extrabold text-[9px]">Save 33%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Plan 1: Free */}
          <Card className={`relative overflow-hidden border transition-all ${currentPlan === "free" ? "border-slate-400/40 bg-white/5" : "border-border/60"}`}>
            {currentPlan === "free" && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 font-bold text-[10px]">Your Active Plan</Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">Starter</span>
              <CardTitle className="text-xl font-bold mt-1">Free Plan</CardTitle>
              <CardDescription className="text-xs">Best for students getting started</CardDescription>
              <div className="pt-2 font-black text-2xl">Free</div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Subject & Task Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Basic Pomodoro Timer</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Exam Countdown Tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Weekly Study Analytics</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-foreground">
                  <Check className="w-3.5 h-3.5 text-indigo-500" />
                  <span>10 AI Credits / Month</span>
                </li>
              </ul>
              {currentPlan !== "free" ? (
                <Button onClick={handleDowngradeAction} variant="outline" className="w-full text-xs rounded-2xl py-5 hover:text-red-500 border-border/80">
                  Downgrade to Free
                </Button>
              ) : (
                <Button disabled className="w-full text-xs rounded-2xl py-5 bg-slate-500/10 text-slate-500 hover:bg-slate-500/10">Active Tier</Button>
              )}
            </CardContent>
          </Card>

          {/* Plan 2: Pro */}
          <Card className={`relative overflow-hidden border transition-all ${currentPlan === "pro" ? "border-violet-500 bg-violet-500/[0.02]" : "border-border/60 hover:border-violet-500/40"}`}>
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              {currentPlan === "pro" && <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 font-bold text-[10px]">Active</Badge>}
              <Badge className="bg-violet-500 text-white font-extrabold text-[10px]">🔥 Popular</Badge>
            </div>
            <CardHeader className="pb-3">
              <span className="text-[10px] font-extrabold text-violet-500 uppercase tracking-widest">Scholar Pro</span>
              <CardTitle className="text-xl font-bold mt-1">Pro Plan ⭐</CardTitle>
              <CardDescription className="text-xs">University students & learners</CardDescription>
              <div className="pt-2 font-black text-2xl flex items-baseline gap-1.5">
                <span>{billingCycle === "monthly" ? "LKR 1,500" : "LKR 12,000"}</span>
                <span className="text-xs text-muted-foreground font-semibold">/ {billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>
              <div className="text-[10px] text-emerald-500 font-bold">Only LKR 50/day</div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2 font-bold text-foreground">
                  <Check className="w-3.5 h-3.5 text-violet-500" />
                  <span>Everything in Free +</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>AI Study Planner & Notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>AI Tutor (Explain Mode)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Unlimited AI Quiz Generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cloud Sync & Dark Themes</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-foreground">
                  <Check className="w-3.5 h-3.5 text-indigo-500" />
                  <span>500 AI Credits / Month</span>
                </li>
              </ul>
              {currentPlan === "pro" ? (
                <Button disabled className="w-full text-xs rounded-2xl py-5 bg-violet-500/10 text-violet-500 hover:bg-violet-500/10">Active Tier</Button>
              ) : (
                <Button onClick={() => handleUpgradeClick("pro")} className="w-full text-xs rounded-2xl py-5 bg-violet-600 hover:bg-violet-700 text-white">
                  {currentPlan === "premium" ? "Downgrade to Pro" : "Upgrade to Pro"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Plan 3: Premium */}
          <Card className={`relative overflow-hidden border transition-all ${currentPlan === "premium" ? "border-amber-500 bg-amber-500/[0.02]" : "border-border/60 hover:border-amber-500/40"}`}>
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              {currentPlan === "premium" && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold text-[10px]">Active</Badge>}
              <Badge className="bg-amber-500 text-white font-extrabold text-[10px]">👑 Best Value</Badge>
            </div>
            <CardHeader className="pb-3">
              <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest">Elite</span>
              <CardTitle className="text-xl font-bold mt-1">Premium Plan 👑</CardTitle>
              <CardDescription className="text-xs">Competitive exams & power users</CardDescription>
              <div className="pt-2 font-black text-2xl flex items-baseline gap-1.5">
                <span>{billingCycle === "monthly" ? "LKR 2,500" : "LKR 20,000"}</span>
                <span className="text-xs text-muted-foreground font-semibold">/ {billingCycle === "monthly" ? "mo" : "yr"}</span>
              </div>
              <div className="text-[10px] text-emerald-500 font-bold">Less than LKR 85/day</div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2 font-bold text-foreground">
                  <Check className="w-3.5 h-3.5 text-amber-500" />
                  <span>Everything in Pro +</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Smart Revision & Tutor Plus</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Personalized Study Roadmaps</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Group Study Collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Premium 24/7 Support Desk</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-foreground">
                  <Check className="w-3.5 h-3.5 text-indigo-500" />
                  <span>3,000 AI Credits / Month</span>
                </li>
              </ul>
              {currentPlan === "premium" ? (
                <Button disabled className="w-full text-xs rounded-2xl py-5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/10">Active Tier</Button>
              ) : (
                <Button onClick={() => handleUpgradeClick("premium")} className="w-full text-xs rounded-2xl py-5 bg-amber-500 hover:bg-amber-600 text-white">Upgrade to Premium</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── CREDITS WARNING SYSTEM / ESTIMATOR ─── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Estimator calculator */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Credit Usage Estimator
            </CardTitle>
            <CardDescription className="text-xs">
              Understand what your remaining credit balance of <span className="font-extrabold text-foreground">{plan?.aiCredits} credits</span> is equivalent to:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-background/55 rounded-2xl border border-border/40">
                <span className="text-2xl font-black text-indigo-500">{estimators?.quizzes || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-medium mt-1">AI Quizzes</span>
                <span className="text-[9px] text-slate-400 italic">2 cr/each</span>
              </div>
              <div className="p-3 bg-background/55 rounded-2xl border border-border/40">
                <span className="text-2xl font-black text-indigo-500">{estimators?.shortNotes || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-medium mt-1">Short Notes</span>
                <span className="text-[9px] text-slate-400 italic">2 cr/each</span>
              </div>
              <div className="p-3 bg-background/55 rounded-2xl border border-border/40">
                <span className="text-2xl font-black text-indigo-500">{estimators?.tutor || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-medium mt-1">Tutor chats</span>
                <span className="text-[9px] text-slate-400 italic">3 cr/each</span>
              </div>
              <div className="p-3 bg-background/55 rounded-2xl border border-border/40">
                <span className="text-2xl font-black text-indigo-500">{estimators?.roadmaps || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-medium mt-1">Roadmaps</span>
                <span className="text-[9px] text-slate-400 italic">4 cr/each</span>
              </div>
            </div>
            
            <div className="p-3 rounded-2xl border border-border/40 bg-zinc-950/5 text-xs text-muted-foreground space-y-1 leading-normal">
              <span className="font-bold text-foreground block">Credit Consumption Ledger Rules:</span>
              <span>• Short Notes → 2 credits • Full Notes → 5 credits</span><br/>
              <span>• AI Tutor (Explain) → 3 credits • Roadmaps → 4 credits • Quizzes → 2 credits</span>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Billing history */}
        <Card className="border-border/60 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Receipt Billing History
            </CardTitle>
            <CardDescription className="text-xs">Download professional PDF receipts of your subscription renewals</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-4 pt-0">
            <div className="space-y-2 overflow-y-auto max-h-52 flex-1 pr-1">
              {invoices.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs space-y-1">
                  <CreditCard className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p>No billing invoices yet.</p>
                  <p className="text-[10px] text-slate-400">Your mock transactions will appear here.</p>
                </div>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.invoiceId} className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-background/55 hover:bg-accent/40 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-foreground">{inv.planName} - {inv.cycle}</span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{inv.invoiceId}</span>
                        <span>•</span>
                        <span>{inv.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{inv.amount}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl hover:bg-indigo-500/10 text-indigo-500"
                        onClick={() => handleDownloadInvoice(inv)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── CHRONOLOGICAL TRANSACTION AUDIT LOGS ─── */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-500" />
            AI Credits Usage History
          </CardTitle>
          <CardDescription className="text-xs">Real-time ledger audit log showing how credits were securely deducted</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground uppercase font-bold text-[9px] tracking-wider">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Action Description</th>
                  <th className="py-2.5 px-3">Credits Deducted</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                      No AI credit usage history found yet. Actions will update live.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/60 hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-500">{log.id}</td>
                      <td className="py-3 px-3 font-bold text-foreground">{log.actionType}</td>
                      <td className="py-3 px-3 font-extrabold text-red-500">-{log.creditsUsed} cr</td>
                      <td className="py-3 px-3 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── STRIPE CHECKOUT MOCK MODAL ─── */}
      {isStripeModalOpen && selectedUpgradePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full rounded-3xl border border-border/80 bg-card p-6 sm:p-8 relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              {/* stripe secure title */}
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500 animate-pulse" />
                  <span className="text-sm font-extrabold tracking-tight">Stripe Secure Checkout</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-extrabold text-[9px] uppercase tracking-wider">SSL Encrypted</Badge>
              </div>

              {/* Purchase details summary */}
              <div className="p-4 rounded-2xl bg-zinc-950/20 border border-border/60 space-y-2">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block opacity-75">Order Details</span>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-foreground">
                    {selectedUpgradePlan === "pro" ? "Scholar Pro Tier Subscription" : "Elite Premium Tier Subscription"}
                  </span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">
                    {selectedUpgradePlan === "pro" 
                      ? (billingCycle === "monthly" ? "LKR 1,500" : "LKR 12,000") 
                      : (billingCycle === "monthly" ? "LKR 2,500" : "LKR 20,000")}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground leading-normal">
                  • Renews {billingCycle === "monthly" ? "monthly" : "yearly"}. Cancel anytime securely in settings.<br/>
                  • Provides immediate refill of {selectedUpgradePlan === "pro" ? "500" : "3,000"} AI Monthly Credits.
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={19}
                      placeholder="4242 • 4242 • 4242 • 4242"
                      value={cardNumber}
                      onChange={(e) => {
                        // formats card digits
                        const v = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
                        const matches = v.match(/\d{4,16}/g);
                        const match = (matches && matches[0]) || "";
                        const parts = [];
                        for (let i = 0, len = match.length; i < len; i += 4) {
                          parts.push(match.substring(i, i + 4));
                        }
                        if (parts.length > 0) {
                          setCardNumber(parts.join(" "));
                        } else {
                          setCardNumber(v);
                        }
                      }}
                      className="w-full text-sm px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium pl-10"
                    />
                    <CreditCard className="w-4 h-4 text-muted-foreground absolute left-4.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/gi, "");
                        if (v.length >= 2) {
                          setExpiry(`${v.slice(0, 2)}/${v.slice(2, 4)}`);
                        } else {
                          setExpiry(v);
                        }
                      }}
                      className="w-full text-sm px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">CVC / CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="•••"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/gi, ""))}
                      className="w-full text-sm px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-center"
                    />
                  </div>
                </div>

                {/* Secure highlight info */}
                <div className="text-[10px] text-muted-foreground text-center">
                  🔐 No hidden fees • Cancel anytime • Secure payments by Stripe
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-xs rounded-2xl py-5 hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => {
                      setIsStripeModalOpen(false);
                      setCardNumber("");
                      setExpiry("");
                      setCvc("");
                    }}
                    disabled={checkoutLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 text-xs rounded-2xl py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? "Processing Payment..." : `Authorize Payment`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
