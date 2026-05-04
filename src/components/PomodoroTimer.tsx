import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePomodoro } from "../contexts/PomodoroContext";
import databaseService, {
  Subject,
  PomodoroSession,
} from "../services/databaseService";
import { Button } from "../app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";
import { Badge } from "../app/components/ui/badge";
import { Progress } from "../app/components/ui/progress";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { toast } from "sonner";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Coffee,
  TrendingUp,
  Clock,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export const PomodoroTimer: React.FC = () => {
  const { user } = useAuth();
  const {
    mode,
    timeLeft,
    isRunning,
    selectedSubject,
    setSelectedSubject,
    breakType,
    settings,
    updateSettings,
    start,
    pause,
    reset,
    lastCompletedAt,
  } = usePomodoro();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PomodoroSession | null>(
    null,
  );
  const [settingsDraft, setSettingsDraft] = useState(settings);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, lastCompletedAt]);

  useEffect(() => {
    setSettingsDraft(settings);
  }, [settings]);

  const loadData = async () => {
    try {
      const [subjectsData, sessionsData] = await Promise.all([
        databaseService.getSubjects(user!.$id),
        databaseService.getPomodoroSessions(user!.$id, 100),
      ]);
      setSubjects(subjectsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleStart = () => start();
  const handlePause = () => pause();
  const handleReset = () => reset();

  const handleEditSession = (session: PomodoroSession) => {
    setEditingSession(session);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSession?.$id) return;

    const formData = new FormData(e.currentTarget);
    const subjectId = formData.get("subjectId") as string;
    const durationRaw = formData.get("duration") as string;
    const duration = Number(durationRaw);

    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error("Duration must be a positive number");
      return;
    }

    try {
      const updated = await databaseService.updatePomodoroSession(
        editingSession.$id,
        {
          subjectId: subjectId === "none" ? "" : subjectId,
          duration,
        },
      );
      setSessions(sessions.map((s) => (s.$id === updated.$id ? updated : s)));
      setEditingSession(null);
      setIsEditDialogOpen(false);
      toast.success("Session updated");
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await databaseService.deletePomodoroSession(sessionId);
      setSessions(sessions.filter((s) => s.$id !== sessionId));
      toast.success("Session deleted");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const totalSeconds =
    mode === "focus"
      ? settings.focusMinutes * 60
      : (breakType === "long"
          ? settings.longBreakMinutes
          : settings.breakMinutes) * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const todaySessions = sessions.filter(
    (s) => new Date(s.createdAt).toDateString() === new Date().toDateString(),
  );

  const thisWeekSessions = sessions.filter((s) => {
    const date = new Date(s.createdAt);
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    return date >= weekStart && date <= weekEnd;
  });

  const thisMonthSessions = sessions.filter((s) => {
    const date = new Date(s.createdAt);
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    return date >= monthStart && date <= monthEnd;
  });

  const totalMinutesToday = todaySessions.reduce(
    (acc, s) => acc + s.duration,
    0,
  );
  const totalMinutesWeek = thisWeekSessions.reduce(
    (acc, s) => acc + s.duration,
    0,
  );
  const totalMinutesMonth = thisMonthSessions.reduce(
    (acc, s) => acc + s.duration,
    0,
  );

  const dailyGoal = settings.dailyGoal;
  const dailyGoalProgress =
    dailyGoal > 0 ? Math.min((todaySessions.length / dailyGoal) * 100, 100) : 0;

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextSettings = {
      focusMinutes: Math.max(1, Number(settingsDraft.focusMinutes) || 25),
      breakMinutes: Math.max(1, Number(settingsDraft.breakMinutes) || 5),
      longBreakMinutes: Math.max(
        1,
        Number(settingsDraft.longBreakMinutes) || 15,
      ),
      cyclesBeforeLongBreak: Math.max(
        1,
        Number(settingsDraft.cyclesBeforeLongBreak) || 4,
      ),
      dailyGoal: Math.max(1, Number(settingsDraft.dailyGoal) || 4),
    };

    updateSettings(nextSettings);
    toast.success("Timer settings updated");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <Badge variant="secondary" className="mb-3">
              Focus Studio
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">Pomodoro Timer</h1>
            <p className="text-muted-foreground">
              Deep focus sessions with smart breaks.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{sessions.length} sessions</Badge>
              <Badge variant="outline">
                {Math.floor(totalMinutesToday / 60)}h today
              </Badge>
              <Badge variant="outline">
                {Math.floor(totalMinutesWeek / 60)}h this week
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timer */}
        <Card className="md:col-span-2 lg:col-span-1 bg-white/70 dark:bg-slate-900/60">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {mode === "focus" ? (
                <>
                  <Timer className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-2xl">Focus Time</CardTitle>
                </>
              ) : (
                <>
                  <Coffee className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-2xl">
                    {breakType === "long" ? "Long Break" : "Break Time"}
                  </CardTitle>
                </>
              )}
            </div>
            <CardDescription>
              {mode === "focus"
                ? "Stay focused on your studies"
                : "Take a well-deserved break"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "focus" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Subject (Optional)
                </label>
                <Select
                  value={selectedSubject || "none"}
                  onValueChange={(value) =>
                    setSelectedSubject(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.$id} value={subject.$id!}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="text-center space-y-4">
              <div
                className={`text-5xl sm:text-6xl md:text-7xl font-bold font-mono ${
                  mode === "focus" ? "text-blue-600" : "text-green-600"
                }`}
              >
                {formatTime(timeLeft)}
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {!isRunning ? (
                <Button size="lg" onClick={handleStart}>
                  <Play className="mr-2 h-5 w-5" />
                  Start
                </Button>
              ) : (
                <Button size="lg" variant="secondary" onClick={handlePause}>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Study Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Today</p>
                    <p className="text-sm text-muted-foreground">
                      {todaySessions.length} sessions
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {Math.floor(totalMinutesToday / 60)}h {totalMinutesToday % 60}
                  m
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">This Week</p>
                    <p className="text-sm text-muted-foreground">
                      {thisWeekSessions.length} sessions
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {Math.floor(totalMinutesWeek / 60)}h {totalMinutesWeek % 60}m
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">This Month</p>
                    <p className="text-sm text-muted-foreground">
                      {thisMonthSessions.length} sessions
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {Math.floor(totalMinutesMonth / 60)}h {totalMinutesMonth % 60}
                  m
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily goal</span>
                  <span className="font-medium">
                    {todaySessions.length}/{dailyGoal} sessions
                  </span>
                </div>
                <Progress value={dailyGoalProgress} className="h-2" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Total Sessions: {sessions.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timer Settings</CardTitle>
          <CardDescription>
            Customize your focus and break routine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSettingsSubmit}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="focusMinutes">Focus minutes</Label>
              <Input
                id="focusMinutes"
                type="number"
                min={1}
                value={settingsDraft.focusMinutes}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    focusMinutes: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Short break minutes</Label>
              <Input
                id="breakMinutes"
                type="number"
                min={1}
                value={settingsDraft.breakMinutes}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    breakMinutes: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longBreakMinutes">Long break minutes</Label>
              <Input
                id="longBreakMinutes"
                type="number"
                min={1}
                value={settingsDraft.longBreakMinutes}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    longBreakMinutes: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cyclesBeforeLongBreak">
                Cycles before long break
              </Label>
              <Input
                id="cyclesBeforeLongBreak"
                type="number"
                min={1}
                value={settingsDraft.cyclesBeforeLongBreak}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    cyclesBeforeLongBreak: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyGoal">Daily goal (sessions)</Label>
              <Input
                id="dailyGoal"
                type="number"
                min={1}
                value={settingsDraft.dailyGoal}
                onChange={(e) =>
                  setSettingsDraft({
                    ...settingsDraft,
                    dailyGoal: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your focus session history</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sessions yet. Start your first Pomodoro session!
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map((session) => {
                const subject = subjects.find(
                  (s) => s.$id === session.subjectId,
                );
                return (
                  <div
                    key={session.$id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {session.duration} minutes
                          {subject && (
                            <Badge
                              variant="outline"
                              className="ml-2"
                              style={{
                                borderColor: subject.color,
                                color: subject.color,
                              }}
                            >
                              {subject.name}
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(
                            new Date(session.createdAt),
                            "MMM d, yyyy • h:mm a",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSession(session)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSession(session.$id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update session details</DialogDescription>
          </DialogHeader>
          {editingSession && (
            <form onSubmit={handleUpdateSession} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-session-subject">Subject</Label>
                <Select
                  name="subjectId"
                  defaultValue={editingSession.subjectId || "none"}
                >
                  <SelectTrigger id="edit-session-subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No subject</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.$id} value={subject.$id!}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-session-duration">
                  Duration (minutes)
                </Label>
                <Input
                  id="edit-session-duration"
                  name="duration"
                  type="number"
                  min={1}
                  defaultValue={editingSession.duration}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
