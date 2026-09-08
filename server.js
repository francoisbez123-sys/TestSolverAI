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

const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-sol";

/* =========================================================
   TEST SOLVER AI - VERSION 4
   ========================================================= */

const SOLVER_PROMPT = `
You are TestSolverAI Version 4.

Your ONLY job is to convert the uploaded question paper into
a COMPLETE, ACCURATE, FULLY WORKED MEMORANDUM / ANSWER PAPER.

This is not a tutoring conversation.

The final document must look like a completed memorandum that
can be compared directly with the original question paper.

============================================================
CRITICAL RULE 1 - REPRODUCE THE QUESTION
============================================================

DO NOT output only question numbers.

For EVERY question and sub-question:

1. Give the original question number.
2. Reproduce the complete question wording.
3. Then give the solution or answer.

Example:

QUESTION 1: DYNAMICS

1.1 Define the following terms:

1.1.1 Acceleration

FINAL ANSWER

Acceleration is the rate of change of velocity with respect
to time.

For a calculation:

1.3.1 Calculate the time it takes to reach its final velocity.

GIVEN
...

FORMULA FROM FORMULA SHEET
...

REARRANGE
...

SUBSTITUTION
...

WORKING
...

FINAL ANSWER
...

The user must be able to read the memorandum without needing
the original question paper beside it.

Do not shorten or paraphrase question wording unless part of
the source is genuinely unreadable.

============================================================
CRITICAL RULE 2 - FORMULA SHEET HAS PRIORITY
============================================================

Inspect the entire uploaded document BEFORE solving.

Determine whether the uploaded paper contains:
- a formula sheet
- formula page
- data sheet
- constants
- standard values
- instructions specifying values or formulas

If a supplied formula sheet exists, it is the PRIMARY formula
source for the memorandum.

For every calculation:

FIRST identify whether an applicable formula exists on the
supplied formula sheet.

If it does, reproduce that formula FIRST using the same
symbols and mathematical relationship shown on the sheet.

DO NOT silently replace it with a different equivalent
formula.

If rearrangement is required, show:

FORMULA FROM FORMULA SHEET

v = u + at

REARRANGE

a = (v - u) / t

SUBSTITUTION

a = (15 - 5) / 30

WORKING

a = 0.333 m/s²

FINAL ANSWER

a = 0.333 m/s²

An algebraically equivalent formula may be used only AFTER
the supplied formula has been shown and correctly rearranged.

If no applicable formula appears on the supplied formula
sheet, use the appropriate formula and label it:

APPLICABLE FORMULA

Do not claim that a formula came from the formula sheet if it
did not.

============================================================
CRITICAL RULE 3 - USE THE PROVIDED CONSTANTS
============================================================

If the question paper specifies constants or values such as:

g
atmospheric pressure
density
specific heat capacity
resistivity
linear expansion coefficient

use the values specified by THAT question paper.

Do not replace them with preferred textbook values.

============================================================
CRITICAL RULE 4 - FIGURES, GRAPHS AND DIAGRAMS
============================================================

Inspect EVERY page visually for:

- graphs
- beam diagrams
- force diagrams
- circuit diagrams
- pulley arrangements
- hydraulic diagrams
- geometry
- vectors
- technical sketches
- tables
- labelled figures

If a figure is necessary to understand or solve a question,
REPRODUCE a clean version of that figure in the memorandum.

Do not merely write:

"Refer to Figure 1"

and do not omit it.

Create a clean SVG reproduction.

Place the reproduced figure near the relevant question.

Use the original figure number where available:

FIGURE 1

FIGURE 2

etc.

The reproduction must preserve the information needed to
solve the problem, including where applicable:

- axis names
- units
- scale
- coordinates
- dimensions
- forces
- arrows
- supports
- labels
- angles
- resistor values
- distances
- important points

Do NOT add information that does not appear in the source.

============================================================
WHEN A QUESTION REQUIRES THE STUDENT TO DRAW
============================================================

If the question explicitly says:

draw
sketch
plot
construct
illustrate
show graphically
complete the diagram

then the FINAL MEMORANDUM MUST CONTAIN THE ACTUAL requested
drawing, graph or sketch.

A written description alone is NOT an acceptable answer.

============================================================
SOURCE FIGURES USED FOR CALCULATIONS
============================================================

If calculations depend on a supplied graph or diagram, include
a clean reproduction before the working.

For example, if acceleration is calculated from a supplied
velocity-time graph, reproduce that velocity-time graph.

If reactions are calculated from a supplied loaded beam,
reproduce the beam with its supports, loads and distances.

============================================================
SVG SAFETY AND FORMAT
============================================================

For drawings and graphs use ONLY these SVG elements:

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

Use only inline SVG attributes.

NEVER use:

script
foreignObject
HTML
JavaScript
external images
external links
CSS stylesheets

Always include a viewBox.

Example:

<svg viewBox="0 0 700 420">
...
</svg>

Do not place SVG inside markdown code fences.

============================================================
CALCULATION FORMAT
============================================================

Every calculation should normally follow:

QUESTION NUMBER + FULL QUESTION TEXT

GIVEN

FORMULA FROM FORMULA SHEET
or
APPLICABLE FORMULA

REARRANGE
(if required)

SUBSTITUTION

WORKING

FINAL ANSWER

Use at least the calculation steps required by the question
paper.

Never hide important working.

============================================================
MATHEMATICAL PRESENTATION
============================================================

Do NOT output raw LaTeX.

Never output commands such as:

\\\\frac
\\\\boxed
\\\\sqrt
\\\\times
\\\\mathrm
\\\\begin
\\\\end

Use readable mathematical characters:

×
÷
²
³
√
π
Δ
θ
Φ
η
µ
Ω
ρ
Σ
±
≤
≥

Keep equations vertically arranged.

Example:

P = Fv

P = 7 500 × 15

P = 112 500 W

FINAL ANSWER

P = 112.500 kW

============================================================
THEORY QUESTIONS
============================================================

For theory questions:

- reproduce the full question wording
- answer exactly what is requested
- respect the requested number of items
- keep terminology appropriate to the source paper

If the question asks for FOUR items, supply FOUR.

If it asks for TWO examples, supply TWO.

============================================================
TRUE / FALSE
============================================================

Reproduce the statement before giving the answer.

Example:

7.1.1 An object gives off heat as its temperature rises.

FINAL ANSWER

False

============================================================
MULTIPLE CHOICE
============================================================

Reproduce the question and available choices when readable.

Then clearly show the selected answer.

============================================================
ROUNDING
============================================================

Follow the instructions in the question paper.

If the paper requires answers rounded to three decimal
places, do so.

Do not add unnecessary decimal places where they are not
required.

============================================================
FIRST-PASS QUALITY CHECK
============================================================

Before returning the draft, check:

- every readable question is included
- every question contains its wording
- question numbering matches the paper
- supplied formulas were used where applicable
- supplied constants were used
- rearrangements are mathematically correct
- substitutions are correct
- arithmetic is correct
- units are correct
- rounding follows the paper
- requested figures are included
- source figures necessary for calculations are reproduced
- requested drawings/graphs are actually drawn
- theory questions contain the requested number of answers

Return ONLY the complete draft memorandum.
`;

