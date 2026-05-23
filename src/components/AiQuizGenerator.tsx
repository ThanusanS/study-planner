import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Textarea } from "../app/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../app/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../app/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../app/components/ui/alert-dialog";
import {
  Loader2,
  Sparkles,
  Download,
  Trash2,
  RotateCcw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { evaluateQuiz, generateQuiz } from "../services/aiQuizService";
import databaseService, { QuizHistory } from "../services/databaseService";
import planService, { UserPlan } from "../services/planService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

export const AiQuizGenerator: React.FC = () => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<UserPlan | null>(null);

  const [mode, setMode] = useState("generate");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [questionCount, setQuestionCount] = useState(8);
  const [questionType, setQuestionType] = useState<"mcq" | "short" | "mixed">(
    "mixed",
  );
  const [quizText, setQuizText] = useState("");
  const [studentAnswers, setStudentAnswers] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizHistory[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editQuestionCount, setEditQuestionCount] = useState(8);
  const [editQuestionType, setEditQuestionType] =
    useState<QuizHistory["questionType"]>("mixed");
  const [editQuizContent, setEditQuizContent] = useState("");
  const [quizPendingDelete, setQuizPendingDelete] =
    useState<QuizHistory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load quizzes and active plan on component mount
  useEffect(() => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (resolvedUserId) {
      loadQuizzes();
      planService.getUserPlan(resolvedUserId).then(setActivePlan);
    }

    const handlePlanChange = (e: any) => {
      setActivePlan(e.detail);
    };

    window.addEventListener("studyPlanChanged", handlePlanChange);
    return () => {
      window.removeEventListener("studyPlanChanged", handlePlanChange);
    };
  }, [user]);

  const loadQuizzes = async () => {
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId) return;
    setQuizzesLoading(true);
    try {
      const userQuizzes = await databaseService.getQuizzes(resolvedUserId);
      setQuizzes(userQuizzes);
    } catch (err) {
      console.error("Failed to load quiz history:", err);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const mapDifficulty = (input: string): "easy" | "medium" | "hard" => {
    const normalized = input.trim().toLowerCase();
    if (normalized === "beginner" || normalized === "easy") return "easy";
    if (normalized === "advanced" || normalized === "hard") return "hard";
    return "medium"; // "intermediate" or any other value defaults to medium
  };

  const saveQuiz = async (quizContent?: string) => {
    const contentToSave = quizContent || result;
    if (!user?.id || !contentToSave) return;

    try {
      const newQuiz: Omit<QuizHistory, "$id"> = {
        userId: user.id,
        topic: topic.trim(),
        difficulty: mapDifficulty(difficulty),
        questionCount,
        questionType,
        quizContent: contentToSave,
        createdAt: new Date().toISOString(),
        attempts: 0,
      };

      await databaseService.createQuiz(newQuiz);
      toast.success("Quiz saved to history!");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadQuizzes();
    } catch (err) {
      console.error("Save quiz error:", err);
      const message = err instanceof Error ? err.message : "Failed to save quiz.";
      toast.error(message);
      setError(message);
    }
  };

  const requestDeleteQuiz = (quiz: QuizHistory) => {
    setQuizPendingDelete(quiz);
  };

  const undoDeleteQuiz = async (quiz: QuizHistory) => {
    try {
      const restoredQuiz: Omit<QuizHistory, "$id"> = {
        userId: quiz.userId,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        questionCount: quiz.questionCount,
        questionType: quiz.questionType,
        quizContent: quiz.quizContent,
        createdAt: quiz.createdAt,
        attempts: quiz.attempts || 0,
      };
      await databaseService.createQuiz(restoredQuiz);
      await loadQuizzes();
      toast.success("Quiz restored to history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore quiz.");
    }
  };

  const confirmDeleteQuiz = async () => {
    if (!quizPendingDelete?.$id) return;

    const deletedQuiz = quizPendingDelete;
    setDeleteLoading(true);
    setQuizPendingDelete(null);

    try {
      setQuizzes((prev) => prev.filter((quiz) => quiz.$id !== deletedQuiz.$id));
      if (editingQuizId === deletedQuiz.$id) {
        cancelEditQuiz();
      }
      await databaseService.deleteQuiz(deletedQuiz.$id);
      toast.success("Quiz deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            void undoDeleteQuiz(deletedQuiz);
          },
        },
      });
    } catch (err) {
      await loadQuizzes();
      setError(err instanceof Error ? err.message : "Failed to delete quiz.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const startEditQuiz = (quiz: QuizHistory) => {
    if (!quiz.$id) return;
    setEditingQuizId(quiz.$id);
    setEditTopic(quiz.topic);
    setEditDifficulty(quiz.difficulty);
    setEditQuestionCount(quiz.questionCount);
    setEditQuestionType(quiz.questionType);
    setEditQuizContent(quiz.quizContent);
  };

  const cancelEditQuiz = () => {
    setEditingQuizId(null);
    setEditTopic("");
    setEditDifficulty("");
    setEditQuestionCount(8);
    setEditQuestionType("mixed");
    setEditQuizContent("");
  };

  const updateQuizHistory = async () => {
    if (!editingQuizId) return;
    if (!editTopic.trim() || !editQuizContent.trim()) {
      setError("Topic and quiz content are required to update quiz history.");
      return;
    }

    try {
      await databaseService.updateQuiz(editingQuizId, {
        topic: editTopic.trim(),
        difficulty: mapDifficulty(editDifficulty),
        questionCount: editQuestionCount,
        questionType: editQuestionType,
        quizContent: editQuizContent.trim(),
      });
      cancelEditQuiz();
      await loadQuizzes();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quiz.");
    }
  };

  const retakeQuiz = (quiz: QuizHistory) => {
    setTopic(quiz.topic);
    setDifficulty(
      quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1),
    );
    setQuestionCount(quiz.questionCount);
    setQuestionType(quiz.questionType);
    setResult(quiz.quizContent);
    setMode("generate");
    // Update attempts
    databaseService.updateQuiz(quiz.$id || "", {
      attempts: (quiz.attempts || 0) + 1,
    });
  };

  const handleGenerate = async () => {
    setError(null);
    setResult(null);

    if (!topic.trim()) {
      setError("Please enter a quiz topic.");
      return;
    }

    const resolvedUserId = user?.$id || (user as any)?.id || user?.id || "test-user";
    const userPlan = await planService.getUserPlan(resolvedUserId);
    
    if (userPlan.aiCredits < 2) {
      setError("Insufficient AI Credits. Generating an AI Quiz requires 2 credits. Please navigate to 'Billing & Plans' in the sidebar to upgrade or refill your credits.");
      toast.error("Insufficient AI Credits!");
      return;
    }

    setLoading(true);
    try {
      const output = await generateQuiz({
        topic: topic.trim(),
        difficulty,
        questionCount,
        questionType,
      });
      const quizOutput = output || "No response returned from the model.";
      setResult(quizOutput);

      // Deduct credits on successful generation
      if (quizOutput !== "No response returned from the model.") {
        await planService.deductCredits(resolvedUserId, `AI Quiz - Topic: ${topic.trim()}`, 2);
        
        // Auto-save quiz to history after generation
        if (user?.id || (user as any)?.$id) {
          try {
            await saveQuiz(quizOutput);
            toast.success("Quiz generated and saved to history! (2 AI Credits deducted)");
          } catch {
            // Silently fail auto-save — user can still save manually
            console.warn("Auto-save failed, quiz can be saved manually.");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setError(null);
    setResult(null);

    if (!quizText.trim() || !studentAnswers.trim()) {
      setError("Please provide the quiz and the student's answers.");
      return;
    }

    setLoading(true);
    try {
      const output = await evaluateQuiz({
        quizText: quizText.trim(),
        studentAnswers: studentAnswers.trim(),
      });
      setResult(output || "No response returned from the model.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to evaluate answers.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    // Auto-populate quiz content when switching to evaluate tab
    if (newMode === "evaluate" && result) {
      setQuizText(result);
      setStudentAnswers(""); // Clear old student answers for new quiz
    }
  };

  const downloadPDF = () => {
    if (!result) return;

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginL = 18;
      const marginR = 18;
      const contentW = pageW - marginL - marginR;
      const isEval = mode === "evaluate";
      const title = isEval ? "Answer Evaluation" : "Quiz Paper";
      let y = 0;

      // ── Colors ──
      const blue = { r: 37, g: 99, b: 235 };
      const darkBlue = { r: 30, g: 58, b: 138 };
      const gray50 = { r: 249, g: 250, b: 251 };
      const gray300 = { r: 209, g: 213, b: 219 };
      const gray500 = { r: 107, g: 114, b: 128 };
      const gray700 = { r: 55, g: 65, b: 81 };
      const gray900 = { r: 17, g: 24, b: 39 };
      const green600 = { r: 22, g: 163, b: 74 };
      const red500 = { r: 239, g: 68, b: 68 };
      const amber600 = { r: 217, g: 119, b: 6 };
      const blueBg = { r: 239, g: 246, b: 255 };
      const greenBg = { r: 240, g: 253, b: 244 };
      const redBg = { r: 254, g: 242, b: 242 };

      // ── Helper: check page break and add new page ──
      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 22) {
          doc.addPage();
          y = 20;
        }
      };

      // ── Draw header ──
      const drawHeader = (isFirst: boolean) => {
        // Blue header band
        doc.setFillColor(blue.r, blue.g, blue.b);
        doc.rect(0, 0, pageW, isFirst ? 38 : 12, "F");
        // Darker accent strip at very top
        doc.setFillColor(darkBlue.r, darkBlue.g, darkBlue.b);
        doc.rect(0, 0, pageW, 3, "F");

        if (isFirst) {
          // App name
          doc.setFont("helvetica", "bold");
          doc.setFontSize(20);
          doc.setTextColor(255, 255, 255);
          doc.text("AI Quiz Studio", marginL, 18);

          // Subtitle badge
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          const badgeText = `  ${title}  `;
          const badgeW = doc.getTextWidth(badgeText) + 4;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginL, 22, badgeW, 6, 1.5, 1.5, "F");
          doc.setTextColor(blue.r, blue.g, blue.b);
          doc.text(badgeText.trim(), marginL + 2, 26.5);

          // Date on right
          doc.setTextColor(220, 230, 255);
          doc.setFontSize(8);
          doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageW - marginR, 14, { align: "right" });
          doc.text(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), pageW - marginR, 19, { align: "right" });

          y = 44;

          // Meta info row (topic, difficulty, count)
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          const topicLabel = topic.trim() || "General";
          const topicLines = doc.splitTextToSize(topicLabel, contentW);
          doc.text(topicLines, marginL, y);
          y += topicLines.length * 5 + 2;

          // Metadata badges
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          const badges = [
            `Difficulty: ${difficulty}`,
            `${questionCount} Questions`,
            `Type: ${questionType.toUpperCase()}`,
          ];
          let badgeX = marginL;
          for (const badge of badges) {
            const bw = doc.getTextWidth(badge) + 6;
            doc.setFillColor(gray50.r, gray50.g, gray50.b);
            doc.setDrawColor(gray300.r, gray300.g, gray300.b);
            doc.roundedRect(badgeX, y - 3.5, bw, 5.5, 1, 1, "FD");
            doc.setTextColor(gray700.r, gray700.g, gray700.b);
            doc.text(badge, badgeX + 3, y);
            badgeX += bw + 3;
          }
          y += 8;

          // Divider
          doc.setDrawColor(gray300.r, gray300.g, gray300.b);
          doc.setLineWidth(0.3);
          doc.line(marginL, y, pageW - marginR, y);
          y += 7;
        } else {
          y = 18;
        }
      };

      // ── Draw footer ──
      const drawFooters = () => {
        const total = doc.getNumberOfPages();
        for (let p = 1; p <= total; p++) {
          doc.setPage(p);
          // Footer line
          doc.setDrawColor(gray300.r, gray300.g, gray300.b);
          doc.setLineWidth(0.2);
          doc.line(marginL, pageH - 14, pageW - marginR, pageH - 14);
          // Footer text
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(gray500.r, gray500.g, gray500.b);
          doc.text("Generated by AI Quiz Studio", marginL, pageH - 9);
          doc.text(`Page ${p} of ${total}`, pageW - marginR, pageH - 9, { align: "right" });
        }
      };

      // ── Render first-page header ──
      drawHeader(true);

      // ── Process content lines ──
      const lines = result.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
          y += 3;
          continue;
        }

        // --- Question numbers: Q1. Q2. etc ---
        if (/^Q\d+[.:]/.test(trimmed)) {
          ensureSpace(16);
          if (y > 55) y += 3; // extra gap between questions

          // Tinted background block
          const qLines = doc.splitTextToSize(trimmed, contentW - 10);
          const blockH = qLines.length * 5 + 5;
          doc.setFillColor(blueBg.r, blueBg.g, blueBg.b);
          doc.roundedRect(marginL, y - 4, contentW, blockH, 1.5, 1.5, "F");
          // Blue left accent bar
          doc.setFillColor(blue.r, blue.g, blue.b);
          doc.roundedRect(marginL, y - 4, 1.2, blockH, 0.6, 0.6, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(darkBlue.r, darkBlue.g, darkBlue.b);
          doc.text(qLines, marginL + 5, y + 1);
          y += blockH + 3;
          continue;
        }

        // --- MCQ options: A) B) C) D) ---
        if (/^[A-Da-d][).]\s/.test(trimmed)) {
          ensureSpace(7);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(gray700.r, gray700.g, gray700.b);
          // Circle bullet
          doc.setFillColor(gray300.r, gray300.g, gray300.b);
          doc.circle(marginL + 6, y - 1, 1.2, "F");
          const optLines = doc.splitTextToSize(trimmed, contentW - 14);
          doc.text(optLines, marginL + 10, y);
          y += optLines.length * 4.5 + 1.5;
          continue;
        }

        // --- Score line ---
        if (/^Score:/i.test(trimmed)) {
          ensureSpace(14);
          y += 2;
          doc.setFillColor(greenBg.r, greenBg.g, greenBg.b);
          doc.roundedRect(marginL, y - 5, contentW, 10, 2, 2, "F");
          doc.setFillColor(green600.r, green600.g, green600.b);
          doc.roundedRect(marginL, y - 5, 1.2, 10, 0.6, 0.6, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(green600.r, green600.g, green600.b);
          doc.text(trimmed, marginL + 5, y + 1);
          y += 12;
          continue;
        }

        // --- Result: Correct / Wrong / Partially Correct ---
        if (/^Result:/i.test(trimmed)) {
          ensureSpace(8);
          const isCorrect = /correct/i.test(trimmed) && !/wrong|partially/i.test(trimmed);
          const isWrong = /wrong/i.test(trimmed);
          const color = isCorrect ? green600 : isWrong ? red500 : amber600;
          const bg = isCorrect ? greenBg : isWrong ? redBg : { r: 255, g: 251, b: 235 };

          doc.setFillColor(bg.r, bg.g, bg.b);
          doc.roundedRect(marginL + 4, y - 3.5, contentW - 8, 6, 1, 1, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(color.r, color.g, color.b);
          doc.text(trimmed, marginL + 7, y);
          y += 7;
          continue;
        }

        // --- Section headings (bold labels) ---
        if (/^(Your Answer:|Correct Answer:|Explanation:|Final Feedback:|Strengths:|Weak Areas:|Study Suggestion:|Quiz Topic:)/i.test(trimmed)) {
          ensureSpace(8);
          y += 1;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          const sLines = doc.splitTextToSize(trimmed, contentW - 4);
          doc.text(sLines, marginL + 2, y);
          y += sLines.length * 4.5 + 2;
          continue;
        }

        // --- Bullet points ---
        if (/^[-•]\s/.test(trimmed)) {
          ensureSpace(7);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(gray700.r, gray700.g, gray700.b);
          doc.setFillColor(blue.r, blue.g, blue.b);
          doc.circle(marginL + 5, y - 1, 0.8, "F");
          const bLines = doc.splitTextToSize(trimmed.replace(/^[-•]\s*/, ""), contentW - 12);
          doc.text(bLines, marginL + 9, y);
          y += bLines.length * 4.5 + 1.5;
          continue;
        }

        // --- Default text ---
        ensureSpace(7);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(gray700.r, gray700.g, gray700.b);
        const wrapped = doc.splitTextToSize(trimmed, contentW - 4);
        doc.text(wrapped, marginL + 2, y);
        y += wrapped.length * 4.5 + 1.5;
      }

      // ── Draw continuation headers on pages 2+ ──
      const total = doc.getNumberOfPages();
      for (let p = 2; p <= total; p++) {
        doc.setPage(p);
        doc.setFillColor(blue.r, blue.g, blue.b);
        doc.rect(0, 0, pageW, 12, "F");
        doc.setFillColor(darkBlue.r, darkBlue.g, darkBlue.b);
        doc.rect(0, 0, pageW, 2.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(`AI Quiz Studio  —  ${title}`, marginL, 8);
      }

      // ── Draw footers on all pages ──
      drawFooters();

      // ── Save ──
      doc.save(`quiz-${mode}-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="relative overflow-hidden border border-border/60 mx-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#38bdf820,transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
        <CardHeader className="relative space-y-3 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl">
                AI Quiz Studio
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Build exam-ready quizzes and evaluate answers with detailed
                teacher-style feedback.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              Adaptive difficulty
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              MCQ and short answers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              Detailed scoring
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 sm:px-3 sm:py-1">
              ⚡ {activePlan !== null ? `${activePlan.aiCredits} AI Credits` : "AI Credits Balance"}
            </span>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={mode} onValueChange={handleModeChange} className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="generate">Quiz Generation</TabsTrigger>
          <TabsTrigger value="evaluate">Answer Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Generate a quiz</CardTitle>
                <CardDescription>
                  Provide a topic and tuning options. The output will not
                  include answers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quiz topic</label>
                    <Input
                      placeholder="e.g., Photosynthesis, Algebra, World War II"
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <Input
                      placeholder="Beginner / Intermediate / Advanced"
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Question count
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={questionCount}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setQuestionCount(
                          Number.isNaN(nextValue) ? 1 : nextValue,
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Question types
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={questionType === "mcq" ? "default" : "outline"}
                        onClick={() => setQuestionType("mcq")}
                      >
                        MCQ
                      </Button>
                      <Button
                        type="button"
                        variant={
                          questionType === "short" ? "default" : "outline"
                        }
                        onClick={() => setQuestionType("short")}
                      >
                        Short Answer
                      </Button>
                      <Button
                        type="button"
                        variant={
                          questionType === "mixed" ? "default" : "outline"
                        }
                        onClick={() => setQuestionType("mixed")}
                      >
                        Mixed
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto">
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Generate Quiz
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Best results use a specific chapter or syllabus name.
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">Pro tips</CardTitle>
                <CardDescription>
                  Keep your quizzes consistent with your exam style.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Specify the course, board, or unit for sharper difficulty
                  control.
                </p>
                <p>Use mixed mode for balanced practice and revision.</p>
                <p>Generate 6-10 questions for faster review sessions.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evaluate">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Evaluate answers</CardTitle>
              <CardDescription>
                Paste the quiz and the student's responses. You will get scores
                and feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quiz content</label>
                  <Textarea
                    rows={5}
                    placeholder="Paste the quiz questions here."
                    value={quizText}
                    onChange={(event) => setQuizText(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student answers</label>
                  <Textarea
                    rows={8}
                    placeholder="Paste the student's answers here."
                    value={studentAnswers}
                    onChange={(event) => setStudentAnswers(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                <Button onClick={handleEvaluate} disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Evaluate Answers
                </Button>
                <span className="text-xs text-muted-foreground">
                  Tip: Keep numbering consistent (Q1, Q2) for accurate grading.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action needed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            Quiz saved successfully to your history!
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 px-4 py-4 sm:px-6">
            <CardTitle className="text-lg sm:text-2xl">AI Output</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              {mode === "generate" && user && (
                <Button
                  onClick={() => saveQuiz()}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Save Quiz
                </Button>
              )}
              <Button
                onClick={downloadPDF}
                variant="outline"
                size="sm"
                disabled={!result}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="bg-muted/40 rounded-lg p-3 sm:p-6 space-y-0">
            <div className="space-y-0 leading-7 sm:leading-8 text-sm sm:text-base font-sans">
              {result.split("\n").map((line, idx) => {
                const isQuestionNumber = /^Q\d+\./.test(line);
                const isBoldLabel =
                  /^(Score:|Q\d+:|Your Answer:|Correct Answer:|Result:|Explanation:|Final Feedback:|Strengths:|Weak Areas:|Study Suggestion:|Quiz Topic:|-\s+(Strengths|Weak Areas|Study Suggestion):)/.test(
                    line,
                  );

                return (
                  <div
                    key={idx}
                    className="min-h-7 sm:min-h-8 py-0.5 sm:py-1 px-2 sm:px-4 hover:bg-primary/5 transition-colors rounded"
                  >
                    <div
                      className={`${
                        isQuestionNumber
                          ? "font-bold text-primary text-base sm:text-lg"
                          : isBoldLabel
                            ? "font-semibold text-foreground"
                            : "text-foreground"
                      }`}
                    >
                      {line || "\u00A0"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {user && quizzes.length > 0 && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">Quiz History</CardTitle>
            <CardDescription>
              Your saved quizzes - retake them anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizzesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.$id}
                    className="p-3 sm:p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    {editingQuizId === quiz.$id ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Topic
                            </label>
                            <Input
                              value={editTopic}
                              onChange={(event) =>
                                setEditTopic(event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Difficulty (easy, medium, hard)
                            </label>
                            <Input
                              value={editDifficulty}
                              onChange={(event) =>
                                setEditDifficulty(event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Question count
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={30}
                              value={editQuestionCount}
                              onChange={(event) => {
                                const nextValue = Number(event.target.value);
                                setEditQuestionCount(
                                  Number.isNaN(nextValue) ? 1 : nextValue,
                                );
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Question type
                            </label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={
                                  editQuestionType === "mcq"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setEditQuestionType("mcq")}
                              >
                                MCQ
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  editQuestionType === "short"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setEditQuestionType("short")}
                              >
                                Short
                              </Button>
                              <Button
                                type="button"
                                variant={
                                  editQuestionType === "mixed"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setEditQuestionType("mixed")}
                              >
                                Mixed
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Quiz content
                          </label>
                          <Textarea
                            rows={6}
                            value={editQuizContent}
                            onChange={(event) =>
                              setEditQuizContent(event.target.value)
                            }
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={updateQuizHistory}
                            size="sm"
                            className="gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Update
                          </Button>
                          <Button
                            onClick={cancelEditQuiz}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {quiz.topic}
                          </h3>
                          <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
                            <span>
                              {quiz.questionCount} questions (
                              {quiz.questionType})
                            </span>
                            <span>Difficulty: {quiz.difficulty}</span>
                            <span>
                              {quiz.attempts || 0} attempt
                              {(quiz.attempts || 0) !== 1 ? "s" : ""}
                            </span>
                            <span>
                              {new Date(quiz.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => retakeQuiz(quiz)}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Retake
                          </Button>
                          <Button
                            onClick={() => startEditQuiz(quiz)}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => requestDeleteQuiz(quiz)}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={Boolean(quizPendingDelete)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleteLoading) {
            setQuizPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this saved quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove
              {quizPendingDelete
                ? ` "${quizPendingDelete.topic}"`
                : " this quiz"}
              from history. You can still undo right after deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteQuiz();
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
