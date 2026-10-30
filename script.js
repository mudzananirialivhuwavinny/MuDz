
"use strict";
function sayMuDz(message) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
}
// =====================================
// IMAGE COMPRESSOR
// =====================================

const qualitySlider = document.getElementById("quality");
const qualityValue = document.getElementById("quality-value");
const imageInput = document.getElementById("image-input");
const compressButton = document.getElementById("compress-button");
const downloadLink = document.getElementById("download-link");
const preview = document.getElementById("image-preview");
const status = document.getElementById("status");

let selectedImage = null;
let compressedUrl = null;
let previewUrl = null;

if (qualitySlider && qualityValue) {
  qualitySlider.addEventListener("input", () => {
    qualityValue.textContent = `${qualitySlider.value}%`;
  });
}

if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      status.textContent = "Please select a valid image file.";
      return;
    }

    selectedImage = file;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    preview.hidden = false;

    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    compressedUrl = null;
    downloadLink.hidden = true;

    status.textContent = `Image selected: ${file.name}`;
  });
}

if (compressButton) {
  compressButton.addEventListener("click", () => {
    if (!selectedImage) {
      status.textContent = "Please choose an image first.";
      return;
    }

    compressButton.disabled = true;
    status.textContent = "Compressing your image...";

    const image = new Image();
    const objectUrl = URL.createObjectURL(selectedImage);

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");

        context.drawImage(image, 0, 0);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          compressButton.disabled = false;

          if (!blob) {
            status.textContent = "Compression failed. Try another image.";
            return;
          }

          if (compressedUrl) URL.revokeObjectURL(compressedUrl);
          compressedUrl = URL.createObjectURL(blob);

          downloadLink.href = compressedUrl;
          downloadLink.download = "mudz-compressed.jpg";
          downloadLink.hidden = false;

          const before = (selectedImage.size / 1024).toFixed(1);
          const after = (blob.size / 1024).toFixed(1);
          const saved = (
            ((selectedImage.size - blob.size) / selectedImage.size) * 100
          ).toFixed(1);

          status.textContent = blob.size < selectedImage.size
            ? `Original: ${before} KB · Compressed: ${after} KB · ${saved}% smaller.`
            : `Original: ${before} KB · Result: ${after} KB. This image did not get smaller.`;
        }, "image/jpeg", Number(qualitySlider.value) / 100);
      } catch {
        URL.revokeObjectURL(objectUrl);
        compressButton.disabled = false;
        status.textContent = "Something went wrong. Try another image.";
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      compressButton.disabled = false;
      status.textContent = "Could not read this image. Try another one.";
    };

    image.src = objectUrl;
  });
}


// =====================================
// QR CODE GENERATOR
// =====================================

const qrText = document.getElementById("qr-text");
const qrGenerate = document.getElementById("qr-generate");
const qrStatus = document.getElementById("qr-status");
const qrResult = document.getElementById("qr-result");
const qrImage = document.getElementById("qr-image");
const qrDownload = document.getElementById("qr-download");

let qrLibraryLoading = false;
let qrLibraryReady = typeof window.QRCode !== "undefined";

function loadQrLibrary(callback) {
  if (typeof window.QRCode !== "undefined") {
    callback();
    return;
  }

  if (qrLibraryLoading) {
    qrStatus.textContent = "Loading QR library. Please try again in a moment.";
    qrGenerate.disabled = false;
    return;
  }

  qrLibraryLoading = true;
  qrStatus.textContent = "Loading QR generator...";

  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";

  script.onload = () => {
    qrLibraryLoading = false;
    qrLibraryReady = typeof window.QRCode !== "undefined";

    if (qrLibraryReady) {
      callback();
    } else {
      qrStatus.textContent = "The QR library did not load. Check your internet.";
      qrGenerate.disabled = false;
    }
  };

  script.onerror = () => {
    qrLibraryLoading = false;
    qrStatus.textContent =
      "Could not load the QR library. Check your internet connection and try again.";
    qrGenerate.disabled = false;
  };

  document.head.appendChild(script);
}

