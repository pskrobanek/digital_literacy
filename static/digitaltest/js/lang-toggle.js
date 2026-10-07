/*
  Language toggle and lightweight client-side translations for staff pages.
  Stores choice in localStorage under 'therahub_lang' and applies translations
  for elements that use `data-i18n` or `data-i18n-placeholder`.
*/

var STAFF_ERROR_MAP = {
  en: {},
  cs: {
    "Incorrect password. Please try again.": "Nesprávné heslo. Zkuste to znovu.",
    "Invalid credentials. Please check the doctor details and patient birth number.": "Neplatné přihlašovací údaje. Zkontrolujte údaje lékaře a rodné číslo pacienta.",
    "Patient session is no longer valid. Please log in again.": "Relace pacienta již není platná. Přihlaste se prosím znovu.",
    "Birth number must contain only digits.": "Rodné číslo musí obsahovat pouze číslice.",
    "Birth number must be exactly 10 digits.": "Rodné číslo musí mít přesně 10 číslic.",
    "This field is required.": "Toto pole je povinné.",
    "Enter a valid email address.": "Zadejte platnou e-mailovou adresu.",
  },
};

function translateStaffErrors(lang) {
  var map = STAFF_ERROR_MAP[lang] || {};
  var selectors = ['.portal-alert', '.portal-error'];
  selectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      var text = el.textContent.trim();
      if (map[text]) {
        el.textContent = map[text];
        return;
      }
      var atLeast = text.match(/^Ensure this value has at least (\d+) characters \(it has (\d+)\)\.$/);
      if (atLeast && lang === 'cs') {
        el.textContent = 'Tato hodnota musí mít alespoň ' + atLeast[1] + ' znaků (má ' + atLeast[2] + ').';
        return;
      }
      var atMost = text.match(/^Ensure this value has at most (\d+) characters \(it has (\d+)\)\.$/);
      if (atMost && lang === 'cs') {
        el.textContent = 'Tato hodnota může mít nejvýše ' + atMost[1] + ' znaků (má ' + atMost[2] + ').';
      }
    });
  });
}

