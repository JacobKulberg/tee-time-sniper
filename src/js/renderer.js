window.addEventListener('DOMContentLoaded', () => {
	let snipeButton6AMEl = document.getElementById('snipe-6am');
	let snipeButtonWhenAvailableEl = document.getElementById('snipe-when-available');
	let targetDateEl = document.getElementById('target-date');
	let coursePriorityEl = document.getElementById('course-priority-list');
	let numberOfPlayersEl = document.getElementById('num-players');
	let optionsEl = document.getElementById('tee-time-options');

	function updateSnipeUI6AM(isSniping) {
		if (isSniping) {
			optionsEl.classList.add('disabled');
			snipeButton6AMEl.textContent = 'Stop Sniping';
			snipeButton6AMEl.classList.add('sniping');
			snipeButtonWhenAvailableEl.classList.add('disabled');
			snipeButtonWhenAvailableEl.disabled = true;
		} else {
			optionsEl.classList.remove('disabled');
			snipeButton6AMEl.textContent = 'Snipe at 6:00 AM';
			snipeButton6AMEl.classList.remove('sniping');
			snipeButtonWhenAvailableEl.classList.remove('disabled');
			snipeButtonWhenAvailableEl.disabled = false;
		}
	}

	function updateSnipeUIWhenAvailable(isSniping) {
		if (isSniping) {
			optionsEl.classList.add('disabled');
			snipeButtonWhenAvailableEl.textContent = 'Stop Sniping';
			snipeButtonWhenAvailableEl.classList.add('sniping');
			snipeButton6AMEl.classList.add('disabled');
			snipeButton6AMEl.disabled = true;
		} else {
			optionsEl.classList.remove('disabled');
			snipeButtonWhenAvailableEl.textContent = 'Snipe When Available';
			snipeButtonWhenAvailableEl.classList.remove('sniping');
			snipeButton6AMEl.classList.remove('disabled');
			snipeButton6AMEl.disabled = false;
		}
	}

	let twoWeeksFromNow = new Date();
	twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 15);
	let easternDate = new Date(twoWeeksFromNow.toLocaleString('en-US', { timeZone: 'America/New_York' }));

	let year = easternDate.getFullYear();
	let month = String(easternDate.getMonth() + 1).padStart(2, '0');
	let day = String(easternDate.getDate()).padStart(2, '0');
	targetDateEl.value = `${year}-${month}-${day}`;

	snipeButton6AMEl.addEventListener('click', async () => {
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

		let isSniping6AM = await window.api.getIsSniping6AM();
		let newIsSniping6AMState = !isSniping6AM;
		await window.api.setIsSniping6AM(newIsSniping6AMState);

		updateSnipeUI6AM(newIsSniping6AMState);
	});

	snipeButtonWhenAvailableEl.addEventListener('click', async () => {
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

		let isSnipingWhenAvailable = await window.api.getIsSnipingWhenAvailable();
		let newIsSnipingWhenAvailableState = !isSnipingWhenAvailable;
		await window.api.setIsSnipingWhenAvailable(newIsSnipingWhenAvailableState);

		updateSnipeUIWhenAvailable(newIsSnipingWhenAvailableState);
	});

	window.api.onStopSniping6AM(async (reservation) => {
		updateSnipeUI6AM(false);

		if (reservation) {
			await window.api.showAlert(`Successfully reserved tee time for ${reservation.teesheet_title} at ${reservation.time}.`);
		} else {
			await window.api.showAlert('Failed to reserve tee time.', 'error');
		}
	});

	window.api.onStopSnipingWhenReady(async (reservation) => {
		updateSnipeUIWhenAvailable(false);

		if (reservation) {
			await window.api.showAlert(`Successfully reserved tee time for ${reservation.teesheet_title} at ${reservation.time}.`);
		} else {
			await window.api.showAlert('Failed to reserve tee time.', 'error');
		}
	});
});
