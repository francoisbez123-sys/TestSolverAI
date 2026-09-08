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

/* =========================================================
   TEST SOLVER AI - VERSION 3
   ========================================================= */

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-sol";

/* ---------------------------------------------------------
   SOLVER INSTRUCTIONS
--------------------------------------------------------- */

const SOLVER_PROMPT = `
You are TestSolverAI.

Your ONLY job is to take an uploaded question paper, test,
exam, worksheet, assignment, or photographed questions and
produce a COMPLETE WORKED MEMORANDUM / ANSWER PAPER.

This is NOT a tutoring conversation.
Do not teach the user how to solve the paper.
Do not ask unnecessary questions.
Solve the paper completely.

============================================================
1. READ THE SOURCE CAREFULLY
============================================================

Read every uploaded page/image carefully.

Identify:
- subject
- question numbers
- sub-question numbers
- marks if visible
- tables
- formulas
- graphs
- diagrams
- measurements
- units
- multiple-choice questions
- theory questions

Preserve the original question numbering and order.

Do not invent missing question text.

If part of the source is genuinely unreadable, state:

SOURCE UNREADABLE - PLEASE UPLOAD A CLEARER IMAGE

for that specific question.

============================================================
2. CALCULATIONS
============================================================

For mathematical, engineering and science calculations use:

QUESTION x.x

GIVEN
...

FORMULA
...

WORKING
...

FINAL ANSWER
...

Show ALL important calculation steps.

Never jump directly to an answer where working is expected.

Always include units.

Check unit conversions carefully.

Examples of readable mathematics:

F = m × a

F = 25 × 9.81

F = 245.25 N

Do NOT output raw LaTeX.

NEVER output things such as:

\\\\frac
\\\\boxed
\\\\sqrt
\\\\times
\\\\mathrm
\\\\begin
\\\\end

Use normal Unicode mathematical characters where useful:

×
÷
²
³
√
π
Δ
θ
≤
≥
±
Ω
µ

Fractions should be readable, for example:

25 / 4

or

     25
    ----
      4

============================================================
3. THEORY QUESTIONS
============================================================

Answer theory questions directly and accurately.

Match the requested number of answers.

If the question asks for FOUR items, give FOUR valid items.

If it asks for TWO reasons, give TWO reasons.

Do not add unrelated tutoring explanations.

============================================================
4. MULTIPLE CHOICE
============================================================

Give the selected answer clearly.

Example:

1.4
ANSWER
C. Pascal's law

============================================================
5. GRAPHS
============================================================

When a question requires a graph, DO NOT merely describe
what the graph should look like.

Create the graph.

First calculate or identify:
- horizontal axis
- vertical axis
- scale
- coordinates
- intercepts
- important points
- curve or line shape

Then include an SVG graph.

SVG RULES:

Use ONLY:
svg
g
line
polyline
polygon
path
rect
circle
ellipse
text
tspan
defs
marker

Do NOT use:
script
foreignObject
HTML
JavaScript
external images
external links
CSS stylesheets

Use inline SVG attributes.

Always include a viewBox.

Example:

<svg viewBox="0 0 700 420">
  ...
</svg>

Graphs must include visible axes, labels, values and plotted
information required by the question.

============================================================
6. ENGINEERING / TECHNICAL DIAGRAMS
============================================================

If a question requires a simple technical diagram that can
reasonably be represented in SVG, DRAW IT.

Examples:
- force diagrams
- vectors
- simple circuits
- hydraulic symbols/concepts
- beams
- moments
- triangles
- geometric constructions
- labelled science diagrams

Use clear labels.

Do not pretend an approximate AI-generated drawing is a
dimensionally exact engineering drawing.

Where exact construction dimensions are required, state the
dimensions and construction information alongside the SVG.

============================================================
7. MEMORANDUM FORMAT
============================================================

The output should resemble a professional worked memorandum.

Use:

QUESTION 1

1.1

GIVEN

FORMULA

WORKING

FINAL ANSWER

Continue through the entire paper.

Use blank lines between sections.

Keep calculations vertically arranged and easy to read on a
phone and when printed on A4 paper.

Do not use markdown tables unless absolutely necessary.

Do not use triple-backtick code blocks.

SVG must appear directly in the response, not inside a code
block.

============================================================
8. ACCURACY
============================================================

Before returning the draft:

- check arithmetic
- check signs
- check substitutions
- check formulas
- check units
- check conversions
- check question numbering
- check that every question was answered
- check that the requested number of theory answers was given
- check graphs against calculated values

Do not guess if source information is genuinely missing.

============================================================
9. COMPLETE THE ENTIRE PAPER
============================================================

Do not stop after a few questions.

Solve ALL readable questions contained in the uploaded files.

Return ONLY the worked memorandum.
`;

/* ---------------------------------------------------------
   VERIFIER INSTRUCTIONS
--------------------------------------------------------- */

