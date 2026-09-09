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
   TEST SOLVER AI VERSION 6
   STRUCTURED MEMORANDUM ENGINE
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
You are TestSolverAI Version 6.

Your only task is to convert uploaded examination question
papers into a complete, professional memorandum.

Your output is STRUCTURED DATA.

Do not output markdown.
Do not output LaTeX.
Do not output prose outside the required structure.

============================================================
SOURCE PRIORITY
============================================================

Inspect ALL uploaded files.

Identify:

1. Question paper
2. Formula/data sheet
3. Official memorandum if supplied
4. Other reference material

Use:

Question paper:
authoritative question wording

Formula/data sheet:
authoritative formulas, constants and units

Official memorandum:
authoritative answer method, terminology and memo style

============================================================
QUESTION WORDING
============================================================

Every question and sub-question must contain the original
question wording.

Never return only a question number.

============================================================
OFFICIAL MEMO STYLE
============================================================

Use compact vertical memorandum working.

Do NOT produce teaching headings such as:

GIVEN
FORMULA
REARRANGE
SUBSTITUTION
WORKING
FINAL ANSWER

unless the source memorandum genuinely requires them.

For a calculation use an equation block.

Example lines:

a = (v − u) / t
= (40 − 10) / 30
= 1 m/s²

Each equation line must be a normal readable Unicode string.

NEVER output:

\\frac
\\boxed
\\begin
\\end
\\text
\\mathrm
\\times

Never use LaTeX syntax.

Use:

×
÷
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
↑
↓

============================================================
FORMULAS
============================================================

Use formulas supplied with the question paper where
applicable.

Correct algebraic rearrangement is allowed.

Match official memorandum methods where an official memo is
provided.

============================================================
ROUNDING
============================================================

Follow the original examination instructions.

Do not turn exact integer answers into unnecessary decimals.

Example:

486 m

NOT

486,000 m

unless that decimal representation is genuinely appropriate
in the source convention.

============================================================
THEORY
============================================================

Use short marking-guideline answers.

For:

Name THREE...

return a list block with exactly THREE appropriate answers.

Definitions should normally use a text block.

============================================================
ALTERNATIVE METHODS
============================================================

Where an official memorandum accepts a useful alternative
method:

use an "or" block containing the word OR

followed by the alternate calculation.

Do not invent alternatives unnecessarily.

============================================================
GRAPHS
============================================================

If the candidate must draw or plot a graph:

YOU MUST return a graph block.

For normal XY / time graphs:

diagram.kind = "line_graph"

Supply:

x_label
y_label
x_values
y_values

The x_values and y_values arrays MUST have the same length.

The application will draw this graph itself.

Do NOT put SVG in diagram.svg for a normal line graph.

Example:

x_values:
[0,10,20,30,40,50,60]

y_values:
[10,20,30,40,40,40,0]

============================================================
SOURCE FIGURES
============================================================

If an existing figure is materially important to a
calculation, reproduce it.

Examples:

loaded beam
Weston pulley
force graph
circuit
technical diagram

For these use:

type = "diagram"

diagram.kind = "source_figure"
or
diagram.kind = "technical"

Put a safe SVG drawing in:

diagram.svg

The SVG must contain the actual drawing, not merely labels.

Allowed SVG elements:

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
CSS stylesheets

Always use a viewBox.

============================================================
IMPORTANT FIGURE RULE
============================================================

Never return a diagram block containing only text such as:

"160 N 70 N 250 N L R 13 m"

If you create a source figure, diagram.svg MUST contain
actual SVG shapes and lines.

If you cannot confidently reproduce a source figure, use a
text block explaining that the source figure must be
consulted rather than pretending a drawing was generated.

============================================================
MATH STYLE EXAMPLES
============================================================

DYNAMICS:

a = (v − u) / t
= (40 − 10) / 30
= 1 m/s²

STATICS:

Take moments about R:

Σ clockwise moments = Σ anticlockwise moments

(L × 13) + (250 × 1)
= (70 × 7) + (160 × 11)

13L = 2 000

L = 153,846 N

