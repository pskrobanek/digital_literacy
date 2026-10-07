var SIGNUP_ERROR_MAP = {
    en: {},
    cs: {
        "Birth number must contain only digits.": "Rodné číslo musí obsahovat pouze číslice.",
        "Birth number must be exactly 10 digits.": "Rodné číslo musí mít přesně 10 číslic.",
        "Birth numbers do not match.": "Rodná čísla se neshodují.",
        "This birth number has already been registered. Contact staff for retake access.": "Toto rodné číslo je již zaregistrováno. Pro opakování testu kontaktujte personál.",
        "Please correct the errors below.": "Opravte prosím níže uvedené chyby.",
        "This field is required.": "Toto pole je povinné.",
        "Enter a valid date.": "Zadejte platné datum.",
    },
};

function translateErrorElements(lang) {
    var map = SIGNUP_ERROR_MAP[lang] || {};
    var selectors = [".error-message", ".alert"];
    selectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
            var text = el.textContent.trim();
            if (map[text]) {
                el.textContent = map[text];
                return;
            }
            // Django length constraint messages (e.g. "Ensure this value has at least 10 characters (it has 5).")
            var atLeast = text.match(/^Ensure this value has at least (\d+) characters \(it has (\d+)\)\.$/);
            if (atLeast && lang === 'cs') {
                el.textContent = "Tato hodnota musí mít alespoň " + atLeast[1] + " znaků (má " + atLeast[2] + ").";
                return;
            }
            var atMost = text.match(/^Ensure this value has at most (\d+) characters \(it has (\d+)\)\.$/);
            if (atMost && lang === 'cs') {
                el.textContent = "Tato hodnota může mít nejvýše " + atMost[1] + " znaků (má " + atMost[2] + ").";
            }
        });
    });
}

var SIGNUP_LANG = {
    en: {
        title: "Create Your Account",
        subtitle: "Join TheraHub today",
        first: "First Name",
        last: "Last Name",
        dob: "Date of Birth",
        birthNumber: "Birth Number",
        birthNumberConfirm: "Confirm Birth Number",
        diagnosis: "Diagnosis (Optional)",
        birthHelp: "Your birth number will be used to access your account (10 digits only)",
        submit: "Create Account",
        footer: "Welcome to TheraHub",
        placeholders: {
            first: "First name",
            last: "Last name",
            dob: "DD.MM.YYYY",
            birthNumber: "Enter your 10-digit birth number",
            birthNumberConfirm: "Confirm your birth number",
            diagnosis: "Diagnosis (optional)",
        },
    },
    cs: {
        title: "Vytvořte si účet",
        subtitle: "Připojte se k TheraHub",
        first: "Jméno",
        last: "Příjmení",
        dob: "Datum narození",
        birthNumber: "Rodné číslo",
        birthNumberConfirm: "Potvrzení rodného čísla",
        diagnosis: "Diagnóza (volitelné)",
        birthHelp: "Vaše rodné číslo bude použito pro přístup k účtu (pouze 10 číslic)",
        submit: "Vytvořit účet",
        footer: "Vítejte v TheraHub",
        placeholders: {
            first: "Jméno",
            last: "Příjmení",
            dob: "DD.MM.RRRR",
            birthNumber: "Zadejte své 10místné rodné číslo",
            birthNumberConfirm: "Potvrďte rodné číslo",
            diagnosis: "Diagnóza (volitelné)",
        },
    },
};

var currentSignupLang = localStorage.getItem("therahub_lang") || "en";
var signupLangSelect = document.getElementById("lang-select");

function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setPlaceholder(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.setAttribute("placeholder", value);
}

function applySignupLanguage() {
    var t = SIGNUP_LANG[currentSignupLang] || SIGNUP_LANG.en;

    setText("signup-title", t.title);
    setText("signup-subtitle", t.subtitle);
    setText("label-first", t.first);
    setText("label-last", t.last);
    setText("label-dob", t.dob);
    setText("label-birth-number", t.birthNumber);
    setText("label-birth-number-confirm", t.birthNumberConfirm);
    setText("label-diagnosis", t.diagnosis);
    setText("help-birth-number", t.birthHelp);
    setText("signup-submit-btn", t.submit);
    setText("signup-footer-text", t.footer);

    setPlaceholder("#id_first", t.placeholders.first);
    setPlaceholder("#id_last", t.placeholders.last);
    setPlaceholder("#id_dob", t.placeholders.dob);
    setPlaceholder("#id_birth_number", t.placeholders.birthNumber);
    setPlaceholder("#id_birth_number_confirm", t.placeholders.birthNumberConfirm);
    setPlaceholder("#id_diagnosis", t.placeholders.diagnosis);

    translateErrorElements(currentSignupLang);
}

if (signupLangSelect) {
    signupLangSelect.value = currentSignupLang;
    signupLangSelect.addEventListener("change", function () {
        currentSignupLang = signupLangSelect.value;
        localStorage.setItem("therahub_lang", currentSignupLang);
        applySignupLanguage();
    });
}

applySignupLanguage();

document.addEventListener("click", function (e) {
    var btn = e.target.closest(".password-toggle");
    if (!btn) return;
    var input = document.getElementById(btn.dataset.target);
    if (!input) return;
    var showing = input.type === "text";
    input.type = showing ? "password" : "text";
    btn.setAttribute("aria-pressed", showing ? "false" : "true");
    var open = btn.querySelector(".eye-open");
    var closed = btn.querySelector(".eye-closed");
    if (open && closed) {
        open.style.display = showing ? "" : "none";
        closed.style.display = showing ? "none" : "";
    }
});
