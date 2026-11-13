'use strict';

const $ = (selector) => document.querySelector(selector);
const digitInput = $('#digit-inp');
const saveDigitButton = $('#save-digit');
const rollInput = $('#rolls');
const processButton = $('#process');
const pasteButton = $('#paste');
const stdCount = $('#stdCount');
const presentCount = $('#presentCount');
const absentCount = $('#absentCount');
const mistakeCount = $('#mistakeCount');
const presentContainer = $('#rollsContainer');
const absentContainer = $('#absentRollsContainer');
const omrContainer = $('#wrongOmrRollsContainer');
const searchInput = $('#searchInput');
const searchButton = $('#searchBtn');
const searchLog = $('#searchLog');
const copyStatus = $('#copyStatus');
const examDateInput = $('#exam-date');
const examTimeInput = $('#exam-time');
const examDateDisplay = $('#exam-date-display');
const digitHelp = $('#digit-help');
const rollHelp = $('#roll-help');

const ALLOWED_DIGIT_LENGTHS = [6, 10];
const DEFAULT_DIGIT_LENGTH = 6;
const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const banglaWeekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

function isValidDigitLength(value) {
  return ALLOWED_DIGIT_LENGTHS.includes(value);
}

function readSavedDigitLength() {
  try {
    const saved = Number(localStorage.getItem('roll-digit'));
    return isValidDigitLength(saved) ? saved : DEFAULT_DIGIT_LENGTH;
  } catch (error) {
    return DEFAULT_DIGIT_LENGTH;
  }
}

let digit = readSavedDigitLength();
let presentRolls = [];
let absentRolls = new Map(); // roll -> its original index in presentRolls
let omrMistakeRolls = [];
let selectedAction = 'absent';

function updateDigitSettingUi() {
  digitInput.value = String(digit);
  digitHelp.textContent = `Current setting: ${digit} digits per roll (choose 6 or 10).`;
  rollHelp.textContent = `Every roll must be exactly ${digit} digits. Duplicate rolls will be reported.`;
  rollInput.placeholder = `Paste rolls here; each roll must be exactly ${digit} digits`;
  document.documentElement.style.setProperty('--roll-box-width', digit === 10 ? '5.7em' : '3.8em');
}

updateDigitSettingUi();

function toEnglishDigits(value) {
  return String(value).replace(/[০-৯]/g, (digitChar) => String(banglaDigits.indexOf(digitChar)));
}

function toBanglaDigits(value) {
  return String(value).replace(/\d/g, (digitChar) => banglaDigits[Number(digitChar)]);
}

function showActionError(status, roll) {
  const messages = {
    'already-absent': `⚠ ${roll} is already marked as Absent.`,
    'already-omr': `⚠ ${roll} is already marked as an OMR mistake.`,
    'is-absent': `⚠ ${roll} is marked Absent. Remove the Absent mark before marking it as an OMR mistake.`,
    'not-present': `⚠ ${roll} is not in the Present list.`
  };
  if (messages[status]) alert(messages[status]);
}

function setSelectedAction(action) {
  selectedAction = action;
  const isAbsent = action === 'absent';
  $('#absent').classList.toggle('selected', isAbsent);
  $('#wrongOmr').classList.toggle('selected', !isAbsent);
  $('#absent').setAttribute('aria-pressed', String(isAbsent));
  $('#wrongOmr').setAttribute('aria-pressed', String(!isAbsent));
}

function createRollButton(roll, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'roll';
  button.textContent = roll;
  button.addEventListener('click', onClick);
  return button;
}

function updateCounts() {
  const presentTotal = presentRolls.filter((roll) => roll !== '').length;
  presentCount.textContent = String(presentTotal);
  absentCount.textContent = String(absentRolls.size);
  mistakeCount.textContent = String(omrMistakeRolls.length);

  presentContainer.replaceChildren();
  presentRolls.forEach((roll, index) => {
    if (roll !== '') {
      presentContainer.append(createRollButton(roll, () => handleRollClick(roll, index)));
    }
  });

  absentContainer.replaceChildren();
  [...absentRolls.keys()].sort().forEach((roll) => {
    absentContainer.append(createRollButton(roll, () => cancelAbsent(roll)));
  });

  omrContainer.replaceChildren();
  omrMistakeRolls.forEach((roll) => {
    omrContainer.append(createRollButton(roll, () => removeOmr(roll)));
  });
}

