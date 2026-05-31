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
  Eye,
  ClipboardCheck,
} from "lucide-react";
import { evaluateQuiz, generateQuiz } from "../services/aiQuizService";
import databaseService, { QuizHistory } from "../services/databaseService";
import planService, { UserPlan } from "../services/planService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";

// Helper to parse markdown bold/italic segments
const parseMarkdownSegments = (text: string): { text: string; bold: boolean }[] => {
  const segments: { text: string; bold: boolean }[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  const parts = text.split(regex);
  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**")) {
      segments.push({ text: part.slice(2, -2), bold: true });
    } else if (part.startsWith("*") && part.endsWith("*")) {
      segments.push({ text: part.slice(1, -1), bold: true });
    } else {
      segments.push({ text: part, bold: false });
    }
  }
  return segments;
};

// Helper to wrap segments into lines of a maximum width
const wrapSegments = (
  doc: jsPDF,
  segments: { text: string; bold: boolean }[],
  contentWidth: number,
  baseFontName: string,
  baseFontSize: number
): { text: string; bold: boolean }[][] => {
  const lines: { text: string; bold: boolean }[][] = [];
  let currentLine: { text: string; bold: boolean }[] = [];
  let currentLineWidth = 0;

  for (const seg of segments) {
    if (!seg.text) currentLine.push({ text: " ", bold: false });

    // Split segment into words, preserving spaces
    const words = seg.text.split(/(\s+)/);

    for (const word of words) {
      if (!word) continue;

      doc.setFont(baseFontName, seg.bold ? "bold" : "normal");
      doc.setFontSize(baseFontSize);
      const wordWidth = doc.getTextWidth(word);

      if (currentLineWidth + wordWidth > contentWidth) {
        if (/^\s+$/.test(word)) continue; // skip leading space

        lines.push(currentLine);
        currentLine = [{ text: word, bold: seg.bold }];
        currentLineWidth = wordWidth;
      } else {
        currentLine.push({ text: word, bold: seg.bold });
        currentLineWidth += wordWidth;
      }
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
};

// Main helper to render paragraphs with inline markdown and emoji cleaning
const drawWrappedMarkdown = (
  doc: jsPDF,
  paragraph: string,
  startX: number,
  startY: number,
  contentWidth: number,
  lineHeight: number,
  baseFontName: string,
  baseFontSize: number,
  baseColor: { r: number; g: number; b: number },
  boldColor: { r: number; g: number; b: number },
  pageHeight: number,
  addPage: () => void
): number => {
  const cleanPara = paragraph
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{2934}\u{2935}\u{2190}-\u{21FF}]/gu, "")
    // Remove non-standard unicode characters
    .replace(/[^\x00-\x7F\u00A0-\u00FF\u2013\u2014\u2022]/g, "");

  const segments = parseMarkdownSegments(cleanPara);
  const wrappedLines = wrapSegments(doc, segments, contentWidth, baseFontName, baseFontSize);

  let currentY = startY;

  for (const line of wrappedLines) {
    if (currentY + lineHeight > pageHeight - 22) {
      addPage();
      currentY = 20;
    }
    
    let currentX = startX;

    for (const seg of line) {
      doc.setFont(baseFontName, seg.bold ? "bold" : "normal");
      doc.setFontSize(baseFontSize);
      doc.setTextColor(
        seg.bold ? boldColor.r : baseColor.r,
        seg.bold ? boldColor.g : baseColor.g,
        seg.bold ? boldColor.b : baseColor.b
      );
      doc.text(seg.text, currentX, currentY);
      currentX += doc.getTextWidth(seg.text);
    }

    currentY += lineHeight;
  }

  return currentY;
};