if (qrGenerate && qrText && qrStatus && qrResult && qrImage && qrDownload) {
  qrGenerate.addEventListener("click", () => {
    const text = qrText.value.trim();

    if (!text) {
      qrStatus.textContent = "Enter a link or some text first.";
      qrResult.hidden = true;
      return;
    }

    qrGenerate.disabled = true;
    qrResult.hidden = true;

    loadQrLibrary(() => {
      try {
        const temporaryBox = document.createElement("div");

        new window.QRCode(temporaryBox, {
          text,
          width: 300,
          height: 300,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M
        });

        const generatedCanvas = temporaryBox.querySelector("canvas");
        const generatedImage = temporaryBox.querySelector("img");

        function showQr(source) {
          qrImage.onload = () => {
            qrResult.hidden = false;
            qrStatus.textContent = "Your QR code is ready!";
            qrGenerate.disabled = false;
            qrDownload.href = source;
            qrDownload.download = "mudz-qr-code.png";
          };

          qrImage.onerror = () => {
            qrStatus.textContent = "Could not display the QR code. Try again.";
            qrGenerate.disabled = false;
          };

          qrImage.src = source;
        }

        if (generatedCanvas) {
          showQr(generatedCanvas.toDataURL("image/png"));
        } else if (generatedImage) {
          generatedImage.onload = () => showQr(generatedImage.src);
          if (generatedImage.complete) showQr(generatedImage.src);
        } else {
          qrStatus.textContent = "QR generation failed. Try a shorter text.";
          qrGenerate.disabled = false;
        }
      } catch {
        qrStatus.textContent = "QR generation failed. Try a shorter text.";
        qrGenerate.disabled = false;
      }
    });
  });
}


 
// =====================================
// IMAGE RESIZER
// =====================================

const resizeInput = document.getElementById("resize-input");
const resizePreview = document.getElementById("resize-preview");
const resizeWidth = document.getElementById("resize-width");
const resizeHeight = document.getElementById("resize-height");
const keepRatio = document.getElementById("keep-ratio");
const resizeButton = document.getElementById("resize-button");
const resizeStatus = document.getElementById("resize-status");
const resizeDownload = document.getElementById("resize-download");

let resizeImageUrl = null;
let resizedImageUrl = null;
let originalWidth = 0;
let originalHeight = 0;
let resizeFile = null;
let updatingSize = false;

if (resizeInput) {
  resizeInput.addEventListener("change", () => {
    const file = resizeInput.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      resizeStatus.textContent = "Please choose a JPG, PNG, or WebP image.";
      return;
    }

    if (resizeImageUrl) URL.revokeObjectURL(resizeImageUrl);
    if (resizedImageUrl) URL.revokeObjectURL(resizedImageUrl);

    resizeFile = file;
    resizeImageUrl = URL.createObjectURL(file);
    resizedImageUrl = null;
    resizeDownload.hidden = true;
    resizeStatus.textContent = "Loading image...";

    const image = new Image();

    image.onload = () => {
      originalWidth = image.naturalWidth;
      originalHeight = image.naturalHeight;

      resizePreview.src = resizeImageUrl;
      resizePreview.hidden = false;
      resizeWidth.value = originalWidth;
      resizeHeight.value = originalHeight;

      resizeStatus.textContent =
        `Image loaded: ${originalWidth} × ${originalHeight} pixels.`;
    };

    image.onerror = () => {
      resizeStatus.textContent = "Could not load this image. Try another one.";
    };

    image.src = resizeImageUrl;
  });
}

if (resizeWidth && resizeHeight && keepRatio) {
  resizeWidth.addEventListener("input", () => {
    if (!keepRatio.checked || updatingSize || !originalWidth) return;

    const width = Number(resizeWidth.value);
    if (width > 0) {
      updatingSize = true;
      resizeHeight.value = Math.round(width * originalHeight / originalWidth);
      updatingSize = false;
    }
  });

  resizeHeight.addEventListener("input", () => {
    if (!keepRatio.checked || updatingSize || !originalHeight) return;

    const height = Number(resizeHeight.value);
    if (height > 0) {
      updatingSize = true;
      resizeWidth.value = Math.round(height * originalWidth / originalHeight);
      updatingSize = false;
    }
  });
}

if (resizeButton) {
  resizeButton.addEventListener("click", () => {
    if (!resizeFile || !resizeImageUrl) {
      resizeStatus.textContent = "Please choose an image first.";
      return;
    }

    const width = Number(resizeWidth.value);
    const height = Number(resizeHeight.value);

    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 || height < 1 ||
      width > 10000 || height > 10000
    ) {
      resizeStatus.textContent =
        "Enter width and height between 1 and 10,000 pixels.";
      return;
    }

    resizeButton.disabled = true;
    resizeStatus.textContent = "Resizing your image...";

    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        resizeButton.disabled = false;
        resizeStatus.textContent = "Your browser could not resize this image.";
        return;
      }

      context.drawImage(image, 0, 0, width, height);

      const outputType = resizeFile.type;
      const extension = outputType === "image/jpeg"
        ? "jpg"
        : outputType.split("/")[1];

      canvas.toBlob((blob) => {
        resizeButton.disabled = false;

        if (!blob) {
          resizeStatus.textContent = "Resizing failed. Please try again.";
          return;
        }

        if (resizedImageUrl) URL.revokeObjectURL(resizedImageUrl);
        resizedImageUrl = URL.createObjectURL(blob);

        resizeDownload.href = resizedImageUrl;
        resizeDownload.download = `mudz-resized-image.${extension}`;
        resizeDownload.hidden = false;

        resizeStatus.textContent =
          `Success! Resized to ${width} × ${height} pixels.`;
      }, outputType, 0.92);
    };

    image.onerror = () => {
      resizeButton.disabled = false;
      resizeStatus.textContent = "Could not process the image. Try again.";
    };

    image.src = resizeImageUrl;
  });
}

 
// =====================================
// TOOL 04: UNIT CONVERTER
// =====================================