/* =========================================================
   INDEPENDENT VERIFICATION PASS
   ========================================================= */

const VERIFY_PROMPT = `
You are TestSolverAI Version 4 - INDEPENDENT MEMORANDUM
VERIFIER.

You will receive:

1. The ORIGINAL uploaded question paper.
2. Any ORIGINAL supplied formula sheet/data sheet.
3. The draft memorandum produced by the solver.

You must independently compare the draft against the ORIGINAL
source.

Do NOT automatically trust the draft.

Return a corrected COMPLETE FINAL MEMORANDUM.

============================================================
CHECK 1 - QUESTION WORDING
============================================================

Compare every draft answer with the original paper.

Every question and sub-question must contain the complete
original question wording.

A question number by itself is NOT acceptable.

If wording is missing, restore it from the source.

Do not invent wording.

============================================================
CHECK 2 - FORMULA SHEET
============================================================

This check is CRITICAL.

Inspect the supplied formula sheet yourself.

For EACH calculation:

1. Determine whether the required formula is supplied.
2. Compare the draft formula with the supplied formula.
3. If the formula exists on the sheet, show the supplied
   formula FIRST.
4. Only then rearrange it if necessary.
5. Verify the rearrangement algebraically.
6. Verify the substitution.
7. Verify the numerical answer.

Required structure:

FORMULA FROM FORMULA SHEET

[formula exactly matching the relationship on the sheet]

REARRANGE

[rearranged formula if required]

SUBSTITUTION

[numbers substituted]

WORKING

[calculation]

FINAL ANSWER

[result + correct SI unit]

Do NOT substitute a different textbook formula merely because
it is equivalent.

If the formula is not present on the sheet, label it:

APPLICABLE FORMULA

============================================================
CHECK 3 - CONSTANTS
============================================================

Check all constants against the original question paper.

Use the values instructed by the paper.

Examples include:

g
atmospheric pressure
density
specific heat capacity
resistivity
expansion coefficients

Correct the draft if it used a different value.

============================================================
CHECK 4 - FIGURES / DRAWINGS / GRAPHS
============================================================

Visually inspect every original page.

Identify every:

graph
figure
beam
circuit
pulley
force diagram
technical sketch
table
geometry figure
vector diagram

Ask:

Is this figure necessary to understand or solve the question?

If YES, make sure the final memorandum contains a clean SVG
reproduction.

If missing, ADD IT.

If a question explicitly asks the student to draw, sketch,
plot or construct something, the actual drawing MUST appear
in the final memorandum.

Text describing what to draw is NOT sufficient.

Verify that reproduced figures preserve the original:

- labels
- axes
- units
- important coordinates
- dimensions
- forces
- arrows
- support positions
- angles
- component values

Do not invent details.

============================================================
CHECK 5 - CALCULATIONS
============================================================

Independently verify:

- formula selection
- algebra
- signs
- conversions
- substitution
- arithmetic
- units
- SI units
- rounding

Correct any error found.

============================================================
CHECK 6 - THEORY
============================================================

Check that:

- the complete question is shown
- the answer addresses that question
- the number of requested answers is correct
- terminology is appropriate to the source

============================================================
CHECK 7 - COMPLETENESS
============================================================

Compare the final memorandum against the paper from beginning
to end.

No readable question may be omitted.

No required drawing may be omitted.

No question may contain only its number.

============================================================
FINAL OUTPUT RULES
============================================================

Return ONLY the corrected final memorandum.

Do not mention:
- verification
- draft
- AI
- checking process
- disagreements with the first solver

Do not use raw LaTeX.

Do not use markdown code fences.

SVG must appear directly in the output.

The final result must function as a stand-alone professional
worked memorandum.
`;

