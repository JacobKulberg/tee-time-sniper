window.addEventListener('DOMContentLoaded', () => {
	let snipeButtonEl = document.getElementById('snipe');
	let targetDateEl = document.getElementById('target-date');
	let coursePriorityEl = document.getElementById('course-priority-list');
	let numberOfPlayersEl = document.getElementById('num-players');
	let optionsEl = document.getElementById('tee-time-options');

	function updateSnipeUI(isSniping) {
		if (isSniping) {
			optionsEl.classList.add('disabled');
			snipeButtonEl.textContent = 'Stop Sniping';
			snipeButtonEl.classList.add('sniping');
		} else {
			optionsEl.classList.remove('disabled');
			snipeButtonEl.textContent = 'Snipe at 6:00 AM';
			snipeButtonEl.classList.remove('sniping');
		}
	}

	let twoWeeksFromNow = new Date();
	twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 15);
	let easternDate = new Date(twoWeeksFromNow.toLocaleString('en-US', { timeZone: 'America/New_York' }));

	let year = easternDate.getFullYear();
	let month = String(easternDate.getMonth() + 1).padStart(2, '0');
	let day = String(easternDate.getDate()).padStart(2, '0');
	targetDateEl.value = `${year}-${month}-${day}`;

	snipeButtonEl.addEventListener('click', async () => {
		let teeTimeOptions = {
			targetDate: targetDateEl.value,
			minTime: document.getElementById('target-time-min').textContent,
			targetTime: document.getElementById('target-time-value').textContent,
			maxTime: document.getElementById('target-time-max').textContent,
			courseScheduleIds: Array.from(coursePriorityEl.querySelectorAll('li'))
				.filter((li) => !li.classList.contains('disabled'))
				.map((li) => li.getAttribute('value')),
			numPlayers: parseInt(numberOfPlayersEl.value),
		};
		await window.api.setTeeTimeOptions(teeTimeOptions);

		let isSniping = await window.api.getIsSniping();
		let newIsSnipingState = !isSniping;
		await window.api.setIsSniping(newIsSnipingState);

		updateSnipeUI(newIsSnipingState);
	});

	window.api.onStopSniping(async (reservation) => {
		updateSnipeUI(false);

		if (reservation) {
			await window.api.showAlert(`Successfully reserved tee time for ${reservation.teesheet_title} at ${reservation.time}.`);
		} else {
			await window.api.showAlert('Failed to reserve tee time.', 'error');
		}
	});
});