const unitCategory = document.getElementById("unit-category");
const unitValue = document.getElementById("unit-value");
const unitFrom = document.getElementById("unit-from");
const unitTo = document.getElementById("unit-to");
const unitConvertButton = document.getElementById("unit-convert-button");
const unitStatus = document.getElementById("unit-status");
const unitResult = document.getElementById("unit-result");
const unitAnswer = document.getElementById("unit-answer");

const unitOptions = {
  length: {
    meter: { label: "Meters (m)", factor: 1 },
    kilometer: { label: "Kilometers (km)", factor: 1000 },
    centimeter: { label: "Centimeters (cm)", factor: 0.01 },
    millimeter: { label: "Millimeters (mm)", factor: 0.001 },
    mile: { label: "Miles (mi)", factor: 1609.344 },
    yard: { label: "Yards (yd)", factor: 0.9144 },
    foot: { label: "Feet (ft)", factor: 0.3048 },
    inch: { label: "Inches (in)", factor: 0.0254 }
  },
  weight: {
    kilogram: { label: "Kilograms (kg)", factor: 1 },
    gram: { label: "Grams (g)", factor: 0.001 },
    milligram: { label: "Milligrams (mg)", factor: 0.000001 },
    pound: { label: "Pounds (lb)", factor: 0.45359237 },
    ounce: { label: "Ounces (oz)", factor: 0.028349523125 },
    tonne: { label: "Metric tonnes (t)", factor: 1000 }
  },
  temperature: {
    celsius: { label: "Celsius (°C)" },
    fahrenheit: { label: "Fahrenheit (°F)" },
    kelvin: { label: "Kelvin (K)" }
  }
};

function fillUnitOptions() {
  const category = unitCategory.value;
  const options = unitOptions[category];

  unitFrom.replaceChildren();
  unitTo.replaceChildren();

  Object.entries(options).forEach(([key, unit]) => {
    const fromOption = document.createElement("option");
    fromOption.value = key;
    fromOption.textContent = unit.label;
    unitFrom.appendChild(fromOption);

    const toOption = document.createElement("option");
    toOption.value = key;
    toOption.textContent = unit.label;
    unitTo.appendChild(toOption);
  });

  if (category === "length") {
    unitFrom.value = "meter";
    unitTo.value = "kilometer";
  } else if (category === "weight") {
    unitFrom.value = "kilogram";
    unitTo.value = "gram";
  } else {
    unitFrom.value = "celsius";
    unitTo.value = "fahrenheit";
  }

  unitResult.hidden = true;
  unitStatus.textContent = "Enter a value and press Convert.";
}

if (
  unitCategory && unitValue && unitFrom && unitTo &&
  unitConvertButton && unitStatus && unitResult && unitAnswer
) {
  unitCategory.addEventListener("change", fillUnitOptions);

  unitConvertButton.addEventListener("click", () => {
    const value = Number(unitValue.value);
    const category = unitCategory.value;
    const from = unitFrom.value;
    const to = unitTo.value;

    if (unitValue.value.trim() === "" || !Number.isFinite(value)) {
      unitStatus.textContent = "Please enter a valid number.";
      unitResult.hidden = true;
      return;
    }

    let answer;

    if (category === "temperature") {
      let celsius;

      if (from === "celsius") celsius = value;
      if (from === "fahrenheit") celsius = (value - 32) * 5 / 9;
      if (from === "kelvin") celsius = value - 273.15;

      if (celsius < -273.15) {
        unitStatus.textContent = "Temperature cannot be below absolute zero.";
        unitResult.hidden = true;
        return;
      }

      if (to === "celsius") answer = celsius;
      if (to === "fahrenheit") answer = celsius * 9 / 5 + 32;
      if (to === "kelvin") answer = celsius + 273.15;
    } else {
      const baseValue = value * unitOptions[category][from].factor;
      answer = baseValue / unitOptions[category][to].factor;
    }

    const formatted = Number(answer.toPrecision(10)).toLocaleString(
      "en-US",
      { maximumFractionDigits: 8 }
    );

    unitAnswer.textContent = `${formatted} ${unitOptions[category][to].label}`;
    unitResult.hidden = false;
    unitStatus.textContent = "Conversion complete!";
  });

  fillUnitOptions();
}

