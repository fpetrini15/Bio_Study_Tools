const PARAMS = new URLSearchParams(window.location.search);

const quizName = PARAMS.get("quiz");

if (!quizName) {
  document.body.innerHTML = "<h1>No quiz specified</h1>";

  throw new Error("Missing quiz parameter");
}

const dataPath = "data/" + quizName + ".json";

let quizData;
let quizType;

let current = 0;
let questions = [];
let answers = [];

let correctCount = 0;
let answeredCount = 0;

/* ELEMENTS */

const promptBox = document.getElementById("prompt");

const promptContainer = document.getElementById("prompt-container");

const draggable = document.getElementById("draggable");

const interactionArea = document.getElementById("interaction-area");

const categoriesContainer = document.getElementById("categories");

const feedback = document.getElementById("feedback");

const scoreDisplay = document.getElementById("score");

const totalDisplay = document.getElementById("total");

const progressBar = document.getElementById("progress-bar");

const continueBtn = document.getElementById("continue-btn");

const finalScreen = document.getElementById("final-screen");

const finalScore = document.getElementById("final-score");

const retryBtn = document.getElementById("retry-btn");

const instructionText = document.getElementById("instruction-text");

const loadingScreen = document.getElementById("loading-screen");

/* UTILITY */

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/* RESET */

function resetQuestionUI() {
  promptBox.innerHTML = "";

  categoriesContainer.innerHTML = "";

  feedback.textContent = "";

  feedback.classList.remove("show");

  continueBtn.style.display = "none";

  draggable.classList.add("hidden");

  draggable.innerHTML = "";

  draggable.setAttribute("draggable", "false");

  interactionArea.style.display = "flex";

  categoriesContainer.style.display = "flex";
}

/* RENDER SYSTEM */

const questionRenderers = {
  drag_and_drop: renderDragQuestion,

  multiple_choice: renderMultipleChoiceQuestion,
};

/* LOAD QUIZ */

async function loadQuiz() {
  const res = await fetch(dataPath);

  quizData = await res.json();

  quizType = quizData.type || "drag_and_drop";

  if (quizType == "multiple_choice") {
    questions = shuffle(
      quizData.questions.map((q) => ({
        ...q,
        options: shuffle([...q.options]),
      })),
    );
  } else {
    questions = shuffle([...quizData.questions]);
  }

  document.getElementById("tabTitle").textContent = quizData.title;
  document.getElementById("quizHeader").textContent = quizData.title;

  loadQuestion();
  setTimeout(() => {
    loadingScreen.classList.add("hidden");
  }, 150);
}

/* LOAD QUESTION */

function loadQuestion() {
  if (current >= questions.length) {
    endQuiz();

    return;
  }

  resetQuestionUI();

  updateProgress();

  const question = questions[current];

  const renderer = questionRenderers[quizType];

  renderer(question);
}

/* DRAG RENDER */

function renderDragQuestion(question) {
  createCategories();

  instructionText.textContent =
    "Drag the prompts/images into the appropriate category.";

  draggable.setAttribute("draggable", "true");
  promptContainer.style.display = "none";

  /* embed prompt inside tile */

  if (question.prompt.text) {
    const text = document.createElement("div");

    text.textContent = question.prompt.text;
    text.className = "draggable-text";

    draggable.appendChild(text);
  }

  if (question.prompt.image) {
    const img = document.createElement("img");

    img.src = question.prompt.image;

    img.className = "quiz-image";

    draggable.appendChild(img);
  }
  draggable.classList.remove("hidden");
  draggable.classList.add("visible");
}

/* MC RENDER */

function renderMultipleChoiceQuestion(question) {
  draggable.classList.add("hidden");

  instructionText.textContent =
    "Select the correct answer from the options below.";

  /* prompt stays separate */

  if (question.prompt.text) {
    const text = document.createElement("div");

    text.textContent = question.prompt.text;

    promptBox.appendChild(text);
  }

  if (question.prompt.image) {
    const img = document.createElement("img");

    img.src = question.prompt.image;

    img.className = "quiz-image";

    promptBox.appendChild(img);
  }

  question.options.forEach((option) => {
    const btn = document.createElement("button");

    btn.className = "mc-option";

    btn.textContent = option;

    btn.addEventListener("click", () => {
      checkMultipleChoiceAnswer(option);
    });

    categoriesContainer.appendChild(btn);
  });
}

/* CATEGORIES */

function createCategories() {
  quizData.categories.forEach((cat) => {
    const zone = document.createElement("div");

    zone.className = "dropzone";

    zone.textContent = cat;

    zone.dataset.category = cat;

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();

      zone.classList.add("dragover");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("dragover");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();

      zone.classList.remove("dragover");

      checkDragAnswer(cat);
    });

    categoriesContainer.appendChild(zone);
  });
}

/* PROGRESS */

function updateProgress() {
  const percent = (current / questions.length) * 100;

  progressBar.style.width = percent + "%";
}

/* DRAG CHECK */

function checkDragAnswer(category) {
  const correct = questions[current].answer;

  answeredCount++;

  document.querySelectorAll(".dropzone").forEach((zone) => {
    zone.classList.remove("correct", "incorrect");
  });

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

/* MC CHECK */

function checkMultipleChoiceAnswer(option) {
  const correct = questions[current].answer;

  answeredCount++;

  document.querySelectorAll(".mc-option").forEach((btn) => {
    btn.disabled = true;

    if (btn.textContent === correct) {
      btn.classList.add("correct");
    } else if (btn.textContent === option) {
      btn.classList.add("incorrect");
    }
  });

  if (option === correct) {
    correctCount++;

    feedback.textContent = "Correct!";
  } else {
    feedback.textContent = "Wrong! Correct answer: " + correct;
  }

  scoreDisplay.textContent = correctCount;

  totalDisplay.textContent = answeredCount;

  feedback.classList.add("show");

  continueBtn.style.display = "inline-block";
}

/* CONTINUE */

continueBtn.addEventListener("click", () => {
  current++;

  loadQuestion();
});

/* END */

function endQuiz() {
  interactionArea.style.display = "none";

  categoriesContainer.style.display = "none";

  continueBtn.style.display = "none";

  finalScreen.style.display = "block";

  finalScore.textContent =
    "You got " + correctCount + " out of " + answeredCount + " correct.";

  progressBar.style.width = "100%";
}

/* RETRY */

retryBtn.addEventListener("click", () => {
  current = 0;

  correctCount = 0;

  answeredCount = 0;

  quizType = quizData.type || "drag_and_drop";

  if (quizType == "multiple_choice") {
    questions = shuffle(
      quizData.questions.map((q) => ({
        ...q,
        options: shuffle([...q.options]),
      })),
    );
  } else {
    questions = shuffle([...quizData.questions]);
  }

  interactionArea.style.display = "flex";

  categoriesContainer.style.display = "flex";

  finalScreen.style.display = "none";

  scoreDisplay.textContent = "0";

  totalDisplay.textContent = "0";

  loadQuestion();
});

function loadFavicon() {
  const quizName = PARAMS.get("quiz");

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
  const quizName = PARAMS.get("quiz");
  const subject = quizName.split("/")[0];
  document.getElementById("mainBack").href = subject + ".html";
}

/* START */
loadFavicon();
buildBackButtons();
loadQuiz();
