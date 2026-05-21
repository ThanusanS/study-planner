import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import databaseService, {
  Task,
  Exam,
  PomodoroSession,
  Subject,
  QuizHistory,
} from "../services/databaseService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import { Progress } from "../app/components/ui/progress";
import { Badge } from "../app/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Target,
  Flame,
  Calendar,
  Timer,
  Sparkles,
  BookOpen,
  Plus,
  TrendingUp,
  ArrowRight,
  Award,
  Zap,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format, subDays } from "date-fns";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type DashboardProps = {
  onOpenAiQuiz?: () => void;
};

export const Dashboard: React.FC<DashboardProps> = ({ onOpenAiQuiz }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>(
    [],
  );
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizzes, setQuizzes] = useState<QuizHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Task states
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSubject, setQuickSubject] = useState("");
  const [quickPriority, setQuickPriority] = useState<"low" | "medium" | "high">(
    "medium",
  );

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const resolvedUserId = user?.$id || (user as any)?.id;
      if (!resolvedUserId) return;

      const [tasksData, examsData, pomodoroData, subjectsData, quizzesData] =
        await Promise.all([
          databaseService.getTasks(resolvedUserId, 100),
          databaseService.getExams(resolvedUserId),
          databaseService.getPomodoroSessions(resolvedUserId, 100),
          databaseService.getSubjects(resolvedUserId),
          databaseService
            .getQuizzes(resolvedUserId)
            .catch(() => [] as QuizHistory[]),
        ]);

      setTasks(tasksData);
      setExams(examsData);
      setPomodoroSessions(pomodoroData);
      setSubjects(subjectsData);
      setQuizzes(quizzesData);

      // Auto-set the first subject for the quick task form
      if (subjectsData.length > 0) {
        setQuickSubject(subjectsData[0].$id || "");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to sync dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Greeting based on current time
  const dynamicGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    if (hour >= 17 && hour < 22) return "Good evening";
    return "Burning the midnight oil";
  }, []);

  // Quick encouragements
  const encouragementMessage = useMemo(() => {
    const pendingCount = tasks.filter((t) => t.status === "pending").length;
    if (pendingCount === 0 && tasks.length > 0) {
      return "All caught up! You are doing incredible work. 🏆";
    }
    if (pendingCount > 5) {
      return "Focus on one high-priority task at a time. You've got this! ⚡";
    }
    return "Stay focused. Track your progress. Finish strong. ✨";
  }, [tasks]);

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayTasks = tasks.filter((t) => {
    const taskDate = new Date(t.dueDate).toDateString();
    const today = new Date().toDateString();
    return taskDate === today;
  });
  const todayCompleted = todayTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const todayCompletionRate =
    todayTasks.length > 0
      ? Math.round((todayCompleted / todayTasks.length) * 100)
      : 0;

  const upcomingExams = exams
    .filter((e) => new Date(e.examDate) >= new Date())
    .slice(0, 3);

  const urgentExams = exams.filter((e) => {
    const examTime = new Date(e.examDate).getTime();
    const nowTime = new Date().getTime();
    const daysUntil = Math.ceil((examTime - nowTime) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 3;
  });

  const studyStreak =
    pomodoroSessions.length > 0 ? Math.min(pomodoroSessions.length, 7) : 0;

  const totalStudyMinutes = pomodoroSessions.reduce(
    (acc, s) => acc + s.duration,
    0,
  );
  const totalStudyHours = parseFloat((totalStudyMinutes / 60).toFixed(1));

  // Quick Add Task action
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedUserId = user?.$id || (user as any)?.id;
    if (!resolvedUserId) return;
    if (!quickTitle.trim()) return;

    let selectedSubjectId = quickSubject;
    if (!selectedSubjectId && subjects.length > 0) {
      selectedSubjectId = subjects[0].$id || "";
    }

    if (!selectedSubjectId) {
      toast.error(
        "Please create a subject under the 'Subjects' section first!",
      );
      return;
    }

    try {
      const newTask = await databaseService.createTask({
        userId: resolvedUserId,
        subjectId: selectedSubjectId,
        title: quickTitle.trim(),
        dueDate: new Date().toISOString().split("T")[0],
        status: "pending",
        createdAt: new Date().toISOString(),
        priority: quickPriority,
        archived: false,
      });

      setTasks([newTask, ...tasks]);
      setQuickTitle("");
      toast.success("Task added to today's schedule!");
    } catch (error) {
      console.error("Error quick adding task:", error);
      toast.error("Failed to add task");
    }
  };

  // Toggle task status
  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === "pending" ? "completed" : "pending";
      const completedAt =
        newStatus === "completed" ? new Date().toISOString() : undefined;
      const updated = await databaseService.updateTask(task.$id!, {
        status: newStatus,
        completedAt,
      });
      setTasks(tasks.map((t) => (t.$id === task.$id ? updated : t)));
      toast.success(
        newStatus === "completed"
          ? "Task completed! Great job 🎉"
          : "Task marked as pending",
      );
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  // Charts formatting: 7-day Study Velocity
  const studyChartData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const formattedDay = format(date, "EEE");
      const dateStr = date.toDateString();

      const daySessions = pomodoroSessions.filter(
        (session) => new Date(session.createdAt).toDateString() === dateStr,
      );
      const totalMins = daySessions.reduce((sum, s) => sum + s.duration, 0);
      result.push({
        day: formattedDay,
        minutes: totalMins,
        hours: parseFloat((totalMins / 60).toFixed(1)),
      });
    }
    return result;
  }, [pomodoroSessions]);

  // Subject allocation pie chart
  const subjectPieData = useMemo(() => {
    const distribution: Record<
      string,
      { name: string; minutes: number; color: string }
    > = {};

    subjects.forEach((subj) => {
      distribution[subj.$id || ""] = {
        name: subj.name,
        minutes: 0,
        color: subj.color || "#6366f1",
      };
    });

    pomodoroSessions.forEach((session) => {
      if (session.subjectId && distribution[session.subjectId]) {
        distribution[session.subjectId].minutes += session.duration;
      }
    });

    const activeAllocation = Object.values(distribution).filter(
      (d) => d.minutes > 0,
    );

    if (activeAllocation.length === 0 && subjects.length > 0) {
      // Fallback placeholder data if nothing studied yet
      return subjects.slice(0, 4).map((s) => ({
        name: s.name,
        value: 10,
        color: s.color || "#6366f1",
        isPlaceholder: true,
      }));
    }

    return activeAllocation.map((d) => ({
      name: d.name,
      value: d.minutes,
      color: d.color,
      isPlaceholder: false,
    }));
  }, [pomodoroSessions, subjects]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <Sparkles className="absolute text-indigo-500 animate-pulse h-6 w-6" />
        </div>
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Syncing dashboard data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Premium Hero Greeting */}
      <Card className="relative overflow-hidden border border-border/80 shadow-lg dark:shadow-indigo-950/20 glass-effect">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/5 dark:from-indigo-950/30 dark:via-purple-950/15" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <CardContent className="p-6 sm:p-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold px-3 py-1 text-xs"
                >
                  SaaS Core v1.2
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground"
                >
                  {format(new Date(), "EEEE, MMM d")}
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {dynamicGreeting},{" "}
                <span className="text-gradient font-black">
                  {user?.name || "Achiever"}
                </span>
                ! 🚀
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-xl">
                {encouragementMessage}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-background/50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-border/60 backdrop-blur-md">
              <div className="flex items-center gap-3 pr-2 border-r border-border/60">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">
                    Streak
                  </div>
                  <div className="text-lg font-bold text-orange-500">
                    {studyStreak} Days
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">
                    Study
                  </div>
                  <div className="text-lg font-bold text-indigo-500">
                    {totalStudyHours} hrs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Bento Grid KPI Blocks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Circular Progress Dial */}
        <Card className="hover-lift border border-border/80 bg-card shadow-sm relative overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Overall Progress
              </span>
              <div className="text-3xl font-black">{completionRate}%</div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {completedTasks}/{totalTasks} tasks resolved
              </span>
            </div>

            <div className="relative flex items-center justify-center">
              {/* Circular SVG Ring */}
              <svg
                className="w-16 h-16 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  className="fill-none stroke-muted/20"
                  strokeWidth="2.8"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  className="fill-none stroke-indigo-600 transition-all duration-700 ease-out"
                  strokeWidth="3.2"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <Target className="absolute h-5 w-5 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Study Sessions */}
        <Card className="hover-lift border border-border/80 bg-card shadow-sm relative overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mindful Study
              </span>
              <div className="text-3xl font-black">{totalStudyHours}h</div>
              <span className="text-xs text-muted-foreground">
                Across {pomodoroSessions.length} focus sessions
              </span>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Timer className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Streak Alert */}
        <Card className="hover-lift border border-border/80 bg-card shadow-sm relative overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Daily Momentum
              </span>
              <div className="text-3xl font-black">{studyStreak} Days</div>
              <span className="text-xs text-muted-foreground">
                Keep the streak active today
              </span>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flame className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Academic Countdown */}
        <Card className="hover-lift border border-border/80 bg-card shadow-sm relative overflow-hidden group">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Upcoming Exams
              </span>
              <div className="text-3xl font-black">{exams.length}</div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {urgentExams.length > 0 ? (
                  <Badge
                    variant="destructive"
                    className="py-0 px-1.5 text-[10px] uppercase font-bold animate-pulse"
                  >
                    {urgentExams.length} Urgent
                  </Badge>
                ) : (
                  <span className="text-[11px]">Keep reviewing subjects</span>
                )}
              </span>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Interactive Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Study Velocity Area Chart (Spans 2 columns) */}
        <Card className="lg:col-span-2 border border-border/80 bg-card shadow-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Focus Velocity Trend
              </CardTitle>
              <CardDescription>
                Daily Pomodoro study time logged in the past week
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 text-xs font-semibold px-2 py-0.5"
            >
              Live Tracker
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-64 sm:h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={studyChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorMinutes"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit="m"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(9, 13, 22, 0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#f3f4f6",
                      fontSize: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                      backdropFilter: "blur(4px)",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#818cf8" }}
                    formatter={(value: any) => [
                      `${value} minutes`,
                      "Time Spent",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMinutes)"
                    activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 1.5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Allocation Donut Pie Chart (Spans 1 column) */}
        <Card className="border border-border/80 bg-card shadow-sm relative overflow-hidden flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              Time Breakdown
            </CardTitle>
            <CardDescription>Allocation across active subjects</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col items-center justify-center flex-1">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subjectPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute text-center">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Total Study
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {totalStudyHours}h
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {pomodoroSessions.length} sessions
                </div>
              </div>
            </div>

            {/* Styled custom legends */}
            <div className="w-full max-h-32 overflow-y-auto mt-4 px-2 space-y-1.5 text-xs">
              {subjectPieData.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate font-medium">{entry.name}</span>
                  </div>
                  <span className="text-muted-foreground shrink-0 font-bold">
                    {entry.isPlaceholder ? "No history" : `${entry.value} min`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bento Grid: Today's Tasks, Quick Actions, and AI Quiz Insights */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Bento Column 1: Today's Schedule + Quick task builder */}
        <Card className="border border-border/80 bg-card shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">
                Today's Schedule
              </CardTitle>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs"
              >
                {todayTasks.length} tasks scheduled
              </Badge>
            </div>
            <CardDescription>
              Check off completed tasks or quick-add a new task below
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-4 flex-1 flex flex-col justify-between">
            {/* Task list list */}
            <div className="space-y-2 overflow-y-auto max-h-60 flex-1 pr-1">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-1">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p>All clean! No tasks scheduled for today.</p>
                </div>
              ) : (
                todayTasks.map((task) => {
                  const subColor =
                    subjects.find((s) => s.$id === task.subjectId)?.color ||
                    "#6366f1";
                  return (
                    <div
                      key={task.$id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/40 hover:bg-accent/40 transition-colors group cursor-pointer"
                      onClick={() => handleToggleTask(task)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            task.status === "completed"
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-muted-foreground/40 hover:border-indigo-500"
                          }`}
                        >
                          {task.status === "completed" && (
                            <Plus className="h-3 w-3 rotate-45 stroke-[4px]" />
                          )}
                        </div>
                        <span
                          className={`text-xs truncate font-medium ${
                            task.status === "completed"
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <Badge
                        className="text-[10px] shrink-0 text-white font-semibold py-0"
                        style={{ backgroundColor: subColor }}
                      >
                        {subjects.find((s) => s.$id === task.subjectId)?.name ||
                          "Task"}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Add Form */}
            <form
              onSubmit={handleQuickAddTask}
              className="pt-3 border-t border-border/60 space-y-2.5"
            >
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Quick Add to Today
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter task description..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-border/80 bg-background/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-foreground"
                />
                <button
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {subjects.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={quickSubject}
                    onChange={(e) => setQuickSubject(e.target.value)}
                    className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background focus:outline-none text-muted-foreground w-1/2"
                  >
                    {subjects.map((subj) => (
                      <option key={subj.$id} value={subj.$id}>
                        {subj.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as any)}
                    className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background focus:outline-none text-muted-foreground w-1/2"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Bento Column 2: AI Quiz Studio Highlights */}
        <Card className="border border-border/80 bg-card shadow-sm flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                AI Quiz Hub
              </CardTitle>
              <Badge
                variant="secondary"
                className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs"
              >
                {quizzes.length} Generated
              </Badge>
            </div>
            <CardDescription>
              Practice with custom adaptive difficulty AI Quizzes
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5 overflow-y-auto max-h-60 flex-1 pr-1">
              {quizzes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs space-y-1">
                  <Award className="h-8 w-8 text-muted-foreground/30 mx-auto animate-pulse" />
                  <p>No quizzes built yet.</p>
                  <p className="text-[10px] text-muted-foreground/80">
                    Generate one in the AI Quiz section!
                  </p>
                </div>
              ) : (
                quizzes.slice(0, 3).map((quiz) => (
                  <div
                    key={quiz.$id}
                    className="p-3 rounded-xl border border-border/60 bg-background/40 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-foreground truncate">
                        {quiz.topic}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="capitalize font-semibold text-indigo-500">
                          {quiz.difficulty}
                        </span>
                        <span>•</span>
                        <span>{quiz.questionCount} Questions</span>
                        {quiz.attempts && quiz.attempts > 0 ? (
                          <>
                            <span>•</span>
                            <span className="text-emerald-500">
                              {quiz.attempts} Attempted
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-border/80 text-muted-foreground shrink-0 font-medium"
                    >
                      AI Generated
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border/60 bg-indigo-500/5 dark:bg-indigo-950/20 p-3 rounded-xl flex items-center justify-between gap-3 mt-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Ready to test?
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Challenge yourself on any topic!
                </span>
              </div>
              <Badge
                className="bg-indigo-600 text-white shrink-0 py-1 cursor-pointer hover:bg-indigo-700 transition-colors flex items-center gap-1 text-xs"
                onClick={onOpenAiQuiz}
                role="button"
                tabIndex={0}
              >
                Go to AI Quiz <ArrowRight className="h-3 w-3" />
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Bento Column 3: Exam Milestones & Countdown */}
        <Card className="border border-border/80 bg-card shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Upcoming Exams
            </CardTitle>
            <CardDescription>
              Track exam preparation and revision countdowns
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5 overflow-y-auto max-h-72 flex-1 pr-1">
              {upcomingExams.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-xs space-y-1">
                  <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p>Hooray! No upcoming exams listed.</p>
                </div>
              ) : (
                upcomingExams.map((exam) => {
                  const examTime = new Date(exam.examDate).getTime();
                  const nowTime = new Date().getTime();
                  const daysUntil = Math.ceil(
                    (examTime - nowTime) / (1000 * 60 * 60 * 24),
                  );
                  const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                  const subjectColor =
                    subjects.find((s) => s.$id === exam.subjectId)?.color ||
                    "#6366f1";

                  return (
                    <div
                      key={exam.$id}
                      className={`p-3 rounded-xl border transition-all ${
                        isUrgent
                          ? "border-red-200 bg-red-500/5 dark:bg-red-950/20 dark:border-red-900/40"
                          : "border-border/60 bg-background/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-foreground truncate">
                            {exam.examName}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {format(new Date(exam.examDate), "MMMM d, yyyy")}
                          </div>
                        </div>
                        <Badge
                          variant={isUrgent ? "destructive" : "secondary"}
                          className={`text-[10px] shrink-0 font-bold px-2 py-0.5 ${
                            isUrgent ? "animate-pulse" : ""
                          }`}
                        >
                          {daysUntil === 0
                            ? "TODAY"
                            : daysUntil === 1
                              ? "Tomorrow"
                              : `${daysUntil} days`}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/40 text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: subjectColor }}
                          />
                          {subjects.find((s) => s.$id === exam.subjectId)
                            ?.name || "Subject"}
                        </span>
                        {exam.location ? (
                          <span className="text-muted-foreground font-medium truncate max-w-[120px]">
                            {exam.location}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-zinc-500/5 dark:bg-zinc-800/10 border border-border/40 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                Tip: Try generating an{" "}
                <span className="font-semibold text-foreground">AI Quiz</span>{" "}
                matching your exam topic to identify study gaps!
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
