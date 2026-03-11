const params = new URLSearchParams(window.location.search);

const quizName = params.get("quiz");

if (!quizName) {
  document.body.innerHTML = "<h1>No quiz specified</h1>";

  throw new Error("Missing quiz parameter");
}

const subject = quizName.split("/")[0];

const dataPath = "data/" + quizName + ".json";

let quizData;

let current = 0;

let questions = [];

let correctCount = 0;

let answeredCount = 0;

const draggable = document.getElementById("draggable");

const staticInstruction = document.getElementById("static-instruction");

const promptBox = document.getElementById("prompt");

const categoriesContainer = document.getElementById("categories");

const feedback = document.getElementById("feedback");

const scoreDisplay = document.getElementById("score");

const totalDisplay = document.getElementById("total");

const progressBar = document.getElementById("progress-bar");

const continueBtn = document.getElementById("continue-btn");

const finalScreen = document.getElementById("final-screen");

const finalScore = document.getElementById("final-score");

const retryBtn = document.getElementById("retry-btn");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function loadFavicon() {
  const params = new URLSearchParams(window.location.search);

  const quizName = params.get("quiz");

  const subject = quizName.split("/")[0];

  const favicon = document.getElementById("favicon");

  if (subject === "biology") {
    favicon.href = "images/favicons/dna.svg";
  } else if (subject === "chemistry") {
    favicon.href = "images/favicons/chemistry.svg";
  } else {
    favicon.href = "";
  }
}

function buildBackButtons() {
  //document.getElementById("subjectBack").href = subject + ".html";

  document.getElementById("mainBack").href = subject + ".html";
}

async function loadQuiz() {
  const res = await fetch(dataPath);

  quizData = await res.json();

  questions = shuffle([...quizData.questions]);

  document.getElementById("quizHeader").textContent = quizData.title;

  document.getElementById("quizTitle").textContent = quizData.title;

  createCategories();

  loadQuestion();
}

function createCategories() {
  quizData.categories.forEach((cat) => {
    const zone = document.createElement("div");

    zone.className = "dropzone";

    zone.textContent = cat;

    zone.dataset.category = cat;

    /* DRAG OVER */

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();

      zone.classList.add("dragover");
    });

    /* DRAG ENTER (important for some browsers) */

    zone.addEventListener("dragenter", (e) => {
      e.preventDefault();

      zone.classList.add("dragover");
    });

    /* DRAG LEAVE */

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("dragover");
    });

    /* DROP */

    zone.addEventListener("drop", (e) => {
      e.preventDefault();

      zone.classList.remove("dragover");

      checkAnswer(cat);
    });

    categoriesContainer.appendChild(zone);
  });
}

draggable.addEventListener("dragstart", () => {
  draggable.classList.add("dragging");
});

draggable.addEventListener("dragend", () => {
  draggable.classList.remove("dragging");
});

draggable.addEventListener("touchstart", () => {
  draggable.classList.add("dragging");
});

document.addEventListener("touchend", (e) => {
  if (!draggable.classList.contains("dragging")) return;

  const touch = e.changedTouches[0];

  const element = document.elementFromPoint(
    touch.clientX,

    touch.clientY,
  );

  if (element && element.classList.contains("dropzone")) {
    checkAnswer(element.dataset.category);
  }

  draggable.classList.remove("dragging");
});

function loadQuestion() {
  if (current >= questions.length) {
    endQuiz();

    return;
  }

  updateProgress();

  const question = questions[current];

  const prompt = question.prompt;

  promptBox.innerHTML = "";

  if (prompt.text) {
    const text = document.createElement("div");

    text.textContent = prompt.text;

    promptBox.appendChild(text);
  }

  if (prompt.image) {
    const instruction = document.createElement("div");

    instruction.textContent =
      prompt.instruction || "Identify the mitosis stage";

    instruction.className = "image-instruction";

    promptBox.appendChild(instruction);

    const img = document.createElement("img");
    console.log(prompt.image);

    img.src = prompt.image;

    img.className = "quiz-image";

    img.onerror = () => {
      img.onerror = null;

      img.src = "images/errors/fallback.svg";

      if (img.src.includes("fallback.svg")) {
        img.style.display = "none";
      }
    };

    promptBox.appendChild(img);
  }

  if (prompt.audio) {
    const audio = document.createElement("audio");

    audio.src = prompt.audio;

    audio.controls = true;

    promptBox.appendChild(audio);
  }

  draggable.setAttribute("draggable", "true");
}

function updateProgress() {
  const percent = (current / questions.length) * 100;

  progressBar.style.width = percent + "%";
}

function checkAnswer(category) {
  const correct = questions[current].answer;

  document

    .querySelectorAll(".dropzone")

    .forEach((z) => z.classList.remove("correct", "incorrect"));

  feedback.classList.remove("show");

  answeredCount++;

  if (category === correct) {
    correctCount++;

    feedback.textContent = "Correct!";

    document

      .querySelector(`[data-category="${category}"]`)

      .classList.add("correct");
  } else {
    feedback.textContent = "Wrong! Correct answer: " + correct;

    document

      .querySelector(`[data-category="${category}"]`)

      .classList.add("incorrect");
  }

  scoreDisplay.textContent = correctCount;

  totalDisplay.textContent = answeredCount;

  feedback.classList.add("show");

  continueBtn.style.display = "inline-block";

  draggable.setAttribute("draggable", "false");
}

continueBtn.addEventListener("click", () => {
  current++;

  loadQuestion();

  feedback.textContent = "";

  feedback.classList.remove("show");

  continueBtn.style.display = "none";

  document

    .querySelectorAll(".dropzone")

    .forEach((z) => z.classList.remove("correct", "incorrect"));
});

function endQuiz() {
  draggable.style.display = "none";

  categoriesContainer.style.display = "none";

  feedback.style.display = "none";

  continueBtn.style.display = "none";

  staticInstruction.style.display = "none";

  finalScreen.style.display = "block";

  finalScore.textContent =
    "You got " + correctCount + " out of " + answeredCount + " correct!";

  progressBar.style.width = "100%";
}

retryBtn.addEventListener("click", () => {
  current = 0;

  correctCount = 0;

  answeredCount = 0;

  finalScreen.style.display = "none";

  draggable.style.display = "flex";

  categoriesContainer.style.display = "flex";

  staticInstruction.style.display = "block";

  feedback.style.display = "block";

  scoreDisplay.textContent = "0";

  totalDisplay.textContent = "0";

  questions = shuffle([...quizData.questions]);

  loadQuestion();
});

loadFavicon();

buildBackButtons();

loadQuiz();
