import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiConfig = () => {
  return import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
};

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getSystemPrompt = (taskType: "summary" | "roadmap" | "quiz" | "flashcards", options?: any) => {
  switch (taskType) {
    case "summary":
      return `You are an expert academic assistant. Your job is to analyze the provided document or image of study notes and generate a highly detailed academic summary.
      
Rules:
- Structure the summary with sections like MAIN CONCEPTS, IMPORTANT TERMS, KEY FORMULAS, and PRACTICAL EXAMPLES.
- Use clear markdown formatting.
- DO NOT use ** or __ for bold/emphasis (e.g. use plain capital letters, simple headings, or colons instead), as our PDF generation engine fails to parse double asterisks.
- Keep explanations simple but highly educational.`;

    case "roadmap":
      return `You are an expert study advisor. Analyze the provided study material (document or image) and generate a step-by-step learning roadmap.

Rules:
- Break down the material into weeks or logical study sessions.
- Provide clear learning milestones, estimated time commitments, and topics to cover.
- Give a self-assessment checklist at the end.
- Use clean markdown formatting without double asterisks (**) or double underscores (__).`;

    case "quiz":
      const count = options?.questionCount || 5;
      const type = options?.questionType === "mixed" ? "MCQ and short-answer" : (options?.questionType || "MCQ");
      return `You are an AI teacher. Based on the uploaded study document or image, generate a quiz with exactly ${count} questions of type ${type}.

Rules:
- Do NOT show answers or explanations in the quiz output.
- Format the output exactly like this:
Quiz Topic: <Topic Name>

Q1. <Question text>
A) <Option A>
B) <Option B>
C) <Option C>
D) <Option D>

Q2. <Question text>

Make sure to format it cleanly. Avoid double asterisks (**) for bolding.`;

    case "flashcards":
      return `You are a study card helper. Create a list of flashcards based on the uploaded document or image.

Rules:
- Return ONLY a valid JSON array of objects, where each object has "front" (the question/term) and "back" (the answer/definition) fields.
- Do NOT include any markdown code blocks (such as \`\`\`json or \`\`\`) or any introductory/concluding text. Return the raw JSON array string.
Example format:
[{"front": "Term 1", "back": "Definition 1"}, {"front": "Term 2", "back": "Definition 2"}]`;

    default:
      return "You are an academic study assistant.";
  }
};

export const processDocumentWithAI = async (
  base64Data: string,
  mimeType: string,
  taskType: "summary" | "roadmap" | "quiz" | "flashcards",
  options?: any
): Promise<string> => {
  const geminiApiKey = getGeminiConfig();

  if (!geminiApiKey || geminiApiKey.trim() === "") {
    throw new Error(
      "Direct Gemini API Key is missing. Document processing requires a valid VITE_GEMINI_API_KEY in the environment."
    );
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  let lastError: unknown = null;

  const promptText = 
    taskType === "summary" ? "Please generate a detailed summary of this study material." :
    taskType === "roadmap" ? "Please generate a learning roadmap from this study material." :
    taskType === "quiz" ? "Please generate a quiz from this study material." :
    "Please generate flashcards from this study material in the JSON format requested.";

  const systemPrompt = getSystemPrompt(taskType, options);

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const modelName = GEMINI_MODELS[i];
    try {
      console.log(`[DocHub] Trying Gemini model: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              { text: promptText },
            ],
          },
        ],
      });

      const responseText = result.response.text();
      if (!responseText) {
        throw new Error("Empty response received from the AI model.");
      }
      return responseText;
    } catch (error) {
      lastError = error;
      console.warn(`[DocHub] Failed with ${modelName}, trying next...`, error);
      if (i < GEMINI_MODELS.length - 1) {
        await delay(2000);
      }
    }
  }

  throw lastError || new Error("All Gemini models failed to process the document. Please try again.");
};