function updatePrintable() {
  const presentRollContainer = $('#present-roll');
  const absentRollContainer = $('#absent-roll');
  const omrRollContainer = $('#omr-roll');

  presentRollContainer.replaceChildren();
  presentRolls.filter((roll) => roll !== '').forEach((roll) => {
    const span = document.createElement('span');
    span.textContent = roll;
    presentRollContainer.append(span);
  });

  absentRollContainer.replaceChildren();
  [...absentRolls.keys()].sort().forEach((roll) => {
    const span = document.createElement('span');
    span.textContent = roll;
    absentRollContainer.append(span);
  });

  omrRollContainer.replaceChildren();
  [...omrMistakeRolls].sort().forEach((roll) => {
    const span = document.createElement('span');
    span.textContent = roll;
    omrRollContainer.append(span);
  });

  const presentTotal = toBanglaDigits(presentRolls.filter((roll) => roll !== '').length);
  document.querySelectorAll('.p-presentCount').forEach((span) => {
    span.textContent = presentTotal;
  });
  $('#p-omrCount').textContent = toBanglaDigits(omrMistakeRolls.length);
  $('#p-absentCount').textContent = toBanglaDigits(absentRolls.size);
}

function applySelectedAction(roll, presentIndex) {
  if (selectedAction === 'absent') {
    if (absentRolls.has(roll)) return 'already-absent';
    if (omrMistakeRolls.includes(roll)) return 'already-omr';
    if (presentIndex < 0 || presentRolls[presentIndex] !== roll) return 'not-present';

    presentRolls[presentIndex] = '';
    absentRolls.set(roll, presentIndex);
    return 'applied';
  }

  if (absentRolls.has(roll)) return 'is-absent';
  if (omrMistakeRolls.includes(roll)) return 'already-omr';
  if (presentIndex < 0 || presentRolls[presentIndex] !== roll) return 'not-present';

  omrMistakeRolls.push(roll);
  omrMistakeRolls.sort();
  return 'applied';
}

function handleRollClick(roll, presentIndex) {
  const result = applySelectedAction(roll, presentIndex);
  if (result !== 'applied') {
    showActionError(result, roll);
    return;
  }
  updateCounts();
  updatePrintable();
}

function cancelAbsent(roll) {
  if (!absentRolls.has(roll)) return;
  const originalIndex = absentRolls.get(roll);
  presentRolls[originalIndex] = roll;
  absentRolls.delete(roll);
  updateCounts();
  updatePrintable();
}

function removeOmr(roll) {
  const index = omrMistakeRolls.indexOf(roll);
  if (index === -1) return;
  omrMistakeRolls.splice(index, 1);
  updateCounts();
  updatePrintable();
}

function processRolls() {
  const digitLength = Number(digit);
  const input = toEnglishDigits(rollInput.value);
  const rolls = input.match(/\d+/g) || [];

  if (!isValidDigitLength(digitLength)) {
    alert('Choose either 6 or 10 digits per roll, then click Save.');
    return;
  }
  if (rolls.length === 0) {
    alert(`Enter ${digitLength}-digit roll numbers.`);
    return;
  }

  const invalidRolls = [...new Set(rolls.filter((roll) => roll.length !== digitLength))];
  if (invalidRolls.length > 0) {
    alert(`These values are not ${digitLength} digits long: ${invalidRolls.slice(0, 10).join(', ')}`);
    return;
  }

  const seen = new Set();
  const duplicates = new Set();
  rolls.forEach((roll) => {
    if (seen.has(roll)) duplicates.add(roll);
    seen.add(roll);
  });
  if (duplicates.size > 0) {
    alert(`Duplicate roll numbers found: ${[...duplicates].join(', ')}`);
    return;
  }

  presentRolls = [...rolls].sort();
  absentRolls = new Map();
  omrMistakeRolls = [];
  stdCount.textContent = String(presentRolls.length);
  searchLog.textContent = '';
  updateCounts();
  updatePrintable();
}

saveDigitButton.addEventListener('click', () => {
  const value = Number(digitInput.value);
  if (!isValidDigitLength(value)) {
    alert('Choose either 6 or 10 digits per roll.');
    digitInput.value = String(digit);
    digitInput.focus();
    return;
  }

  if (value !== digit && presentRolls.length > 0) {
    const changeConfirmed = window.confirm(
      'Changing the roll length will clear the processed lists. The text in the input box will be kept. Continue?'
    );
    if (!changeConfirmed) {
      digitInput.value = String(digit);
      return;
    }
    presentRolls = [];
    absentRolls = new Map();
    omrMistakeRolls = [];
    stdCount.textContent = '0';
    searchLog.textContent = '';
    updateCounts();
    updatePrintable();
  }

  digit = value;
  updateDigitSettingUi();
  try {
    localStorage.setItem('roll-digit', String(value));
  } catch (error) {
    console.warn('Could not save the digit count:', error);
  }
  alert(`Saved: each roll must now be exactly ${value} digits.`);
});