var STAFF_LANG = {
  en: {
    medicalStaffAccess: 'Medical Staff Access',
    patientDashboardLogin: 'Patient Dashboard Login',
    staffLoginDesc: "Enter your doctor details and the patient's birth number to open that patient's dashboard.",
    staffFirstName: 'Staff First Name',
    staffFirstNamePlaceholder: 'Enter staff first name',
    staffLastName: 'Staff Last Name',
    staffLastNamePlaceholder: 'Enter staff last name',
    doctorEmail: 'Doctor Email',
    doctorEmailPlaceholder: 'doctor@example.com',
    patientBirthNumber: 'Patient Birth Number',
    patientBirthNumberPlaceholder: 'Enter patient birth number',
    openPatientDashboard: 'Open Patient Dashboard',
    back: 'Back',
    staffLabel: 'Staff:',
    staffEmailLabel: 'Staff Email:',
    patientLabel: 'Patient:',
    birthNumberLabel: 'Birth Number:',
    finalScore: 'Final Score',
    speed: 'Speed',
    avgMisclickDistance: 'Avg Misclick Distance',
    typingTime: 'Typing Time',
    typingAccuracy: 'Typing Accuracy',
    surveyStatus: 'Survey Status',
    surveyStatusValue: { completed: 'Completed', not_completed: 'Not completed' },
    digitalLiteracy: 'Digital Literacy',
    lastTestUpdate: 'Last test update:',
    scoringFormulas: 'Scoring formulas',
    recommendedSoftware: 'Recommended Software',
    activityLog: 'Activity Log',
    startTestRetake: 'Start Test Retake',
    switchPatient: 'Switch Patient',
    logOut: 'Log Out',
    highComplexityFiltered: "Higher-complexity apps were filtered out based on this patient's literacy tier.",
    finalScoreFormulas: 'Final score formulas',
    digitalLiteracyFormulas: 'Digital literacy score formulas',
    digitalLiteracyScore: 'Digital literacy score',
    accuracy: 'accuracy',
    precision: 'precision',
    typingSpeed: 'typing speed',
    techBreadth: 'tech breadth',
    lFactor: 'L factor',
    resourceQuality: 'resource quality',
    penalty: 'penalty',
    expr_final_score: 'round(65 × accuracy + 15 × speed + 10 × precision + 5 × typing speed + 5 × typing accuracy)',
    expr_accuracy: 'correct tasks / total tasks',
    expr_speed: 'max(0, 1 - min(test time, 120) / 120)',
    expr_precision: 'max(0, 1 - min(avg misclick distance, 500) / 500)',
    expr_typing_speed: 'max(0, 1 - min(typing duration, 30) / 30)',
    expr_typing_accuracy: 'typing accuracy / 100',
    expr_digital_literacy: 'clamp(round(motor score × tech breadth × L factor × resource quality - penalty), 0, 100)',
    expr_tech_breadth: '0.7 + selected device weights from question 1',
    expr_l_factor: 'value from question 2',
    expr_resource_quality: 'highest selected value from question 3',
    expr_penalty: 'value from question 4',
    gatePageTitle: 'Site Access',
    restrictedAccess: 'Restricted Access',
    enterPassword: 'Enter Password',
    gateDescription: 'This site requires a password to proceed.',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    enter: 'Enter',
    landingPageTitle: 'TheraHub Nicosia',
    landingKicker: 'TheraHub Nicosia',
    landingHeadline: 'Digital Literacy Evaluation Platform',
    landingDescription: 'This website is used to evaluate technological literacy through a short questionnaire and an interactive test. Patients can register and complete the assessment workflow, while medical staff can log in to view a specific patient\'s recorded scores.',
    patientSignup: 'Patient Signup',
    medicalStaffLogin: 'Medical Staff Login'
  },
  cs: {
    medicalStaffAccess: 'Přístup lékařů',
    patientDashboardLogin: 'Přihlášení do pacientova panelu',
    staffLoginDesc: 'Zadejte údaje lékaře a rodné číslo pacienta pro otevření jeho panelu.',
    staffFirstName: 'Křestní jméno lékaře',
    staffFirstNamePlaceholder: 'Zadejte křestní jméno lékaře',
    staffLastName: 'Příjmení lékaře',
    staffLastNamePlaceholder: 'Zadejte příjmení lékaře',
    doctorEmail: 'E-mail lékaře',
    doctorEmailPlaceholder: 'lekar@example.com',
    patientBirthNumber: 'Rodné číslo pacienta',
    patientBirthNumberPlaceholder: 'Zadejte rodné číslo pacienta',
    openPatientDashboard: 'Otevřít pacientův panel',
    back: 'Zpět',
    staffLabel: 'Lékař:',
    staffEmailLabel: 'E-mail lékaře:',
    patientLabel: 'Pacient:',
    birthNumberLabel: 'Rodné číslo:',
    finalScore: 'Celkové skóre',
    speed: 'Rychlost',
    avgMisclickDistance: 'Prům. vzdálenost chybných kliknutí',
    typingTime: 'Doba psaní',
    typingAccuracy: 'Přesnost psaní',
    surveyStatus: 'Stav dotazníku',
    surveyStatusValue: { completed: 'Dokončeno', not_completed: 'Nedokončeno' },
    digitalLiteracy: 'Digitální gramotnost',
    lastTestUpdate: 'Poslední aktualizace testu:',
    scoringFormulas: 'Vzorce skórování',
    recommendedSoftware: 'Doporučený software',
    activityLog: 'Protokol aktivit',
    startTestRetake: 'Spustit opakování testu',
    switchPatient: 'Změnit pacienta',
    logOut: 'Odhlásit se',
    highComplexityFiltered: 'Aplikace s vyšší komplexitou byly odfiltrovány podle úrovně digitální gramotnosti tohoto pacienta.',
    finalScoreFormulas: 'Vzorce celkového skóre',
    digitalLiteracyFormulas: 'Vzorce skóre digitální gramotnosti',
    digitalLiteracyScore: 'Skóre digitální gramotnosti',
    accuracy: 'přesnost',
    precision: 'preciznost',
    typingSpeed: 'rychlost psaní',
    techBreadth: 'šíře technologií',
    lFactor: 'L faktor',
    resourceQuality: 'kvalita zdrojů',
    penalty: 'penalizace',
    expr_final_score: 'round(65 × přesnost + 15 × rychlost + 10 × preciznost + 5 × rychlost psaní + 5 × přesnost psaní)',
    expr_accuracy: 'správné úkoly / celkový počet úkolů',
    expr_speed: 'max(0, 1 - min(čas testu, 120) / 120)',
    expr_precision: 'max(0, 1 - min(prům. vzdálenost chybných kliknutí, 500) / 500)',
    expr_typing_speed: 'max(0, 1 - min(doba psaní, 30) / 30)',
    expr_typing_accuracy: 'přesnost psaní / 100',
    expr_digital_literacy: 'clamp(round(motorické skóre × šíře technologií × L faktor × kvalita zdrojů - penalizace), 0, 100)',
    expr_tech_breadth: '0,7 + váhy vybraných zařízení z otázky 1',
    expr_l_factor: 'hodnota z otázky 2',
    expr_resource_quality: 'nejvyšší vybraná hodnota z otázky 3',
    expr_penalty: 'hodnota z otázky 4',
    gatePageTitle: 'Přístup na web',
    restrictedAccess: 'Omezený přístup',
    enterPassword: 'Zadejte heslo',
    gateDescription: 'Pro pokračování je vyžadováno heslo.',
    password: 'Heslo',
    passwordPlaceholder: 'Zadejte heslo',
    enter: 'Vstoupit',
    landingPageTitle: 'TheraHub Nicosia',
    landingKicker: 'TheraHub Nicosia',
    landingHeadline: 'Platforma pro hodnocení digitální gramotnosti',
    landingDescription: 'Tento web slouží k hodnocení technologické gramotnosti pomocí krátkého dotazníku a interaktivního testu. Pacienti se mohou registrovat a dokončit celý postup hodnocení, zatímco zdravotnický personál se může přihlásit a zobrazit zaznamenané výsledky konkrétního pacienta.',
    patientSignup: 'Registrace pacienta',
    medicalStaffLogin: 'Přihlášení zdravotnického personálu'
  }
};

