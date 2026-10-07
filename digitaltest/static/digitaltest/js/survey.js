/* ===== Translations ===== */
var LANG = {
    en: {
        startTitle: "Technology Usage Survey",
        startDesc: "This short survey will help us understand your technology usage habits and how you get help when needed.",
        startBtn: "Begin Survey",

        q1Opt1: "Mobile phone",
        q1Opt2: "Mobile tablet",
        q1Opt3: "Desktop/Laptop",
        q1Opt4: "Smart Watch",
        q1Opt5: "None",

        q2Opt1: "Give up",
        q2Opt2: "Ask someone for help or to demonstrate",
        q2Opt3: "Take a break and try again later",
        q2Opt4: "Press buttons to see what they do",

        q3Opt1: "Family",
        q3Opt2: "Friends",
        q3Opt3: "Caregivers",
        q3Opt4: "Professionals (IT/support staff)",
        q3Opt5: "No one",

        q4Opt1: "Immediately / on demand",
        q4Opt2: "Within a day",
        q4Opt3: "Within a few days",
        q4Opt4: "About once a week",
        q4Opt5: "Rarely or almost never",

        nextBtn: "Next",
        backBtn: "Back",
        submitBtn: "Submit Survey",
        discardBtn: "Discard",

        instructions: [
            '"I use ___ on a daily basis" (Select all that apply)',
            '"When struggling to learn a technology, I..."',
            '"If you have difficulties using technology, who usually helps you the most?"',
            '"How often can you get help when you have difficulties using technology?"',
        ],

        taskCounter: function (cur, total) { return "Question " + cur + " of " + total; },
        progressLabel: function (done, total) { return done + " of " + total + " completed"; },
    },
    cs: {
        startTitle: "Průzkum používání technologií",
        startDesc: "Tento krátký průzkum nám pomůže porozumět vašim zvyklostem při používání technologií a jak získáváte pomoc.",
        startBtn: "Začít průzkum",

        q1Opt1: "Mobilní telefon",
        q1Opt2: "Tablet",
        q1Opt3: "Stolní počítač/Notebook",
        q1Opt4: "Chytré hodinky",
        q1Opt5: "Žádné",

        q2Opt1: "Vzdám to",
        q2Opt2: "Požádám někoho o pomoc nebo předvedení",
        q2Opt3: "Dám si pauzu a zkusím to později",
        q2Opt4: "Mačkám tlačítka, abych viděl, co dělají",

        q3Opt1: "Rodina",
        q3Opt2: "Přátelé",
        q3Opt3: "Pečovatelé",
        q3Opt4: "Profesionálové (IT/podpora)",
        q3Opt5: "Nikdo",

        q4Opt1: "Okamžitě / na požádání",
        q4Opt2: "Do jednoho dne",
        q4Opt3: "Do několika dnů",
        q4Opt4: "Přibližně jednou týdně",
        q4Opt5: "Zřídka nebo téměř nikdy",

        nextBtn: "Další",
        backBtn: "Zpět",
        submitBtn: "Odeslat průzkum",
        discardBtn: "Zrušit",

        instructions: [
            '"Denně používám ___" (Vyberte vše, co platí)',
            '"Když se mi nedaří naučit se technologii, tak..."',
            '"Pokud máte potíže s používáním technologií, kdo vám obvykle nejvíce pomáhá?"',
            '"Jak často můžete získat pomoc, když máte potíže s používáním technologií?"',
        ],

        taskCounter: function (cur, total) { return "Otázka " + cur + " z " + total; },
        progressLabel: function (done, total) { return done + " z " + total + " dokončeno"; },
    },
};

var currentLang = localStorage.getItem("therahub_lang") || "en";
var submitUrl = document.body.dataset.submitUrl || "/survey/submit/";

/* ===== Task definitions ===== */
var TASKS = [
    { id: "task-1", type: "checkbox", name: "q1" },
    { id: "task-2", type: "radio", name: "q2" },
    { id: "task-3", type: "radio", name: "q3" },
    { id: "task-4", type: "radio", name: "q4" },
];

/* ===== State ===== */
var currentTaskIndex = 0;
var responses = {};