/* MuDz: register the service worker */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => {
        console.log("MuDz service worker registered.");
      })
      .catch((error) => {
        console.error("MuDz service worker registration failed:", error);
      });
  });
}

/* TOOL 05: IMAGE TO PDF */
(() => {
  const imageInput = document.getElementById("pdf-images");
  const imageList = document.getElementById("pdf-image-list");
  const pageSizeInput = document.getElementById("pdf-page-size");
  const orientationInput = document.getElementById("pdf-orientation");
  const createButton = document.getElementById("pdf-create-button");
  const status = document.getElementById("pdf-status");

  // Do nothing if the Image to PDF section is not on this page.
  if (
    !imageInput ||
    !imageList ||
    !pageSizeInput ||
    !orientationInput ||
    !createButton ||
    !status
  ) return;

  let selectedImages = [];

  imageInput.addEventListener("change", () => {
    selectedImages = Array.from(imageInput.files || [])
      .filter(file => file.type.startsWith("image/"));

    imageList.replaceChildren();

    selectedImages.forEach((file, index) => {
      const item = document.createElement("p");
      item.textContent = `${index + 1}. ${file.name}`;
      imageList.appendChild(item);
    });

    status.textContent = selectedImages.length
      ? `${selectedImages.length} image(s) selected.`
      : "Choose one or more images to begin.";
  });

  createButton.addEventListener("click", async () => {
    if (!selectedImages.length) {
      status.textContent = "Please choose at least one image.";
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      status.textContent =
        "PDF library not loaded. Check your internet connection and reload MuDz.";
      return;
    }

    createButton.disabled = true;
    status.textContent = "Creating your PDF…";

    try {
      const { jsPDF } = window.jspdf;
      const firstOrientation = orientationInput.value;
      const pageSize = pageSizeInput.value;

      let pdf;

      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error(`Unsupported image format: ${file.name}`);
        }

        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Could not read an image."));
          reader.readAsDataURL(file);
        });

        const image = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Could not open ${file.name}.`));
          img.src = dataUrl;
        });

        const imageFormat = file.type === "image/png"
          ? "PNG"
          : "JPEG";

        let pageWidth;
        let pageHeight;

        if (pageSize === "fit") {
          const ratio = image.width / image.height;
          pageWidth = 210;
          pageHeight = pageWidth / ratio;

          if (pageHeight > 297) {
            pageHeight = 297;
            pageWidth = pageHeight * ratio;
          }
        } else if (pageSize === "letter") {
          pageWidth = firstOrientation === "portrait" ? 215.9 : 279.4;
          pageHeight = firstOrientation === "portrait" ? 279.4 : 215.9;
        } else {
          pageWidth = firstOrientation === "portrait" ? 210 : 297;
          pageHeight = firstOrientation === "portrait" ? 297 : 210;
        }

        if (!pdf) {
          pdf = new jsPDF({
            orientation: firstOrientation,
            unit: "mm",
            format: pageSize === "fit"
              ? [pageWidth, pageHeight]
              : pageSize
          });
        } else {
          pdf.addPage(
            pageSize === "fit" ? [pageWidth, pageHeight] : pageSize,
            firstOrientation
          );
        }

        const margin = pageSize === "fit" ? 0 : 10;
        const availableWidth = pageWidth - margin * 2;
        const availableHeight = pageHeight - margin * 2;
        const scale = Math.min(
          availableWidth / image.width,
          availableHeight / image.height
        );

        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const x = (pageWidth - drawWidth) / 2;
        const y = (pageHeight - drawHeight) / 2;

        pdf.addImage(
          dataUrl,
          imageFormat,
          x,
          y,
          drawWidth,
          drawHeight
        );

        status.textContent =
          `Adding image ${i + 1} of ${selectedImages.length}…`;
      }

      pdf.save("mudz-images.pdf");
      status.textContent =
        `Success! Your PDF contains ${selectedImages.length} image(s).`;
    } catch (error) {
      console.error("MuDz Image to PDF error:", error);
      status.textContent =
        error.message || "Something went wrong while creating the PDF.";
    } finally {
      createButton.disabled = false;
    }
  });
})();


/* MuDz Tool 07: Password Generator */
(() => {
  const get = id => document.getElementById(id);
  const lengthInput = get("password-length");
  const output = get("password-output");
  const status = get("password-status");
  const generate = get("password-generate");
  const copy = get("password-copy");

  if (!lengthInput || !output || !status || !generate || !copy) return;

  function secureIndex(max) {
    const limit = Math.floor(4294967296 / max) * max;
    const values = new Uint32Array(1);
    let value;

    do {
      crypto.getRandomValues(values);
      value = values[0];
    } while (value >= limit);

    return value % max;
  }

  generate.addEventListener("click", () => {
    const length = Number(lengthInput.value);

    if (!Number.isInteger(length) || length < 8 || length > 64) {
      status.textContent = "Choose a password length from 8 to 64.";
      return;
    }

    const groups = [];
    if (get("password-lower").checked) groups.push("abcdefghijklmnopqrstuvwxyz");
    if (get("password-upper").checked) groups.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    if (get("password-numbers").checked) groups.push("0123456789");
    if (get("password-symbols").checked) groups.push("!@#$%^&*()-_=+?");

    if (groups.length === 0) {
      status.textContent = "Select at least one character type.";
      return;
    }

    const all = groups.join("");
    const chars = groups.map(group => group[secureIndex(group.length)]);

    while (chars.length < length) {
      chars.push(all[secureIndex(all.length)]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
      const j = secureIndex(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    output.value = chars.join("");
    status.textContent = "Password generated successfully.";
  });

  copy.addEventListener("click", async () => {
    if (!output.value) {
      status.textContent = "Generate a password first.";
      return;
    }

    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = "Password copied successfully.";
    } catch {
      output.select();
      status.textContent = "Automatic copy failed. Copy the selected text manually.";
    }
  });
})();

/* MuDz Tool 08: Stopwatch & Countdown Timer */
(() => {
  const get = id => document.getElementById(id);

  const stopwatchDisplay = get("stopwatch-display");
  const countdownDisplay = get("countdown-display");
  const countdownStatus = get("countdown-status");

  if (!stopwatchDisplay || !countdownDisplay || !countdownStatus) return;

  // Stopwatch
  let stopwatchElapsed = 0;
  let stopwatchStartedAt = 0;
  let stopwatchRunning = false;
  let stopwatchFrame = null;

  function formatStopwatch(ms) {
    const tenths = Math.floor(ms / 100);
    const minutes = Math.floor(tenths / 600);
    const seconds = Math.floor(tenths / 10) % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths % 10}`;
  }

  function updateStopwatch() {
    if (!stopwatchRunning) return;
    const elapsed = stopwatchElapsed + performance.now() - stopwatchStartedAt;
    stopwatchDisplay.textContent = formatStopwatch(elapsed);
    stopwatchFrame = requestAnimationFrame(updateStopwatch);
  }

  get("stopwatch-start").addEventListener("click", () => {
    if (stopwatchRunning) return;
    stopwatchStartedAt = performance.now();
    stopwatchRunning = true;
    updateStopwatch();
  });

  get("stopwatch-pause").addEventListener("click", () => {
    if (!stopwatchRunning) return;
    stopwatchElapsed += performance.now() - stopwatchStartedAt;
    stopwatchRunning = false;
    cancelAnimationFrame(stopwatchFrame);
    stopwatchDisplay.textContent = formatStopwatch(stopwatchElapsed);
  });

  get("stopwatch-reset").addEventListener("click", () => {
    stopwatchRunning = false;
    cancelAnimationFrame(stopwatchFrame);
    stopwatchElapsed = 0;
    stopwatchDisplay.textContent = "00:00.0";
  });

  // Countdown
  let countdownRemaining = 60;
  let countdownEndAt = 0;
  let countdownRunning = false;
  let countdownInterval = null;

  function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function updateCountdownDisplay() {
    countdownDisplay.textContent = formatCountdown(countdownRemaining);
  }

  function stopCountdown(message) {
    countdownRunning = false;
    clearInterval(countdownInterval);
    countdownInterval = null;
    countdownStatus.textContent = message;
  }

  function tickCountdown() {
    countdownRemaining = Math.max(0, Math.ceil((countdownEndAt - Date.now()) / 1000));
    updateCountdownDisplay();

    if (countdownRemaining <= 0) {
      stopCountdown("Time is up!");
    }
  }

  function readCountdownInputs() {
    const minutes = Number(get("countdown-minutes").value);
    const seconds = Number(get("countdown-seconds").value);

    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 999 ||
        !Number.isInteger(seconds) || seconds < 0 || seconds > 59 ||
        minutes * 60 + seconds <= 0) {
      countdownStatus.textContent = "Enter a valid time greater than zero.";
      return null;
    }

    return minutes * 60 + seconds;
  }

  get("countdown-start").addEventListener("click", () => {
    if (countdownRunning) return;

    if (countdownRemaining <= 0) {
      const value = readCountdownInputs();
      if (value === null) return;
      countdownRemaining = value;
    }

    countdownEndAt = Date.now() + countdownRemaining * 1000;
    countdownRunning = true;
    countdownStatus.textContent = "Countdown running.";

    countdownInterval = setInterval(tickCountdown, 200);
    tickCountdown();
  });

  get("countdown-pause").addEventListener("click", () => {
    if (!countdownRunning) return;
    countdownRemaining = Math.max(0, Math.ceil((countdownEndAt - Date.now()) / 1000));
    stopCountdown("Countdown paused.");
    updateCountdownDisplay();
  });

  get("countdown-reset").addEventListener("click", () => {
    stopCountdown("Countdown reset.");
    const value = readCountdownInputs();
    if (value !== null) {
      countdownRemaining = value;
      updateCountdownDisplay();
    }
  });

  ["countdown-minutes", "countdown-seconds"].forEach(id => {
    get(id).addEventListener("input", () => {
      if (countdownRunning) return;
      const value = readCountdownInputs();
      if (value !== null) {
        countdownRemaining = value;
        updateCountdownDisplay();
        countdownStatus.textContent = "Ready to count down.";
      }
    });
  });

  updateCountdownDisplay();
})();

