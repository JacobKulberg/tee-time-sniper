let container = document.getElementById('target-time-slider');
const HANDLE_ELEMENTS = {
	min: document.getElementById('target-time-handle-min'),
	value: document.getElementById('target-time-handle-value'),
	max: document.getElementById('target-time-handle-max'),
};
const DISPLAY_VALUES = {
	min: document.getElementById('target-time-min'),
	value: document.getElementById('target-time-value'),
	max: document.getElementById('target-time-max'),
};
const START_HOUR = 7;
const END_HOUR = 12;
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
const STEP_MIN = 5;
const STEP_PCT = (STEP_MIN / TOTAL_MIN) * 100;
const HANDLE_POSITIONS = {
	min: (45 / TOTAL_MIN) * 100,
	value: (75 / TOTAL_MIN) * 100,
	max: (105 / TOTAL_MIN) * 100,
};

let activeHandle = null;

function pctToPx(p) {
	return (p / 100) * container.clientWidth;
}

function pxToPct(x) {
	return Math.min(100, Math.max(0, (x / container.clientWidth) * 100));
}

function snapPct(pct) {
	let mins = (pct / 100) * TOTAL_MIN;
	let snapped = Math.round(mins / STEP_MIN) * STEP_MIN;

	return (snapped / TOTAL_MIN) * 100;
}

function formatTime(pct) {
	let minsFromStart = Math.round((pct / 100) * TOTAL_MIN);
	let totalMins = START_HOUR * 60 + minsFromStart;
	let h = Math.floor(totalMins / 60),
		m = totalMins % 60;
	let ampm = h >= 12 ? 'PM' : 'AM';

	if (h > 12) h -= 12;
	if (h === 0) h = 12;

	return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

let rangeEl = document.getElementById('target-time-slider-range');
function render() {
	for (let key of ['min', 'value', 'max']) {
		HANDLE_ELEMENTS[key].style.left = pctToPx(HANDLE_POSITIONS[key]) + 'px';
		DISPLAY_VALUES[key].textContent = formatTime(HANDLE_POSITIONS[key]);
	}

	let leftPx = pctToPx(HANDLE_POSITIONS.min);
	let widthPx = pctToPx(HANDLE_POSITIONS.max - HANDLE_POSITIONS.min);

	rangeEl.style.left = leftPx + 'px';
	rangeEl.style.width = widthPx + 'px';
}

function onDown(e) {
	activeHandle = e.target.dataset.type;

	document.addEventListener('mousemove', onMove);
	document.addEventListener('mouseup', onUp);
}

function onMove(e) {
	if (!activeHandle) return;

	let rect = container.getBoundingClientRect();
	let pct = snapPct(pxToPct(e.clientX - rect.left));

	if (activeHandle === 'min') {
		pct = Math.min(pct, HANDLE_POSITIONS.value - STEP_PCT);
	} else if (activeHandle === 'value') {
		pct = Math.max(pct, HANDLE_POSITIONS.min + STEP_PCT);
		pct = Math.min(pct, HANDLE_POSITIONS.max - STEP_PCT);
	} else if (activeHandle === 'max') {
		pct = Math.max(pct, HANDLE_POSITIONS.value + STEP_PCT);
	}

	HANDLE_POSITIONS[activeHandle] = pct;

	render();
}

function onUp() {
	activeHandle = null;

	document.removeEventListener('mousemove', onMove);
	document.removeEventListener('mouseup', onUp);
}

Object.values(HANDLE_ELEMENTS).forEach((h) => h.addEventListener('mousedown', onDown));

render();
