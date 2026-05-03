import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import databaseService, { Exam, Subject } from "../services/databaseService";
import { Button } from "../app/components/ui/button";
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
import { Badge } from "../app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../app/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Calendar, AlertCircle, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export const ExamsManager: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [examsData, subjectsData] = await Promise.all([
        databaseService.getExams(user!.$id),
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

  const getExamStatus = (examDate: string) => {
    const today = new Date();
    const exam = new Date(examDate);
    const daysUntil = differenceInDays(exam, today);

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

  const upcomingExams = exams.filter((e) => new Date(e.examDate) >= new Date());
  const pastExams = exams.filter((e) => new Date(e.examDate) < new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams</h1>
          <p className="text-muted-foreground">
            Track your upcoming examinations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
              <Button type="submit" className="w-full">
                Add Exam
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Exams */}
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
              const subject = subjects.find((s) => s.$id === exam.subjectId);
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
                    <div className="flex items-start justify-between">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExam(exam.$id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(exam.examDate), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
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

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Exams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastExams.map((exam) => {
              const subject = subjects.find((s) => s.$id === exam.subjectId);

              return (
                <Card key={exam.$id} className="opacity-60">
                  <div
                    className="h-2"
                    style={{ backgroundColor: subject?.color || "#gray" }}
                  />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{exam.examName}</CardTitle>
                        <CardDescription className="mt-2">
                          {subject?.name}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExam(exam.$id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
    </div>
  );
};