/* MuDz Tool 09: Text Formatter */
(() => {
  const input = document.getElementById("formatter-input");
  const mode = document.getElementById("formatter-mode");
  const output = document.getElementById("formatter-output");
  const status = document.getElementById("formatter-status");
  const apply = document.getElementById("formatter-apply");
  const copy = document.getElementById("formatter-copy");

  if (!input || !mode || !output || !status || !apply || !copy) {
    console.error("Text Formatter: An HTML element is missing.");
    return;
  }

  apply.addEventListener("click", () => {
    const text = input.value;
    let result = text;

    switch (mode.value) {
      case "upper":
        result = text.toUpperCase();
        break;
      case "lower":
        result = text.toLowerCase();
        break;
      case "title":
        result = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        break;
      case "sentence":
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g,
          c => c.toUpperCase());
        break;
      case "spaces":
        result = text.split("\n")
          .map(line => line.trim().replace(/[ \t]+/g, " "))
          .join("\n")
          .replace(/\n{3,}/g, "\n\n");
        break;
    }

    output.value = result;
    status.textContent = "Text formatted successfully.";
  });

  copy.addEventListener("click", async () => {
    if (!output.value) {
      status.textContent = "Format some text first.";
      return;
    }

    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = "Formatted text copied.";
    } catch {
      output.focus();
      output.select();
      status.textContent = "Press Ctrl+C to copy the selected text.";
    }
  });
})();

