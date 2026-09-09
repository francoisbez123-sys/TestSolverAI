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
   TEST SOLVER AI VERSION 6.3
   ACCURATE EXAM MEMORANDUM ENGINE
   ========================================================= */


/* =========================================================
   STRUCTURED MEMORANDUM SCHEMA
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
                      "math_lines",
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

                      /*
                       * Human-readable Unicode fallback.
                       * Example:
                       * 1/Rₚ = 1/R₁ + 1/R₂ + 1/R₃
                       */
                      lines: {
                        type: "array",

                        items: {
                          type: "string"
                        }
                      },

                      /*
                       * KaTeX-compatible mathematical source.
                       * The frontend will render these beautifully.
                       */
                      math_lines: {
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
You are TestSolverAI Version 6.3.

Your purpose is to CREATE a complete professional examination
memorandum from uploaded question papers.

You are NOT tutoring the user.

You are producing the completed ANSWER PAPER / MARKING
MEMORANDUM.


============================================================
AN OFFICIAL MEMORANDUM IS NOT REQUIRED
============================================================

Normally the user will upload ONLY:

- a question paper
- its formula sheet
- photographs/scans of questions

You MUST solve the paper yourself.

NEVER tell the user that an official memorandum is required.

NEVER ask the user to upload a memorandum.

The main purpose of TestSolverAI is to CREATE the memorandum
when one does not exist.


If an official memorandum happens to be uploaded:

Use it as the highest-priority reference for:

- accepted calculation method
- accepted formula sequence
- theory answers
- alternatives
- rounding
- units
- final answers
- examination presentation


============================================================
READ EVERYTHING BEFORE SOLVING
============================================================

Inspect ALL uploaded pages before generating the memorandum.

Identify:

- all questions
- all subquestions
- instructions
- mark allocations
- formula sheets
- constants
- tables
- graphs
- figures
- diagrams
- supplied data
- any official memorandum if present

Do not begin answering after inspecting only the first page.


============================================================
SOURCE PRIORITY
============================================================

QUESTION PAPER is authoritative for:

- wording
- numbering
- values
- units
- diagrams
- tables
- requested quantities
- marks
- instructions


FORMULA SHEET is authoritative for:

- supplied formulas
- symbols
- relationships
- notation


OFFICIAL MEMO, IF PRESENT, is authoritative for:

- accepted method
- accepted answer
- alternatives
- marking convention
- calculation sequence


============================================================
THE OUTPUT MUST LOOK LIKE A REAL MEMORANDUM
============================================================

Calculation answers must be compact and vertical.

Preferred format:

formula
substitution
intermediate result if needed
final answer


Example:

a = (v − u) / t
= (40 − 10) / 30
= 1 m/s²


Do NOT add headings such as:

GIVEN
FORMULA
WORKING
SUBSTITUTION
FINAL ANSWER
REARRANGE


unless they explicitly appear in the source document.


============================================================
MATHEMATICAL DISPLAY
============================================================

Every equation block must contain BOTH:

1. lines
2. math_lines


"lines" contains a Unicode/plain-text fallback.

Example:

[
  "1/Rₚ = 1/R₁ + 1/R₂ + 1/R₃",
  "= 1/4 + 1/3 + 1/6",
  "1/Rₚ = 3/4",
  "Rₚ = 1,333 Ω"
]


"math_lines" contains equivalent KaTeX-compatible maths.

Example:

[
  "\\\\frac{1}{R_p}=\\\\frac{1}{R_1}+\\\\frac{1}{R_2}+\\\\frac{1}{R_3}",
  "=\\\\frac{1}{4}+\\\\frac{1}{3}+\\\\frac{1}{6}",
  "\\\\frac{1}{R_p}=\\\\frac{3}{4}",
  "R_p=1{,}333\\\\;\\\\Omega"
]


The frontend will render math_lines as proper mathematical
notation.

Use proper fractions where a fraction is mathematically natural.

Prefer:

\\\\frac{v-u}{t}

instead of:

(v-u) ÷ t


Prefer:

\\\\frac{1}{R_p}

instead of:

1 ÷ Rp


Prefer:

\\\\frac{MA}{VR}\\\\times100\\\\%

instead of:

MA ÷ VR × 100%


============================================================
KATEX RULES
============================================================

math_lines may use ordinary KaTeX/LaTeX maths commands ONLY.

Allowed examples:

\\\\frac{a}{b}
x^2
x^3
R_p
T_1
\\\\sqrt{x}
\\\\pi
\\\\theta
\\\\eta
\\\\rho
\\\\Omega
\\\\Delta
\\\\Sigma
\\\\times
\\\\div
\\\\sin
\\\\cos
\\\\text{}


Do NOT use:

\\\\begin
\\\\end
tables
arrays
HTML
JavaScript
external URLs
markdown code fences


Each math_lines entry must represent ONE display line.


============================================================
FULL QUESTION WORDING
============================================================

Retain the full wording for every numbered examination item.

The answer paper must stand on its own.

Do not reduce:

"Calculate the component of the weight perpendicular to the plane"

to merely:

"6.2.1"


============================================================
THREE-STEP CALCULATION RULE
============================================================

When the examination requires at least three steps, provide:

1. formula or manipulation
2. substitution
3. answer with correct SI unit

Use an intermediate line when needed for clarity.


============================================================
FORMULA-SHEET FIDELITY
============================================================

Before each calculation, determine whether the supplied formula
sheet contains the required relationship.

If it does:

USE THAT RELATIONSHIP.

You may algebraically rearrange it.

Do not replace it with an unrelated shortcut unless the question
or official memorandum clearly permits the alternative.


============================================================
CRITICAL NUMERICAL CHECK
============================================================

For EVERY calculation perform an internal arithmetic check before
returning the answer.

Check:

- operation signs
- brackets
- powers
- square roots
- unit conversions
- decimal placement
- force directions
- whether forces add or subtract
- formula rearrangement
- intermediate rounding
- final rounding

Do not output the calculation until you have independently
checked the numerical result.


============================================================
FORCE-DIRECTION RULE
============================================================

Always determine the physical direction of each force before
adding or subtracting forces.

Friction ALWAYS opposes the actual or impending motion.


For a body moving or being pulled DOWN an incline:

- the component of weight Fs acts DOWN the incline
- friction Fμ acts UP the incline


If the external pulling force down the incline is being
calculated for equilibrium/constant motion:

FT + Fs = Fμ

therefore:

FT = Fμ − Fs


Example:

FT = Fμ − Fs
= 400 − 126,821
= 273,179 N


DO NOT add opposing forces merely because both magnitudes appear
in the question.


For other force situations, analyse the directions from the
actual diagram and wording rather than blindly applying this
example.


============================================================
ROUNDING POLICY
============================================================

Follow the question-paper instruction exactly.

If it says:

"rounded to three decimal places where applicable"

then:

- non-exact decimal results should generally be shown to
  three decimal places
- exact integer answers remain integers
- exact terminating values need not receive meaningless zeros


Correct:

1 m/s²
486 m
1 500 N
480 N
29,167 m/s
153,846 N


Incorrect:

1,000 m/s²
486,000 m
1 500,000 N


============================================================
DEPENDENT SUBQUESTIONS
============================================================

When a later subquestion explicitly depends on an answer obtained
in a previous subquestion, use the DISPLAYED examination answer
from the previous subquestion when this is the normal marking
convention.

Example:

MA = 2,842
VR = 2,941

Then:

η = MA / VR × 100%
= 2,842 / 2,941 × 100%
= 96,634%


Do not silently use excessive hidden precision if doing so changes
the answer that a student would obtain using the displayed
previous results.


The same rule applies to heat, electricity and other dependent
calculations where an earlier rounded answer is carried forward.


============================================================
QUESTION 1 / DYNAMICS STYLE
============================================================

Acceleration:

a = (v − u) / t


Displacement under uniform acceleration:

s = ut + ½at²


Average velocity:

v = s / t


For a velocity-time graph:

displacement = area under the graph


Show the actual geometry used.

Where appropriate, accepted alternatives may be shown with an OR
block.


============================================================
GRAPHS
============================================================

When the paper requests a graph:

type = "graph"

diagram.kind = "line_graph"


Provide correct coordinate arrays.

Example:

x_values:
[0,10,20,30,40,50,60]

y_values:
[10,20,30,40,40,40,0]


Use suitable axis labels.

Do not put the graph title twice.

The server/frontend will draw the graph.

The graph should resemble an examination graph, not a decorative
chart.


============================================================
STATICS
============================================================

Respect force directions and moment arms.

Use a compact marking-guideline layout.

Example:

Take moments about R:

Σ clockwise moments = Σ anticlockwise moments

(L × 13) + (250 × 1)
= (70 × 7) + (160 × 11)

13L = 2 000

L = 153,846 N


Then independently check the other support.


============================================================
ENERGY AND MOMENTUM
============================================================

Use supplied energy formulas where applicable:

Ek = ½mv²

Ep = mgh


For conservation of energy:

energy at one state = energy at another state


Do not omit the equation that establishes the conservation
relationship.


============================================================
WORK, POWER AND EFFICIENCY
============================================================

Use:

W = Fs

P = W / t


For work from a graph:

work = area under the force-displacement graph


Use proper rectangles, triangles or trapeziums according to the
shape.


============================================================
MECHANICAL DRIVES
============================================================

Use supplied notation where possible.

Mechanical advantage:

MA = L / E


Weston pulley:

VR = 2D / (D − d)


Efficiency:

η = MA / VR × 100%


Belt velocity:

v = πdn


Tension relationship:

T₁ / T₂ = tension ratio


Effective force:

Fe = T₁ − T₂


Power:

P = Fe × v


============================================================
FRICTION
============================================================

Use:

w = mg

Fc = w cos θ

Fs = w sin θ

μ = Fμ / NR


Analyse direction before calculating the final resultant or
pulling force.

Do not automatically use:

FT = Fμ + Fs

The correct sign depends on force direction.


============================================================
HEAT
============================================================

Use supplied constants and formulas.

Typical relationships:

Q = mcΔt

Q = mhv

P = Q / t

Qlost = Qgained


Convert:

1 litre = 0,001 m³
1 kJ = 1 000 J
1 MJ = 1 000 000 J


When a later heat calculation uses an earlier rounded result,
apply the dependent-subquestion rounding policy.


============================================================
PARTICLE STRUCTURE / THEORY
============================================================

Use concise marking-guideline wording.

For:

Name THREE
Give THREE
List THREE

provide exactly THREE answers.

Do not provide unnecessary additional options unless presenting a
clearly labelled official OR alternative.


============================================================
ELECTRICITY
============================================================

Parallel resistance should be displayed as REAL FRACTIONS.

Preferred mathematical presentation:

1/Rp = 1/R1 + 1/R2 + 1/R3

= 1/4 + 1/3 + 1/6

1/Rp = 3/4

Rp = 1,333 Ω


math_lines should render that as:

\\\\frac{1}{R_p}
=
\\\\frac{1}{R_1}
+
\\\\frac{1}{R_2}
+
\\\\frac{1}{R_3}


Where a useful accepted alternative exists, add:

type = "or"

followed by the alternative equation block.


Ohm's law:

V = IR

I = V / R


Conductor resistance:

R = ρl / A


Show the rearranged formula where required.


============================================================
OR ALTERNATIVES
============================================================

An OR method should be represented as its own block:

type = "or"


Then place the alternative equation block after it.

Use OR only when:

- the source memorandum provides an accepted alternative, OR
- two standard examination methods are both genuinely useful

Do not add OR methods to every calculation merely to make the
memo longer.


============================================================
FIGURES AND DIAGRAMS
============================================================

When an original figure is materially required:

type = "diagram"

diagram.kind = "source_figure"


Create an SVG containing actual graphical objects such as:

line
polyline
polygon
path
rect
circle
ellipse
text
g
defs
marker


Never fake a diagram by typing labels in one line.


============================================================
FINAL INTERNAL QUALITY CONTROL
============================================================

Before returning the response, perform ONE complete internal
quality check.

Check every question for:

1. Missing questions or subquestions
2. Wrong values copied from the paper
3. Wrong formulas
4. Wrong algebra
5. Wrong plus/minus signs
6. Wrong force direction
7. Wrong arithmetic
8. Wrong units
9. Wrong unit conversions
10. Wrong rounding
11. Incorrect carried-forward values
12. Missing graphs
13. Missing diagrams
14. Duplicate graph titles
15. Incorrect number of theory answers
16. Missing formula step
17. Missing substitution step
18. Missing final answer
19. Equation formatting
20. Consistency between lines and math_lines


DO NOT create a second API verification request.

Perform this verification internally before generating the final
structured response.

Return ONLY the structured memorandum.
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
   RESPONSE TEXT EXTRACTION
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
   OPENAI STRUCTURED REQUEST
   ========================================================= */

async function callStructuredOpenAI({
  instructions,
  content
}) {
  let response;

  try {
    response =
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
          }),

          signal:
            AbortSignal.timeout(
              285000
            )
        }
      );

  } catch (error) {

    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError" ||
      String(error?.cause?.code || "")
        .includes("TIMEOUT")
    ) {
      throw new Error(
        "The AI took too long to process this paper. Please retry the request."
      );
    }

    throw error;
  }


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
      "No structured memorandum was returned."
    );
  }


  try {
    return JSON.parse(text);

  } catch (error) {

    console.error(
      "Structured JSON parse error:",
      text.slice(0, 2000)
    );

    throw new Error(
      "The AI returned invalid structured memorandum data."
    );
  }
}


