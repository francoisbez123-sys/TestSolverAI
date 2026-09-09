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
   TEST SOLVER AI VERSION 6.1
   OFFICIAL MEMO + FORMULA FIDELITY
   ========================================================= */


/* =========================================================
   STRUCTURED OUTPUT SCHEMA
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
   MAIN SOLVER PROMPT
   ========================================================= */

const SOLVER_PROMPT = `
You are TestSolverAI Version 6.1.

Your task is to create a COMPLETE worked examination memorandum
from uploaded examination material.

You are NOT a tutor.

You are producing an examination-style memorandum / marking
guideline.

Your output MUST conform exactly to the supplied JSON schema.

Do not return markdown.
Do not return prose outside the JSON structure.
Do not return LaTeX.


============================================================
FIRST: IDENTIFY ALL SOURCE DOCUMENTS
============================================================

Inspect EVERY uploaded file and EVERY page before answering.

Determine whether the upload contains:

1. QUESTION PAPER
2. FORMULA SHEET / DATA SHEET
3. OFFICIAL MEMORANDUM / MARKING GUIDELINE
4. SUPPORTING NOTES OR OTHER REFERENCES


============================================================
SOURCE AUTHORITY
============================================================

QUESTION PAPER is authoritative for:

- exact question wording
- question numbering
- numerical information
- tables
- figures
- diagrams
- instructions
- required units
- marks
- required number of answers


FORMULA SHEET is authoritative for:

- formulas expected in the examination
- symbols
- constants
- supplied relationships


OFFICIAL MEMORANDUM / MARKING GUIDELINE is authoritative for:

- accepted solution method
- formula selected
- sequence of calculations
- accepted definitions
- accepted theory answers
- OR alternatives
- rounding
- units
- final numerical results
- examination memo presentation


============================================================
CRITICAL RULE WHEN OFFICIAL MEMO IS UPLOADED
============================================================

When an official memorandum or marking guideline is present,
you MUST study it question by question.

For EACH question:

1. Read the full question from the question paper.
2. Find the matching question in the official memorandum.
3. Use the SAME formula shown in the official memorandum.
4. Use the SAME accepted calculation method.
5. Use the SAME logical sequence.
6. Use the SAME final answer where the source data matches.
7. Use the SAME units.
8. Use the SAME rounding convention.
9. Include meaningful accepted OR methods when appropriate.

Do not substitute your own preferred method.

Do not simplify the official method into an explanation.

Do not convert symbolic formulas into descriptive English.

The generated answer paper must behave like the official
marking guideline.


============================================================
QUESTION WORDING
============================================================

The user wants a standalone worked memorandum.

Therefore every question and sub-question MUST contain the full
question wording from the question paper.

Example:

1.2.2 Determine the following from the graph drawn in QUESTION
1.2.1: The acceleration of the car during the first 30 seconds.

Then show the official-style working underneath.

Do not return only:

1.2.2

Do not substantially paraphrase the original wording.


============================================================
FORMULA FIDELITY
============================================================

Before solving a calculation:

CHECK THE FORMULA SHEET.

If the required formula exists on the supplied formula sheet,
use that symbolic formula.

Do not rewrite a symbolic formula into words.

CORRECT:

a = (v − u) / t
= (40 − 10) / 30
= 1 m/s²


INCORRECT:

a = change in velocity ÷ time
= (40 − 10) ÷ 30
= 1 m/s²


CORRECT:

s = ut + ½at²
= 0(9) + ½(12)(9²)
= 486 m


Do not replace it with a different valid formula if the official
memo uses the supplied formula.

Direct algebraic rearrangement is allowed where required.


============================================================
EXAMINATION MEMO STYLE
============================================================

Use compact vertical calculation working.

Do NOT add tutorial headings such as:

GIVEN
FORMULA
REARRANGE
SUBSTITUTION
WORKING
FINAL ANSWER

unless those words genuinely appear in the official marking
guideline.

A calculation should normally look like this:

a = (v − u) / t
= (40 − 10) / 30
= 1 m/s²


NOT:

FORMULA
a = ...

SUBSTITUTION
a = ...

WORKING
...

FINAL ANSWER
...


============================================================
QUESTION PAPER INSTRUCTIONS
============================================================

Follow the examination instructions.

If the paper requires calculations to show:

- formula or manipulation
- substitution
- answer with SI unit

then the memorandum must visibly contain those steps.

Do not skip the formula.

Do not skip substitution.


============================================================
ROUNDING
============================================================

Follow the question paper and official memorandum.

Where applicable, round as required by the examination.

IMPORTANT:

Do not add false trailing decimal zeros.

Correct:

1 m/s²
486 m
1 500 N
157 500 J
480 N


Incorrect:

1,000 m/s²
486,000 m
1 500,000 N
157 500,000 J
480,000 N


South African examination material may use a comma as a decimal
separator.

Examples of genuine decimals:

153,846 N
326,154 N
29,167 m/s
31,888 m
2,842
2,941
96,634%

Only use a decimal comma when there is a genuine decimal
fraction.


============================================================
THEORY QUESTIONS
============================================================

When an official memorandum exists:

Use an accepted definition or answer from the official memorandum.

Do not replace it with a different textbook definition merely
because it is also correct.

If the memorandum provides several OR definitions, normally use
one accepted version unless the alternatives are useful.

For:

Name THREE...
Give THREE...

return exactly THREE answers unless the source requires otherwise.


============================================================
OR ALTERNATIVE METHODS
============================================================

If the official memorandum contains an accepted alternative
method that is useful to show, preserve it.

Use a block:

type = "or"

between the methods.

Example:

first accepted method

OR

second accepted method

Do not invent OR alternatives when an official memo is supplied.


============================================================
DYNAMICS STYLE
============================================================

For acceleration, preserve symbolic notation.

Example:

a = (v − u) / t
= (40 − 10) / 30
= 1 m/s²


For displacement from a velocity-time graph, if the official memo
uses area calculation, use the same area method.

Example style:

S = ½bh + lb + lb + ½bh
= (10 × 50) + (0,5 × 30 × 30) + (30 × 20) + (0,5 × 10 × 40)
= 1 750 m


If the official memorandum also accepts a trapezium method,
it may be shown after an OR block.


For average velocity:

v = s / t
= 1 750 / 60
= 29,167 m/s


For uniformly accelerated motion:

s = ut + ½at²
= 0(9) + ½(12)(9²)
= 486 m


============================================================
STATICS STYLE
============================================================

Follow the official memo's moment method.

Example:

Take moments about R:

Σ↓M = Σ↑M

(L × 13) + (250 × 1)
= (70 × 7) + (160 × 11)

13L = 2 000

L = 153,846 N


Take moments about L:

Σ↓M = Σ↑M

(160 × 2) + (70 × 6) + (250 × 14)
= (R × 13)

4 240 = 13R

R = 326,154 N


For equilibrium checking, use the same force balance convention
as the official memorandum.


============================================================
ENERGY AND MOMENTUM
============================================================

If the memorandum uses conservation of energy, reproduce that
method.

Example style:

Ek = ½mv²
= ½(0,6)(25²)
= 187,5 J

Ep top = Ek bottom

mgh = 187,5

h = 187,5 / (0,6 × 9,8)

= 31,888 m


If the official memorandum shows another accepted OR method,
preserve it where useful.


============================================================
WORK, POWER AND EFFICIENCY
============================================================

Follow the official memorandum's selected equations and area
methods.

Example:

Weightchain = 6 000 − 4 500
= 1 500 N


For work from a graph, preserve the official area calculation.

For power:

P = W / t

Use the exact substitution sequence in the marking guideline.


============================================================
MECHANICAL DRIVES
============================================================

Use the formula-sheet symbols and the official memorandum method.

Examples:

MA = L / E
= (87 × 9,8) / 300
= 2,842


VR = 2D / (D − d)
= 2(250) / (250 − 80)
= 2,941


η = MA / VR × 100%
= 2,842 / 2,941 × 100%
= 96,634%


For belt drives, preserve the formula-sheet notation used by the
official memo.


============================================================
FRICTION
============================================================

Use formula-sheet notation.

Example:

Fc = w cos θ
= 50 × 9,8 × cos 15°
= 473,304 N


μ = Fμ / Fc
= 400 / 473,304
= 0,845


Fs = w sin θ
= 50 × 9,8 × sin 15°
= 126,821 N


Follow the official memorandum sequence.


============================================================
HEAT
============================================================

Use supplied constants.

Respect density conversions.

Respect heat-loss percentage.

For mixture calculations preserve:

Qlost = Qgained

and then the official equation sequence.


============================================================
ELECTRICITY
============================================================

Use formula-sheet formulas.

Example:

1 / Rp = 1 / R1 + 1 / R2 + 1 / R3

= 1 / 4 + 1 / 3 + 1 / 6

1 / Rp = 3 / 4

Rp = 1,333 Ω


Follow the official memo if it uses an accepted alternate
calculation.


============================================================
GRAPHS
============================================================

If a question requires the candidate to draw or plot a graph,
a graph block MUST be returned.

For a standard XY graph use:

type = "graph"

diagram.kind = "line_graph"


Supply actual coordinates.

Example:

x_values:
[0,10,20,30,40,50,60]

y_values:
[10,20,30,40,40,40,0]


x_label:
Time (s)

y_label:
Velocity (m/s)


The application itself will draw the graph.

Do not put SVG into diagram.svg for normal line graphs.

Do not return only graph labels.


============================================================
SOURCE FIGURES
============================================================

When an original figure is materially required to understand the
question or calculation, reproduce the figure.

Examples:

loaded beam
Weston pulley
force-displacement graph
electrical circuit
mechanical system


For source diagrams:

type = "diagram"

diagram.kind = "source_figure"
or
diagram.kind = "technical"


diagram.svg must contain actual SVG geometry.

Allowed elements:

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


Never use:

script
foreignObject
HTML
JavaScript
external links
external images


Always use a viewBox.


============================================================
NO FAKE DIAGRAMS
============================================================

Never return something like:

L R 160 N 70 N 250 N 2 m 4 m 13 m 1 m

and pretend it is a diagram.

A diagram must contain real SVG lines/shapes/arrows.


============================================================
MATHEMATICAL CHARACTER RULES
============================================================

Use readable Unicode notation.

Examples:

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


Do not output LaTeX.

Never output:

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
NO METHOD INVENTION
============================================================

When an official memorandum is uploaded:

Do not improve it.
Do not modernise it.
Do not replace its formulas.
Do not change its solving method.
Do not insert unnecessary explanation.
Do not choose another correct method merely because you prefer it.

Mirror the official examination method as closely as possible.


============================================================
FINAL INTERNAL CHECK
============================================================

Before returning the memorandum verify internally:

- every readable question is present
- question order is correct
- full question wording is present
- formulas come from the supplied formula sheet where applicable
- official memo method is followed when supplied
- substitutions are shown
- final answers match accepted memo answers
- SI units are correct
- rounding matches the examination
- integers have not become false decimal-comma numbers
- graphs contain actual coordinate data
- diagrams contain actual drawings
- no LaTeX remains
- no tutoring-style headings were added
`;


