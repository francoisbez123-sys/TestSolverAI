
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
  const has = selectedFiles.length > 0;
  emptyText.style.display = has ? "none" : "block";
  fileArea.classList.toggle("empty", !has);

  selectedFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-row";

    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = `${index + 1}. ${file.name || `Camera photo ${index + 1}`}`;

    const size = document.createElement("div");
    size.className = "file-size";
    size.textContent = niceSize(file.size);

    row.append(name, size);
    fileList.appendChild(row);
  });

  solveBtn.disabled = !has;
  clearBtn.disabled = !has;
}

function addFiles(fileListLike) {
  const incoming = Array.from(fileListLike || []);
  for (const f of incoming) {
    selectedFiles.push(f);
  }
  renderFiles();
}

uploadBtn.addEventListener("click", () => filePicker.click());
cameraBtn.addEventListener("click", () => cameraPicker.click());

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
  answer.textContent = "";
  resultCard.classList.add("hidden");
  renderFiles();
});

solveBtn.addEventListener("click", async () => {
  if (!selectedFiles.length) return;

  resultCard.classList.add("hidden");
  statusCard.classList.remove("hidden");
  solveBtn.disabled = true;
  clearBtn.disabled = true;
  answer.textContent = "";

  const form = new FormData();
  selectedFiles.forEach(file => form.append("files", file, file.name || "camera.jpg"));

  try {
    const response = await fetch("/api/solve", {
      method: "POST",
      body: form
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not solve the paper.");
    }

    answer.textContent = data.answer;
    resultCard.classList.remove("hidden");
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    resultCard.classList.remove("hidden");
    answer.innerHTML = "";
    const box = document.createElement("div");
    box.className = "error";
    box.textContent = err.message || "Something went wrong.";
    answer.appendChild(box);
  } finally {
    statusCard.classList.add("hidden");
    solveBtn.disabled = selectedFiles.length === 0;
    clearBtn.disabled = selectedFiles.length === 0;
  }
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(answer.innerText);
  const old = copyBtn.textContent;
  copyBtn.textContent = "Copied ✓";
  setTimeout(() => copyBtn.textContent = old, 1200);
});

printBtn.addEventListener("click", () => window.print());

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

renderFiles();