HEAT:

Q lost = Q gained

6 × 500 × (145 − T)
= 40 × 1 500 × (T − 23)

T = 28,810 °C

ELECTRICITY:

1 / Rₚ = 1 / R₁ + 1 / R₂ + 1 / R₃

= 1 / 4 + 1 / 3 + 1 / 6

Rₚ = 1,333 Ω

============================================================
COMPLETENESS
============================================================

Answer every readable question.

Include every requested graph.

Include important source figures required for understanding
the calculation.

Preserve the original question order.
`;


/* =========================================================
   VERIFIER PROMPT
   ========================================================= */

const VERIFY_PROMPT = `
You are the independent final verification stage of
TestSolverAI Version 6.

You receive:

- the original uploaded files
- a structured draft memorandum

Independently inspect the ORIGINAL files.

Correct the draft.

============================================================
VERIFY
============================================================

Check:

- every question exists
- original question wording is correct
- calculations are correct
- supplied formulas are respected
- constants are correct
- units are correct
- rounding is correct
- official memorandum answers are followed if supplied
- requested graphs exist
- important figures exist
- line_graph arrays contain correct plotted coordinates
- source figure SVGs contain real shapes
- no raw LaTeX exists anywhere

============================================================
LATEX IS FORBIDDEN
============================================================

Remove anything containing patterns such as:

\\frac
\\boxed
\\begin
\\end
\\text
\\mathrm

Replace them with normal readable Unicode equations.

============================================================
MEMO STYLE
============================================================

Use compact marking-guideline working.

Do not add tutor explanations.

Preserve full question wording.

Return only the corrected structured memorandum.
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
   EXTRACT OUTPUT
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
          part?.type ===
            "output_text" &&
          typeof part.text ===
            "string"
        ) {
          pieces.push(part.text);
        }
      }
    }
  }

  return pieces.join("\n");
}


/* =========================================================
   STRUCTURED OPENAI REQUEST
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
      text.slice(0, 1000)
    );

    throw new Error(
      "The AI returned an invalid structured memorandum."
    );
  }
}


/* =========================================================
   SVG HELPERS
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
   DRAW LINE GRAPH
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

  const xTicks =
    xs
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

  const uniqueY =
    [...new Set(ys)]
      .sort(
        (a, b) => a - b
      );

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
   REMOVE LATEX IF MODEL TRIES IT
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
   CONVERT STRUCTURE TO APP OUTPUT
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
          block.type ===
          "text"
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
          block.type ===
          "equation"
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
          block.type ===
          "list"
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
          block.type ===
          "or"
        ) {
          out.push("OR");
          out.push("");

          continue;
        }

        if (
          block.type ===
          "graph"
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
          block.type ===
          "diagram"
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
   HEALTH
   ========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      version: "6.0",
      model: MODEL,
      mode:
        "structured-memorandum"
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

      const sourceParts =
        req.files.map(
          fileToInputPart
        );

      /* =============================
         PASS 1
      ============================== */

      const draft =
        await callStructuredOpenAI({
          instructions:
            SOLVER_PROMPT,

          content: [
            {
              type:
                "input_text",

              text:
                "Read every uploaded page. Produce a complete structured memorandum. " +
                "Use full question wording, official marking-guideline style working, " +
                "the supplied formula sheet, and actual graph/diagram data."
            },

            ...sourceParts
          ]
        });

      /* =============================
         PASS 2
      ============================== */

      const verified =
        await callStructuredOpenAI({
          instructions:
            VERIFY_PROMPT,

          content: [
            {
              type:
                "input_text",

              text:
                "Independently verify the original files and correct the structured " +
                "memorandum below. Preserve the required schema. Return the complete " +
                "corrected memorandum.\n\n" +
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
        model: MODEL,
        verified: true,
        version: "6.0"
      });

    } catch (error) {
      console.error(
        "TestSolverAI V6 error:",
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
   START
   ========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `TestSolverAI Version 6 running on port ${PORT}`
    );

    console.log(
      `Model: ${MODEL}`
    );
  }
);