/* =========================================================
   VERIFICATION PROMPT
   ========================================================= */

const VERIFY_PROMPT = `
You are TestSolverAI Version 6.1 FINAL VERIFIER.

You receive:

1. The ORIGINAL uploaded examination files.
2. A structured draft memorandum.

Your task is NOT merely to proofread the draft.

Independently inspect the source files and correct the draft
question by question.

Return the COMPLETE corrected memorandum using exactly the same
JSON schema.


============================================================
SOURCE PRIORITY
============================================================

QUESTION PAPER:

authoritative for:
- wording
- numbering
- figures
- numerical values
- question requirements


FORMULA SHEET:

authoritative for:
- examination formulas
- symbols
- constants


OFFICIAL MEMORANDUM:

authoritative for:
- accepted method
- formula selection
- sequence
- accepted definitions
- alternative methods
- rounding
- units
- final answer
- marking-guideline style


============================================================
STRICT QUESTION-BY-QUESTION COMPARISON
============================================================

If an official memorandum exists:

Compare EVERY draft answer against the corresponding official
memorandum answer.

For calculations verify:

- same formula
- same symbolic notation
- same substitution
- same method
- same calculation sequence
- same final value
- same SI unit
- same rounding
- same accepted OR alternatives where useful


If the draft uses a different valid formula while the official
memo uses another formula:

CHANGE THE DRAFT TO MATCH THE OFFICIAL MEMO.


============================================================
FORMULA-SHEET VERIFICATION
============================================================

For EVERY numerical calculation:

Inspect the supplied formula sheet.

If the required formula exists there:

the final answer must use that formula or a direct algebraic
rearrangement.

Do not allow formulas to be rewritten into plain English.


Example:

INCORRECT:

a = change in velocity ÷ time


CORRECT:

a = (v − u) / t


============================================================
EXAM WORKING
============================================================

Where the examination requires:

1. Formula
2. Substitution
3. Answer with SI unit

ensure all three appear.

Do not omit the symbolic formula.


============================================================
NUMBER-FORMAT VERIFICATION
============================================================

Carefully distinguish integers from decimal-comma answers.

INCORRECT:

1,000 m/s²
486,000 m
1 500,000 N
157 500,000 J
480,000 N


CORRECT:

1 m/s²
486 m
1 500 N
157 500 J
480 N


Valid decimal-comma examples:

153,846 N
326,154 N
29,167 m/s
31,888 m
473,304 N


Never add ",000" merely because the examination uses decimal
commas elsewhere.


============================================================
QUESTION WORDING
============================================================

Each numbered item must contain the complete wording from the
question paper.

Correct any shortened or paraphrased wording where the original
is available.


============================================================
THEORY ANSWERS
============================================================

When an official memorandum is supplied:

Use an accepted official answer.

Do not substitute a different textbook definition.

For:

Give THREE...
Name THREE...

return exactly the requested number of answers.


============================================================
GRAPH CHECK
============================================================

When a question requires a graph:

- a graph block must exist
- graph type must be line_graph when appropriate
- x coordinates must match source data
- y coordinates must match source data
- x-axis label must be correct
- y-axis label must be correct
- overall graph shape must agree with source / official memo


Do not accept graph text without actual graph data.


============================================================
DIAGRAM CHECK
============================================================

When an important source figure is needed:

- a diagram block must exist
- SVG must contain actual lines / shapes
- labels must correspond to the source
- dimensions must correspond to the source
- loads / forces must be positioned sensibly

Reject fake text-only diagrams.


============================================================
OFFICIAL MEMO STYLE
============================================================

The final memorandum must look like compact examination working.

Do not add:

GIVEN
FORMULA
REARRANGE
SUBSTITUTION
WORKING
FINAL ANSWER

unless genuinely present in the supplied official memorandum.


============================================================
LATEX CHECK
============================================================

No raw LaTeX may remain.

Remove:

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


Replace with readable Unicode notation.


============================================================
FINAL RESPONSIBILITY
============================================================

Re-solve calculations where necessary.

Do not trust the first draft merely because it looks plausible.

The corrected final memorandum must match the source material as
closely as possible.
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
   EXTRACT RESPONSE TEXT
   ========================================================= */

function extractOutputText(data) {
  if (
    typeof data?.output_text ===
      "string" &&
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
   OPENAI STRUCTURED REQUEST
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
            effort: "high"
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
      JSON.stringify(
        data,
        null,
        2
      )
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
      "No structured answer was returned."
    );
  }

  try {
    return JSON.parse(text);

  } catch (error) {
    console.error(
      "Structured JSON parse error:",
      text.slice(0, 1500)
    );

    throw new Error(
      "The AI returned an invalid structured memorandum."
    );
  }
}


/* =========================================================
   HTML / SVG ESCAPE
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
   SERVER-SIDE LINE GRAPH CREATOR
   ========================================================= */

function createLineGraph(diagram) {
  const xs =
    Array.isArray(
      diagram?.x_values
    )
      ? diagram.x_values
      : [];

  const ys =
    Array.isArray(
      diagram?.y_values
    )
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
  >${esc(
    diagram.title ||
      "Graph"
  )}</text>

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
  >${esc(
    diagram.x_label ||
      "x"
  )}</text>

  <text
    x="24"
    y="${top + plotH / 2}"
    text-anchor="middle"
    font-size="17"
    font-weight="700"
    transform="rotate(-90 24 ${
      top + plotH / 2
    })"
  >${esc(
    diagram.y_label ||
      "y"
  )}</text>
</svg>
`;
}