/* MuDz Tool 10: Percentage Calculator */
(() => {
  const get = id => document.getElementById(id);

  const rate = get("percent-rate");
  const number = get("percent-number");
  const calculate = get("percent-calculate");
  const result = get("percent-result");

  const part = get("percent-part");
  const whole = get("percent-whole");
  const find = get("percent-find");
  const findResult = get("percent-find-result");

  const changeNumber = get("percent-change-number");
  const changeRate = get("percent-change-rate");
  const changeType = get("percent-change-type");
  const changeButton = get("percent-change");
  const changeResult = get("percent-change-result");

  if (
    !rate || !number || !calculate || !result ||
    !part || !whole || !find || !findResult ||
    !changeNumber || !changeRate || !changeType ||
    !changeButton || !changeResult
  ) {
    console.error("Percentage Calculator: An HTML element is missing.");
    return;
  }

  calculate.addEventListener("click", () => {
    if (rate.value === "" || number.value === "") {
      result.textContent = "Please enter both numbers.";
      return;
    }

    const answer = (Number(rate.value) / 100) * Number(number.value);
    result.textContent = `${rate.value}% of ${number.value} = ${answer}`;
  });

  find.addEventListener("click", () => {
    if (part.value === "" || whole.value === "") {
      findResult.textContent = "Please enter both numbers.";
      return;
    }

    if (Number(whole.value) === 0) {
      findResult.textContent = "The total number cannot be zero.";
      return;
    }

    const answer = (Number(part.value) / Number(whole.value)) * 100;
    findResult.textContent = `${part.value} is ${answer.toFixed(2)}% of ${whole.value}.`;
  });

  changeButton.addEventListener("click", () => {
    if (changeNumber.value === "" || changeRate.value === "") {
      changeResult.textContent = "Please enter both numbers.";
      return;
    }

    const start = Number(changeNumber.value);
    const amount = start * Number(changeRate.value) / 100;
    const answer = changeType.value === "increase"
      ? start + amount
      : start - amount;

    changeResult.textContent =
      `${changeType.value === "increase" ? "Increased" : "Decreased"} result: ${answer}`;
  });
})();

