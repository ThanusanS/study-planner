import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import databaseService, {
  Exam,
  PomodoroSession,
  Subject,
  Task,
  Topic,
} from "../services/databaseService";
import { Button } from "../app/components/ui/button";
import { Checkbox } from "../app/components/ui/checkbox";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
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
  DialogTrigger,
} from "../app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";
import { Switch } from "../app/components/ui/switch";
import { Badge } from "../app/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, BookOpen, List, Pencil } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../app/components/ui/accordion";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../app/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  subDays,
} from "date-fns";

const SUBJECT_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

export const SubjectsManager: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [loading, setLoading] = useState(true);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isEditTopicDialogOpen, setIsEditTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingTopicSubjectId, setEditingTopicSubjectId] = useState<
    string | null
  >(null);
  const [activeSubjectForTopic, setActiveSubjectForTopic] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("custom");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [bulkColor, setBulkColor] = useState("");
  const [draggingSubjectId, setDraggingSubjectId] = useState<string | null>(
    null,
  );
  const [dragOverSubjectId, setDragOverSubjectId] = useState<string | null>(
    null,
  );
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [allSessions, setAllSessions] = useState<PomodoroSession[]>([]);
  const [analyticsSubjectId, setAnalyticsSubjectId] = useState<string>("");
  const [analyticsRange, setAnalyticsRange] = useState("30");
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [examCounts, setExamCounts] = useState<Record<string, number>>({});
  const [studyMinutes, setStudyMinutes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, showArchived]);

  useEffect(() => {
    setSelectedSubjectIds([]);
  }, [showArchived, searchQuery, sortOption]);

  useEffect(() => {
    if (!subjects.length) return;
    const exists = subjects.some(
      (subject) => subject.$id === analyticsSubjectId,
    );
    if (!exists) {
      const next = subjects.find((subject) => !(subject.archived ?? false));
      setAnalyticsSubjectId(next?.$id || "");
    }
  }, [subjects, analyticsSubjectId]);

  const loadData = async () => {
    try {
      const [subjectsData, tasksData, examsData, sessionsData] =
        await Promise.all([
          databaseService.getSubjects(user!.$id, {
            includeArchived: showArchived,
          }),
          databaseService.getTasks(user!.$id, 500),
          databaseService.getExams(user!.$id),
          databaseService.getPomodoroSessions(user!.$id, 500),
        ]);
      setSubjects(subjectsData);
      setAllTasks(tasksData as Task[]);
      setAllExams(examsData as Exam[]);
      setAllSessions(sessionsData as PomodoroSession[]);

      const nextTaskCounts: Record<string, number> = {};
      const nextExamCounts: Record<string, number> = {};
      const nextStudyMinutes: Record<string, number> = {};

      (tasksData as Task[]).forEach((task) => {
        nextTaskCounts[task.subjectId] =
          (nextTaskCounts[task.subjectId] || 0) + 1;
      });

      (examsData as Exam[]).forEach((exam) => {
        nextExamCounts[exam.subjectId] =
          (nextExamCounts[exam.subjectId] || 0) + 1;
      });

      (sessionsData as PomodoroSession[]).forEach((session) => {
        if (!session.subjectId) return;
        nextStudyMinutes[session.subjectId] =
          (nextStudyMinutes[session.subjectId] || 0) + session.duration;
      });

      setTaskCounts(nextTaskCounts);
      setExamCounts(nextExamCounts);
      setStudyMinutes(nextStudyMinutes);

      const topicsData: Record<string, Topic[]> = {};
      for (const subject of subjectsData) {
        const subjectTopics = await databaseService.getTopicsBySubject(
          subject.$id!,
        );
        topicsData[subject.$id!] = subjectTopics;
      }
      setTopics(topicsData);
      if (!analyticsSubjectId && subjectsData.length > 0) {
        setAnalyticsSubjectId(subjectsData[0].$id || "");
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredSubjects = subjects.filter((subject) => {
    const isArchived = subject.archived ?? false;
    if (!showArchived && isArchived) return false;
    if (!normalizedQuery) return true;
    const subjectMatches = subject.name.toLowerCase().includes(normalizedQuery);
    const topicMatches = (topics[subject.$id!] || []).some((topic) =>
      topic.name.toLowerCase().includes(normalizedQuery),
    );
    return subjectMatches || topicMatches;
  });

  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    switch (sortOption) {
      case "custom":
        return (a.order || 0) - (b.order || 0);
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "topics-desc":
        return (topics[b.$id!]?.length || 0) - (topics[a.$id!]?.length || 0);
      case "tasks-desc":
        return (taskCounts[b.$id!] || 0) - (taskCounts[a.$id!] || 0);
      case "created-asc":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "created-desc":
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  const canDrag = sortOption === "custom" && !normalizedQuery && !showArchived;

  const handleDragStart = (subjectId: string) => {
    if (!canDrag) return;
    setDraggingSubjectId(subjectId);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    id: string,
  ) => {
    if (!canDrag) return;
    event.preventDefault();
    setDragOverSubjectId(id);
  };

  const handleDrop = async (targetId: string) => {
    if (!canDrag || !draggingSubjectId) return;
    if (draggingSubjectId === targetId) {
      setDraggingSubjectId(null);
      setDragOverSubjectId(null);
      return;
    }

    const current = [...sortedSubjects];
    const fromIndex = current.findIndex((s) => s.$id === draggingSubjectId);
    const toIndex = current.findIndex((s) => s.$id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...current];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const orderMap = new Map<string, number>();
    reordered.forEach((subject, index) => {
      if (subject.$id) {
        orderMap.set(subject.$id, index + 1);
      }
    });

    setSubjects(
      subjects.map((subject) => {
        const nextOrder = orderMap.get(subject.$id || "");
        if (!nextOrder) return subject;
        return { ...subject, order: nextOrder };
      }),
    );

    setDraggingSubjectId(null);
    setDragOverSubjectId(null);

    try {
      await Promise.all(
        reordered.map((subject, index) =>
          databaseService.updateSubject(subject.$id!, {
            order: index + 1,
          }),
        ),
      );
      toast.success("Order updated");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const visibleSubjectIds = sortedSubjects.map((subject) => subject.$id || "");
  const isAllSelected =
    visibleSubjectIds.length > 0 &&
    visibleSubjectIds.every((id) => selectedSubjectIds.includes(id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubjectIds(visibleSubjectIds);
    } else {
      setSelectedSubjectIds([]);
    }
  };

  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  };

  const selectedSubject = subjects.find(
    (subject) => subject.$id === analyticsSubjectId,
  );

  const subjectTasks = useMemo(
    () => allTasks.filter((task) => task.subjectId === analyticsSubjectId),
    [allTasks, analyticsSubjectId],
  );

  const subjectExams = useMemo(
    () => allExams.filter((exam) => exam.subjectId === analyticsSubjectId),
    [allExams, analyticsSubjectId],
  );

  const subjectSessions = useMemo(
    () =>
      allSessions.filter((session) => session.subjectId === analyticsSubjectId),
    [allSessions, analyticsSubjectId],
  );

  const taskStatusData = useMemo(() => {
    const completed = subjectTasks.filter(
      (task) => task.status === "completed",
    ).length;
    const pending = subjectTasks.length - completed;
    return [
      { status: "Completed", value: completed },
      { status: "Pending", value: pending },
    ];
  }, [subjectTasks]);

  const studyDays = useMemo(() => {
    const days = Number(analyticsRange) || 30;
    const start = subDays(new Date(), days - 1);
    return eachDayOfInterval({ start, end: new Date() }).map((day) => ({
      date: format(day, "MMM d"),
      minutes: subjectSessions
        .filter((session) => isSameDay(new Date(session.createdAt), day))
        .reduce((sum, session) => sum + session.duration, 0),
    }));
  }, [analyticsRange, subjectSessions]);

  const examByMonth = useMemo(() => {
    return Array.from({ length: 6 }).map((_, index) => {
      const monthDate = addMonths(new Date(), index);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const count = subjectExams.filter((exam) => {
        const examDate = new Date(exam.examDate);
        return examDate >= monthStart && examDate <= monthEnd;
      }).length;
      return {
        month: format(monthDate, "MMM"),
        count,
      };
    });
  }, [subjectExams]);

  const handleCreateSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const color = formData.get("color") as string;
    const nextOrder =
      subjects.reduce((max, subject) => Math.max(max, subject.order || 0), 0) +
      1;

    try {
      const newSubject = await databaseService.createSubject({
        userId: user!.$id,
        name,
        color,
        createdAt: new Date().toISOString(),
        order: nextOrder,
        archived: false,
      });
      setSubjects([newSubject, ...subjects]);
      setTopics({ ...topics, [newSubject.$id!]: [] });
      setIsSubjectDialogOpen(false);
      toast.success("Subject created successfully");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating subject:", error);
      toast.error("Failed to create subject");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (
      !confirm(
        "Are you sure? This will delete all associated topics and tasks.",
      )
    )
      return;

    try {
      await databaseService.deleteSubject(subjectId);
      setSubjects(subjects.filter((s) => s.$id !== subjectId));
      const newTopics = { ...topics };
      delete newTopics[subjectId];
      setTopics(newTopics);
      toast.success("Subject deleted");
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Failed to delete subject");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubjectIds.length === 0) return;
    if (!confirm("Delete selected subjects and all related topics?")) return;

    try {
      await Promise.all(
        selectedSubjectIds.map((subjectId) =>
          databaseService.deleteSubject(subjectId),
        ),
      );
      const remaining = subjects.filter(
        (subject) => !selectedSubjectIds.includes(subject.$id || ""),
      );
      setSubjects(remaining);
      const nextTopics = { ...topics };
      selectedSubjectIds.forEach((subjectId) => {
        delete nextTopics[subjectId];
      });
      setTopics(nextTopics);
      setSelectedSubjectIds([]);
      toast.success("Subjects deleted");
    } catch (error) {
      console.error("Error deleting subjects:", error);
      toast.error("Failed to delete subjects");
    }
  };

  const handleBulkArchive = async (archived: boolean) => {
    if (selectedSubjectIds.length === 0) return;

    try {
      await Promise.all(
        selectedSubjectIds.map((subjectId) =>
          databaseService.updateSubject(subjectId, { archived }),
        ),
      );
      setSubjects(
        subjects.map((subject) =>
          selectedSubjectIds.includes(subject.$id || "")
            ? { ...subject, archived }
            : subject,
        ),
      );
      setSelectedSubjectIds([]);
      toast.success(archived ? "Subjects archived" : "Subjects restored");
    } catch (error) {
      console.error("Error archiving subjects:", error);
      toast.error("Failed to update subjects");
    }
  };

  const handleBulkColorChange = async () => {
    if (!bulkColor || selectedSubjectIds.length === 0) return;

    try {
      await Promise.all(
        selectedSubjectIds.map((subjectId) =>
          databaseService.updateSubject(subjectId, { color: bulkColor }),
        ),
      );
      setSubjects(
        subjects.map((subject) =>
          selectedSubjectIds.includes(subject.$id || "")
            ? { ...subject, color: bulkColor }
            : subject,
        ),
      );
      setBulkColor("");
      setSelectedSubjectIds([]);
      toast.success("Color updated");
    } catch (error) {
      console.error("Error updating colors:", error);
      toast.error("Failed to update colors");
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSubject?.$id) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const color = formData.get("color") as string;

    try {
      const updated = await databaseService.updateSubject(editingSubject.$id, {
        name,
        color,
      });
      setSubjects(subjects.map((s) => (s.$id === updated.$id ? updated : s)));
      setEditingSubject(null);
      setIsEditDialogOpen(false);
      toast.success("Subject updated");
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Failed to update subject");
    }
  };

  const handleCreateTopic = async (
    e: React.FormEvent<HTMLFormElement>,
    subjectId: string,
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("topicName") as string;

    try {
      const newTopic = await databaseService.createTopic({
        subjectId,
        name,
      });
      setTopics({
        ...topics,
        [subjectId]: [...(topics[subjectId] || []), newTopic],
      });
      setActiveSubjectForTopic(null);
      toast.success("Topic added");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Failed to add topic");
    }
  };

  const handleDeleteTopic = async (subjectId: string, topicId: string) => {
    try {
      await databaseService.deleteTopic(topicId);
      setTopics({
        ...topics,
        [subjectId]: topics[subjectId].filter((t) => t.$id !== topicId),
      });
      toast.success("Topic deleted");
    } catch (error) {
      console.error("Error deleting topic:", error);
      toast.error("Failed to delete topic");
    }
  };

  const handleEditTopic = (subjectId: string, topic: Topic) => {
    setEditingTopic(topic);
    setEditingTopicSubjectId(subjectId);
    setIsEditTopicDialogOpen(true);
  };

  const handleUpdateTopic = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTopic?.$id || !editingTopicSubjectId) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("topicName") as string;

    try {
      const updated = await databaseService.updateTopic(editingTopic.$id, {
        name,
      });
      setTopics({
        ...topics,
        [editingTopicSubjectId]: topics[editingTopicSubjectId].map((t) =>
          t.$id === updated.$id ? updated : t,
        ),
      });
      setEditingTopic(null);
      setEditingTopicSubjectId(null);
      setIsEditTopicDialogOpen(false);
      toast.success("Topic updated");
    } catch (error) {
      console.error("Error updating topic:", error);
      toast.error("Failed to update topic");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <Badge variant="secondary" className="mb-3">
              Subject Hub
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Subjects & Topics
            </h1>
            <p className="text-muted-foreground">
              Organize your study materials.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{subjects.length} subjects</Badge>
              <Badge variant="outline">{allTasks.length} tasks</Badge>
              <Badge variant="outline">{allExams.length} exams</Badge>
            </div>
          </div>
          <Dialog
            open={isSubjectDialogOpen}
            onOpenChange={setIsSubjectDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
                <DialogDescription>
                  Add a new subject to your study planner
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Mathematics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {SUBJECT_COLORS.map((color) => (
                      <label key={color} className="cursor-pointer">
                        <input
                          type="radio"
                          name="color"
                          value={color}
                          required
                          className="sr-only peer"
                        />
                        <div
                          className="w-10 h-10 rounded-full border-2 border-transparent peer-checked:border-primary peer-checked:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Create Subject
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update your subject details</DialogDescription>
          </DialogHeader>
          {editingSubject && (
            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Subject Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingSubject.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {SUBJECT_COLORS.map((color) => (
                    <label key={color} className="cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        defaultChecked={color === editingSubject.color}
                        required
                        className="sr-only peer"
                      />
                      <div
                        className="w-10 h-10 rounded-full border-2 border-transparent peer-checked:border-primary peer-checked:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditTopicDialogOpen}
        onOpenChange={setIsEditTopicDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>Update topic name</DialogDescription>
          </DialogHeader>
          {editingTopic && (
            <form onSubmit={handleUpdateTopic} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-topic-name">Topic Name</Label>
                <Input
                  id="edit-topic-name"
                  name="topicName"
                  defaultValue={editingTopic.name}
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

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Subject Analytics</CardTitle>
              <CardDescription>Track performance by subject</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={analyticsSubjectId}
                onValueChange={setAnalyticsSubjectId}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    .filter((subject) => !(subject.archived ?? false))
                    .map((subject) => (
                      <SelectItem key={subject.$id} value={subject.$id!}>
                        {subject.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={analyticsRange} onValueChange={setAnalyticsRange}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedSubject ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{subjectTasks.length} tasks</Badge>
              <Badge variant="secondary">{subjectExams.length} exams</Badge>
              <Badge variant="secondary">
                {subjectSessions.reduce(
                  (sum, session) => sum + session.duration,
                  0,
                )}{" "}
                minutes studied
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a subject to view analytics.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {selectedSubject ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Study Minutes</p>
                <ChartContainer
                  config={{
                    minutes: { label: "Minutes", color: "#3b82f6" },
                  }}
                  className="h-52"
                >
                  <LineChart data={studyDays} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis
                      width={28}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="var(--color-minutes)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Task Status</p>
                <ChartContainer
                  config={{
                    Completed: { label: "Completed", color: "#22c55e" },
                    Pending: { label: "Pending", color: "#f97316" },
                  }}
                  className="h-52"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={taskStatusData}
                      dataKey="value"
                      nameKey="status"
                      innerRadius={40}
                      outerRadius={70}
                    >
                      {taskStatusData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={
                            entry.status === "Completed" ? "#22c55e" : "#f97316"
                          }
                        />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Upcoming Exams</p>
                <ChartContainer
                  config={{
                    count: { label: "Exams", color: "#8b5cf6" },
                  }}
                  className="h-52"
                >
                  <BarChart data={examByMonth} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis
                      width={28}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No analytics available yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 items-end">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="subject-search">Search</Label>
            <Input
              id="subject-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects or topics"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject-sort">Sort by</Label>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger id="subject-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Manual order</SelectItem>
                <SelectItem value="created-desc">Newest</SelectItem>
                <SelectItem value="created-asc">Oldest</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="topics-desc">Most Topics</SelectItem>
                <SelectItem value="tasks-desc">Most Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <Label>Show archived</Label>
              <div className="mt-2">
                <Switch
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
            />
            <span className="text-sm text-muted-foreground">
              {selectedSubjectIds.length} selected
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={bulkColor} onValueChange={setBulkColor}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Set color" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_COLORS.map((color) => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {color}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleBulkColorChange}
              disabled={!bulkColor || selectedSubjectIds.length === 0}
            >
              Apply Color
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkArchive(true)}
              disabled={selectedSubjectIds.length === 0}
            >
              Archive
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkArchive(false)}
              disabled={selectedSubjectIds.length === 0}
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedSubjectIds.length === 0}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No subjects yet. Create your first subject to get started!
          </CardContent>
        </Card>
      ) : sortedSubjects.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No subjects match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedSubjects.map((subject) => (
            <Card
              key={subject.$id}
              className={`overflow-hidden ${
                draggingSubjectId === subject.$id ? "opacity-70" : ""
              } ${dragOverSubjectId === subject.$id ? "ring-2 ring-primary" : ""} ${
                subject.archived ? "opacity-60" : ""
              }`}
              draggable={canDrag}
              onDragStart={() => handleDragStart(subject.$id || "")}
              onDragOver={(event) => handleDragOver(event, subject.$id || "")}
              onDrop={() => handleDrop(subject.$id || "")}
              onDragEnd={() => {
                setDraggingSubjectId(null);
                setDragOverSubjectId(null);
              }}
            >
              <div className="h-2" style={{ backgroundColor: subject.color }} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSubjectIds.includes(subject.$id || "")}
                      onCheckedChange={() =>
                        toggleSubjectSelection(subject.$id || "")
                      }
                    />
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${subject.color}20` }}
                    >
                      <BookOpen
                        className="h-6 w-6"
                        style={{ color: subject.color }}
                      />
                    </div>
                    <div>
                      <CardTitle>{subject.name}</CardTitle>
                      <CardDescription>
                        {topics[subject.$id!]?.length || 0} topics
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {subject.archived && <Badge>Archived</Badge>}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSubject(subject)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubject(subject.$id!)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground mb-4">
                  <div className="rounded-md border px-2 py-1 text-center">
                    {topics[subject.$id!]?.length || 0} topics
                  </div>
                  <div className="rounded-md border px-2 py-1 text-center">
                    {taskCounts[subject.$id!] || 0} tasks
                  </div>
                  <div className="rounded-md border px-2 py-1 text-center">
                    {examCounts[subject.$id!] || 0} exams
                  </div>
                  <div className="rounded-md border px-2 py-1 text-center">
                    {Math.floor((studyMinutes[subject.$id!] || 0) / 60)}h{" "}
                    {(studyMinutes[subject.$id!] || 0) % 60}m
                  </div>
                </div>
                <Accordion type="single" collapsible>
                  <AccordionItem value="topics" className="border-none">
                    <AccordionTrigger className="py-2">
                      <span className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        View Topics
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {topics[subject.$id!]?.map((topic) => (
                          <div
                            key={topic.$id}
                            className="flex items-center justify-between p-2 rounded border hover:bg-accent group"
                          >
                            <span className="text-sm">{topic.name}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditTopic(subject.$id!, topic)
                                }
                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 h-6 w-6 p-0"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteTopic(subject.$id!, topic.$id!)
                                }
                                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {activeSubjectForTopic === subject.$id ? (
                          <form
                            onSubmit={(e) => handleCreateTopic(e, subject.$id!)}
                            className="flex flex-col sm:flex-row gap-2"
                          >
                            <Input
                              name="topicName"
                              placeholder="Topic name"
                              required
                              autoFocus
                              className="h-8"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              className="h-8 w-full sm:w-auto"
                            >
                              Add
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveSubjectForTopic(null)}
                              className="h-8 w-full sm:w-auto"
                            >
                              Cancel
                            </Button>
                          </form>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActiveSubjectForTopic(subject.$id!)
                            }
                            className="w-full"
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Add Topic
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
