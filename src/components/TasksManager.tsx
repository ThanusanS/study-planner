import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import databaseService, { Task, Subject } from "../services/databaseService";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Label } from "../app/components/ui/label";
import { Textarea } from "../app/components/ui/textarea";
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
import { Switch } from "../app/components/ui/switch";
import { Calendar as CalendarPicker } from "../app/components/ui/calendar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../app/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";
import { Badge } from "../app/components/ui/badge";
import { Checkbox } from "../app/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, Filter, Pencil } from "lucide-react";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  parseISO,
} from "date-fns";

export const TasksManager: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editArchived, setEditArchived] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [filterArchived, setFilterArchived] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortOption, setSortOption] = useState<
    "dueDate" | "createdAt" | "priority"
  >("dueDate");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkDueDate, setBulkDueDate] = useState("");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(
    new Date(),
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const parseLocalDate = (dateString: string) => parseISO(dateString);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterArchived]);

  useEffect(() => {
    setEditArchived(Boolean(editingTask?.archived));
  }, [editingTask]);

  useEffect(() => {
    setSelectedTaskIds([]);
  }, [
    searchQuery,
    filterStatus,
    filterSubject,
    filterPriority,
    filterDateFrom,
    filterDateTo,
    sortOption,
    filterArchived,
  ]);

  const loadData = async () => {
    try {
      const [tasksData, subjectsData] = await Promise.all([
        databaseService.getTasks(user!.$id, 500, {
          includeArchived: filterArchived,
        }),
        databaseService.getSubjects(user!.$id),
      ]);
      setTasks(tasksData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const parseTags = (value: string) =>
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(", ");

  const getNextDueDate = (dueDate: string, repeat: Task["repeat"]) => {
    const date = new Date(dueDate);
    const nextDate =
      repeat === "daily"
        ? addDays(date, 1)
        : repeat === "weekly"
          ? addWeeks(date, 1)
          : repeat === "monthly"
            ? addMonths(date, 1)
            : null;
    return nextDate ? format(nextDate, "yyyy-MM-dd") : null;
  };

  const createRecurringTask = async (task: Task) => {
    if (!task.repeat || task.repeat === "none") return;
    const nextDueDate = getNextDueDate(task.dueDate, task.repeat);
    if (!nextDueDate) return;

    const newTask = await databaseService.createTask({
      userId: task.userId,
      subjectId: task.subjectId,
      title: task.title,
      dueDate: nextDueDate,
      reminderTime: task.reminderTime || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
      priority: task.priority,
      tags: task.tags || "",
      notes: task.notes,
      archived: false,
      completedAt: undefined,
      repeat: task.repeat,
    });

    setTasks((prev) => [newTask, ...prev]);
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const subjectId = formData.get("subjectId") as string;
    const dueDate = formData.get("dueDate") as string;
    const reminderTime = formData.get("reminderTime") as string;
    const priority = (formData.get("priority") as Task["priority"]) || "medium";
    const tags = parseTags((formData.get("tags") as string) || "");
    const notes = (formData.get("notes") as string) || "";
    const repeat = (formData.get("repeat") as Task["repeat"]) || "none";

    try {
      const newTask = await databaseService.createTask({
        userId: user!.$id,
        title,
        subjectId,
        dueDate,
        reminderTime: reminderTime || undefined,
        status: "pending",
        createdAt: new Date().toISOString(),
        priority,
        tags,
        notes,
        archived: false,
        completedAt: undefined,
        repeat,
      });
      setTasks([newTask, ...tasks]);
      setIsDialogOpen(false);
      toast.success("Task created successfully");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTask?.$id) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const subjectId = formData.get("subjectId") as string;
    const dueDate = formData.get("dueDate") as string;
    const reminderTime = formData.get("reminderTime") as string;
    const status = formData.get("status") as "pending" | "completed";
    const priority = (formData.get("priority") as Task["priority"]) || "medium";
    const tags = parseTags((formData.get("tags") as string) || "");
    const notes = (formData.get("notes") as string) || "";
    const repeat = (formData.get("repeat") as Task["repeat"]) || "none";
    const archived = formData.get("archived") === "true";
    const wasCompleted = editingTask.status === "completed";
    const completedAt =
      status === "completed"
        ? editingTask.completedAt || new Date().toISOString()
        : undefined;

    try {
      const updated = await databaseService.updateTask(editingTask.$id, {
        title,
        subjectId,
        dueDate,
        reminderTime: reminderTime || undefined,
        status,
        priority,
        tags,
        notes,
        repeat,
        archived,
        completedAt,
      });
      setTasks(tasks.map((t) => (t.$id === updated.$id ? updated : t)));
      setIsEditDialogOpen(false);
      setEditingTask(null);
      if (!wasCompleted && status === "completed") {
        await createRecurringTask(updated);
      }
      toast.success("Task updated");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

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
      if (newStatus === "completed") {
        await createRecurringTask(updated);
      }
      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await databaseService.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.$id !== taskId));
      toast.success("Task deleted");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const toggleSelectAll = (checked: boolean, ids: string[]) => {
    if (checked) {
      setSelectedTaskIds(ids);
    } else {
      setSelectedTaskIds([]);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const handleBulkComplete = async () => {
    if (selectedTaskIds.length === 0) return;

    try {
      const now = new Date().toISOString();
      const updatedTasks = await Promise.all(
        tasks
          .filter((task) => selectedTaskIds.includes(task.$id || ""))
          .map(async (task) => {
            if (task.status === "completed") return task;
            const updated = await databaseService.updateTask(task.$id!, {
              status: "completed",
              completedAt: now,
            });
            await createRecurringTask(updated);
            return updated;
          }),
      );

      setTasks(
        tasks.map((task) =>
          selectedTaskIds.includes(task.$id || "")
            ? updatedTasks.find((t) => t.$id === task.$id) || task
            : task,
        ),
      );
      setSelectedTaskIds([]);
      toast.success("Tasks completed");
    } catch (error) {
      console.error("Error completing tasks:", error);
      toast.error("Failed to complete tasks");
    }
  };

  const handleBulkArchive = async (archived: boolean) => {
    if (selectedTaskIds.length === 0) return;

    try {
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          databaseService.updateTask(taskId, { archived }),
        ),
      );
      setTasks(
        tasks.map((task) =>
          selectedTaskIds.includes(task.$id || "")
            ? { ...task, archived }
            : task,
        ),
      );
      setSelectedTaskIds([]);
      toast.success(archived ? "Tasks archived" : "Tasks restored");
    } catch (error) {
      console.error("Error archiving tasks:", error);
      toast.error("Failed to update tasks");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!confirm("Delete selected tasks?")) return;

    try {
      await Promise.all(
        selectedTaskIds.map((taskId) => databaseService.deleteTask(taskId)),
      );
      setTasks(
        tasks.filter((task) => !selectedTaskIds.includes(task.$id || "")),
      );
      setSelectedTaskIds([]);
      toast.success("Tasks deleted");
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks");
    }
  };

  const handleBulkReschedule = async () => {
    if (!bulkDueDate || selectedTaskIds.length === 0) return;

    try {
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          databaseService.updateTask(taskId, { dueDate: bulkDueDate }),
        ),
      );
      setTasks(
        tasks.map((task) =>
          selectedTaskIds.includes(task.$id || "")
            ? { ...task, dueDate: bulkDueDate }
            : task,
        ),
      );
      setBulkDueDate("");
      setSelectedTaskIds([]);
      toast.success("Tasks rescheduled");
    } catch (error) {
      console.error("Error rescheduling tasks:", error);
      toast.error("Failed to reschedule tasks");
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const subjectMap = useMemo(
    () =>
      subjects.reduce(
        (acc, subject) => {
          acc[subject.$id || ""] = subject;
          return acc;
        },
        {} as Record<string, Subject>,
      ),
    [subjects],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const isArchived = task.archived ?? false;
      if (!filterArchived && isArchived) return false;

      const statusMatch =
        filterStatus === "all" || task.status === filterStatus;
      const subjectMatch =
        filterSubject === "all" || task.subjectId === filterSubject;
      const priorityMatch =
        filterPriority === "all" || task.priority === filterPriority;

      const fromMatch = filterDateFrom
        ? parseLocalDate(task.dueDate) >= parseLocalDate(filterDateFrom)
        : true;
      const toMatch = filterDateTo
        ? parseLocalDate(task.dueDate) <= parseLocalDate(filterDateTo)
        : true;

      const subjectName = subjectMap[task.subjectId]?.name || "";
      const tagsText = (task.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(" ");
      const searchText =
        `${task.title} ${task.notes || ""} ${tagsText} ${subjectName}`.toLowerCase();
      const searchMatch = normalizedQuery
        ? searchText.includes(normalizedQuery)
        : true;

      return (
        statusMatch &&
        subjectMatch &&
        priorityMatch &&
        fromMatch &&
        toMatch &&
        searchMatch
      );
    });
  }, [
    tasks,
    filterArchived,
    filterStatus,
    filterSubject,
    filterPriority,
    filterDateFrom,
    filterDateTo,
    normalizedQuery,
    subjectMap,
  ]);

  const sortedTasks = useMemo(() => {
    const priorityRank: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };
    return [...filteredTasks].sort((a, b) => {
      if (sortOption === "priority") {
        return (
          (priorityRank[b.priority || "medium"] || 0) -
          (priorityRank[a.priority || "medium"] || 0)
        );
      }
      if (sortOption === "createdAt") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [filteredTasks, sortOption]);

  const groupedTasks = sortedTasks.reduce(
    (acc, task) => {
      const date = task.dueDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(task);
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  const calendarTasks = calendarDate
    ? sortedTasks.filter((task) =>
        isSameDay(parseLocalDate(task.dueDate), calendarDate),
      )
    : [];

  const visibleTaskIds = sortedTasks.map((task) => task.$id || "");
  const isAllSelected =
    visibleTaskIds.length > 0 &&
    visibleTaskIds.every((id) => selectedTaskIds.includes(id));

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
              Task Center
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Plan your study workload and stay on track.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{tasks.length} total</Badge>
              <Badge variant="outline">
                {tasks.filter((task) => task.status === "completed").length}{" "}
                done
              </Badge>
              <Badge variant="outline">
                {tasks.filter((task) => task.status === "pending").length}{" "}
                pending
              </Badge>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new study task to your planner
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Complete Chapter 5 exercises"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject</Label>
                  <Select name="subjectId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.$id} value={subject.$id!}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Reminder Time (Optional)</Label>
                  <Input id="reminderTime" name="reminderTime" type="time" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" name="tags" placeholder="exam, revision" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add details or links"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeat">Repeat</Label>
                  <Select name="repeat" defaultValue="none">
                    <SelectTrigger id="repeat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update your study task details
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingTask.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Select
                  name="subjectId"
                  defaultValue={editingTask.subjectId}
                  required
                >
                  <SelectTrigger id="edit-subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.$id} value={subject.$id!}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  name="dueDate"
                  type="date"
                  defaultValue={editingTask.dueDate}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reminderTime">
                  Reminder Time (Optional)
                </Label>
                <Input
                  id="edit-reminderTime"
                  name="reminderTime"
                  type="time"
                  defaultValue={editingTask.reminderTime || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  name="priority"
                  defaultValue={editingTask.priority || "medium"}
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags</Label>
                <Input
                  id="edit-tags"
                  name="tags"
                  defaultValue={(editingTask.tags || []).join(", ")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editingTask.notes || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-repeat">Repeat</Label>
                <Select
                  name="repeat"
                  defaultValue={editingTask.repeat || "none"}
                >
                  <SelectTrigger id="edit-repeat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Archived</p>
                  <p className="text-xs text-muted-foreground">
                    Hide from active task lists
                  </p>
                </div>
                <Switch
                  checked={editArchived}
                  onCheckedChange={setEditArchived}
                />
                <input
                  type="hidden"
                  name="archived"
                  value={String(editArchived)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  name="status"
                  defaultValue={editingTask.status}
                  required
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="task-search">Search</Label>
            <Input
              id="task-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, notes, tags"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filterStatus}
              onValueChange={(value: any) => setFilterStatus(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.$id} value={subject.$id!}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-from">From</Label>
            <Input
              id="date-from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-to">To</Label>
            <Input
              id="date-to"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Sort</Label>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <Label>Show archived</Label>
              <div className="mt-2">
                <Switch
                  checked={filterArchived}
                  onCheckedChange={setFilterArchived}
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
              onCheckedChange={(checked) =>
                toggleSelectAll(Boolean(checked), visibleTaskIds)
              }
            />
            <span className="text-sm text-muted-foreground">
              {selectedTaskIds.length} selected
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="date"
              value={bulkDueDate}
              onChange={(e) => setBulkDueDate(e.target.value)}
              className="w-full sm:w-40"
            />
            <Button
              variant="outline"
              onClick={handleBulkReschedule}
              disabled={!bulkDueDate || selectedTaskIds.length === 0}
            >
              Reschedule
            </Button>
            <Button
              variant="outline"
              onClick={handleBulkComplete}
              disabled={selectedTaskIds.length === 0}
            >
              Complete
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkArchive(true)}
              disabled={selectedTaskIds.length === 0}
            >
              Archive
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkArchive(false)}
              disabled={selectedTaskIds.length === 0}
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedTaskIds.length === 0}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="w-full flex-wrap justify-start sm:justify-center bg-white/70 dark:bg-slate-900/60">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {Object.keys(groupedTasks).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tasks found. Create your first task to get started!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks)
                .sort(
                  ([dateA], [dateB]) =>
                    new Date(dateA).getTime() - new Date(dateB).getTime(),
                )
                .map(([date, dateTasks]) => {
                  const dateObj = new Date(date);
                  const isToday =
                    dateObj.toDateString() === new Date().toDateString();
                  const isPast = dateObj < new Date() && !isToday;

                  return (
                    <Card key={date}>
                      <CardHeader>
                        <CardTitle className="flex flex-wrap items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {format(dateObj, "EEEE, MMMM d, yyyy")}
                          {isToday && <Badge>Today</Badge>}
                          {isPast && (
                            <Badge variant="destructive">Overdue</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {
                            dateTasks.filter((t) => t.status === "completed")
                              .length
                          }{" "}
                          of {dateTasks.length} completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {dateTasks.map((task) => {
                          const subject = subjects.find(
                            (s) => s.$id === task.subjectId,
                          );
                          return (
                            <div
                              key={task.$id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border hover:bg-accent transition-colors group"
                            >
                              <div className="flex items-center gap-4 flex-1 w-full">
                                <Checkbox
                                  checked={selectedTaskIds.includes(
                                    task.$id || "",
                                  )}
                                  onCheckedChange={() =>
                                    toggleTaskSelection(task.$id || "")
                                  }
                                />
                                <Checkbox
                                  checked={task.status === "completed"}
                                  onCheckedChange={() => handleToggleTask(task)}
                                />
                                <div className="flex-1">
                                  <p
                                    className={`font-medium ${
                                      task.status === "completed"
                                        ? "line-through text-muted-foreground"
                                        : ""
                                    }`}
                                  >
                                    {task.title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {subject && (
                                      <Badge
                                        variant="outline"
                                        style={{
                                          borderColor: subject.color,
                                          color: subject.color,
                                        }}
                                      >
                                        {subject.name}
                                      </Badge>
                                    )}
                                    {task.priority && (
                                      <Badge variant="secondary">
                                        {task.priority}
                                      </Badge>
                                    )}
                                    {task.archived && (
                                      <Badge variant="outline">Archived</Badge>
                                    )}
                                    {(task.tags || "")
                                      .split(",")
                                      .map((tag) => tag.trim())
                                      .filter(Boolean)
                                      .map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                          {tag}
                                        </Badge>
                                      ))}
                                    {task.repeat && task.repeat !== "none" && (
                                      <Badge variant="outline">
                                        {task.repeat}
                                      </Badge>
                                    )}
                                    {task.reminderTime && (
                                      <span className="text-xs text-muted-foreground">
                                        Reminder: {task.reminderTime}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 self-end sm:self-auto">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditTask(task)}
                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTask(task.$id!)}
                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="py-4 overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) =>
                          toggleSelectAll(Boolean(checked), visibleTaskIds)
                        }
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => {
                    const subject = subjects.find(
                      (s) => s.$id === task.subjectId,
                    );
                    return (
                      <TableRow key={task.$id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTaskIds.includes(task.$id || "")}
                            onCheckedChange={() =>
                              toggleTaskSelection(task.$id || "")
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={task.status === "completed"}
                              onCheckedChange={() => handleToggleTask(task)}
                            />
                            <span
                              className={
                                task.status === "completed"
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }
                            >
                              {task.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{subject?.name || "-"}</TableCell>
                        <TableCell>{task.dueDate}</TableCell>
                        <TableCell>{task.priority || "medium"}</TableCell>
                        <TableCell>
                          {task.status}
                          {task.archived ? " (archived)" : ""}
                        </TableCell>
                        <TableCell>{task.tags || ""}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTask(task)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task.$id!)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <Card>
              <CardContent className="py-4">
                <CalendarPicker
                  mode="single"
                  selected={calendarDate}
                  onSelect={setCalendarDate}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {calendarDate
                    ? format(calendarDate, "EEEE, MMMM d, yyyy")
                    : "Select a date"}
                </CardTitle>
                <CardDescription>
                  {calendarTasks.length} tasks scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {calendarTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks scheduled for this date.
                  </p>
                ) : (
                  calendarTasks.map((task) => {
                    const subject = subjects.find(
                      (s) => s.$id === task.subjectId,
                    );
                    return (
                      <div
                        key={task.$id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={task.status === "completed"}
                            onCheckedChange={() => handleToggleTask(task)}
                          />
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {subject && <span>{subject.name}</span>}
                              {task.priority && <span>{task.priority}</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTask(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
