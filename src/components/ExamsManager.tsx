import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import databaseService, { Exam, Subject } from "../services/databaseService";
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
import { Badge } from "../app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";
import { Checkbox } from "../app/components/ui/checkbox";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  Pencil,
} from "lucide-react";
import {
  format,
  differenceInCalendarDays,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";

export const ExamsManager: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editArchived, setEditArchived] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "past">(
    "all",
  );
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [sortOption, setSortOption] = useState("examDate");
  const [filterArchived, setFilterArchived] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [bulkDate, setBulkDate] = useState("");
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(
    new Date(),
  );

  const parseLocalDate = (dateString: string) => parseISO(dateString);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterArchived]);

  useEffect(() => {
    setEditArchived(Boolean(editingExam?.archived));
  }, [editingExam]);

  useEffect(() => {
    setSelectedExamIds([]);
  }, [
    searchQuery,
    filterSubject,
    filterStatus,
    filterFrom,
    filterTo,
    sortOption,
    filterArchived,
  ]);

  const loadData = async () => {
    try {
      const [examsData, subjectsData] = await Promise.all([
        databaseService.getExams(user!.$id, {
          includeArchived: filterArchived,
        }),
        databaseService.getSubjects(user!.$id),
      ]);
      setExams(examsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error loading exams:", error);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const examName = formData.get("examName") as string;
    const subjectId = (formData.get("subjectId") as string) || "";
    const examDate = formData.get("examDate") as string;
    const location = (formData.get("location") as string) || "";
    const reminderTime = (formData.get("reminderTime") as string) || "";
    const notes = (formData.get("notes") as string) || "";

    if (!subjectId) {
      toast.error("Please select a subject");
      return;
    }

    try {
      const newExam = await databaseService.createExam({
        userId: user!.$id,
        examName,
        subjectId,
        examDate,
        location,
        reminderTime,
        notes,
        archived: false,
      });
      setExams(
        [...exams, newExam].sort(
          (a, b) =>
            new Date(a.examDate).getTime() - new Date(b.examDate).getTime(),
        ),
      );
      setIsDialogOpen(false);
      toast.success("Exam added successfully");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error("Failed to add exam");
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await databaseService.deleteExam(examId);
      setExams(exams.filter((e) => e.$id !== examId));
      toast.success("Exam deleted");
    } catch (error) {
      console.error("Error deleting exam:", error);
      toast.error("Failed to delete exam");
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setIsEditDialogOpen(true);
  };

  const handleUpdateExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExam?.$id) return;

    const formData = new FormData(e.currentTarget);
    const examName = formData.get("examName") as string;
    const subjectId = (formData.get("subjectId") as string) || "";
    const examDate = formData.get("examDate") as string;
    const location = (formData.get("location") as string) || "";
    const reminderTime = (formData.get("reminderTime") as string) || "";
    const notes = (formData.get("notes") as string) || "";
    const archived = formData.get("archived") === "true";

    if (!subjectId) {
      toast.error("Please select a subject");
      return;
    }

    try {
      const updated = await databaseService.updateExam(editingExam.$id, {
        examName,
        subjectId,
        examDate,
        location,
        reminderTime,
        notes,
        archived,
      });
      setExams(
        exams
          .map((e) => (e.$id === updated.$id ? updated : e))
          .sort(
            (a, b) =>
              new Date(a.examDate).getTime() - new Date(b.examDate).getTime(),
          ),
      );
      setEditingExam(null);
      setIsEditDialogOpen(false);
      toast.success("Exam updated");
    } catch (error) {
      console.error("Error updating exam:", error);
      toast.error("Failed to update exam");
    }
  };

  const getExamStatus = (examDate: string) => {
    const today = startOfDay(new Date());
    const exam = startOfDay(parseLocalDate(examDate));
    const daysUntil = differenceInCalendarDays(exam, today);

    if (daysUntil < 0) {
      return { label: "Past", variant: "secondary" as const, urgent: false };
    } else if (daysUntil === 0) {
      return { label: "Today", variant: "default" as const, urgent: true };
    } else if (daysUntil === 1) {
      return {
        label: "Tomorrow",
        variant: "destructive" as const,
        urgent: true,
      };
    } else if (daysUntil <= 3) {
      return {
        label: `${daysUntil} days`,
        variant: "destructive" as const,
        urgent: true,
      };
    } else if (daysUntil <= 7) {
      return {
        label: `${daysUntil} days`,
        variant: "default" as const,
        urgent: false,
      };
    } else {
      return {
        label: `${daysUntil} days`,
        variant: "secondary" as const,
        urgent: false,
      };
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const isArchived = exam.archived ?? false;
      if (!filterArchived && isArchived) return false;

      const status = getExamStatus(exam.examDate);
      const statusMatch =
        filterStatus === "all" ||
        (filterStatus === "upcoming" && status.label !== "Past") ||
        (filterStatus === "past" && status.label === "Past");

      const subjectMatch =
        filterSubject === "all" || exam.subjectId === filterSubject;

      const fromMatch = filterFrom
        ? parseLocalDate(exam.examDate) >= parseLocalDate(filterFrom)
        : true;
      const toMatch = filterTo
        ? parseLocalDate(exam.examDate) <= parseLocalDate(filterTo)
        : true;

      const subjectName =
        subjects.find((s) => s.$id === exam.subjectId)?.name || "";
      const searchText =
        `${exam.examName} ${exam.notes || ""} ${exam.location || ""} ${subjectName}`.toLowerCase();
      const searchMatch = normalizedQuery
        ? searchText.includes(normalizedQuery)
        : true;

      return statusMatch && subjectMatch && fromMatch && toMatch && searchMatch;
    });
  }, [
    exams,
    filterArchived,
    filterStatus,
    filterSubject,
    filterFrom,
    filterTo,
    normalizedQuery,
    subjects,
  ]);

  const sortedExams = useMemo(() => {
    return [...filteredExams].sort((a, b) => {
      if (sortOption === "urgency") {
        return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      }
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    });
  }, [filteredExams, sortOption]);

  const visibleExamIds = sortedExams.map((exam) => exam.$id || "");
  const isAllSelected =
    visibleExamIds.length > 0 &&
    visibleExamIds.every((id) => selectedExamIds.includes(id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedExamIds(visibleExamIds);
    } else {
      setSelectedExamIds([]);
    }
  };

  const toggleExamSelection = (examId: string) => {
    setSelectedExamIds((prev) =>
      prev.includes(examId)
        ? prev.filter((id) => id !== examId)
        : [...prev, examId],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedExamIds.length === 0) return;
    if (!confirm("Delete selected exams?")) return;

    try {
      await Promise.all(
        selectedExamIds.map((examId) => databaseService.deleteExam(examId)),
      );
      setExams(exams.filter((e) => !selectedExamIds.includes(e.$id || "")));
      setSelectedExamIds([]);
      toast.success("Exams deleted");
    } catch (error) {
      console.error("Error deleting exams:", error);
      toast.error("Failed to delete exams");
    }
  };

  const handleBulkReschedule = async () => {
    if (!bulkDate || selectedExamIds.length === 0) return;

    try {
      await Promise.all(
        selectedExamIds.map((examId) =>
          databaseService.updateExam(examId, { examDate: bulkDate }),
        ),
      );
      setExams(
        exams.map((exam) =>
          selectedExamIds.includes(exam.$id || "")
            ? { ...exam, examDate: bulkDate }
            : exam,
        ),
      );
      setBulkDate("");
      setSelectedExamIds([]);
      toast.success("Exams rescheduled");
    } catch (error) {
      console.error("Error rescheduling exams:", error);
      toast.error("Failed to reschedule exams");
    }
  };

  const handleBulkArchive = async (archived: boolean) => {
    if (selectedExamIds.length === 0) return;

    try {
      await Promise.all(
        selectedExamIds.map((examId) =>
          databaseService.updateExam(examId, { archived }),
        ),
      );
      setExams(
        exams.map((exam) =>
          selectedExamIds.includes(exam.$id || "")
            ? { ...exam, archived }
            : exam,
        ),
      );
      setSelectedExamIds([]);
      toast.success(archived ? "Exams archived" : "Exams restored");
    } catch (error) {
      console.error("Error archiving exams:", error);
      toast.error("Failed to update exams");
    }
  };

  const today = startOfDay(new Date());
  const upcomingExams = sortedExams.filter(
    (e) => startOfDay(parseLocalDate(e.examDate)) >= today,
  );
  const pastExams = sortedExams.filter(
    (e) => startOfDay(parseLocalDate(e.examDate)) < today,
  );

  const calendarExams = calendarDate
    ? sortedExams.filter((exam) =>
        isSameDay(parseLocalDate(exam.examDate), calendarDate),
      )
    : [];

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
              Exam Planner
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">Exams</h1>
            <p className="text-muted-foreground">
              Stay ahead of your test schedule with clarity.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{exams.length} total</Badge>
              <Badge variant="outline">{upcomingExams.length} upcoming</Badge>
              <Badge variant="outline">{pastExams.length} past</Badge>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Exam</DialogTitle>
                <DialogDescription>
                  Schedule an upcoming examination
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="examName">Exam Name</Label>
                  <Input
                    id="examName"
                    name="examName"
                    placeholder="Midterm Exam"
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
                  <Label htmlFor="examDate">Exam Date</Label>
                  <Input
                    id="examDate"
                    name="examDate"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="Room 201" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Reminder Time</Label>
                  <Input id="reminderTime" name="reminderTime" type="time" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" />
                </div>
                <Button type="submit" className="w-full">
                  Add Exam
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>Update your exam details</DialogDescription>
          </DialogHeader>
          {editingExam && (
            <form onSubmit={handleUpdateExam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-examName">Exam Name</Label>
                <Input
                  id="edit-examName"
                  name="examName"
                  defaultValue={editingExam.examName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subjectId">Subject</Label>
                <Select
                  name="subjectId"
                  defaultValue={editingExam.subjectId}
                  required
                >
                  <SelectTrigger id="edit-subjectId">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label htmlFor="edit-examDate">Exam Date</Label>
                <Input
                  id="edit-examDate"
                  name="examDate"
                  type="date"
                  defaultValue={editingExam.examDate}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  name="location"
                  defaultValue={editingExam.location || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reminderTime">Reminder Time</Label>
                <Input
                  id="edit-reminderTime"
                  name="reminderTime"
                  type="time"
                  defaultValue={editingExam.reminderTime || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editingExam.notes || ""}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Archived</p>
                  <p className="text-xs text-muted-foreground">
                    Hide from upcoming list
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
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="exam-search">Search</Label>
            <Input
              id="exam-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, notes, location"
            />
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
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-from">From</Label>
            <Input
              id="exam-from"
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-to">To</Label>
            <Input
              id="exam-to"
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Sort</Label>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="examDate">Exam Date</SelectItem>
                <SelectItem value="urgency">Urgency</SelectItem>
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
              onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
            />
            <span className="text-sm text-muted-foreground">
              {selectedExamIds.length} selected
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <Input
              type="date"
              value={bulkDate}
              onChange={(e) => setBulkDate(e.target.value)}
              className="w-full sm:w-40"
            />
            <Button
              variant="outline"
              onClick={handleBulkReschedule}
              disabled={!bulkDate || selectedExamIds.length === 0}
              className="w-full sm:w-auto"
            >
              Reschedule
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkArchive(true)}
              disabled={selectedExamIds.length === 0}
              className="w-full sm:w-auto"
            >
              Archive
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkArchive(false)}
              disabled={selectedExamIds.length === 0}
              className="w-full sm:w-auto"
            >
              Restore
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={selectedExamIds.length === 0}
              className="w-full sm:w-auto"
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="w-full flex-wrap justify-start sm:justify-center bg-white/70 dark:bg-slate-900/60">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Exams</h2>
            {upcomingExams.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming exams scheduled
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingExams.map((exam) => {
                  const subject = subjects.find(
                    (s) => s.$id === exam.subjectId,
                  );
                  const status = getExamStatus(exam.examDate);

                  return (
                    <Card
                      key={exam.$id}
                      className={`overflow-hidden transition-all ${
                        status.urgent ? "border-destructive shadow-lg" : ""
                      }`}
                    >
                      <div
                        className="h-2"
                        style={{ backgroundColor: subject?.color || "#gray" }}
                      />
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {status.urgent && (
                                <AlertCircle className="h-5 w-5 text-destructive" />
                              )}
                              {exam.examName}
                            </CardTitle>
                            <CardDescription className="mt-2">
                              {subject?.name}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedExamIds.includes(exam.$id || "")}
                              onCheckedChange={() =>
                                toggleExamSelection(exam.$id || "")
                              }
                            />
                            {exam.archived && <Badge>Archived</Badge>}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditExam(exam)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExam(exam.$id!)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(
                              new Date(exam.examDate),
                              "EEEE, MMMM d, yyyy",
                            )}
                          </span>
                        </div>
                        {exam.location && (
                          <div className="text-sm text-muted-foreground">
                            Location: {exam.location}
                          </div>
                        )}
                        {exam.reminderTime && (
                          <div className="text-sm text-muted-foreground">
                            Reminder: {exam.reminderTime}
                          </div>
                        )}
                        {exam.notes && (
                          <div className="text-sm text-muted-foreground">
                            Notes: {exam.notes}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        {status.urgent && (
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium text-destructive">
                              Exam is coming soon! Make sure to prepare.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {pastExams.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Past Exams</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastExams.map((exam) => {
                  const subject = subjects.find(
                    (s) => s.$id === exam.subjectId,
                  );

                  return (
                    <Card key={exam.$id} className="opacity-60">
                      <div
                        className="h-2"
                        style={{ backgroundColor: subject?.color || "#gray" }}
                      />
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <CardTitle>{exam.examName}</CardTitle>
                            <CardDescription className="mt-2">
                              {subject?.name}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedExamIds.includes(exam.$id || "")}
                              onCheckedChange={() =>
                                toggleExamSelection(exam.$id || "")
                              }
                            />
                            {exam.archived && <Badge>Archived</Badge>}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditExam(exam)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExam(exam.$id!)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(exam.examDate), "MMMM d, yyyy")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
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
                  {calendarExams.length} exams scheduled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {calendarExams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No exams scheduled for this date.
                  </p>
                ) : (
                  calendarExams.map((exam) => {
                    const subject = subjects.find(
                      (s) => s.$id === exam.subjectId,
                    );
                    return (
                      <div
                        key={exam.$id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{exam.examName}</p>
                          <p className="text-xs text-muted-foreground">
                            {subject?.name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditExam(exam)}
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
