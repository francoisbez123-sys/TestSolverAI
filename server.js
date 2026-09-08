import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 20
  }
});

app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `
You are Test Solver AI. Your only job is to read the complete uploaded question paper or photographed pages and produce a fully completed worked memorandum.

Rules:
1. Identify the subject and the complete structure of the paper automatically.
2. Preserve the exact question order and numbering, including every sub-question.
3. Do not skip any visible question, instruction, table, diagram, graph, multiple-choice item or calculation.
4. Reproduce each question briefly enough that the user knows exactly which question is being answered.
5. For mathematics, engineering science and calculation questions:
   - state the relevant formula/rule,
   - substitute the given values,
   - show the important working steps,
   - keep units throughout,
   - clearly state the final answer.
6. For theory questions, provide a complete direct answer suitable for a memorandum.
7. For multiple-choice questions, state the option and the answer. Add a short justification only when useful.
8. For technical drawing/diagram questions, identify exactly what must be drawn. Give the dimensions, views, projection method, construction sequence, labels and all visible requirements. If a precise drawable representation can be expressed using simple text/ASCII, include it, but never pretend an approximate sketch is dimensionally exact.
9. If information is unreadable or genuinely missing, say exactly what is unreadable rather than inventing data.
10. Distinguish clearly between GIVEN, FORMULA/RULE, WORKING and FINAL ANSWER where relevant.
11. Use clean Markdown headings and formatting.
12. Do not tutor, quiz, ask the user questions, or provide study advice. Produce the completed answers only.
13. Work through the ENTIRE uploaded paper in one response.
`;

function fileToInputPart(file) {
  const mime = file.mimetype || "application/octet-stream";
  const b64 = file.buffer.toString("base64");

  if (mime.startsWith("image/")) {
    return {
      type: "input_image",
      image_url: `data:${mime};base64,${b64}`,
      detail: "high"
    };
  }

  return {
    type: "input_file",
    filename: file.originalname || "document",
    file_data: `data:${mime};base64,${b64}`
  };
}

app.post("/api/solve", upload.array("files", 20), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured on the server."
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    const content = [
      {
        type: "input_text",
        text: "Read every uploaded page/file as one question paper and generate the complete worked memorandum now."
      },
      ...req.files.map(fileToInputPart)
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6",
        reasoning: { effort: "high" },
        instructions: SYSTEM_PROMPT,
        input: [
          {
            role: "user",
            content
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI API request failed."
      });
    }

    const outputText =
      data.output_text ||
      (data.output || [])
        .flatMap(item => item.content || [])
        .filter(part => part.type === "output_text")
        .map(part => part.text)
        .join("\n");

    if (!outputText) {
      return res.status(500).json({
        error: "The AI returned no readable answer text."
      });
    }

    res.json({
      answer: outputText,
      model: data.model || process.env.OPENAI_MODEL || "gpt-5.6"
    });

  } catch (err) {
    console.error(err);
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "One of the files is larger than 30 MB." });
    }
    res.status(500).json({
      error: err?.message || "Something went wrong while solving the paper."
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Test Solver AI running on port ${PORT}`);
});