processButton.addEventListener('click', processRolls);

pasteButton.addEventListener('click', async () => {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      throw new Error('Clipboard reading is not available in this context.');
    }
    rollInput.value = await navigator.clipboard.readText();
    processRolls();
  } catch (error) {
    console.error('Failed to read clipboard contents:', error);
    alert("Can't access the clipboard. You can paste the rolls into the text box manually.");
  }
});

$('#absent').addEventListener('click', () => setSelectedAction('absent'));
$('#wrongOmr').addEventListener('click', () => setSelectedAction('omr'));

searchButton.addEventListener('click', () => {
  const input = toEnglishDigits(searchInput.value);
  const rolls = input.match(/\d+/g) || [];
  if (rolls.length === 0) {
    searchLog.textContent = 'Enter one or more roll numbers.';
    return;
  }

  const digitLength = Number(digit);
  const invalidRolls = [...new Set(rolls.filter((roll) => roll.length !== digitLength))];
  if (invalidRolls.length > 0) {
    searchLog.textContent = `Wrong digit count: ${invalidRolls.join(', ')}`;
    return;
  }

  const applied = [];
  const notFound = [];
  const skipped = [];
  [...new Set(rolls)].forEach((roll) => {
    const presentIndex = presentRolls.indexOf(roll);
    if (presentIndex === -1 && !absentRolls.has(roll)) {
      notFound.push(roll);
      return;
    }

    const result = applySelectedAction(roll, presentIndex);
    if (result === 'applied') {
      applied.push(roll);
    } else if (result === 'not-present') {
      notFound.push(roll);
    } else {
      skipped.push(`${roll} (${result === 'is-absent' ? 'already Absent' : result === 'already-absent' ? 'already Absent' : 'already OMR'})`);
    }
  });

  updateCounts();
  updatePrintable();
  const messages = [];
  if (applied.length) messages.push(`Updated: ${applied.join(', ')}`);
  if (skipped.length) messages.push(`Skipped: ${skipped.join(', ')}`);
  if (notFound.length) messages.push(`Not found: ${notFound.join(', ')}`);
  searchLog.textContent = messages.join(' | ') || 'No rolls were changed.';
  searchInput.value = notFound.join(' ');
});

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') searchButton.click();
});

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const type = button.dataset.copy;
    let rolls = [];
    if (type === 'present') {
      rolls = presentRolls.filter((roll) => roll !== '');
    } else if (type === 'absent') {
      rolls = [...absentRolls.keys()].sort();
    } else {
      rolls = [...omrMistakeRolls].sort();
    }

    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error('Clipboard writing is not available in this context.');
      }
      await navigator.clipboard.writeText(rolls.join('  '));
      copyStatus.textContent = `Copied ${rolls.length} ${type} roll(s).`;
    } catch (error) {
      console.error('Failed to copy rolls:', error);
      copyStatus.textContent = 'Copy failed. Check clipboard permission and try again.';
    }
  });
});

function localDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBanglaTime(value) {
  const match = /^([0-9]{2}):([0-9]{2})$/.exec(value);
  if (!match) return '';

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return '';

  let period;
  if (hour < 4) period = 'রাত';
  else if (hour < 6) period = 'ভোর';
  else if (hour < 12) period = 'সকাল';
  else if (hour < 14) period = 'দুপুর';
  else if (hour < 19) period = 'বিকাল';
  else period = 'রাত';

  const hour12 = hour % 12 || 12;
  const timeText = `${String(hour12).padStart(2, '0')}.${String(minute).padStart(2, '0')}`;
  return `${period} ${toBanglaDigits(timeText)}`;
}

function updateExamDate() {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(examDateInput.value);
  if (!match) {
    examDateDisplay.textContent = '';
    return;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    examDateDisplay.textContent = '';
    return;
  }

  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  const timeText = formatBanglaTime(examTimeInput.value);
  examDateDisplay.textContent = `${toBanglaDigits(formattedDate)} ${banglaWeekdays[date.getDay()]}${timeText ? ` ${timeText}` : ''}`;
}

examDateInput.value = localDateValue(new Date());
examTimeInput.value = '10:00';
examDateInput.addEventListener('input', updateExamDate);
examDateInput.addEventListener('change', updateExamDate);
examTimeInput.addEventListener('input', updateExamDate);
examTimeInput.addEventListener('change', updateExamDate);
updateExamDate();

$('#printBtn').addEventListener('click', () => window.print());
