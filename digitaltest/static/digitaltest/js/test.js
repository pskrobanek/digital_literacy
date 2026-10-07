/* ===== Translations ===== */
var LANG = {
    en: {
        startTitle: "Digital Literacy Test",
        startDesc: "This short test will check your ability to interact with common items on a computer screen. Follow the instructions for each task.",
        startBtn: "Begin Test",
        discardBtn: "Discard",

        task1Btn: "START",
        task2Cancel: "Cancel",
        task2Continue: "Continue",
        task2GoBack: "Go Back",
        task5Text: 'Welcome to our website. We offer a variety of services to help you get started with technology. If you need assistance, please visit our <a href="#" class="target-link" onclick="return false;">help center</a> for more information. Our team is available Monday through Friday to answer your questions.',
        task6Home: "Home",
        task6About: "About",
        task6Services: "Services",
        task6Contact: "Contact",
        task6Help: "Help",
        task7Title: "Notification",
        task7Body: "Thank you for visiting. This is a sample popup message. You can close this window to continue.",
        task7Dismiss: "Dismiss",
        task8Label: "Type this word:",
        task8Word: "computer",
        task9Label: "Select this date:",
        task9Date: "February 15, 2026",
        task9Hint: "Your device date format may vary. Select the same calendar date.",
        taskSubmitBtn: "Submit",

        resultsHome: "Finish",
        resultsTitle: "Final Score",
        resultsLabel: "Your test metrics are shown below.",
        timeRemainingLabel: "Time Remaining",
        timeLimitNote: "The test will automatically finish after 2 minutes. Incomplete tasks will be marked blank.",
        resultsLockedTitle: "Scores Locked",
        resultsLockedDesc: "Enter the matching patient birth number for this session to view your results.",
        internalIdLabel: "Birth Number",
        internalIdPlaceholder: "Enter birth number",
        unlockResultsBtn: "View Scores",
        unlockResultsError: "The birth number does not match this session.",
        speedLabel: "Speed",
        correctTasksLabel: "Correct Tasks",
        misclickDistanceLabel: "Avg Misclick Distance",
        typingDurationLabel: "Typing Time",
        typingAccuracyLabel: "Typing Accuracy",

        instructions: [
            "Click the green button below.",
            "Click the 'Continue' button.",
            "Click the blue dot.",
            "Click the email icon.",
            "Click the link in the paragraph below.",
            "Click 'Contact' in the navigation menu.",
            "Close the popup window.",
            "Type the word shown below.",
            "Select the date shown below.",
        ],

        taskCounter: function (cur, total) { return "Task " + cur + " of " + total; },
        progressLabel: function (done, total) { return done + " of " + total + " completed"; },
    },
    cs: {
        startTitle: "Test digitální gramotnosti",
        startDesc: "Tento krátký test prověří vaši schopnost pracovat s běžnými prvky na obrazovce počítače. Postupujte podle pokynů u každého úkolu.",
        startBtn: "Začít test",
        discardBtn: "Zahodit",

        task1Btn: "START",
        task2Cancel: "Zrušit",
        task2Continue: "Pokračovat",
        task2GoBack: "Zpět",
        task5Text: 'Vítejte na našich stránkách. Nabízíme různé služby, které vám pomohou začít s technologiemi. Pokud potřebujete pomoc, navštivte naše <a href="#" class="target-link" onclick="return false;">centrum nápovědy</a> pro více informací. Náš tým je k dispozici od pondělí do pátku.',
        task6Home: "Domů",
        task6About: "O nás",
        task6Services: "Služby",
        task6Contact: "Kontakt",
        task6Help: "Nápověda",
        task7Title: "Oznámení",
        task7Body: "Děkujeme za návštěvu. Toto je ukázková vyskakovací zpráva. Zavřete toto okno pro pokračování.",
        task7Dismiss: "Zavřít",
        task8Label: "Napište toto slovo:",
        task8Word: "počítač",
        task9Label: "Vyberte toto datum:",
        task9Date: "15. 2. 2026",
        task9Hint: "Formát data na zařízení se může lišit. Vyberte stejné kalendářní datum.",
        taskSubmitBtn: "Potvrdit",

        resultsHome: "Dokončit",
        resultsTitle: "Celkové skóre",
        resultsLabel: "Níže jsou zobrazeny výsledné metriky testu.",
        timeRemainingLabel: "Zbývající čas",
        timeLimitNote: "Test se automaticky ukončí po 2 minutách. Nedokončené úkoly budou označeny jako prázdné.",
        resultsLockedTitle: "Skóre uzamčeno",
        resultsLockedDesc: "Pro zobrazení výsledků zadejte shodné rodné číslo pacienta této relace.",
        internalIdLabel: "Rodné číslo",
        internalIdPlaceholder: "Zadejte rodné číslo",
        unlockResultsBtn: "Zobrazit skóre",
        unlockResultsError: "Zadané rodné číslo neodpovídá této relaci.",
        speedLabel: "Rychlost",
        correctTasksLabel: "Správné úkoly",
        misclickDistanceLabel: "Průměrná vzdálenost chybných kliknutí",
        typingDurationLabel: "Čas psaní",
        typingAccuracyLabel: "Přesnost psaní",

        instructions: [
            "Klikněte na zelené tlačítko.",
            "Klikněte na tlačítko 'Pokračovat'.",
            "Klikněte na modrý bod.",
            "Klikněte na ikonu e-mailu.",
            "Klikněte na odkaz v odstavci níže.",
            "Klikněte na 'Kontakt' v navigační liště.",
            "Zavřete vyskakovací okno.",
            "Napište slovo zobrazené níže.",
            "Vyberte datum zobrazené níže.",
        ],

        taskCounter: function (cur, total) { return "Úkol " + cur + " z " + total; },
        progressLabel: function (done, total) { return done + " z " + total + " splněno"; },
    },
};

