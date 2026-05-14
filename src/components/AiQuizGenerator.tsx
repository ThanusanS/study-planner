import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../app/components/ui/card";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { Textarea } from "../app/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../app/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../app/components/ui/alert";
import { Loader2, Sparkles } from "lucide-react";
import { evaluateQuiz, generateQuiz } from "../services/aiQuizService";

export const AiQuizGenerator: React.FC = () => {
  const [mode, setMode] = useState("generate");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [questionCount, setQuestionCount] = useState(8);
  const [questionType, setQuestionType] = useState<"mcq" | "short" | "mixed">("mixed");
  const [quizText, setQuizText] = useState("");
  const [studentAnswers, setStudentAnswers] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setResult(null);

    if (!topic.trim()) {
      setError("Please enter a quiz topic.");
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
      setResult(output || "No response returned from the model.");
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
      setError(err instanceof Error ? err.message : "Failed to evaluate answers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#38bdf820,transparent_55%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
        <CardHeader className="relative space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl">AI Quiz Studio</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Build exam-ready quizzes or evaluate answers with detailed teacher-style feedback.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1">
              Adaptive difficulty
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1">
              MCQ and short answers
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1">
              Detailed scoring
            </span>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={mode} onValueChange={setMode} className="space-y-4">
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
                  Provide a topic and tuning options. The output will not include answers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                    <label className="text-sm font-medium">Question count</label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={questionCount}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setQuestionCount(Number.isNaN(nextValue) ? 1 : nextValue);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Question types</label>
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
                        variant={questionType === "short" ? "default" : "outline"}
                        onClick={() => setQuestionType("short")}
                      >
                        Short Answer
                      </Button>
                      <Button
                        type="button"
                        variant={questionType === "mixed" ? "default" : "outline"}
                        onClick={() => setQuestionType("mixed")}
                      >
                        Mixed
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={handleGenerate} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                <p>Specify the course, board, or unit for sharper difficulty control.</p>
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
                Paste the quiz and the student's responses. You will get scores and feedback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quiz content</label>
                  <Textarea
                    rows={8}
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
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleEvaluate} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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

      {result && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>AI Output</CardTitle>
            <CardDescription>Review, edit, or copy the result as needed.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