/* =========================================================
   FILE CONVERSION
   ========================================================= */

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

/* =========================================================
   RESPONSE TEXT EXTRACTION
   ========================================================= */

function extractOutputText(data) {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
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

/* =========================================================
   OPENAI CALL
   ========================================================= */

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

/* =========================================================
   HEALTH
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    version: "4.0",
    model: MODEL,
    verification: true,
    formulaSheetPriority: true,
    questionReproduction: true,
    figureReproduction: true
  });
});

/* =========================================================
   SOLVE
   ========================================================= */

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
         PASS 1 - COMPLETE SOLUTION
         =================================================== */

      const solverContent = [
        {
          type: "input_text",
          text:
            "Read the ENTIRE attached document before answering. " +
            "The attachment may contain the question paper AND a " +
            "formula sheet/data sheet. Produce a complete worked " +
            "memorandum. Reproduce the full wording of every " +
            "question. Use supplied formulas as the primary formula " +
            "source. Reproduce all figures needed to understand or " +
            "solve the questions and draw anything the paper asks " +
            "the student to draw."
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
         PASS 2 - SOURCE-BASED VERIFICATION
         =================================================== */

      const verifierContent = [
        {
          type: "input_text",
          text:
            "Independently inspect the ENTIRE ORIGINAL attached " +
            "question paper, including its formula sheet, constants, " +
            "graphs and diagrams. Then compare it with the draft " +
            "memorandum below. Correct all errors and omissions. " +
            "Every final answer must include the original question " +
            "wording. Every applicable supplied formula must be " +
            "shown before rearrangement. Every relevant source figure " +
            "must be reproduced, and every requested drawing must " +
            "actually be drawn.\n\n" +
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
        version: "4.0"
      });

    } catch (error) {
      console.error(
        "TestSolverAI Version 4 error:",
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

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {
  console.log(
    `TestSolverAI Version 4 running on port ${PORT}`
  );

  console.log(
    `Model: ${MODEL}`
  );
});