/* =========================================================
   CLEAN EQUATION TEXT
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
   STRUCTURED DATA TO FALLBACK TEXT
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
    out.push(
      `QUESTION ${section.heading}`
    );

    out.push("");

    for (
      const item
      of section.items || []
    ) {
      const questionLine =
        [
          item.number,
          item.question_text
        ]
          .filter(Boolean)
          .join(" ");

      out.push(questionLine);

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
              cleanEquation(
                line
              )
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

      version: "6.1",

      model: MODEL,

      mode:
        "official-memo-formula-fidelity"
    });
  }
);


/* =========================================================
   SOLVE ENDPOINT
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


      const sourceParts =
        req.files.map(
          fileToInputPart
        );


      /* =====================================================
         PASS 1 — SOLVE
         ===================================================== */

      const draft =
        await callStructuredOpenAI({
          instructions:
            SOLVER_PROMPT,

          content: [
            {
              type:
                "input_text",

              text:
                "Read ALL uploaded files and ALL pages before answering. " +
                "Identify the question paper, formula sheet and any official " +
                "memorandum or marking guideline. Produce a complete structured " +
                "worked memorandum. If an official memorandum is present, match " +
                "its formulas, calculation sequence, answers, rounding, OR methods " +
                "and examination style. Use the full original question wording."
            },

            ...sourceParts
          ]
        });


      /* =====================================================
         PASS 2 — VERIFY AGAINST ORIGINAL FILES
         ===================================================== */

      const verified =
        await callStructuredOpenAI({
          instructions:
            VERIFY_PROMPT,

          content: [
            {
              type:
                "input_text",

              text:
                "Independently inspect the ORIGINAL examination files again. " +
                "Compare this draft question-by-question against the question " +
                "paper, formula sheet and official memorandum if supplied. " +
                "Correct formulas, method, substitution, results, rounding, units, " +
                "graphs, diagrams, theory answers and wording. Return the COMPLETE " +
                "corrected structured memorandum.\n\nDRAFT JSON:\n" +
                JSON.stringify(
                  draft
                )
            },

            ...sourceParts
          ]
        });


      const finalStructure =
        verified || draft;


      const answer =
        structureToMemo(
          finalStructure
        );


      return res.json({
        answer,

        structured:
          finalStructure,

        model:
          MODEL,

        verified:
          true,

        version:
          "6.1",

        mode:
          "official-memo-formula-fidelity"
      });

    } catch (error) {

      console.error(
        "TestSolverAI V6.1 error:",
        error
      );

      return res
        .status(500)
        .json({
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

app.listen(
  PORT,

  () => {
    console.log(
      `TestSolverAI Version 6.1 running on port ${PORT}`
    );

    console.log(
      `Model: ${MODEL}`
    );

    console.log(
      "Mode: Official memo + formula fidelity"
    );
  }
);