// Add activity, tiers and note mappings to both language maps
Object.keys(STAFF_LANG).forEach(function (lang) {
  var map = STAFF_LANG[lang];
  map.initial_test = map.initial_test || (lang === 'cs' ? 'První test proveden:' : 'Initial test taken at');
  map.retake_started = map.retake_started || (lang === 'cs' ? 'Opakování zahájeno:' : 'Retake started at');
  map.byLabel = map.byLabel || (lang === 'cs' ? 'od' : 'by');
  map.patientLabel = map.patientLabel || (lang === 'cs' ? 'pacient' : 'patient');
  // tier map
  map.tierMap = map.tierMap || {
    'Low': (lang === 'cs' ? 'Nízká' : 'Low'),
    'Medium': (lang === 'cs' ? 'Střední' : 'Medium'),
    'High': (lang === 'cs' ? 'Vysoká' : 'High')
  };
  // note map for known app notes
  map.noteMap = map.noteMap || {
    'Demo score — interpret with caution': (lang === 'cs' ? 'Demo skóre — interpretujte opatrně' : 'Demo score — interpret with caution')
  };
});

function applyStaffLanguage(lang) {
  var map = STAFF_LANG[lang] || STAFF_LANG.en;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    var val = map[key];
    if (!val) return;
    el.textContent = val;
  });

  // placeholders or small conditional values
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-placeholder');
    var val = map[key];
    if (!val) return;
    // If val is an object (like surveyStatusValue), try to preserve existing truthiness
    if (typeof val === 'object') return;
    if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });

  // Translate elements using data-i18n-key (useful for dynamic event types)
  document.querySelectorAll('[data-i18n-key]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-key');
    if (!key) return;
    var val = map[key] || map[key.replace(/-/g, '_')];
    if (val) el.textContent = val;
  });

  // Translate tiers (data-tier)
  document.querySelectorAll('[data-tier]').forEach(function (el) {
    var tier = el.getAttribute('data-tier');
    if (!tier) return;
    var translated = (map.tierMap && map.tierMap[tier]) || tier;
    el.textContent = translated;
  });

  // Translate notes (data-note) for known notes
  document.querySelectorAll('[data-note]').forEach(function (el) {
    var note = el.getAttribute('data-note');
    if (!note) return;
    var translated = (map.noteMap && map.noteMap[note]) || note;
    el.textContent = translated;
  });

  translateStaffErrors(lang);

  // Handle special case: survey status value text is server-rendered; replace if element present
  var surveyEl = document.querySelector('[data-i18n-placeholder="surveyStatusValue"]');
  if (surveyEl) {
    var completed = surveyEl.textContent && surveyEl.textContent.trim().length > 0 && surveyEl.textContent.trim() !== '--';
    surveyEl.textContent = completed ? map.surveyStatusValue.completed : map.surveyStatusValue.not_completed;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  var sel = document.getElementById('lang-select');
  var current = localStorage.getItem('therahub_lang') || 'en';
  // set selector value if present
  if (sel) {
    try { sel.value = current; } catch (e) {}
    sel.addEventListener('change', function () {
      localStorage.setItem('therahub_lang', sel.value);
      applyStaffLanguage(sel.value);
      window.dispatchEvent(new Event('therahub_lang_changed'));
    });
  }

  // Apply on load
  applyStaffLanguage(current);

  // Listen for external changes
  window.addEventListener('therahub_lang_changed', function () {
    var newLang = localStorage.getItem('therahub_lang') || 'en';
    applyStaffLanguage(newLang);
  });
});
