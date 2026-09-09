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
   FILE HANDLING
========================================================= */

function niceSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];

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
    hasFiles ? "none" : "block";

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
    Array.from(files || []);

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
          el.removeAttribute(name);
          return;
        }

        if (
          !allowedSvgAttributes.has(
            name
          )
        ) {
          el.removeAttribute(name);
        }
      });

      [
        ...el.children
      ].forEach(cleanElement);
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
}


function buildLineGraph(
  diagram
) {
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
    xs.length !==
      ys.length
  ) {
    return null;
  }

  const width = 720;
  const height = 440;

  const left = 90;
  const right = 35;
  const top = 60;
  const bottom = 80;

  const plotW =
    width -
    left -
    right;

  const plotH =
    height -
    top -
    bottom;

  const minX =
    Math.min(
      0,
      ...xs
    );

  const maxX =
    Math.max(
      1,
      ...xs
    );

  const minY =
    Math.min(
      0,
      ...ys
    );

  const maxY =
    Math.max(
      1,
      ...ys
    );

  const xRange =
    maxX - minX || 1;

  const yRange =
    maxY - minY || 1;

  const px = value =>
    left +
    ((value - minX) /
      xRange) *
      plotW;

  const py = value =>
    top +
    plotH -
    ((value - minY) /
      yRange) *
      plotH;

  const svg =
    createSvgElement(
      "svg",
      {
        viewBox:
          `0 0 ${width} ${height}`,
        width: "100%",
        height: "auto"
      }
    );


  /* TITLE */

  svg.appendChild(
    createSvgText(
      diagram.title ||
        "Graph",
      {
        x: width / 2,
        y: 28,
        "text-anchor":
          "middle",
        "font-size": 21,
        "font-weight": 700
      }
    )
  );


  /* GRID + X LABELS */

  xs.forEach(x => {
    svg.appendChild(
      createSvgElement(
        "line",
        {
          x1: px(x),
          y1: top,
          x2: px(x),
          y2:
            top +
            plotH,
          stroke:
            "#d1d5db",
          "stroke-width":
            1
        }
      )
    );

    svg.appendChild(
      createSvgText(
        x,
        {
          x: px(x),
          y:
            top +
            plotH +
            27,
          "text-anchor":
            "middle",
          "font-size": 14
        }
      )
    );
  });


  /* Y TICKS */

  const uniqueY =
    [
      ...new Set(
        [0, ...ys]
      )
    ].sort(
      (a, b) =>
        a - b
    );

  uniqueY.forEach(y => {
    svg.appendChild(
      createSvgElement(
        "line",
        {
          x1: left,
          y1: py(y),
          x2:
            left +
            plotW,
          y2: py(y),
          stroke:
            "#d1d5db",
          "stroke-width":
            1
        }
      )
    );

    svg.appendChild(
      createSvgText(
        y,
        {
          x:
            left -
            14,
          y:
            py(y) +
            5,
          "text-anchor":
            "end",
          "font-size": 14
        }
      )
    );
  });


  /* AXES */

  svg.appendChild(
    createSvgElement(
      "line",
      {
        x1: left,
        y1: top,
        x2: left,
        y2:
          top +
          plotH,
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
        y1:
          top +
          plotH,
        x2:
          left +
          plotW,
        y2:
          top +
          plotH,
        stroke: "black",
        "stroke-width": 2
      }
    )
  );


  /* GRAPH LINE */

  const points =
    xs.map(
      (x, index) =>
        `${px(x)},${py(
          ys[index]
        )}`
    )
    .join(" ");

  svg.appendChild(
    createSvgElement(
      "polyline",
      {
        points,
        fill: "none",
        stroke: "black",
        "stroke-width": 4,
        "stroke-linecap":
          "round",
        "stroke-linejoin":
          "round"
      }
    )
  );


  /* DATA POINTS */

  xs.forEach(
    (x, index) => {
      svg.appendChild(
        createSvgElement(
          "circle",
          {
            cx: px(x),
            cy: py(
              ys[index]
            ),
            r: 4,
            fill: "black"
          }
        )
      );
    }
  );


  /* X AXIS NAME */

  svg.appendChild(
    createSvgText(
      diagram.x_label ||
        "x",
      {
        x:
          left +
          plotW / 2,
        y:
          height -
          18,
        "text-anchor":
          "middle",
        "font-size": 17,
        "font-weight": 700
      }
    )
  );


  /* Y AXIS NAME */

  const yLabel =
    createSvgText(
      diagram.y_label ||
        "y",
      {
        x: 24,
        y:
          top +
          plotH / 2,
        "text-anchor":
          "middle",
        "font-size": 17,
        "font-weight": 700
      }
    );

  yLabel.setAttribute(
    "transform",
    `rotate(-90 24 ${
      top +
      plotH / 2
    })`
  );

  svg.appendChild(
    yLabel
  );

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

  const heading =
    document.createElement(
      "div"
    );

  heading.className =
    "memo-diagram-title";

  heading.textContent =
    title ||
    "GRAPH / DIAGRAM";

  wrapper.appendChild(
    heading
  );

  return wrapper;
}


/* =========================================================
   RENDER ONE BLOCK
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


  /* EQUATIONS */

  if (
    block.type ===
    "equation"
  ) {
    const eq =
      document.createElement(
        "div"
      );

    eq.className =
      "memo-equation-group";

    (
      block.lines || []
    ).forEach(line => {
      const row =
        document.createElement(
          "div"
        );

      row.className =
        "memo-equation";

      row.textContent =
        cleanText(line);

      eq.appendChild(row);
    });

    container.appendChild(
      eq
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
    container.appendChild(
      makeDiv(
        "memo-or",
        "OR"
      )
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


  /* SOURCE / TECHNICAL SVG */

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
  }
}


/* =========================================================
   RENDER STRUCTURED MEMORANDUM
========================================================= */

function renderStructuredMemo(
  memo
) {
  answer.innerHTML = "";

  if (!memo) {
    answer.textContent =
      "No memorandum was returned.";

    return;
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

  String(text || "")
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
            method: "POST",
            body: form
          }
        );

      const data =
        await response.json();

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
        renderStructuredMemo(
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
        behavior: "smooth",
        block: "start"
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
        answer.innerText;

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
        .register("/sw.js")
        .catch(error => {
          console.log(
            "Service worker:",
            error
          );
        });
    }
  );
}


renderFiles();