var currentLang = localStorage.getItem("therahub_lang") || "en";
var completeUrl = document.body.dataset.completeUrl || "/complete/";
var submitUrl = document.body.dataset.submitUrl || "/test/submit/";
var testTimeLimitMs = parseInt(document.body.dataset.testTimeLimitMs || "120000", 10);
var pageLoadTimestamp = Date.now();

/* ===== Task definitions ===== */
var TASKS = [
    { id: "task-1", type: "click", correctSelector: ".target-btn" },
    { id: "task-2", type: "click", correctSelector: ".btn-continue" },
    { id: "task-3", type: "click", correctSelector: ".dot-blue" },
    { id: "task-4", type: "click", correctSelector: ".icon-email" },
    { id: "task-5", type: "click", correctSelector: ".target-link" },
    { id: "task-6", type: "click", correctSelector: ".nav-contact" },
    { id: "task-7", type: "click", correctSelector: ".modal-close-btn, .modal-dismiss-btn" },
    { id: "task-8", type: "typing" },
    { id: "task-9", type: "date", targetDate: "2026-02-15" },
];

/* ===== State ===== */
var currentTaskIndex = 0;
var currentAttempts = 1;
var results = [];
var testTimerId = null;
var testCountdownId = null;
var testFinished = false;
var completionElapsedSeconds = null;
var testStartTimestamp = null;
var misclickDistances = [];
var typingStartTime = null;
var typingFirstAttemptText = null;
var typingDuration = null;
var typingAccuracy = null;

/* ===== DOM refs ===== */
var instructionBar = document.getElementById("instruction-bar");
var instructionText = document.getElementById("instruction-text");
var taskCounter = document.getElementById("task-counter");
var testContainer = document.getElementById("test-container");
var startScreen = document.getElementById("start-screen");
var resultsScreen = document.getElementById("results-screen");
var progressBarContainer = document.getElementById("progress-bar-container");
var progressFill = document.getElementById("progress-fill");
var progressLabel = document.getElementById("progress-label");
var sideTimer = document.getElementById("side-timer");
var testTimerValue = document.getElementById("test-timer-value");
var langSelect = document.getElementById("lang-select");
var resultsScore = document.getElementById("results-score");
var resultsLabel = document.getElementById("results-label");
var speedValue = document.getElementById("speed-value");
var correctTasksValue = document.getElementById("correct-tasks-value");
var misclickDistanceValue = document.getElementById("misclick-distance-value");
var typingDurationValue = document.getElementById("typing-duration-value");
var typingAccuracyValue = document.getElementById("typing-accuracy-value");
var resultsSummaryPanel = document.getElementById("results-summary-panel");

var pendingResultData = null;

/* ===== i18n ===== */
function t(key) {
    return LANG[currentLang][key] || LANG["en"][key] || key;
}

