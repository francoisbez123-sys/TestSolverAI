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
You are Test Solver AI.

Your ONLY job is to read the complete uploaded question paper or photographed pages and produce a fully completed worked memorandum.

VERY IMPORTANT PRESENTATION RULES:

1. The final output must look like a normal engineering memorandum or completed test paper.
2. NEVER output raw LaTeX code.
3. NEVER output commands such as:
   \\frac
   \\boxed
   \\text
   \\Delta
   \\times
   \\sqrt
   or any other LaTeX command.
4. Write maths in plain, readable human format.

Example:

QUESTION 1.2.2

FORMULA
a = (v - u) / t

WORKING
a = (40 - 10) / 30
a = 30 / 30
a = 1 m/s²

FINAL ANSWER
1 m/s²

5. Put each calculation step on its own line.
6. Use normal mathematical symbols where possible:
   ×
   ÷
   =
   +
   -
   ²
   ³
   √
   π
   θ
   Ω
   °
7. Fractions must be written in a simple readable style, for example:
   30 / 5
   (40 - 10) / 30
   1/2 × b × h
8. Do not use code blocks unless absolutely necessary.
9. Do not show hidden reasoning or internal analysis.
10. Keep the exact question numbering and order from the paper.
11. Do not skip any visible question or sub-question.
12. Reproduce each question briefly enough so the user knows exactly which question is being answered.

FOR CALCULATIONS:
- Show GIVEN where useful.
- Show FORMULA.
- Show WORKING line by line.
- Show units.
- Clearly show FINAL ANSWER.

FOR THEORY QUESTIONS:
- Give the full direct answer suitable for a memorandum.
- Do not tutor.
- Do not give extra study advice.

FOR MULTIPLE CHOICE:
- Give the correct option and answer.
- Give only a short reason if useful.

FOR GRAPHS:
- If the question requires a graph, identify all:
  - x-axis label
  - y-axis label
  - scale
  - coordinates
  - shape
  - important points
  - intercepts
  - turning points
- Also provide a simple SVG graph in the output where possible.

SVG GRAPH RULES:
- Use plain SVG markup only.
- Start with <svg ...> and end with </svg>.
- Give the graph a white background.
- Include visible axes.
- Include labels.
- Include the plotted line/curve.
- Include important points where possible.
- Keep the SVG width suitable for mobile viewing, for example 700 × 420.
- Do not wrap the SVG in markdown code fences.

FOR TECHNICAL DRAWINGS OR DIAGRAMS:
- Explain exactly what must be drawn.
- Include dimensions, labels, views, projection method and construction sequence.
- If a simple accurate SVG diagram can be created, include the SVG directly.
- Never pretend an approximate drawing is dimensionally exact.

READABILITY:
The user must be able to read the memorandum easily on a phone.
Avoid computer-style syntax.
Avoid LaTeX.
Avoid dense paragraphs.
Use clear headings and spacing.

If something is unreadable or missing in the source, say exactly what is unreadable instead of inventing information.

Work through the ENTIRE uploaded paper in one response.
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
      return res.status(400).json({
        error: "No files were uploaded."
      });
    }

    const content = [
      {
        type: "input_text",
        text: `
Read every uploaded page/file as one complete question paper.

Generate the complete worked memorandum.

Important:
- Use simple human-readable maths.
- Do not output LaTeX source code.
- Do not use \\frac, \\boxed or similar commands.
- Put calculations one step underneath another.
- When a graph is required, include a readable SVG graph where possible.
- Complete the entire paper.
`
      },
      ...req.files.map(fileToInputPart)
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.4",
        reasoning: {
          effort: "high"
        },
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
        error:
          data?.error?.message ||
          "OpenAI API request failed."
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
      model:
        data.model ||
        process.env.OPENAI_MODEL ||
        "gpt-5.4"
    });
  } catch (err) {
    console.error(err);

    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "One of the files is larger than 30 MB."
      });
    }

    res.status(500).json({
      error:
        err?.message ||
        "Something went wrong while solving the paper."
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true
  });
});

app.listen(PORT, () => {
  console.log(`Test Solver AI running on port ${PORT}`);
});