const VERIFY_PROMPT = `
You are the independent verification stage of TestSolverAI.

You will receive:

1. The ORIGINAL question paper / images.
2. A DRAFT worked memorandum produced by another solver.

Your job is to independently verify the draft and return a
CORRECTED FINAL MEMORANDUM.

Do NOT merely agree with the draft.

Check the original source yourself.

============================================================
VERIFY EVERY QUESTION
============================================================

For every question check:

- Was the question interpreted correctly?
- Is the correct formula used?
- Are substitutions correct?
- Is arithmetic correct?
- Are signs correct?
- Are units correct?
- Are conversions correct?
- Is rounding reasonable?
- Is the requested number of answers supplied?
- Is question numbering correct?
- Was any readable question missed?
- Are theory answers factually appropriate?
- Do graph coordinates agree with the calculations?
- Are diagram labels appropriate?

If the draft is wrong, FIX IT.

If the draft missed a question, ADD IT.

If the draft invented information not supported by the
source, REMOVE or CORRECT it.

Do not mention the draft or verification process in the final
answer.

============================================================
FORMAT
============================================================

Return ONLY the corrected complete memorandum.

Keep this format:

QUESTION x

x.x

GIVEN
...

FORMULA
...

WORKING
...

FINAL ANSWER
...

Never output raw LaTeX commands.

Use readable symbols such as:

×
÷
²
³
√
π
Δ
θ
≤
≥
±
Ω
µ

Preserve or correct SVG graphs and diagrams where required.

SVG must NOT be placed inside markdown code blocks.

Do not output scripts, HTML, JavaScript, foreignObject,
external links or external images.

Complete the ENTIRE readable paper.
`;

/* ---------------------------------------------------------
   CONVERT UPLOADED FILE TO OPENAI INPUT
--------------------------------------------------------- */

function fileToInputPart(file) {
  const mime =
    file.mimetype || "application/octet-stream";

  const b64 =
    file.buffer.toString("base64");

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

/* ---------------------------------------------------------
   EXTRACT RESPONSE TEXT
--------------------------------------------------------- */

function extractOutputText(data) {
  if (data?.output_text) {
    return data.output_text;
  }

  if (!Array.isArray(data?.output)) {
    return "";
  }

  const pieces = [];

  for (const item of data.output) {
    if (!Array.isArray(item?.content)) continue;

    for (const part of item.content) {
      if (
        part?.type === "output_text" &&
        typeof part.text === "string"
      ) {
        pieces.push(part.text);
      }
    }
  }

  return pieces.join("\n");
}

/* ---------------------------------------------------------
   CALL OPENAI RESPONSES API
--------------------------------------------------------- */

async function callOpenAI({
  instructions,
  content
}) {
  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${process.env.OPENAI_API_KEY}`,

        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: MODEL,

        reasoning: {
          effort: "high"
        },

        instructions,

        input: [
          {
            role: "user",
            content
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "OpenAI API error:",
      JSON.stringify(data, null, 2)
    );

    throw new Error(
      data?.error?.message ||
      "OpenAI API request failed."
    );
  }

  return extractOutputText(data);
}

/* ---------------------------------------------------------
   HEALTH CHECK
--------------------------------------------------------- */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    version: "3.0",
    model: MODEL
  });
});

/* ---------------------------------------------------------
   SOLVE ENDPOINT
--------------------------------------------------------- */

app.post(
  "/api/solve",
  upload.array("files", 20),

  async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          error:
            "OPENAI_API_KEY is not configured on the server."
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error:
            "Please upload a question paper or take a photo first."
        });
      }

      const sourceParts =
        req.files.map(fileToInputPart);

      /* ===================================================
         PASS 1 - SOLVE THE PAPER
         =================================================== */

      const solverContent = [
        {
          type: "input_text",
          text:
            "Solve the attached question paper completely. " +
            "Produce a full worked memorandum."
        },
        ...sourceParts
      ];

      const draft = await callOpenAI({
        instructions: SOLVER_PROMPT,
        content: solverContent
      });

      if (!draft.trim()) {
        throw new Error(
          "The solver did not return an answer."
        );
      }

      /* ===================================================
         PASS 2 - INDEPENDENT VERIFICATION
         =================================================== */

      const verifierContent = [
        {
          type: "input_text",
          text:
            "Independently check the ORIGINAL attached paper " +
            "against the draft memorandum below. Correct every " +
            "error and return ONLY the complete corrected final " +
            "memorandum.\n\n" +
            "================ DRAFT MEMORANDUM ================\n\n" +
            draft
        },

        ...sourceParts
      ];

      const verified =
        await callOpenAI({
          instructions: VERIFY_PROMPT,
          content: verifierContent
        });

      const finalAnswer =
        verified.trim() || draft.trim();

      return res.json({
        answer: finalAnswer,
        model: MODEL,
        verified: Boolean(verified.trim()),
        version: "3.0"
      });

    } catch (error) {
      console.error(
        "TestSolverAI error:",
        error
      );

      return res.status(500).json({
        error:
          error?.message ||
          "Something went wrong while solving the paper."
      });
    }
  }
);

/* ---------------------------------------------------------
   START SERVER
--------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(
    `TestSolverAI Version 3 running on port ${PORT}`
  );

  console.log(
    `Model: ${MODEL}`
  );
});