/* ===== DOM refs ===== */
var instructionBar = document.getElementById("instruction-bar");
var instructionText = document.getElementById("instruction-text");
var taskCounter = document.getElementById("task-counter");
var testContainer = document.getElementById("test-container");
var discardBtn = document.getElementById("discard-btn");
var progressBarContainer = document.getElementById("progress-bar-container");
var progressFill = document.getElementById("progress-fill");
var progressLabel = document.getElementById("progress-label");
var langSelect = document.getElementById("lang-select");

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

    if (instructionBar.style.display !== "none" && TASKS[currentTaskIndex]) {
        instructionText.textContent = LANG[currentLang].instructions[currentTaskIndex];
        taskCounter.textContent = LANG[currentLang].taskCounter(currentTaskIndex + 1, TASKS.length);
    }

    if (progressBarContainer.style.display !== "none") {
        var done = currentTaskIndex >= TASKS.length ? TASKS.length : currentTaskIndex;
        progressLabel.textContent = LANG[currentLang].progressLabel(done, TASKS.length);
    }

    if (discardBtn) {
        discardBtn.textContent = t("discardBtn") || "Discard";
    }
}

langSelect.value = currentLang;
langSelect.addEventListener("change", function () {
    currentLang = langSelect.value;
    localStorage.setItem("therahub_lang", currentLang);
    applyLanguage();
});

applyLanguage();

/* ===== "None" mutual exclusivity for q1 ===== */
document.addEventListener("change", function (e) {
    var input = e.target;
    if (input.type !== "checkbox" || input.name !== "q1") return;
    if (input.value === "none" && input.checked) {
        document.querySelectorAll('input[name="q1"]').forEach(function (cb) {
            if (cb.value !== "none") cb.checked = false;
        });
    } else if (input.value !== "none" && input.checked) {
        var noneBox = document.querySelector('input[name="q1"][value="none"]');
        if (noneBox) noneBox.checked = false;
    }
});

/* ===== Auto-start survey ===== */
function startSurvey() {
    instructionBar.style.display = "block";
    progressBarContainer.style.display = "block";
    currentTaskIndex = 0;
    responses = {};
    showTask(0);
    updateProgress();
}

document.addEventListener("DOMContentLoaded", startSurvey);

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

    // Handle back button clicks
    var backBtn = e.target.closest(".back-btn");
    if (backBtn && panel.contains(backBtn)) {
        if (currentTaskIndex > 0) {
            currentTaskIndex--;
            showTask(currentTaskIndex);
            updateProgress();
        }
        return;
    }

    // Handle next/submit button clicks
    var nextBtn = e.target.closest(".next-btn, .submit-btn");
    if (nextBtn && panel.contains(nextBtn)) {
        // Require an answer before moving on
        if (task.type === "checkbox") {
            var hasChecked = panel.querySelectorAll('input[name="' + task.name + '"]:checked').length > 0;
            if (!hasChecked) {
                nextBtn.classList.add("incorrect-flash");
                setTimeout(function () {
                    nextBtn.classList.remove("incorrect-flash");
                }, 400);
                return;
            }
        } else if (task.type === "radio") {
            var hasSelected = panel.querySelector('input[name="' + task.name + '"]:checked') !== null;
            if (!hasSelected) {
                nextBtn.classList.add("incorrect-flash");
                setTimeout(function () {
                    nextBtn.classList.remove("incorrect-flash");
                }, 400);
                return;
            }
        }

        // Collect responses for current task
        if (task.type === "checkbox") {
            var checked = panel.querySelectorAll('input[name="' + task.name + '"]:checked');
            var values = [];
            checked.forEach(function(cb) {
                values.push(cb.value);
            });
            responses[task.name] = values;
        } else if (task.type === "radio") {
            var selected = panel.querySelector('input[name="' + task.name + '"]:checked');
            responses[task.name] = selected ? selected.value : null;
        }

        nextBtn.classList.add("correct-flash");
        setTimeout(function () {
            nextBtn.classList.remove("correct-flash");
            advanceTask();
        }, 400);
    }
});

function advanceTask() {
    currentTaskIndex++;

    if (currentTaskIndex >= TASKS.length) {
        updateProgress();
        showResults();
    } else {
        showTask(currentTaskIndex);
        updateProgress();
    }
}

/* ===== Results ===== */
function showResults() {
    document.querySelectorAll(".task-panel").forEach(function (panel) {
        panel.classList.remove("active");
        panel.style.display = "none";
    });
    instructionBar.style.display = "none";
    progressFill.style.width = "100%";
    progressLabel.textContent = LANG[currentLang].progressLabel(TASKS.length, TASKS.length);

    submitResults();
}

function submitResults() {
    var payload = {
        responses: responses,
        total: TASKS.length,
    };

    var csrfToken = document.querySelector('meta[name="csrf-token"]');
    if (!csrfToken) {
        csrfToken = getCookie('csrftoken');
    } else {
        csrfToken = csrfToken.getAttribute('content');
    }

    fetch(submitUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        if (data && data.next_url) {
            window.location.href = data.next_url;
        }
    })
    .catch(function(err) {
        console.error("Submit error:", err);
    });
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