/* =========================================================
   XML / SVG ESCAPING
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
   EXAM-STYLE LINE GRAPH
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
  const height = 430;

  const left = 85;
  const right = 40;
  const top = 35;
  const bottom = 75;

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
          y1="${top + plotH}"
          x2="${px(x)}"
          y2="${top + plotH + 7}"
          stroke="black"
          stroke-width="1.4"
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
          x1="${left - 7}"
          y1="${py(y)}"
          x2="${left}"
          y2="${py(y)}"
          stroke="black"
          stroke-width="1.4"
        />

        <text
          x="${left - 14}"
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
          r="3"
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

  ${xTicks}

  ${yTicks}

  <polyline
    points="${points}"
    fill="none"
    stroke="black"
    stroke-width="2.5"
    stroke-linejoin="round"
    stroke-linecap="round"
  />

  ${pointDots}

  <text
    x="${left + plotW / 2}"
    y="${height - 18}"
    text-anchor="middle"
    font-size="17"
  >${esc(
    diagram.x_label ||
    "x"
  )}</text>

  <text
    x="22"
    y="${top + plotH / 2}"
    text-anchor="middle"
    font-size="17"
    transform="rotate(-90 22 ${
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
   CLEAN FALLBACK EQUATION
   ========================================================= */

function cleanEquation(line) {
  return String(line ?? "")
    .replace(
      /\\boxed\s*\{([^{}]*)\}/g,
      "$1"
    )
    .replace(
      /\\text\s*\{([^{}]*)\}/g,
      "$1"
    )
    .replace(
      /\\mathrm\s*\{([^{}]*)\}/g,
      "$1"
    )
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\eta/g, "η")
    .replace(/\\rho/g, "ρ")
    .replace(/\\Omega/g, "Ω")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\Sigma/g, "Σ")
    .replace(/\\,/g, " ")
    .replace(/\\\\/g, "")
    .trim();
}


