const fileInput = document.getElementById("file-input");
const qualityRange = document.getElementById("quality-range");
const qualityValue = document.getElementById("quality-value");
const convertButton = document.getElementById("convert-button");
const downloadAllButton = document.getElementById("download-all");
const clearFilesButton = document.getElementById("clear-files");
const dropZone = document.getElementById("drop-zone");
const fileListEl = document.getElementById("file-list");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

let selectedFiles = [];
let convertedFiles = [];

const updateStatus = (message) => {
  statusEl.textContent = message;
};

const clearResults = () => {
  resultsEl.innerHTML = "";
  convertedFiles = [];
  downloadAllButton.disabled = true;
};

const updateQualityLabel = () => {
  qualityValue.textContent = `${qualityRange.value}%`;
};

const formatBytes = (bytes) => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[index]}`;
};

const createPreview = (blob, fileName, originalSize) => {
  const url = URL.createObjectURL(blob);
  const item = document.createElement("div");
  item.className = "result";

  const header = document.createElement("div");
  header.className = "result__header";

  const name = document.createElement("strong");
  name.textContent = fileName;

  const download = document.createElement("a");
  download.className = "button button--primary";
  download.textContent = "Descargar WebP";
  download.href = url;
  download.download = fileName.replace(/\.png$/i, ".webp");

  header.append(name, download);

  const preview = document.createElement("div");
  preview.className = "result__preview";

  const image = document.createElement("img");
  image.src = url;
  image.alt = `Vista previa de ${fileName}`;

  const meta = document.createElement("div");
  meta.className = "result__meta";
  meta.innerHTML = `PNG: <strong>${formatBytes(originalSize)}</strong><br />WebP: <strong>${formatBytes(
    blob.size
  )}</strong>`;

  preview.append(image, meta);
  item.append(header, preview);

  resultsEl.appendChild(item);
};

const renderFileList = () => {
  fileListEl.innerHTML = "";
  if (!selectedFiles.length) {
    clearFilesButton.disabled = true;
    return;
  }
  clearFilesButton.disabled = false;
  selectedFiles.forEach((file, index) => {
    const row = document.createElement("div");
    row.className = "file-item";

    const label = document.createElement("div");
    label.innerHTML = `<strong>${file.name}</strong><div class="file-item__meta">${formatBytes(
      file.size
    )}</div>`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "button";
    removeButton.textContent = "Quitar";
    removeButton.addEventListener("click", () => {
      selectedFiles = selectedFiles.filter((_, itemIndex) => itemIndex !== index);
      handleSelectionChange();
    });

    row.append(label, removeButton);
    fileListEl.appendChild(row);
  });
};

const convertFileToWebp = (file, quality) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo iniciar el canvas."));
          return;
        }
        ctx.drawImage(image, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("No se pudo convertir a WebP."));
              return;
            }
            resolve(blob);
          },
          "image/webp",
          quality
        );
      };
      image.onerror = () => reject(new Error("No se pudo leer la imagen."));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error("No se pudo cargar el archivo."));
    reader.readAsDataURL(file);
  });

const mergeFiles = (files) => {
  const fileMap = new Map(
    selectedFiles.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file])
  );
  Array.from(files).forEach((file) => {
    fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file);
  });
  selectedFiles = Array.from(fileMap.values());
};

const handleSelectionChange = () => {
  clearResults();
  renderFileList();

  if (!selectedFiles.length) {
    updateStatus("Selecciona archivos para comenzar.");
    convertButton.disabled = true;
    return;
  }

  const total = selectedFiles.length;
  updateStatus(`${total} archivo${total > 1 ? "s" : ""} listo${total > 1 ? "s" : ""}.`);
  convertButton.disabled = false;
};

const handleFiles = (files, { replace } = { replace: false }) => {
  if (replace) {
    selectedFiles = Array.from(files);
  } else {
    mergeFiles(files);
  }
  handleSelectionChange();
};

const handleConvert = async () => {
  if (!selectedFiles.length) return;

  clearResults();
  updateStatus("Convirtiendo imágenes...");
  convertButton.disabled = true;
  const quality = Number(qualityRange.value) / 100;

  for (const file of selectedFiles) {
    try {
      const webpBlob = await convertFileToWebp(file, quality);
      convertedFiles.push({
        name: file.name,
        blob: webpBlob,
      });
      createPreview(webpBlob, file.name, file.size);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado";
      const item = document.createElement("div");
      item.className = "result";
      item.textContent = `${file.name}: ${message}`;
      resultsEl.appendChild(item);
    }
  }

  const successCount = convertedFiles.length;
  const total = selectedFiles.length;
  updateStatus(
    `Conversión completada. ${successCount} de ${total} imagen${total > 1 ? "es" : ""} listo${
      total > 1 ? "s" : ""
    }.`
  );

  convertButton.disabled = false;
  downloadAllButton.disabled = successCount === 0;
};

const downloadAll = () => {
  convertedFiles.forEach(({ name, blob }, index) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name.replace(/\.png$/i, ".webp");
    document.body.appendChild(link);
    setTimeout(() => {
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
    }, index * 150);
  });
};

fileInput.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    handleFiles(target.files || [], { replace: true });
  }
});

clearFilesButton.addEventListener("click", () => {
  selectedFiles = [];
  fileInput.value = "";
  handleSelectionChange();
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drop-zone--active");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drop-zone--active");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("drop-zone--active");
  if (event.dataTransfer?.files?.length) {
    handleFiles(event.dataTransfer.files, { replace: false });
  }
});

qualityRange.addEventListener("input", updateQualityLabel);
convertButton.addEventListener("click", handleConvert);
downloadAllButton.addEventListener("click", downloadAll);

updateQualityLabel();