// Helper to clean emojis from text headers
const cleanText = (text: string) => {
  if (!text) return "";
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F7FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{2934}\u{2935}\u{2190}-\u{21FF}]/gu, "")
    .replace(/[^\x00-\x7F\u00A0-\u00FF\u2013\u2014\u2022]/g, "");
};

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

  // History: edit state
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editQuestionCount, setEditQuestionCount] = useState(8);
  const [editQuestionType, setEditQuestionType] =
    useState<QuizHistory["questionType"]>("mixed");
  const [editQuizContent, setEditQuizContent] = useState("");

  // History: delete state
  const [quizPendingDelete, setQuizPendingDelete] =
    useState<QuizHistory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // History: expand state
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

  // ── Load data ──
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
    return "medium";
  };

  // ── Save ──
  const saveQuiz = async (quizContent?: string) => {
    const contentToSave = quizContent || result;
    const resolvedUserId = user?.$id || (user as any)?.id || user?.id;
    if (!resolvedUserId || !contentToSave) return;

    try {
      const newQuiz: Omit<QuizHistory, "$id"> = {
        userId: resolvedUserId,
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
      const message =
        err instanceof Error ? err.message : "Failed to save quiz.";
      toast.error(message);
      setError(message);
    }
  };

  // ── Delete ──
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
      setError(
        err instanceof Error ? err.message : "Failed to restore quiz."
      );
    }
  };

  const confirmDeleteQuiz = async () => {
    if (!quizPendingDelete?.$id) return;

    const deletedQuiz = quizPendingDelete;
    setDeleteLoading(true);
    setQuizPendingDelete(null);

    try {
      setQuizzes((prev) =>
        prev.filter((quiz) => quiz.$id !== deletedQuiz.$id)
      );
      if (editingQuizId === deletedQuiz.$id) {
        cancelEditQuiz();
      }
      if (expandedQuizId === deletedQuiz.$id) {
        setExpandedQuizId(null);
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
      setError(
        err instanceof Error ? err.message : "Failed to delete quiz."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Edit ──
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
      setError("Topic and quiz content are required to update.");
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
      setError(
        err instanceof Error ? err.message : "Failed to update quiz."
      );
    }
  };

  // ── Retake ──
  const retakeQuiz = (quiz: QuizHistory) => {
    setTopic(quiz.topic);
    setDifficulty(
      quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)
    );
    setQuestionCount(quiz.questionCount);
    setQuestionType(quiz.questionType);
    setResult(quiz.quizContent);
    setMode("generate");
    databaseService.updateQuiz(quiz.$id || "", {
      attempts: (quiz.attempts || 0) + 1,
    });
  };

  // ── Generate ──
  const handleGenerate = async () => {
    setError(null);
    setResult(null);

    if (!topic.trim()) {
      setError("Please enter a quiz topic.");
      return;
    }

    const resolvedUserId =
      user?.$id || (user as any)?.id || user?.id || "test-user";
    const userPlan = await planService.getUserPlan(resolvedUserId);

    if (userPlan.aiCredits < 2) {
      setError(
        "Insufficient AI Credits. Generating an AI Quiz requires 2 credits. Please navigate to 'Billing & Plans' to upgrade or refill."
      );
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

      if (quizOutput !== "No response returned from the model.") {
        await planService.deductCredits(
          resolvedUserId,
          `AI Quiz - Topic: ${topic.trim()}`,
          2
        );

        if (resolvedUserId) {
          try {
            await saveQuiz(quizOutput);
            toast.success(
              "Quiz generated and saved! (2 AI Credits deducted)"
            );
          } catch {
            console.warn("Auto-save failed.");
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate quiz."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Evaluate ──
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
        err instanceof Error ? err.message : "Failed to evaluate answers."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    if (newMode === "evaluate" && result) {
      setQuizText(result);
      setStudentAnswers("");
    }
  };

  // ══════════════════════════════════════════════
  // PDF DOWNLOAD
  // ══════════════════════════════════════════════
  const downloadPDF = (quiz?: QuizHistory) => {
    const isQuizObj = quiz && typeof quiz === "object" && "quizContent" in quiz;
    const actualQuiz = isQuizObj ? quiz : undefined;
    const content = actualQuiz ? actualQuiz.quizContent : result;
    if (!content) return;

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

      const rTopic = actualQuiz ? actualQuiz.topic : topic;
      const rDifficulty = actualQuiz ? actualQuiz.difficulty : difficulty;
      const rQuestionCount = actualQuiz ? actualQuiz.questionCount : questionCount;
      const rQuestionType = actualQuiz ? actualQuiz.questionType : questionType;

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

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - 22) {
          doc.addPage();
          y = 20;
        }
      };

      const drawHeader = (isFirst: boolean) => {
        doc.setFillColor(blue.r, blue.g, blue.b);
        doc.rect(0, 0, pageW, isFirst ? 38 : 12, "F");
        doc.setFillColor(darkBlue.r, darkBlue.g, darkBlue.b);
        doc.rect(0, 0, pageW, 3, "F");

        if (isFirst) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(20);
          doc.setTextColor(255, 255, 255);
          doc.text("AI Quiz Studio", marginL, 18);

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          const badgeText = `  ${title}  `;
          const badgeW = doc.getTextWidth(badgeText) + 4;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(marginL, 22, badgeW, 6, 1.5, 1.5, "F");
          doc.setTextColor(blue.r, blue.g, blue.b);
          doc.text(badgeText.trim(), marginL + 2, 26.5);

          doc.setTextColor(220, 230, 255);
          doc.setFontSize(8);
          
          const createdDate = actualQuiz ? new Date(actualQuiz.createdAt) : new Date();
          doc.text(
            createdDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            pageW - marginR,
            14,
            { align: "right" }
          );
          doc.text(
            createdDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            pageW - marginR,
            19,
            { align: "right" }
          );

          y = 44;

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          const topicLabel = rTopic.trim() || "General";
          const topicLines = doc.splitTextToSize(topicLabel, contentW);
          doc.text(topicLines, marginL, y);
          y += topicLines.length * 5 + 2;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          const badges = [
            `Difficulty: ${rDifficulty}`,
            `${rQuestionCount} Questions`,
            `Type: ${rQuestionType.toUpperCase()}`,
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

          doc.setDrawColor(gray300.r, gray300.g, gray300.b);
          doc.setLineWidth(0.3);
          doc.line(marginL, y, pageW - marginR, y);
          y += 7;
        } else {
          y = 18;
        }
      };

      const drawFooters = () => {
        const total = doc.getNumberOfPages();
        for (let p = 1; p <= total; p++) {
          doc.setPage(p);
          doc.setDrawColor(gray300.r, gray300.g, gray300.b);
          doc.setLineWidth(0.2);
          doc.line(marginL, pageH - 14, pageW - marginR, pageH - 14);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(gray500.r, gray500.g, gray500.b);
          doc.text("Generated by AI Quiz Studio — Study Planner", marginL, pageH - 9);
          doc.text(`Page ${p} of ${total}`, pageW - marginR, pageH - 9, {
            align: "right",
          });
        }
      };

      drawHeader(true);

      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
          y += 3;
          continue;
        }

        if (/^Q\d+[.:]/.test(trimmed)) {
          ensureSpace(16);
          if (y > 55) y += 3;
          const cleanQ = cleanText(trimmed);
          const qLines = doc.splitTextToSize(cleanQ, contentW - 10);
          const blockH = qLines.length * 5 + 5;
          doc.setFillColor(blueBg.r, blueBg.g, blueBg.b);
          doc.roundedRect(marginL, y - 4, contentW, blockH, 1.5, 1.5, "F");
          doc.setFillColor(blue.r, blue.g, blue.b);
          doc.roundedRect(marginL, y - 4, 1.2, blockH, 0.6, 0.6, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(darkBlue.r, darkBlue.g, darkBlue.b);
          doc.text(qLines, marginL + 5, y + 1);
          y += blockH + 3;
          continue;
        }

        if (/^[A-Da-d][).]\s/.test(trimmed)) {
          ensureSpace(7);
          doc.setFillColor(gray300.r, gray300.g, gray300.b);
          doc.circle(marginL + 6, y - 1, 1.2, "F");
          
          y = drawWrappedMarkdown(
            doc,
            trimmed,
            marginL + 10,
            y,
            contentW - 14,
            4.5,
            "helvetica",
            9.5,
            gray700,
            gray900,
            pageH,
            () => doc.addPage()
          );
          continue;
        }

        if (/^Score:/i.test(trimmed)) {
          ensureSpace(14);
          y += 2;
          const cleanScore = cleanText(trimmed);
          doc.setFillColor(greenBg.r, greenBg.g, greenBg.b);
          doc.roundedRect(marginL, y - 5, contentW, 10, 2, 2, "F");
          doc.setFillColor(green600.r, green600.g, green600.b);
          doc.roundedRect(marginL, y - 5, 1.2, 10, 0.6, 0.6, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(green600.r, green600.g, green600.b);
          doc.text(cleanScore, marginL + 5, y + 1);
          y += 12;
          continue;
        }

        if (/^Result:/i.test(trimmed)) {
          ensureSpace(8);
          const isCorrect =
            /correct/i.test(trimmed) && !/wrong|partially/i.test(trimmed);
          const isWrong = /wrong/i.test(trimmed);
          const color = isCorrect
            ? green600
            : isWrong
              ? red500
              : amber600;
          const bg = isCorrect
            ? greenBg
            : isWrong
              ? redBg
              : { r: 255, g: 251, b: 235 };

          const cleanResultStr = cleanText(trimmed);

          doc.setFillColor(bg.r, bg.g, bg.b);
          doc.roundedRect(
            marginL + 4,
            y - 3.5,
            contentW - 8,
            6,
            1,
            1,
            "F"
          );
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(color.r, color.g, color.b);
          doc.text(cleanResultStr, marginL + 7, y);
          y += 7;
          continue;
        }

        if (
          /^(Your Answer:|Correct Answer:|Explanation:|Final Feedback:|Strengths:|Weak Areas:|Study Suggestion:|Quiz Topic:)/i.test(
            trimmed
          )
        ) {
          ensureSpace(8);
          y += 1;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(gray900.r, gray900.g, gray900.b);
          const cleanLabel = cleanText(trimmed);
          const sLines = doc.splitTextToSize(cleanLabel, contentW - 4);
          doc.text(sLines, marginL + 2, y);
          y += sLines.length * 4.5 + 2;
          continue;
        }

        if (/^[-•]\s/.test(trimmed)) {
          ensureSpace(7);
          doc.setFillColor(blue.r, blue.g, blue.b);
          doc.circle(marginL + 5, y - 1, 0.8, "F");

          y = drawWrappedMarkdown(
            doc,
            trimmed.replace(/^[-•]\s*/, ""),
            marginL + 9,
            y,
            contentW - 12,
            4.5,
            "helvetica",
            9,
            gray700,
            gray900,
            pageH,
            () => doc.addPage()
          );
          continue;
        }

        y = drawWrappedMarkdown(
          doc,
          trimmed,
          marginL + 2,
          y,
          contentW - 4,
          4.5,
          "helvetica",
          9.5,
          gray700,
          gray900,
          pageH,
          () => doc.addPage()
        );
      }

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

      drawFooters();

      const dateStr = actualQuiz 
        ? new Date(actualQuiz.createdAt).toISOString().split("T")[0] 
        : new Date().toISOString().split("T")[0];

      const rMode = actualQuiz ? "generate" : mode;

      doc.save(
        `quiz-${rMode}-${rTopic.trim().replace(/\s+/g, "-").toLowerCase() || "quiz"}-${dateStr}.pdf`
      );
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header Card */}
      <Card className="relative overflow-hidden border border-border/60 mx-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#6366f120,transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-indigo-500/10 to-transparent" />
        <CardHeader className="relative space-y-3 px-4 py-4 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
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
              <Sparkles className="h-3 w-3 text-indigo-500" />
              Quiz Generation
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              <ClipboardCheck className="h-3 w-3 text-emerald-500" />
              Answer Evaluation
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 sm:px-3 sm:py-1">
              Adaptive Difficulty
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 sm:px-3 sm:py-1">
              ⚡{" "}
              {activePlan !== null
                ? `${activePlan.aiCredits} AI Credits`
                : "AI Credits Balance"}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs
        value={mode}
        onValueChange={handleModeChange}
        className="space-y-4"
      >
        <TabsList className="w-full sm:w-auto flex-wrap h-auto p-1">
          <TabsTrigger value="generate" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Quiz Generation
          </TabsTrigger>
          <TabsTrigger value="evaluate" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Answer Evaluation
          </TabsTrigger>
        </TabsList>

        {/* ─── GENERATE TAB ─── */}
        <TabsContent value="generate">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Generate a Quiz</CardTitle>
                <CardDescription>
                  Provide a topic and tuning options. The output will not include
                  answers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quiz topic *</label>
                    <Input
                      placeholder="e.g., Photosynthesis, Algebra, World War II"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                      {["Beginner", "Intermediate", "Advanced"].map((d) => (
                        <Button
                          key={d}
                          type="button"
                          variant={difficulty === d ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDifficulty(d)}
                        >
                          {d}
                        </Button>
                      ))}
                    </div>
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
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setQuestionCount(Number.isNaN(v) ? 1 : v);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Question types
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["mcq", "short", "mixed"] as const).map((t) => (
                        <Button
                          key={t}
                          type="button"
                          variant={questionType === t ? "default" : "outline"}
                          size="sm"
                          onClick={() => setQuestionType(t)}
                        >
                          {t === "mcq"
                            ? "MCQ"
                            : t === "short"
                              ? "Short Answer"
                              : "Mixed"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate Quiz
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Costs 2 AI Credits per generation
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-border/70 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">What you'll get</CardTitle>
                <CardDescription>
                  Exam-ready quizzes tailored to your needs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>📝 Numbered questions (Q1, Q2...)</p>
                <p>🔤 MCQ options (A, B, C, D) with distractors</p>
                <p>✍️ Short answer questions</p>
                <p>🎯 Adaptive difficulty control</p>
                <p>📊 Answer evaluation with detailed feedback</p>
                <p>💡 Pro tip: Specify board/unit for sharper quizzes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── EVALUATE TAB ─── */}
        <TabsContent value="evaluate">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Evaluate Answers</CardTitle>
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
                    rows={8}
                    placeholder="Paste the quiz questions here."
                    value={quizText}
                    onChange={(e) => setQuizText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Student answers
                  </label>
                  <Textarea
                    rows={8}
                    placeholder="Paste the student's answers here."
                    value={studentAnswers}
                    onChange={(e) => setStudentAnswers(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                <Button
                  onClick={handleEvaluate}
                  disabled={loading}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                  )}
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action needed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Save Success */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40">
          <AlertTitle className="text-green-800 dark:text-green-300">
            Success
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Quiz saved successfully to your history!
          </AlertDescription>
        </Alert>
      )}

      {/* AI Output */}
      {result && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 px-4 py-4 sm:px-6">
            <div>
              <CardTitle className="text-lg sm:text-2xl">
                {mode === "generate"
                  ? "📝 Generated Quiz"
                  : "📊 Evaluation Results"}
              </CardTitle>
              <CardDescription className="mt-1">
                {topic.trim() || "Quiz"} — {difficulty} •{" "}
                {questionCount} questions • {questionType.toUpperCase()}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                onClick={() => downloadPDF()}
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
                const t = line.trim();
                const isQ = /^Q\d+[.:]/.test(t);
                const isLabel =
                  /^(Score:|Your Answer:|Correct Answer:|Result:|Explanation:|Final Feedback:|Strengths:|Weak Areas:|Study Suggestion:)/i.test(
                    t
                  );
                const isOption = /^[A-Da-d][).]\s/.test(t);

                return (
                  <div
                    key={idx}
                    className={`min-h-7 sm:min-h-8 py-0.5 sm:py-1 px-2 sm:px-4 hover:bg-primary/5 transition-colors rounded ${
                      isOption ? "pl-4 sm:pl-6" : ""
                    }`}
                  >
                    <div
                      className={`${
                        isQ
                          ? "font-bold text-indigo-600 dark:text-indigo-400 text-base sm:text-lg mt-2"
                          : isLabel
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

      {/* Quiz History */}
      {user && quizzes.length > 0 && (
        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl">
              Quiz History
            </CardTitle>
            <CardDescription>
              Your saved quizzes — view, retake, edit, or download anytime
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
                      /* ── Edit Mode ── */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Topic
                            </label>
                            <Input
                              value={editTopic}
                              onChange={(e) => setEditTopic(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Difficulty
                            </label>
                            <div className="flex gap-2">
                              {["easy", "medium", "hard"].map((d) => (
                                <Button
                                  key={d}
                                  type="button"
                                  variant={
                                    editDifficulty === d
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setEditDifficulty(d)}
                                >
                                  {d.charAt(0).toUpperCase() + d.slice(1)}
                                </Button>
                              ))}
                            </div>
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
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setEditQuestionCount(
                                  Number.isNaN(v) ? 1 : v
                                );
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              Question type
                            </label>
                            <div className="flex gap-2">
                              {(["mcq", "short", "mixed"] as const).map(
                                (t) => (
                                  <Button
                                    key={t}
                                    type="button"
                                    variant={
                                      editQuestionType === t
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setEditQuestionType(t)}
                                  >
                                    {t === "mcq"
                                      ? "MCQ"
                                      : t === "short"
                                        ? "Short"
                                        : "Mixed"}
                                  </Button>
                                )
                              )}
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
                            onChange={(e) =>
                              setEditQuizContent(e.target.value)
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
                      /* ── View Mode ── */
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">
                              {quiz.topic}
                            </h3>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <Sparkles className="h-3 w-3" />
                                {quiz.questionType.toUpperCase()}
                              </span>
                              <span>
                                {quiz.questionCount} questions
                              </span>
                              <span>Difficulty: {quiz.difficulty}</span>
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <RotateCcw className="h-3 w-3" />
                                {quiz.attempts || 0} attempt
                                {(quiz.attempts || 0) !== 1 ? "s" : ""}
                              </span>
                              <span>
                                {new Date(
                                  quiz.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-1.5 sm:gap-2 w-full sm:w-auto">
                            <Button
                              onClick={() =>
                                setExpandedQuizId(
                                  expandedQuizId === quiz.$id
                                    ? null
                                    : quiz.$id || null
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              {expandedQuizId === quiz.$id
                                ? "Collapse"
                                : "View"}
                            </Button>
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
                               onClick={() => downloadPDF(quiz)}
                               variant="outline"
                               size="sm"
                               className="gap-1.5 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                             >
                               <Download className="w-4 h-4" />
                               Download
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

                        {/* Expandable quiz content */}
                        {expandedQuizId === quiz.$id && (
                          <div className="mt-4 p-3 sm:p-4 rounded-lg bg-muted/40 border border-border/40">
                            <div className="space-y-0 leading-7 text-sm font-sans max-h-96 overflow-y-auto">
                              {quiz.quizContent
                                .split("\n")
                                .map((line, idx) => {
                                  const isQ = /^Q\d+[.:]/.test(
                                    line.trim()
                                  );
                                  const isLabel =
                                    /^(Score:|Your Answer:|Correct Answer:|Result:|Explanation:)/i.test(
                                      line.trim()
                                    );
                                  return (
                                    <div
                                      key={idx}
                                      className="min-h-6 py-0.5 px-2"
                                    >
                                      <div
                                        className={
                                          isQ
                                            ? "font-bold text-indigo-600 dark:text-indigo-400"
                                            : isLabel
                                              ? "font-semibold text-foreground"
                                              : "text-foreground"
                                        }
                                      >
                                        {line || "\u00A0"}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
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
                : " this quiz"}{" "}
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