/* MuDz Tool 11: Image Cropper */
(() => {
  const upload = document.getElementById("crop-upload");
  const canvas = document.getElementById("crop-canvas");
  const ratio = document.getElementById("crop-ratio");
  const reset = document.getElementById("crop-reset");
  const download = document.getElementById("crop-download");
  const status = document.getElementById("crop-status");

  if (!upload || !canvas || !ratio || !reset || !download || !status) {
    console.error("Image Cropper: An HTML element is missing.");
    return;
  }

  const ctx = canvas.getContext("2d");
  const image = new Image();
  let loaded = false;
  let selection = null;
  let dragging = false;
  let start = null;

  function draw() {
    if (!loaded) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (selection) {
      const { x, y, w, h } = selection;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(x, y, w, h);
      ctx.drawImage(image, x, y, w, h, x, y, w, h);
      ctx.strokeStyle = "#39d9ff";
      ctx.lineWidth = Math.max(2, canvas.width / 400);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width,
        (event.clientX - rect.left) * canvas.width / rect.width)),
      y: Math.max(0, Math.min(canvas.height,
        (event.clientY - rect.top) * canvas.height / rect.height))
    };
  }

  function constrainSelection(x, y, w, h) {
    const type = ratio.value;
    if (type === "free") return { x, y, w, h };

    const ratios = {
      square: 1,
      landscape: 16 / 9,
      portrait: 9 / 16
    };
    const target = ratios[type];
    if (w / Math.max(h, 1) > target) {
      w = h * target;
    } else {
      h = w / target;
    }
    return { x, y, w, h };
  }

  function makeSelection(a, b) {
    let x = Math.min(a.x, b.x);
    let y = Math.min(a.y, b.y);
    let w = Math.abs(b.x - a.x);
    let h = Math.abs(b.y - a.y);

    const constrained = constrainSelection(x, y, w, h);
    w = constrained.w;
    h = constrained.h;

    x = Math.max(0, Math.min(x, canvas.width - w));
    y = Math.max(0, Math.min(y, canvas.height - h));

    return { x, y, w, h };
  }

  upload.addEventListener("change", () => {
    const file = upload.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      status.textContent = "Please choose a valid image file.";
      return;
    }

    const url = URL.createObjectURL(file);
    image.onload = () => {
      const maxSide = 1200;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      loaded = true;
      selection = null;
      draw();
      status.textContent = "Drag across the image to select a crop area.";
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      status.textContent = "This image could not be opened.";
      URL.revokeObjectURL(url);
    };
    image.src = url;
  });

  canvas.addEventListener("pointerdown", event => {
    if (!loaded) return;
    dragging = true;
    start = getPoint(event);
    selection = { x: start.x, y: start.y, w: 0, h: 0 };
    canvas.setPointerCapture(event.pointerId);
    draw();
  });

  canvas.addEventListener("pointermove", event => {
    if (!dragging || !start) return;
    selection = makeSelection(start, getPoint(event));
    draw();
  });

  function stopDragging(event) {
    if (!dragging) return;
    dragging = false;
    if (start) selection = makeSelection(start, getPoint(event));
    start = null;
    draw();
    if (selection && selection.w >= 2 && selection.h >= 2) {
      status.textContent = "Crop area selected. You can download it.";
    } else {
      selection = null;
      draw();
      status.textContent = "Drag a larger area to select your crop.";
    }
  }

  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);

  ratio.addEventListener("change", () => {
    if (selection) {
      selection = makeSelection(
        { x: selection.x, y: selection.y },
        { x: selection.x + selection.w, y: selection.y + selection.h }
      );
      draw();
    }
  });

  reset.addEventListener("click", () => {
    selection = null;
    draw();
    status.textContent = loaded
      ? "Selection reset. Drag to choose a new crop area."
      : "Choose an image to get started.";
  });

  download.addEventListener("click", () => {
    if (!loaded || !selection || selection.w < 2 || selection.h < 2) {
      status.textContent = "Choose an image and select a crop area first.";
      return;
    }

    const x = Math.round(selection.x);
    const y = Math.round(selection.y);
    const w = Math.round(selection.w);
    const h = Math.round(selection.h);

    const output = document.createElement("canvas");
    output.width = w;
    output.height = h;
    output.getContext("2d").drawImage(
      canvas, x, y, w, h, 0, 0, w, h
    );

    output.toBlob(blob => {
      if (!blob) {
        status.textContent = "Could not create the cropped image.";
        return;
      }
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = "mudz-cropped-image.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = "Your cropped image has been downloaded.";
    }, "image/png");
  });
})();