function applyLanguage() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        var val = t(key);
        if (val) el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
        var key = el.getAttribute("data-i18n-html");
        var val = t(key);
        if (val) el.innerHTML = val;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
        var key = el.getAttribute("data-i18n-placeholder");
        var val = t(key);
        if (val) el.placeholder = val;
    });

    if (instructionBar.style.display !== "none" && TASKS[currentTaskIndex]) {
        instructionText.textContent = LANG[currentLang].instructions[currentTaskIndex];
        taskCounter.textContent = LANG[currentLang].taskCounter(currentTaskIndex + 1, TASKS.length);
    }

    if (progressBarContainer.style.display !== "none") {
        var done = currentTaskIndex >= TASKS.length ? TASKS.length : currentTaskIndex;
        progressLabel.textContent = LANG[currentLang].progressLabel(done, TASKS.length);
    }

    if (resultsScreen.classList.contains("active")) {
        resultsLabel.textContent = t("resultsLabel");
    }

    if (TASKS[currentTaskIndex] && TASKS[currentTaskIndex].type === "typing") {
        var tw = document.getElementById("typing-word");
        if (tw) tw.textContent = t("task8Word");
    }

    if (TASKS[currentTaskIndex] && TASKS[currentTaskIndex].type === "date") {
        var dd = document.getElementById("date-display");
        if (dd) dd.textContent = t("task9Date");
        var dateInput = document.getElementById("date-input");
        if (dateInput) {
            dateInput.setAttribute("lang", currentLang === "cs" ? "cs-CZ" : "en-US");
        }
    }
}

function formatRemainingTime(totalSeconds) {
    var safeSeconds = Math.max(0, totalSeconds);
    var minutes = Math.floor(safeSeconds / 60);
    var seconds = safeSeconds % 60;

    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
}

function updateTimerDisplay(remainingSeconds) {
    if (!testTimerValue) {
        return;
    }

    testTimerValue.textContent = formatRemainingTime(remainingSeconds);

    if (remainingSeconds <= 30) {
        testTimerValue.classList.add("warning");
    } else {
        testTimerValue.classList.remove("warning");
    }
}

langSelect.value = currentLang;
langSelect.addEventListener("change", function () {
    currentLang = langSelect.value;
    localStorage.setItem("therahub_lang", currentLang);
    applyLanguage();
});

applyLanguage();

/* ===== Start test ===== */
document.getElementById("start-test-btn").addEventListener("click", function () {
    startScreen.style.display = "none";
    instructionBar.style.display = "block";
    progressBarContainer.style.display = "block";
    if (sideTimer) {
        sideTimer.style.display = "block";
    }
    currentTaskIndex = 0;
    currentAttempts = 1;
    results = [];
    testFinished = false;
    testStartTimestamp = Date.now();
    misclickDistances = [];
    typingStartTime = null;
    typingFirstAttemptText = null;
    typingDuration = null;
    typingAccuracy = null;
    showTask(0);
    updateProgress();
    startTestTimer();
});

function startTestTimer() {
    if (testTimerId) {
        clearTimeout(testTimerId);
    }
    if (testCountdownId) {
        clearInterval(testCountdownId);
    }

    var startTimestamp = Date.now();
    var totalSeconds = Math.floor(testTimeLimitMs / 1000);
    updateTimerDisplay(totalSeconds);

    testCountdownId = setInterval(function () {
        var elapsedMs = Date.now() - startTimestamp;
        var remainingSeconds = Math.ceil((testTimeLimitMs - elapsedMs) / 1000);
        updateTimerDisplay(remainingSeconds);

        if (remainingSeconds <= 0) {
            clearInterval(testCountdownId);
            testCountdownId = null;
        }
    }, 250);

    testTimerId = setTimeout(function () {
        if (testFinished || currentTaskIndex >= TASKS.length) {
            return;
        }

        testFinished = true;
        completionElapsedSeconds = getElapsedSeconds();

        var score = results.filter(function (r) {
            return r.attempts === 1;
        }).length;

        submitResults(score, completionElapsedSeconds)
            .finally(function () {
                window.location.href = completeUrl;
            });
    }, testTimeLimitMs);
}

function getElapsedSeconds() {
    var origin = testStartTimestamp || pageLoadTimestamp;
    return Number(((Date.now() - origin) / 1000).toFixed(2));
}

function getCorrectTargetElements(panel, task) {
    var selectors = task.correctSelector.split(", ");
    var elements = [];

    selectors.forEach(function (selector) {
        panel.querySelectorAll(selector).forEach(function (element) {
            elements.push(element);
        });
    });

    return elements;
}

