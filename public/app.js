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
let rawAnswerText = "";

/* -------------------------------------------------------
   FILE HELPERS
------------------------------------------------------- */

function niceSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function renderFiles() {
  fileList.innerHTML = "";

  const hasFiles = selectedFiles.length > 0;

  emptyText.style.display = hasFiles ? "none" : "block";
  fileArea.classList.toggle("empty", !hasFiles);

  selectedFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-row";

    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent =
      `${index + 1}. ${file.name || `Camera photo ${index + 1}`}`;

    const size = document.createElement("div");
    size.className = "file-size";
    size.textContent = niceSize(file.size);

    row.append(name, size);
    fileList.appendChild(row);
  });

  solveBtn.disabled = !hasFiles;
  clearBtn.disabled = !hasFiles;
}

function addFiles(fileListLike) {
  const incoming = Array.from(fileListLike || []);

  incoming.forEach(file => {
    selectedFiles.push(file);
  });

  renderFiles();
}

/* -------------------------------------------------------
   SAFE SVG RENDERING
------------------------------------------------------- */

const allowedSvgTags = new Set([
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

const allowedSvgAttributes = new Set([
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");

    if (doc.querySelector("parsererror")) {
      return null;
    }

    const svg = doc.documentElement;

    if (!svg || svg.tagName.toLowerCase() !== "svg") {
      return null;
    }

    function cleanElement(element) {
      const tag = element.tagName.toLowerCase();

      if (!allowedSvgTags.has(tag)) {
        element.remove();
        return;
      }

      [...element.attributes].forEach(attr => {
        const attrName = attr.name;
        const lowerName = attrName.toLowerCase();
        const value = attr.value || "";

        if (
          lowerName.startsWith("on") ||
          lowerName === "href" ||
          lowerName === "xlink:href" ||
          value.toLowerCase().includes("javascript:")
        ) {
          element.removeAttribute(attrName);
          return;
        }

        if (!allowedSvgAttributes.has(attrName)) {
          element.removeAttribute(attrName);
        }
      });

      [...element.children].forEach(cleanElement);
    }

    cleanElement(svg);

    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "auto");

    if (!svg.getAttribute("viewBox")) {
      svg.setAttribute("viewBox", "0 0 700 420");
    }

    return document.importNode(svg, true);
  } catch (error) {
    console.error("SVG rendering error:", error);
    return null;
  }
}

/* -------------------------------------------------------
   MEMORANDUM TEXT RENDERING
------------------------------------------------------- */

function cleanLine(line) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();
}

function makeTextElement(line) {
  const cleaned = cleanLine(line);

  if (!cleaned) {
    const spacer = document.createElement("div");
    spacer.className = "memo-space";
    return spacer;
  }

  let el;

  if (/^QUESTION\s+\d+/i.test(cleaned)) {
    el = document.createElement("h2");
    el.className = "memo-question";
  } else if (/^\d+(\.\d+)+\s/.test(cleaned)) {
    el = document.createElement("h3");
    el.className = "memo-subquestion";
  } else if (/^FINAL ANSWER$/i.test(cleaned)) {
    el = document.createElement("div");
    el.className = "memo-label memo-final-label";
  } else if (/^(GIVEN|FORMULA|WORKING|ANSWER|CHECK)$/i.test(cleaned)) {
    el = document.createElement("div");
    el.className = "memo-label";
  } else if (/^(OR|or)$/i.test(cleaned)) {
    el = document.createElement("div");
    el.className = "memo-or";
  } else if (/^TOTAL\s*:/i.test(cleaned)) {
    el = document.createElement("div");
    el.className = "memo-total";
  } else if (
    /^[A-Za-zΑ-Ωα-ω][A-Za-zΑ-Ωα-ω0-9₀-₉]*\s*=/.test(cleaned) ||
    cleaned.includes(" = ")
  ) {
    el = document.createElement("div");
    el.className = "memo-equation";
  } else {
    el = document.createElement("div");
    el.className = "memo-text";
  }

  el.textContent = cleaned;

  return el;
}

/* -------------------------------------------------------
   COMPLETE ANSWER RENDERER
------------------------------------------------------- */