/* MuDz Tool 12: JSON Formatter & Validator */
(() => {
  const get = id => document.getElementById(id);

  const input = get("json-input");
  const indent = get("json-indent");
  const output = get("json-output");
  const status = get("json-status");
  const format = get("json-format");
  const minify = get("json-minify");
  const validate = get("json-validate");
  const copy = get("json-copy");

  if (!input || !indent || !output || !status ||
      !format || !minify || !validate || !copy) {
    console.error("JSON Formatter: An HTML element is missing.");
    return;
  }

  function parseJSON() {
    try {
      return { value: JSON.parse(input.value), error: null };
    } catch (error) {
      return { value: null, error };
    }
  }

  function getIndent() {
    return indent.value === "tab" ? "\t" : Number(indent.value);
  }

  format.addEventListener("click", () => {
    const parsed = parseJSON();

    if (parsed.error) {
      status.textContent = "Invalid JSON: " + parsed.error.message;
      output.value = "";
      return;
    }

    output.value = JSON.stringify(parsed.value, null, getIndent());
    status.textContent = "Valid JSON — formatted successfully.";
  });

  minify.addEventListener("click", () => {
    const parsed = parseJSON();

    if (parsed.error) {
      status.textContent = "Invalid JSON: " + parsed.error.message;
      output.value = "";
      return;
    }

    output.value = JSON.stringify(parsed.value);
    status.textContent = "Valid JSON — minified successfully.";
  });

  validate.addEventListener("click", () => {
    const parsed = parseJSON();

    if (parsed.error) {
      status.textContent = "Invalid JSON: " + parsed.error.message;
      output.value = "";
      return;
    }

    output.value = "JSON is valid.";
    status.textContent = "Validation successful — your JSON is valid.";
  });

  copy.addEventListener("click", async () => {
    if (!output.value) {
      status.textContent = "There is no result to copy yet.";
      return;
    }

    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = "Result copied successfully.";
    } catch {
      output.focus();
      output.select();
      status.textContent = "Press Ctrl+C to copy the selected result.";
    }
  });
})();

/* MuDz Tool 13: Date Calculator */
(() => {
  const get = id => document.getElementById(id);

  const start = get("date-start");
  const end = get("date-end");
  const differenceButton = get("date-difference");
  const differenceResult = get("date-difference-result");

  const base = get("date-base");
  const amount = get("date-amount");
  const operation = get("date-operation");
  const calculateButton = get("date-calculate");
  const result = get("date-result");

  if (
    !start || !end || !differenceButton || !differenceResult ||
    !base || !amount || !operation || !calculateButton || !result
  ) {
    console.error("Date Calculator: An HTML element is missing.");
    return;
  }

  // Parse a date input as UTC to avoid daylight-saving differences.
  function parseDate(value) {
    if (!value) return null;
    const parts = value.split("-").map(Number);
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });
  }

  differenceButton.addEventListener("click", () => {
    const first = parseDate(start.value);
    const second = parseDate(end.value);

    if (!first || !second) {
      differenceResult.textContent = "Please select both valid dates.";
      return;
    }

    const days = Math.abs(second.getTime() - first.getTime())
      / (24 * 60 * 60 * 1000);

    differenceResult.textContent =
      `There are ${days} days between the dates.`;
  });

  calculateButton.addEventListener("click", () => {
    const date = parseDate(base.value);

    if (!date) {
      result.textContent = "Please select a valid starting date.";
      return;
    }

    if (amount.value.trim() === "") {
      result.textContent = "Please enter the number of days.";
      return;
    }

    const days = Number(amount.value);

    if (!Number.isSafeInteger(days) || days < 0) {
      result.textContent = "Enter a whole number of days, zero or greater.";
      return;
    }

    const direction = operation.value === "subtract" ? -1 : 1;
    date.setUTCDate(date.getUTCDate() + direction * days);

    result.textContent =
      `Resulting date: ${formatDate(date)}.`;
  });
})();

