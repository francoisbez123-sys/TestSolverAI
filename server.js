import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5.6-sol";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 20
  }
});

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* =========================================================
   TEST SOLVER AI VERSION 6.2
   FAST STRUCTURED MEMORANDUM ENGINE
   ========================================================= */


/* =========================================================
   OUTPUT SCHEMA
   ========================================================= */

const MEMO_SCHEMA = {
  type: "object",

  additionalProperties: false,

  required: [
    "title",
    "subtitle",
    "questions"
  ],

  properties: {
    title: {
      type: "string"
    },

    subtitle: {
      type: "string"
    },

    questions: {
      type: "array",

      items: {
        type: "object",

        additionalProperties: false,

        required: [
          "heading",
          "items"
        ],

        properties: {
          heading: {
            type: "string"
          },

          items: {
            type: "array",

            items: {
              type: "object",

              additionalProperties: false,

              required: [
                "number",
                "question_text",
                "blocks"
              ],

              properties: {
                number: {
                  type: "string"
                },

                question_text: {
                  type: "string"
                },

                blocks: {
                  type: "array",

                  items: {
                    type: "object",

                    additionalProperties: false,

                    required: [
                      "type",
                      "text",
                      "lines",
                      "items",
                      "diagram"
                    ],

                    properties: {
                      type: {
                        type: "string",

                        enum: [
                          "text",
                          "equation",
                          "list",
                          "or",
                          "graph",
                          "diagram"
                        ]
                      },

                      text: {
                        type: "string"
                      },

                      lines: {
                        type: "array",

                        items: {
                          type: "string"
                        }
                      },

                      items: {
                        type: "array",

                        items: {
                          type: "string"
                        }
                      },

                      diagram: {
                        type: "object",

                        additionalProperties: false,

                        required: [
                          "kind",
                          "title",
                          "x_label",
                          "y_label",
                          "x_values",
                          "y_values",
                          "svg"
                        ],

                        properties: {
                          kind: {
                            type: "string",

                            enum: [
                              "none",
                              "line_graph",
                              "source_figure",
                              "technical"
                            ]
                          },

                          title: {
                            type: "string"
                          },

                          x_label: {
                            type: "string"
                          },

                          y_label: {
                            type: "string"
                          },

                          x_values: {
                            type: "array",

                            items: {
                              type: "number"
                            }
                          },

                          y_values: {
                            type: "array",

                            items: {
                              type: "number"
                            }
                          },

                          svg: {
                            type: "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};


/* =========================================================
   SOLVER PROMPT
   ========================================================= */

const SOLVER_PROMPT = `
You are TestSolverAI Version 6.2.

Your sole purpose is to generate a COMPLETE worked examination
memorandum from uploaded question papers.

You are not tutoring the student.

You are producing the ANSWER PAPER / MEMORANDUM.


============================================================
IMPORTANT: A MEMO IS NOT REQUIRED
============================================================

An official memorandum may or may not be uploaded.

IF NO OFFICIAL MEMORANDUM IS PROVIDED:

You MUST generate the memorandum yourself.

Use:

1. The question paper
2. The formula sheet
3. The supplied constants and data
4. The examination instructions
5. Correct engineering/scientific calculations
6. Professional NATED/DHET-style memorandum presentation

Do NOT say that a memorandum is missing.

Do NOT ask the user to upload a memorandum.

The entire purpose of TestSolverAI is to CREATE the memorandum.


IF AN OFFICIAL MEMORANDUM IS PROVIDED:

Use it as the strongest reference for:

- accepted formula
- accepted method
- calculation sequence
- theory answers
- OR alternatives
- units
- rounding
- final results


============================================================
READ THE WHOLE PAPER FIRST
============================================================

Before producing answers, inspect ALL uploaded pages.

Identify:

- question paper
- formula sheet
- data/constants
- tables
- diagrams
- graphs
- official memo if one happens to be supplied

Do not begin solving after reading only the first page.


============================================================
SOURCE PRIORITY
============================================================

QUESTION PAPER controls:

- question wording
- question numbering
- numerical values
- instructions
- figures
- tables
- marks
- requested units


FORMULA SHEET controls:

- formulas
- notation
- symbols
- relationships


OFFICIAL MEMO, IF PRESENT, controls:

- preferred method
- accepted answer
- accepted alternatives
- presentation conventions


============================================================
FORMULA SHEET IS CRITICAL
============================================================

For EVERY calculation:

Check whether the required formula appears on the supplied
formula sheet.

If it does, use that formula.

Show the symbolic formula FIRST.

Then substitute values.

Then calculate the answer.

Then give the SI unit.


Example:

a = (v − u) / t
= (40 − 10) / 30
= 1 m/s²


Do NOT write:

a = change in velocity ÷ time


If the supplied formula is:

s = ut + ½at²

use:

s = ut + ½at²
= 0(9) + ½(12)(9²)
= 486 m


Do not replace supplied symbolic formulas with descriptive
English.


============================================================
DIRECT REARRANGEMENT
============================================================

If a formula must be rearranged, a direct algebraic
rearrangement is allowed.

Do not introduce an unrelated alternative formula merely
because it also gives the answer.


============================================================
EXAMINATION CALCULATION STYLE
============================================================

Follow the compact style of an official marking guideline.

A typical answer should contain:

symbolic formula
substitution
calculation
answer with unit


Example:

P = W / t
= 157 500 / (2 × 60)
= 1 312,5 W


Do NOT use unnecessary headings such as:

GIVEN
FORMULA
REARRANGE
SUBSTITUTION
WORKING
FINAL ANSWER


============================================================
FULL QUESTION WORDING
============================================================

Every numbered item must retain the full question wording.

The user wants a standalone answer paper.

For example:

1.3 An object starting from rest accelerates at 12 m/s² for
9 seconds. Calculate the displacement of the object.

Then show:

s = ut + ½at²
= 0(9) + ½(12)(9²)
= 486 m


Do not output only the question number.


============================================================
NUMBER FORMAT
============================================================

Be extremely careful with South African decimal-comma notation.

A comma is a DECIMAL separator only when there is an actual
decimal fraction.


CORRECT:

1 m/s²
486 m
480 N
1 500 N
157 500 J


CORRECT DECIMAL VALUES:

29,167 m/s
153,846 N
326,154 N
31,888 m
2,842
2,941


INCORRECT:

1,000 m/s²
486,000 m
480,000 N
1 500,000 N
157 500,000 J


Never append ",000" to an exact whole number.


============================================================
ROUNDING
============================================================

Follow the instructions on the question paper.

If the paper specifies three decimal places where applicable:

- round non-exact decimal results to three decimals
- leave exact integer answers as integers

Example:

153,846 N

but:

486 m


============================================================
THEORY ANSWERS
============================================================

Answer theory questions in concise memorandum style.

If an official memo is available, use an accepted answer from it.

If no memo is available, give a technically correct answer at the
level of the examination.

For:

Name THREE
Give THREE
List THREE

give exactly THREE answers.

Do not give eight possible answers when only three are requested.


============================================================
OR METHODS
============================================================

If an official memo provides an OR method, it may be preserved.

If no memo is supplied:

Only provide an OR method when there are clearly two standard
accepted examination methods and showing the alternative is
useful.

Do not clutter every calculation with alternatives.


============================================================
GRAPHS
============================================================

If the question says:

draw
plot
sketch
construct a graph

then a graph block MUST exist.


For standard XY / time graphs use:

type = "graph"

diagram.kind = "line_graph"


Supply exact numerical coordinate arrays.

Example:

Time:
0, 10, 20, 30, 40, 50, 60

Velocity:
10, 20, 30, 40, 40, 40, 0


Return:

x_values:
[0,10,20,30,40,50,60]

y_values:
[10,20,30,40,40,40,0]

x_label:
Time (s)

y_label:
Velocity (m/s)


The application will draw the graph.

Do NOT attempt SVG for an ordinary line graph.


============================================================
SOURCE FIGURES
============================================================

If an existing question-paper figure is materially needed for
understanding the working, recreate it.

Examples:

- loaded beam
- Weston pulley
- circuit
- force diagram
- mechanical system


Use:

type = "diagram"

diagram.kind = "source_figure"


The SVG must contain real graphical elements.

Allowed:

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


Always provide a viewBox.


Never use:

script
foreignObject
JavaScript
external images
external URLs


============================================================
NO FAKE DIAGRAMS
============================================================

This is NOT a diagram:

L R 160 N 70 N 250 N 2 m 4 m 13 m 1 m


A diagram must have actual:

lines
arrows
supports
loads
dimensions
shapes
labels


If you cannot reliably recreate a non-essential figure,
do not create a fake text figure.


============================================================
DYNAMICS
============================================================

Use formula-sheet notation.

Acceleration:

a = (v − u) / t


Uniform acceleration:

s = ut + ½at²


Average velocity:

v = s / t


For displacement from a velocity-time graph:

calculate the AREA UNDER THE GRAPH using accepted geometry.

For example:

S = ½bh + lb + lb + ½bh

then substitute dimensions.


============================================================
STATICS
============================================================

Use moments correctly.

Example style:

Take moments about R:

Σ clockwise moments = Σ anticlockwise moments

(L × 13) + (250 × 1)
= (70 × 7) + (160 × 11)

13L = 2 000

L = 153,846 N


Take moments about L:

Σ clockwise moments = Σ anticlockwise moments

(160 × 2) + (70 × 6) + (250 × 14)
= R × 13

4 240 = 13R

R = 326,154 N


============================================================
ENERGY
============================================================

Use the formula-sheet energy equations where applicable.

Example:

Ek = ½mv²

Ep = mgh


For conservation of energy, clearly equate the required forms.


============================================================
WORK AND POWER
============================================================

Use:

W = F × s

P = W / t


For a force-displacement graph:

work = area under graph


Show the actual area calculation.


============================================================
MECHANICAL DRIVES
============================================================

Use supplied formula-sheet notation.

Mechanical advantage:

MA = L / E


Velocity/displacement ratio for Weston pulley:

VR = 2D / (D − d)


Efficiency:

η = MA / VR × 100%


Belt velocity:

v = πdn


Use the exact formula-sheet relationship where available.


============================================================
FRICTION
============================================================

Use formulas supplied on the paper.

Examples:

Fc = w cos θ

Fs = w sin θ

μ = Fμ / Fc


============================================================
HEAT
============================================================

Use supplied heat formulas and constants.

Examples:

Q = mcΔt

Qlost = Qgained

P = Q / t


Perform unit conversions carefully.


============================================================
ELECTRICITY
============================================================

Use supplied formula-sheet relationships.

Parallel resistance:

1 / Rp = 1 / R1 + 1 / R2 + ... + 1 / Rn


Resistance of conductor:

R = ρl / A


Show formula, substitution and final answer.


============================================================
MATHEMATICAL NOTATION
============================================================

Use normal readable Unicode.

Use characters such as:

½
²
³
√
π
Σ
θ
η
ρ
Ω
Δ
×
÷
↑
↓


Do NOT output LaTeX.

Forbidden:

\\frac
\\boxed
\\begin
\\end
\\text
\\mathrm
\\left
\\right
\\[
\\]


============================================================
FINAL SELF-CHECK
============================================================

Before returning the structured memorandum, perform ONE internal
verification of your own work.

Check:

- every question is answered
- numbering is correct
- full question wording is retained
- the formula sheet was actually used
- symbolic formulas appear before substitutions
- substitutions are correct
- arithmetic is correct
- units are correct
- rounding is correct
- exact integers remain integers
- decimal commas are only used for real decimals
- graphs contain correct coordinates
- diagrams contain real shapes
- theory questions contain the requested number of answers
- no raw LaTeX remains

Correct any errors BEFORE returning the JSON.

Return only the final structured memorandum.
`;


/* =========================================================
   FILE INPUT
   ========================================================= */

function fileToInputPart(file) {
  const mime =
    file.mimetype ||
    "application/octet-stream";

  const b64 =
    file.buffer.toString("base64");

  if (mime.startsWith("image/")) {
    return {
      type: "input_image",

      image_url:
        `data:${mime};base64,${b64}`,

      detail: "high"
    };
  }

  return {
    type: "input_file",

    filename:
      file.originalname ||
      "document",

    file_data:
      `data:${mime};base64,${b64}`
  };
}


/* =========================================================
   EXTRACT RESPONSE
   ========================================================= */

function extractOutputText(data) {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text;
  }

  const pieces = [];

  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (!Array.isArray(item?.content)) {
        continue;
      }

      for (const part of item.content) {
        if (
          part?.type === "output_text" &&
          typeof part.text === "string"
        ) {
          pieces.push(part.text);
        }
      }
    }
  }

  return pieces.join("\n");
}


/* =========================================================
   OPENAI REQUEST
   ========================================================= */

async function callStructuredOpenAI({
  instructions,
  content
}) {
  const response =
    await fetch(
      "https://api.openai.com/v1/responses",

      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          model: MODEL,

          reasoning: {
            effort: "medium"
          },

          instructions,

          input: [
            {
              role: "user",
              content
            }
          ],

          text: {
            format: {
              type: "json_schema",

              name:
                "testsolver_memorandum",

              strict: true,

              schema:
                MEMO_SCHEMA
            }
          }
        })
      }
    );

  const data =
    await response.json();

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

  const text =
    extractOutputText(data);

  if (!text.trim()) {
    throw new Error(
      "No structured memorandum was returned."
    );
  }

  try {
    return JSON.parse(text);

  } catch (error) {
    console.error(
      "JSON parse error:",
      text.slice(0, 1500)
    );

    throw new Error(
      "The AI returned invalid structured data."
    );
  }
}


/* =========================================================
   ESCAPE SVG TEXT
   ========================================================= */

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   SERVER GRAPH CREATOR
   ========================================================= */

function createLineGraph(diagram) {
  const xs =
    Array.isArray(diagram?.x_values)
      ? diagram.x_values
      : [];

  const ys =
    Array.isArray(diagram?.y_values)
      ? diagram.y_values
      : [];

  if (
    xs.length < 2 ||
    xs.length !== ys.length
  ) {
    return "";
  }

  const width = 720;
  const height = 440;

  const left = 90;
  const right = 40;
  const top = 55;
  const bottom = 80;

  const plotW =
    width - left - right;

  const plotH =
    height - top - bottom;

  const minX =
    Math.min(...xs, 0);

  const maxX =
    Math.max(...xs, 1);

  const minY =
    Math.min(...ys, 0);

  const maxY =
    Math.max(...ys, 1);

  const xRange =
    maxX - minX || 1;

  const yRange =
    maxY - minY || 1;

  const px = x =>
    left +
    ((x - minX) / xRange) *
      plotW;

  const py = y =>
    top +
    plotH -
    ((y - minY) / yRange) *
      plotH;

  const points =
    xs
      .map(
        (x, i) =>
          `${px(x).toFixed(1)},${py(
            ys[i]
          ).toFixed(1)}`
      )
      .join(" ");

  const uniqueX =
    [...new Set(xs)]
      .sort(
        (a, b) => a - b
      );

  const uniqueY =
    [...new Set([0, ...ys])]
      .sort(
        (a, b) => a - b
      );

  const xTicks =
    uniqueX
      .map(
        x => `
        <line
          x1="${px(x)}"
          y1="${top}"
          x2="${px(x)}"
          y2="${top + plotH}"
          stroke="#dddddd"
          stroke-width="1"
        />

        <text
          x="${px(x)}"
          y="${top + plotH + 28}"
          text-anchor="middle"
          font-size="15"
        >${esc(x)}</text>
      `
      )
      .join("");

  const yTicks =
    uniqueY
      .map(
        y => `
        <line
          x1="${left}"
          y1="${py(y)}"
          x2="${left + plotW}"
          y2="${py(y)}"
          stroke="#dddddd"
          stroke-width="1"
        />

        <text
          x="${left - 15}"
          y="${py(y) + 5}"
          text-anchor="end"
          font-size="15"
        >${esc(y)}</text>
      `
      )
      .join("");

  const pointDots =
    xs
      .map(
        (x, i) => `
        <circle
          cx="${px(x)}"
          cy="${py(ys[i])}"
          r="4"
          fill="black"
        />
      `
      )
      .join("");

  return `
<svg
  viewBox="0 0 ${width} ${height}"
  xmlns="http://www.w3.org/2000/svg"
>
  <text
    x="${width / 2}"
    y="28"
    text-anchor="middle"
    font-size="21"
    font-weight="700"
  >${esc(diagram.title || "Graph")}</text>

  ${xTicks}
  ${yTicks}

  <line
    x1="${left}"
    y1="${top}"
    x2="${left}"
    y2="${top + plotH}"
    stroke="black"
    stroke-width="2"
  />

  <line
    x1="${left}"
    y1="${top + plotH}"
    x2="${left + plotW}"
    y2="${top + plotH}"
    stroke="black"
    stroke-width="2"
  />

  <polyline
    points="${points}"
    fill="none"
    stroke="black"
    stroke-width="4"
    stroke-linejoin="round"
    stroke-linecap="round"
  />

  ${pointDots}

  <text
    x="${left + plotW / 2}"
    y="${height - 18}"
    text-anchor="middle"
    font-size="17"
    font-weight="700"
  >${esc(diagram.x_label || "x")}</text>

  <text
    x="24"
    y="${top + plotH / 2}"
    text-anchor="middle"
    font-size="17"
    font-weight="700"
    transform="rotate(-90 24 ${
      top + plotH / 2
    })"
  >${esc(diagram.y_label || "y")}</text>
</svg>
`;
}


/* =========================================================
   CLEAN EQUATION
   ========================================================= */

function cleanEquation(line) {
  return String(line ?? "")
    .replace(/\\boxed\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\text\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\mathrm\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\eta/g, "η")
    .replace(/\\rho/g, "ρ")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\uparrow/g, "↑")
    .replace(/\\downarrow/g, "↓")
    .replace(/\\,/g, " ")
    .replace(/\\\\/g, "")
    .replace(/\\begin\{[^}]+\}/g, "")
    .replace(/\\end\{[^}]+\}/g, "")
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .trim();
}


/* =========================================================
   FALLBACK MEMO CONVERTER
   ========================================================= */

function structureToMemo(memo) {
  const out = [];

  if (memo.title) {
    out.push(
      memo.title.toUpperCase()
    );
  }

  if (memo.subtitle) {
    out.push(
      memo.subtitle
    );
  }

  out.push("");

  for (
    const section
    of memo.questions || []
  ) {
    const heading =
      String(section.heading || "");

    out.push(
      /^QUESTION/i.test(heading)
        ? heading
        : `QUESTION ${heading}`
    );

    out.push("");

    for (
      const item
      of section.items || []
    ) {
      out.push(
        [
          item.number,
          item.question_text
        ]
          .filter(Boolean)
          .join(" ")
      );

      out.push("");

      for (
        const block
        of item.blocks || []
      ) {
        if (
          block.type === "text"
        ) {
          if (block.text) {
            out.push(
              cleanEquation(
                block.text
              )
            );

            out.push("");
          }

          continue;
        }

        if (
          block.type === "equation"
        ) {
          for (
            const line
            of block.lines || []
          ) {
            out.push(
              cleanEquation(line)
            );
          }

          out.push("");

          continue;
        }

        if (
          block.type === "list"
        ) {
          for (
            const entry
            of block.items || []
          ) {
            out.push(
              `• ${cleanEquation(
                entry
              )}`
            );
          }

          out.push("");

          continue;
        }

        if (
          block.type === "or"
        ) {
          out.push("OR");
          out.push("");

          continue;
        }

        if (
          block.type === "graph"
        ) {
          const svg =
            createLineGraph(
              block.diagram
            );

          if (svg) {
            out.push(svg);
            out.push("");
          }

          continue;
        }

        if (
          block.type === "diagram"
        ) {
          const svg =
            String(
              block?.diagram?.svg ||
              ""
            ).trim();

          if (
            svg.startsWith("<svg") &&
            svg.includes("</svg>")
          ) {
            out.push(svg);
            out.push("");
          }

          continue;
        }
      }
    }
  }

  return out.join("\n");
}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  "/api/health",

  (req, res) => {
    res.json({
      ok: true,

      version: "6.2",

      model: MODEL,

      mode:
        "single-pass-structured-memo"
    });
  }
);


/* =========================================================
   SOLVE
   ========================================================= */

app.post(
  "/api/solve",

  upload.array(
    "files",
    20
  ),

  async (req, res) => {
    try {

      if (
        !process.env
          .OPENAI_API_KEY
      ) {
        return res
          .status(500)
          .json({
            error:
              "OPENAI_API_KEY is not configured on the server."
          });
      }


      if (
        !req.files ||
        req.files.length === 0
      ) {
        return res
          .status(400)
          .json({
            error:
              "Please upload a question paper or take a photo first."
          });
      }


      console.log(
        `V6.2 solving ${req.files.length} file(s)`
      );


      const sourceParts =
        req.files.map(
          fileToInputPart
        );


      const memorandum =
        await callStructuredOpenAI({
          instructions:
            SOLVER_PROMPT,

          content: [
            {
              type:
                "input_text",

              text:
                "Read every uploaded page before answering. " +
                "Generate the complete worked memorandum yourself. " +
                "An official memorandum is NOT required. " +
                "Use the supplied formula sheet as the primary formula source. " +
                "Show symbolic formula, substitution and answer with SI unit. " +
                "Use compact examination memorandum style. " +
                "If an official memo happens to be uploaded, use it as the " +
                "strongest reference. Perform your own final accuracy check " +
                "before returning the structured memorandum."
            },

            ...sourceParts
          ]
        });


      const answer =
        structureToMemo(
          memorandum
        );


      console.log(
        "V6.2 memorandum completed successfully"
      );


      return res.json({
        answer,

        structured:
          memorandum,

        model:
          MODEL,

        verified:
          true,

        version:
          "6.2",

        mode:
          "single-pass-structured-memo"
      });


    } catch (error) {

      console.error(
        "TestSolverAI V6.2 error:",
        error
      );


      let message =
        error?.message ||
        "Something went wrong while solving the paper.";


      if (
        message.includes(
          "UND_ERR_HEADERS_TIMEOUT"
        ) ||
        message.toLowerCase()
          .includes(
            "headers timeout"
          )
      ) {
        message =
          "The AI took too long to process the complete paper. Please try again.";
      }


      return res
        .status(500)
        .json({
          error: message
        });
    }
  }
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
  PORT,

  () => {
    console.log(
      `TestSolverAI Version 6.2 running on port ${PORT}`
    );

    console.log(
      `Model: ${MODEL}`
    );

    console.log(
      "Mode: Single-pass structured memorandum"
    );
  }
);
