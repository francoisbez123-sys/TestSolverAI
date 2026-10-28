const filePicker = document.getElementById("filePicker");
const cameraPicker = document.getElementById("cameraPicker");
const uploadBtn = document.getElementById("uploadBtn");
const cameraBtn = document.getElementById("cameraBtn");
const clearBtn = document.getElementById("clearBtn");
const solveBtn = document.getElementById("solveBtn");
const fileArea = document.getElementById("fileArea");
const emptyText = document.getElementById("emptyText");
const fileList = document.getElementById("fileList");
const statusCard = document.getElementById("statusCard");
const resultCard = document.getElementById("resultCard");
const answer = document.getElementById("answer");
const copyBtn = document.getElementById("copyBtn");
const printBtn = document.getElementById("printBtn");

let selectedFiles = [];
let lastMemo = null;


/* =========================================================
   TEST SOLVER AI V6.3 FRONTEND
   PROFESSIONAL MEMORANDUM + MATHS RENDERING
   ========================================================= */


/* =========================================================
   KATEX MATHS ENGINE
   ========================================================= */

let katexPromise = null;

function loadKatex() {
  if (window.katex) {
    return Promise.resolve(window.katex);
  }

  if (katexPromise) {
    return katexPromise;
  }

  katexPromise = new Promise((resolve, reject) => {

    const existingCss =
      document.querySelector(
        'link[data-testsolver-katex="true"]'
      );

    if (!existingCss) {
      const css =
        document.createElement("link");

      css.rel = "stylesheet";

      css.href =
        "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

      css.setAttribute(
        "data-testsolver-katex",
        "true"
      );

      document.head.appendChild(css);
    }


    const existingScript =
      document.querySelector(
        'script[data-testsolver-katex="true"]'
      );

    if (existingScript) {

      existingScript.addEventListener(
        "load",
        () => resolve(window.katex)
      );

      existingScript.addEventListener(
        "error",
        reject
      );

      return;
    }


    const script =
      document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";

    script.defer = true;

    script.setAttribute(
      "data-testsolver-katex",
      "true"
    );


    script.onload = () => {

      if (window.katex) {
        resolve(window.katex);
      } else {
        reject(
          new Error(
            "KaTeX loaded but was not available."
          )
        );
      }
    };


    script.onerror = () => {

      reject(
        new Error(
          "Could not load the maths renderer."
        )
      );
    };


    document.head.appendChild(
      script
    );
  });


  return katexPromise;
}


/* =========================================================
   FILE HANDLING
   ========================================================= */