function getDistanceFromPointToElementCenter(x, y, element) {
    var rect = element.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var deltaX = x - centerX;
    var deltaY = y - centerY;

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function recordMisclickDistance(event, panel, task) {
    var correctElements = getCorrectTargetElements(panel, task);
    if (correctElements.length === 0) {
        return;
    }

    var shortestDistance = null;

    correctElements.forEach(function (element) {
        var distance = getDistanceFromPointToElementCenter(event.clientX, event.clientY, element);
        if (shortestDistance === null || distance < shortestDistance) {
            shortestDistance = distance;
        }
    });

    if (shortestDistance !== null) {
        misclickDistances.push(Number(shortestDistance.toFixed(2)));
    }
}

function getAverageMisclickDistance() {
    if (misclickDistances.length === 0) {
        return 0;
    }

    var totalDistance = misclickDistances.reduce(function (sum, distance) {
        return sum + distance;
    }, 0);

    return Number((totalDistance / misclickDistances.length).toFixed(2));
}

function formatSpeed(seconds) {
    return seconds.toFixed(2) + " s";
}

function formatMisclickDistance(distance) {
    return distance.toFixed(2) + " px";
}

function renderResultSummary(correctTasks, totalTasks, speed, finalScore, avgMisclickDistance) {
    resultsScore.textContent = finalScore !== null && finalScore !== undefined ? finalScore : "--";
    resultsLabel.textContent = t("resultsLabel");
    speedValue.textContent = formatSpeed(speed);
    correctTasksValue.textContent = correctTasks + " / " + totalTasks;
    misclickDistanceValue.textContent = formatMisclickDistance(avgMisclickDistance);
    typingDurationValue.textContent = pendingResultData && pendingResultData.typingDuration !== null ? pendingResultData.typingDuration.toFixed(2) + " s" : "--";
    typingAccuracyValue.textContent = pendingResultData && pendingResultData.typingAccuracy !== null ? pendingResultData.typingAccuracy + "%" : "--";
}

/* ===== Task display ===== */
function showTask(index) {
    document.querySelectorAll(".task-panel").forEach(function (panel) {
        panel.classList.remove("active");
        panel.style.display = "none";
    });

    var task = TASKS[index];
    var panel = document.getElementById(task.id);
    panel.style.display = "flex";
    panel.classList.add("active");

    instructionText.textContent = LANG[currentLang].instructions[index];
    taskCounter.textContent = LANG[currentLang].taskCounter(index + 1, TASKS.length);

    if (task.type === "typing") {
        document.getElementById("typing-word").textContent = t("task8Word");
        var typingInput = document.getElementById("typing-input");
        typingInput.value = "";
        typingInput.classList.remove("input-error");
        typingStartTime = null;
        typingFirstAttemptText = null;
        setTimeout(function () { typingInput.focus(); }, 50);
    }

    if (task.type === "date") {
        document.getElementById("date-display").textContent = t("task9Date");
        var dateInput = document.getElementById("date-input");
        dateInput.setAttribute("lang", currentLang === "cs" ? "cs-CZ" : "en-US");
        dateInput.value = "";
        dateInput.classList.remove("input-error");
    }
}

function updateProgress() {
    var pct = (currentTaskIndex / TASKS.length) * 100;
    progressFill.style.width = pct + "%";
    progressLabel.textContent = LANG[currentLang].progressLabel(currentTaskIndex, TASKS.length);
}

/* ===== Click detection ===== */
testContainer.addEventListener("click", function (e) {
    var task = TASKS[currentTaskIndex];
    if (!task) return;

    var panel = document.getElementById(task.id);
    if (!panel || !panel.classList.contains("active")) return;

    if (task.type === "typing" || task.type === "date") return;

    var selectors = task.correctSelector.split(", ");
    var matched = false;

    for (var i = 0; i < selectors.length; i++) {
        var match = e.target.closest(selectors[i]);
        if (match && panel.contains(match)) {
            matched = true;
            handleCorrect(match);
            break;
        }
    }

    if (!matched && panel.contains(e.target)) {
        handleIncorrect(e.target, e, panel, task);
    }
});

function handleCorrect(el) {
    el.classList.add("correct-flash");

    if (currentTaskIndex === TASKS.length - 1) {
        completionElapsedSeconds = getElapsedSeconds();
    }

    results.push({
        id: TASKS[currentTaskIndex].id,
        passed: true,
        attempts: currentAttempts,
    });

    setTimeout(function () {
        el.classList.remove("correct-flash");
        advanceTask();
    }, 600);
}

function handleIncorrect(el, event, panel, task) {
    currentAttempts++;
    recordMisclickDistance(event, panel, task);
    el.classList.add("incorrect-flash");
    setTimeout(function () {
        el.classList.remove("incorrect-flash");
    }, 400);
}

function advanceTask() {
    currentTaskIndex++;
    currentAttempts = 1;

    if (currentTaskIndex >= TASKS.length) {
        updateProgress();
        showResults();
    } else {
        showTask(currentTaskIndex);
        updateProgress();
    }
}

/* ===== Typing task ===== */
document.getElementById("typing-input").addEventListener("keydown", function (e) {
    if (!typingStartTime) {
        typingStartTime = Date.now();
    }
    if (e.key === "Enter") {
        document.getElementById("typing-submit-btn").click();
    }
});

document.getElementById("typing-submit-btn").addEventListener("click", function () {
    var task = TASKS[currentTaskIndex];
    if (!task || task.type !== "typing") return;

    var input = document.getElementById("typing-input");
    var typed = input.value;
    var word = t("task8Word");

    if (typingFirstAttemptText === null) {
        typingFirstAttemptText = typed;
        var correct = 0;
        for (var i = 0; i < Math.min(typed.length, word.length); i++) {
            if (typed[i] === word[i]) correct++;
        }
        var maxLen = Math.max(typed.length, word.length);
        typingAccuracy = maxLen > 0 ? Math.round((correct / maxLen) * 100) : 0;
    }

    if (typed !== word) {
        currentAttempts++;
        input.classList.add("input-error");
        setTimeout(function () { input.classList.remove("input-error"); }, 600);
        return;
    }

    if (typingStartTime) {
        typingDuration = Number(((Date.now() - typingStartTime) / 1000).toFixed(2));
    }

    if (currentTaskIndex === TASKS.length - 1) {
        completionElapsedSeconds = getElapsedSeconds();
    }

    results.push({ id: task.id, passed: true, attempts: currentAttempts });
    advanceTask();
});

/* ===== Date picker task ===== */
document.getElementById("date-submit-btn").addEventListener("click", function () {
    var task = TASKS[currentTaskIndex];
    if (!task || task.type !== "date") return;

    var dateInput = document.getElementById("date-input");
    var selected = dateInput.value;

    if (selected !== task.targetDate) {
        currentAttempts++;
        dateInput.classList.add("input-error");
        setTimeout(function () { dateInput.classList.remove("input-error"); }, 600);
        return;
    }

    if (currentTaskIndex === TASKS.length - 1) {
        completionElapsedSeconds = getElapsedSeconds();
    }

    results.push({ id: task.id, passed: true, attempts: currentAttempts });
    advanceTask();
});

/* ===== Results ===== */
function showResults() {
    testFinished = true;
    if (testTimerId) {
        clearTimeout(testTimerId);
        testTimerId = null;
    }
    if (testCountdownId) {
        clearInterval(testCountdownId);
        testCountdownId = null;
    }
    updateTimerDisplay(0);

    document.querySelectorAll(".task-panel").forEach(function (panel) {
        panel.classList.remove("active");
        panel.style.display = "none";
    });
    instructionBar.style.display = "none";
    if (sideTimer) {
        sideTimer.style.display = "none";
    }
    progressFill.style.width = "100%";
    progressLabel.textContent = LANG[currentLang].progressLabel(TASKS.length, TASKS.length);

    var score = results.filter(function (r) {
        return r.attempts === 1;
    }).length;
    var speed = completionElapsedSeconds || getElapsedSeconds();
    var avgMisclickDistance = getAverageMisclickDistance();

    pendingResultData = {
        correctTasks: score,
        totalTasks: TASKS.length,
        speed: speed,
        avgMisclickDistance: avgMisclickDistance,
        typingDuration: typingDuration,
        typingAccuracy: typingAccuracy,
    };

    resultsScreen.classList.add("active");
    resultsScreen.style.display = "block";

    submitResults(score, speed).then(function (data) {
        if (data && data.status === "ok") {
            renderResultSummary(
                data.correct_tasks,
                data.total_tasks,
                data.speed !== null ? data.speed : speed,
                data.final_score,
                data.avg_misclick_distance !== null ? data.avg_misclick_distance : avgMisclickDistance
            );
        }
    });
}


function submitResults(score, speed) {
    var payload = {
        score: score,
        total: TASKS.length,
        speed: speed,
        avg_misclick_distance: getAverageMisclickDistance(),
        typing_duration: typingDuration,
        typing_accuracy: typingAccuracy,
        tasks: results,
    };

    var csrfToken = getCookie("csrftoken");

    return fetch(submitUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
    })
        .then(function (response) {
            return response.json();
        })
        .catch(function (err) {
            console.error("Failed to submit results:", err);
            return null;
        });
}

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }
    return "";
}