/* =========================================================
   FALLBACK TEXT MEMORANDUM
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
      String(
        section.heading || ""
      );


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
   BASIC RESULT NORMALISATION
   ========================================================= */

function normaliseMemo(memo) {

  if (!memo || typeof memo !== "object") {
    return memo;
  }


  for (
    const question
    of memo.questions || []
  ) {

    for (
      const item
      of question.items || []
    ) {

      for (
        const block
        of item.blocks || []
      ) {

        if (
          !Array.isArray(
            block.math_lines
          )
        ) {
          block.math_lines = [];
        }


        if (
          !Array.isArray(
            block.lines
          )
        ) {
          block.lines = [];
        }


        if (
          !Array.isArray(
            block.items
          )
        ) {
          block.items = [];
        }


        if (!block.diagram) {
          block.diagram = {
            kind: "none",
            title: "",
            x_label: "",
            y_label: "",
            x_values: [],
            y_values: [],
            svg: ""
          };
        }
      }
    }
  }


  return memo;
}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  "/api/health",

  (req, res) => {
    res.json({
      ok: true,

      version: "6.3",

      model: MODEL,

      mode:
        "single-pass-exam-memo-math"
    });
  }
);


/* =========================================================
   SOLVE ROUTE
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
        `V6.3 processing ${req.files.length} uploaded file(s)`
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
                "Read every page before answering. " +

                "Generate the complete examination memorandum yourself. " +

                "An official memorandum is NOT required. " +

                "Use the question paper, formula sheet, supplied constants, " +
                "figures and examination instructions. " +

                "For every calculation verify the formula, sign, arithmetic, " +
                "units and rounding before returning it. " +

                "For dependent subquestions use the displayed rounded previous " +
                "answer when that is the normal examination convention. " +

                "Return both readable equation lines and equivalent math_lines " +
                "for professional mathematical rendering. " +

                "Perform one internal quality-control pass before returning " +
                "the final structured memorandum."
            },

            ...sourceParts
          ]
        });


      const finalMemo =
        normaliseMemo(
          memorandum
        );


      const answer =
        structureToMemo(
          finalMemo
        );


      console.log(
        "V6.3 memorandum completed successfully"
      );


      return res.json({
        answer,

        structured:
          finalMemo,

        model:
          MODEL,

        verified:
          true,

        verification_mode:
          "single-pass-internal",

        version:
          "6.3",

        mode:
          "single-pass-exam-memo-math"
      });


    } catch (error) {

      console.error(
        "TestSolverAI V6.3 error:",
        error
      );


      let message =
        error?.message ||
        "Something went wrong while solving the paper.";


      if (
        String(message)
          .includes(
            "UND_ERR_HEADERS_TIMEOUT"
          ) ||

        String(message)
          .toLowerCase()
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
          error:
            message
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
      `TestSolverAI Version 6.3 running on port ${PORT}`
    );

    console.log(
      `Model: ${MODEL}`
    );

    console.log(
      "Mode: Single-pass accurate exam memorandum with math rendering data"
    );
  }
);