function niceSize(bytes) {
  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  let value = bytes;
  let index = 0;

  while (
    value >= 1024 &&
    index < units.length - 1
  ) {
    value /= 1024;
    index++;
  }

  return `${value.toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
}


function renderFiles() {
  fileList.innerHTML = "";

  const hasFiles =
    selectedFiles.length > 0;

  emptyText.style.display =
    hasFiles
      ? "none"
      : "block";

  fileArea.classList.toggle(
    "empty",
    !hasFiles
  );


  selectedFiles.forEach(
    (file, index) => {

      const row =
        document.createElement("div");

      row.className =
        "file-row";


      const name =
        document.createElement("div");

      name.className =
        "file-name";

      name.textContent =
        `${index + 1}. ${
          file.name ||
          `Camera photo ${index + 1}`
        }`;


      const size =
        document.createElement("div");

      size.className =
        "file-size";

      size.textContent =
        niceSize(file.size);


      row.append(
        name,
        size
      );

      fileList.appendChild(row);
    }
  );


  solveBtn.disabled =
    !hasFiles;

  clearBtn.disabled =
    !hasFiles;
}


function addFiles(files) {
  const incoming =
    Array.from(
      files || []
    );

  selectedFiles.push(
    ...incoming
  );

  renderFiles();
}


/* =========================================================
   TEXT HELPERS
   ========================================================= */

function cleanText(value) {
  return String(
    value ?? ""
  )
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^#{1,6}\s*/g, "")
    .trim();
}


function makeDiv(
  className,
  text
) {
  const el =
    document.createElement("div");

  el.className =
    className;

  el.textContent =
    cleanText(text);

  return el;
}


/* =========================================================
   MATHS RENDERING
   ========================================================= */

function renderMathLine(
  mathSource,
  fallbackText
) {
  const row =
    document.createElement("div");

  row.className =
    "memo-equation memo-equation-math";


  const source =
    String(
      mathSource || ""
    ).trim();


  if (
    source &&
    window.katex
  ) {

    try {

      window.katex.render(
        source,
        row,
        {
          displayMode: true,

          throwOnError: false,

          strict: false,

          trust: false,

          output:
            "htmlAndMathml"
        }
      );

      return row;

    } catch (error) {

      console.warn(
        "Math rendering fallback:",
        error
      );
    }
  }


  row.classList.add(
    "memo-equation-fallback"
  );

  row.textContent =
    cleanText(
      fallbackText ||
      mathSource
    );

  return row;
}


/* =========================================================
   SVG SANITISER
   ========================================================= */

const allowedSvgTags =
  new Set([
    "svg",
    "g",
    "line",
    "polyline",
    "polygon",
    "path",
    "rect",
    "circle",
    "ellipse",
    "text",
    "tspan",
    "defs",
    "marker"
  ]);


const allowedSvgAttributes =
  new Set([
    "viewBox",
    "width",
    "height",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "points",
    "d",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "font-size",
    "font-weight",
    "text-anchor",
    "dominant-baseline",
    "transform",
    "opacity",
    "marker-start",
    "marker-mid",
    "marker-end",
    "orient",
    "refX",
    "refY",
    "markerWidth",
    "markerHeight"
  ]);


function sanitizeSvg(svgText) {

  try {

    const parser =
      new DOMParser();

    const doc =
      parser.parseFromString(
        svgText,
        "image/svg+xml"
      );


    if (
      doc.querySelector(
        "parsererror"
      )
    ) {
      return null;
    }


    const svg =
      doc.documentElement;


    if (
      !svg ||
      svg.tagName.toLowerCase() !==
        "svg"
    ) {
      return null;
    }


    function cleanElement(el) {

      const tag =
        el.tagName.toLowerCase();


      if (
        !allowedSvgTags.has(tag)
      ) {
        el.remove();
        return;
      }


      [
        ...el.attributes
      ].forEach(attr => {

        const name =
          attr.name;

        const lower =
          name.toLowerCase();

        const value =
          attr.value || "";


        if (
          lower.startsWith("on") ||
          lower === "href" ||
          lower === "xlink:href" ||
          value
            .toLowerCase()
            .includes(
              "javascript:"
            )
        ) {

          el.removeAttribute(
            name
          );

          return;
        }


        if (
          !allowedSvgAttributes.has(
            name
          )
        ) {

          el.removeAttribute(
            name
          );
        }
      });


      [
        ...el.children
      ].forEach(
        cleanElement
      );
    }


    cleanElement(svg);


    svg.setAttribute(
      "width",
      "100%"
    );

    svg.setAttribute(
      "height",
      "auto"
    );


    if (
      !svg.getAttribute(
        "viewBox"
      )
    ) {

      svg.setAttribute(
        "viewBox",
        "0 0 700 420"
      );
    }


    return document.importNode(
      svg,
      true
    );


  } catch (error) {

    console.error(
      "SVG error:",
      error
    );

    return null;
  }
}


/* =========================================================
   GRAPH ENGINE
   ========================================================= */

function createSvgElement(
  tag,
  attrs = {}
) {

  const el =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      tag
    );


  Object.entries(
    attrs
  ).forEach(
    ([key, value]) => {

      el.setAttribute(
        key,
        value
      );
    }
  );


  return el;
}


function createSvgText(
  text,
  attrs
) {

  const el =
    createSvgElement(
      "text",
      attrs
    );

  el.textContent =
    String(text);

  return el;
function buildLineGraph(
  diagram
) {
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
    xs.length !== ys.length ||
    !xs.every(value => typeof value === "number" && Number.isFinite(value)) ||
    !ys.every(value => typeof value === "number" && Number.isFinite(value))
  ) {
    return null;
  }

  const width = 720;
  const height = 410;

  const left = 90;
  const right = 35;
  const top = 30;
  const bottom = 75;

  const plotW = width - left - right;
  const plotH = height - top - bottom;

  function niceStep(span, targetTicks) {
    const raw = span / targetTicks;
    const exponent = Math.floor(Math.log10(raw));
    const magnitude = Math.pow(10, exponent);
    const fraction = raw / magnitude;
    const niceFraction =
      fraction <= 1 ? 1 :
      fraction <= 2 ? 2 :
      fraction <= 5 ? 5 : 10;

    return niceFraction * magnitude;
  }

  function makeScale(values, targetTicks) {
    let min = Math.min(0, ...values);
    let max = Math.max(0, ...values);

    if (min === max) {
      min = -1;
      max = 1;
    }

    const step = niceStep(max - min, targetTicks);
    const epsilon = 1e-10;
    const low = Math.floor(min / step + epsilon) * step;
    const high = Math.ceil(max / step - epsilon) * step;
    const firstIndex = Math.ceil(low / step - epsilon);
    const lastIndex = Math.floor(high / step + epsilon);
    const ticks = [];

    for (let index = firstIndex; index <= lastIndex; index++) {
      const value = index * step;
      ticks.push(Math.abs(value) < step * epsilon ? 0 : value);
    }

    return { min: low, max: high, step, ticks };
  }

  function formatTick(value, step) {
    if (value === 0) return "0";

    const decimals = Math.max(
      0,
      Math.min(12, -Math.floor(Math.log10(step)))
    );

    return Number(value.toFixed(decimals)).toString();
  }

  const xScale = makeScale(xs, 6);
  const yScale = makeScale(ys, 5);

  const px = value =>
    left +
    ((value - xScale.min) / (xScale.max - xScale.min)) *
      plotW;

  const py = value =>
    top +
    plotH -
    ((value - yScale.min) / (yScale.max - yScale.min)) *
      plotH;

  const axisX = px(0);
  const axisY = py(0);

  const svg = createSvgElement(
    "svg",
    {
      viewBox: "0 0 " + width + " " + height,
      width: "100%",
      height: "auto"
    }
  );

  /* Graduated gridlines */
  xScale.ticks.forEach(x => {
    if (x === 0) return;

    svg.appendChild(
      createSvgElement(
        "line",
        {
          x1: px(x),
          y1: top,
          x2: px(x),
          y2: top + plotH,
          stroke: "#d9dee7",
          "stroke-width": 1
        }
      )
    );
  });

  yScale.ticks.forEach(y => {
    if (y === 0) return;

    svg.appendChild(
      createSvgElement(
        "line",
        {
          x1: left,
          y1: py(y),
          x2: left + plotW,
          y2: py(y),
          stroke: "#d9dee7",
          "stroke-width": 1
        }
      )
    );
  });

  /* Axes cross at the origin */
  svg.appendChild(
    createSvgElement(
      "line",
      {
        x1: axisX,
        y1: top,
        x2: axisX,
        y2: top + plotH,
        stroke: "black",
        "stroke-width": 2
      }
    )
  );

  svg.appendChild(
    createSvgElement(
      "line",
      {
        x1: left,
        y1: axisY,
        x2: left + plotW,
        y2: axisY,
        stroke: "black",
        "stroke-width": 2
      }
    )
  );

  /* Evenly graduated x-axis */
  xScale.ticks.forEach(x => {
    const tickX = px(x);

    svg.appendChild(
      createSvgElement(
        "line",
        {
          x1: tickX,
          y1: axisY - 5,
          x2: tickX,
          y2: axisY + 5,
          stroke: "black",
          "stroke-width": 1.2
        }
      )
    );

    svg.appendChild(
      createSvgText(
        formatTick(x, xScale.step),
        {
          x: tickX,
          y: axisY + 22,
          "text-anchor": "middle",
          "font-size": 13
        }
      )
    );
  });

  /* Evenly graduated y-axis */
  yScale.ticks.forEach(y => {
    const tickY = py(y);

    svg.appendChild(
      createSvgElement(
        "line",
        {
          x1: axisX - 5,
          y1: tickY,
          x2: axisX + 5,
          y2: tickY,
          stroke: "black",
          "stroke-width": 1.2
        }
      )
    );

    svg.appendChild(
      createSvgText(
        formatTick(y, yScale.step),
        {
          x: axisX - 11,
          y: tickY + 4,
          "text-anchor": "end",
          "font-size": 13
        }
      )
    );
  });

  /* Plot the supplied coordinate pairs at their scaled positions */
  const points = xs
    .map((x, index) => px(x) + "," + py(ys[index]))
    .join(" ");

  svg.appendChild(
    createSvgElement(
      "polyline",
      {
        points,
        fill: "none",
        stroke: "black",
        "stroke-width": 2.5,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    )
  );

  xs.forEach((x, index) => {
    svg.appendChild(
      createSvgElement(
        "circle",
        {
          cx: px(x),
          cy: py(ys[index]),
          r: 3,
          fill: "black"
        }
      )
    );
  });

  svg.appendChild(
    createSvgText(
      diagram.x_label || "x",
      {
        x: left + plotW / 2,
        y: height - 16,
        "text-anchor": "middle",
        "font-size": 17
      }
    )
  );

  const yLabel = createSvgText(
    diagram.y_label || "y",
    {
      x: 24,
      y: top + plotH / 2,
      "text-anchor": "middle",
      "font-size": 17
    }
  );

  yLabel.setAttribute(
    "transform",
    "rotate(-90 24 " + (top + plotH / 2) + ")"
  );

  svg.appendChild(yLabel);

  return svg;
}

  

/* =========================================================
   DIAGRAM WRAPPER
   ========================================================= */

function makeDiagramBox(
  title
) {

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "memo-diagram";


  if (title) {

    const heading =
      document.createElement(
        "div"
      );

    heading.className =
      "memo-diagram-title";

    heading.textContent =
      title;

    wrapper.appendChild(
      heading
    );
  }


  return wrapper;
}


/* =========================================================
   RENDER ONE MEMO BLOCK
   ========================================================= */

function renderBlock(
  block,
  container
) {

  if (!block) return;


  /* TEXT */

  if (
    block.type ===
    "text"
  ) {

    if (block.text) {

      container.appendChild(
        makeDiv(
          "memo-text",
          block.text
        )
      );
    }

    return;
  }


  /* EQUATION */

  if (
    block.type ===
    "equation"
  ) {

    const group =
      document.createElement(
        "div"
      );

    group.className =
      "memo-equation-group";


    const normalLines =
      Array.isArray(
        block.lines
      )
        ? block.lines
        : [];


    const mathLines =
      Array.isArray(
        block.math_lines
      )
        ? block.math_lines
        : [];


    const count =
      Math.max(
        normalLines.length,
        mathLines.length
      );


    for (
      let index = 0;
      index < count;
      index++
    ) {

      const mathSource =
        mathLines[index] || "";

      const fallback =
        normalLines[index] ||
        mathSource;


      group.appendChild(
        renderMathLine(
          mathSource,
          fallback
        )
      );
    }


    container.appendChild(
      group
    );

    return;
  }


  /* LIST */

  if (
    block.type ===
    "list"
  ) {

    const ul =
      document.createElement(
        "ul"
      );

    ul.className =
      "memo-list";


    (
      block.items || []
    ).forEach(item => {

      const li =
        document.createElement(
          "li"
        );

      li.textContent =
        cleanText(item);

      ul.appendChild(li);
    });


    container.appendChild(
      ul
    );

    return;
  }


  /* OR */

  if (
    block.type ===
    "or"
  ) {

    const orBox =
      document.createElement(
        "div"
      );

    orBox.className =
      "memo-or";

    orBox.textContent =
      "OR";

    container.appendChild(
      orBox
    );

    return;
  }


  /* LINE GRAPH */

  if (
    block.type ===
    "graph"
  ) {

    const graph =
      buildLineGraph(
        block.diagram
      );


    const box =
      makeDiagramBox(
        block?.diagram
          ?.title ||
        "GRAPH"
      );


    if (graph) {

      box.appendChild(
        graph
      );

    } else {

      box.appendChild(
        makeDiv(
          "memo-diagram-error",
          "Graph data could not be rendered."
        )
      );
    }


    container.appendChild(
      box
    );

    return;
  }


  /* TECHNICAL / SOURCE DIAGRAM */

  if (
    block.type ===
    "diagram"
  ) {

    const box =
      makeDiagramBox(
        block?.diagram
          ?.title ||
        "DIAGRAM"
      );


    const safeSvg =
      sanitizeSvg(
        block?.diagram
          ?.svg || ""
      );


    if (safeSvg) {

      box.appendChild(
        safeSvg
      );

    } else {

      box.appendChild(
        makeDiv(
          "memo-diagram-error",
          "Diagram could not be rendered."
        )
      );
    }


    container.appendChild(
      box
    );

    return;
  }
}


/* =========================================================
   RENDER STRUCTURED MEMORANDUM
   ========================================================= */

async function renderStructuredMemo(
  memo
) {

  answer.innerHTML = "";


  if (!memo) {

    answer.textContent =
      "No memorandum was returned.";

    return;
  }


  /*
   * Load maths engine BEFORE rendering.
   * If it fails, normal text equations
   * still render automatically.
   */

  try {

    await loadKatex();

  } catch (error) {

    console.warn(
      "Maths renderer unavailable. Using fallback equations.",
      error
    );
  }


  /* DOCUMENT TITLE */

  if (memo.title) {

    const title =
      document.createElement(
        "div"
      );

    title.className =
      "memo-document-title";

    title.textContent =
      memo.title;

    answer.appendChild(
      title
    );
  }


  if (memo.subtitle) {

    const subtitle =
      document.createElement(
        "div"
      );

    subtitle.className =
      "memo-document-subtitle";

    subtitle.textContent =
      memo.subtitle;

    answer.appendChild(
      subtitle
    );
  }


  /* QUESTIONS */

  (
    memo.questions || []
  ).forEach(section => {

    const heading =
      document.createElement(
        "h2"
      );

    heading.className =
      "memo-question";


    const headingText =
      cleanText(
        section.heading
      );


    heading.textContent =
      /^QUESTION/i.test(
        headingText
      )
        ? headingText
        : `QUESTION ${headingText}`;


    answer.appendChild(
      heading
    );


    (
      section.items || []
    ).forEach(item => {

      const itemBox =
        document.createElement(
          "section"
        );

      itemBox.className =
        "memo-item";


      const q =
        document.createElement(
          "h3"
        );

      q.className =
        "memo-subquestion";


      q.textContent =
        [
          item.number,
          item.question_text
        ]
          .filter(Boolean)
          .join(" ");


      itemBox.appendChild(
        q
      );


      (
        item.blocks || []
      ).forEach(block => {

        renderBlock(
          block,
          itemBox
        );
      });


      answer.appendChild(
        itemBox
      );
    });
  });
}


/* =========================================================
   FALLBACK TEXT RENDERER
   ========================================================= */

function renderFallbackText(
  text
) {

  answer.innerHTML = "";


  String(
    text || ""
  )
    .split(/\r?\n/)
    .forEach(line => {

      if (!line.trim()) {

        const gap =
          document.createElement(
            "div"
          );

        gap.className =
          "memo-space";

        answer.appendChild(
          gap
        );

        return;
      }


      answer.appendChild(
        makeDiv(
          "memo-text",
          line
        )
      );
    });
}


/* =========================================================
   PLAIN-TEXT MEMO FOR COPYING
   ========================================================= */

function memoToPlainText(
  memo
) {

  if (!memo) {
    return answer.innerText;
  }


  const output = [];


  if (memo.title) {
    output.push(
      memo.title
    );
  }


  if (memo.subtitle) {
    output.push(
      memo.subtitle
    );
  }


  output.push("");


  (
    memo.questions || []
  ).forEach(section => {

    const heading =
      cleanText(
        section.heading
      );


    output.push(
      /^QUESTION/i.test(
        heading
      )
        ? heading
        : `QUESTION ${heading}`
    );

    output.push("");


    (
      section.items || []
    ).forEach(item => {

      output.push(
        [
          item.number,
          item.question_text
        ]
          .filter(Boolean)
          .join(" ")
      );


      (
        item.blocks || []
      ).forEach(block => {

        if (
          block.type ===
          "text"
        ) {

          if (block.text) {
            output.push(
              cleanText(
                block.text
              )
            );
          }
        }


        if (
          block.type ===
          "equation"
        ) {

          (
            block.lines || []
          ).forEach(line => {

            output.push(
              cleanText(line)
            );
          });
        }


        if (
          block.type ===
          "list"
        ) {

          (
            block.items || []
          ).forEach(itemText => {

            output.push(
              `• ${cleanText(
                itemText
              )}`
            );
          });
        }


        if (
          block.type ===
          "or"
        ) {

          output.push(
            "OR"
          );
        }


        if (
          block.type ===
          "graph"
        ) {

          output.push(
            block?.diagram
              ?.title ||
            "GRAPH"
          );
        }


        if (
          block.type ===
          "diagram"
        ) {

          output.push(
            block?.diagram
              ?.title ||
            "DIAGRAM"
          );
        }
      });


      output.push("");
    });
  });


  return output.join("\n");
}


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

uploadBtn.addEventListener(
  "click",
  () => {

    filePicker.click();
  }
);


cameraBtn.addEventListener(
  "click",
  () => {

    cameraPicker.click();
  }
);


filePicker.addEventListener(
  "change",
  () => {

    addFiles(
      filePicker.files
    );

    filePicker.value = "";
  }
);


cameraPicker.addEventListener(
  "change",
  () => {

    addFiles(
      cameraPicker.files
    );

    cameraPicker.value = "";
  }
);


clearBtn.addEventListener(
  "click",
  () => {

    selectedFiles = [];

    lastMemo = null;

    answer.innerHTML = "";

    resultCard.classList.add(
      "hidden"
    );

    renderFiles();
  }
);


/* =========================================================
   GENERATE MEMORANDUM
   ========================================================= */

solveBtn.addEventListener(
  "click",
  async () => {

    if (
      !selectedFiles.length
    ) {
      return;
    }


    resultCard.classList.add(
      "hidden"
    );

    statusCard.classList.remove(
      "hidden"
    );


    solveBtn.disabled = true;
    clearBtn.disabled = true;

    answer.innerHTML = "";
    lastMemo = null;


    const form =
      new FormData();


    selectedFiles.forEach(
      file => {

        form.append(
          "files",
          file,
          file.name ||
            "camera.jpg"
        );
      }
    );


    try {

      const response =
        await fetch(
          "/api/solve",
          {
            method:
              "POST",

            body:
              form
          }
        );


      let data;


      try {

        data =
          await response.json();

      } catch {

        throw new Error(
          "The server returned an invalid response."
        );
      }


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Could not generate the memorandum."
        );
      }


      lastMemo =
        data.structured ||
        null;


      if (lastMemo) {

        await renderStructuredMemo(
          lastMemo
        );

      } else {

        renderFallbackText(
          data.answer
        );
      }


      resultCard.classList.remove(
        "hidden"
      );


      resultCard.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });


    } catch (error) {

      resultCard.classList.remove(
        "hidden"
      );

      answer.innerHTML = "";


      const box =
        document.createElement(
          "div"
        );

      box.className =
        "error";

      box.textContent =
        error?.message ||
        "Something went wrong.";


      answer.appendChild(
        box
      );


    } finally {

      statusCard.classList.add(
        "hidden"
      );


      solveBtn.disabled =
        selectedFiles.length === 0;

      clearBtn.disabled =
        selectedFiles.length === 0;
    }
  }
);


/* =========================================================
   COPY
   ========================================================= */

copyBtn.addEventListener(
  "click",
  async () => {

    try {

      const text =
        lastMemo
          ? memoToPlainText(
              lastMemo
            )
          : answer.innerText;


      await navigator.clipboard
        .writeText(text);


      const old =
        copyBtn.textContent;


      copyBtn.textContent =
        "Copied ✓";


      setTimeout(
        () => {

          copyBtn.textContent =
            old;

        },
        1200
      );


    } catch {

      alert(
        "Could not copy the memorandum."
      );
    }
  }
);


/* =========================================================
   PRINT / SAVE PDF
   ========================================================= */

printBtn.addEventListener(
  "click",
  () => {

    window.print();
  }
);


/* =========================================================
   SERVICE WORKER
   ========================================================= */

if (
  "serviceWorker"
  in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register(
          "/sw.js"
        )
        .catch(error => {

          console.log(
            "Service worker:",
            error
          );
        });
    }
  );
}


/* =========================================================
   START
   ========================================================= */

renderFiles();


/*
 * Preload KaTeX quietly.
 * This costs NO OpenAI API credits.
 */

loadKatex()
  .catch(error => {

    console.warn(
      "KaTeX preload:",
      error
    );
  });