function renderAnswer(rawText) {
  answer.innerHTML = "";

  const text = String(rawText || "").trim();

  if (!text) {
    answer.textContent = "No answer was returned.";
    return;
  }

  /*
    Split answer into normal text and SVG blocks.
    SVG is rendered as an actual graph/diagram.
    All other content remains plain safe text.
  */
  const svgRegex = /<svg[\s\S]*?<\/svg>/gi;

  let lastIndex = 0;
  let match;

  function renderTextBlock(block) {
    const lines = block.split(/\r?\n/);

    lines.forEach(line => {
      answer.appendChild(makeTextElement(line));
    });
  }

  while ((match = svgRegex.exec(text)) !== null) {
    const beforeSvg = text.slice(lastIndex, match.index);

    if (beforeSvg.trim()) {
      renderTextBlock(beforeSvg);
    }

    const svgNode = sanitizeSvg(match[0]);

    if (svgNode) {
      const wrapper = document.createElement("div");
      wrapper.className = "memo-diagram";

      const heading = document.createElement("div");
      heading.className = "memo-diagram-title";
      heading.textContent = "GRAPH / DIAGRAM";

      wrapper.appendChild(heading);
      wrapper.appendChild(svgNode);
      answer.appendChild(wrapper);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "memo-diagram-error";
      fallback.textContent =
        "Diagram could not be displayed correctly.";
      answer.appendChild(fallback);
    }

    lastIndex = svgRegex.lastIndex;
  }

  const remainder = text.slice(lastIndex);

  if (remainder.trim()) {
    renderTextBlock(remainder);
  }
}

/* -------------------------------------------------------
   BUTTONS
------------------------------------------------------- */

uploadBtn.addEventListener("click", () => {
  filePicker.click();
});

cameraBtn.addEventListener("click", () => {
  cameraPicker.click();
});

filePicker.addEventListener("change", () => {
  addFiles(filePicker.files);
  filePicker.value = "";
});

cameraPicker.addEventListener("change", () => {
  addFiles(cameraPicker.files);
  cameraPicker.value = "";
});

clearBtn.addEventListener("click", () => {
  selectedFiles = [];
  rawAnswerText = "";

  answer.innerHTML = "";
  resultCard.classList.add("hidden");

  renderFiles();
});

/* -------------------------------------------------------
   SOLVE PAPER
------------------------------------------------------- */

solveBtn.addEventListener("click", async () => {
  if (!selectedFiles.length) return;

  resultCard.classList.add("hidden");
  statusCard.classList.remove("hidden");

  solveBtn.disabled = true;
  clearBtn.disabled = true;

  answer.innerHTML = "";
  rawAnswerText = "";

  const form = new FormData();

  selectedFiles.forEach(file => {
    form.append(
      "files",
      file,
      file.name || "camera.jpg"
    );
  });

  try {
    const response = await fetch("/api/solve", {
      method: "POST",
      body: form
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Could not solve the paper."
      );
    }

    rawAnswerText = data.answer || "";

    renderAnswer(rawAnswerText);

    resultCard.classList.remove("hidden");

    resultCard.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    resultCard.classList.remove("hidden");
    answer.innerHTML = "";

    const box = document.createElement("div");
    box.className = "error";
    box.textContent =
      error.message || "Something went wrong.";

    answer.appendChild(box);
  } finally {
    statusCard.classList.add("hidden");

    solveBtn.disabled =
      selectedFiles.length === 0;

    clearBtn.disabled =
      selectedFiles.length === 0;
  }
});

/* -------------------------------------------------------
   COPY
------------------------------------------------------- */

copyBtn.addEventListener("click", async () => {
  try {
    const textToCopy =
      rawAnswerText || answer.innerText;

    await navigator.clipboard.writeText(textToCopy);

    const oldText = copyBtn.textContent;

    copyBtn.textContent = "Copied ✓";

    setTimeout(() => {
      copyBtn.textContent = oldText;
    }, 1200);
  } catch (error) {
    alert("Could not copy the answer.");
  }
});

/* -------------------------------------------------------
   PRINT / SAVE PDF
------------------------------------------------------- */

printBtn.addEventListener("click", () => {
  window.print();
});

/* -------------------------------------------------------
   SERVICE WORKER
------------------------------------------------------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(error => {
        console.log(
          "Service worker registration skipped:",
          error
        );
      });
  });
}

renderFiles();
