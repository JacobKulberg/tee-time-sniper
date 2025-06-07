window.addEventListener('DOMContentLoaded', () => {
	let getClosestTeeTimeButtonEl = document.getElementById('get-closest-tee-time');
	let targetDateEl = document.getElementById('target-date');
	let coursePriorityEl = document.getElementById('course-priority-list');

	let twoWeeksFromNow = new Date();
	twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 15);
	targetDateEl.value = twoWeeksFromNow.toISOString().split('T')[0];

	getClosestTeeTimeButtonEl.addEventListener('click', async () => {
		let courseScheduleIds = Array.from(coursePriorityEl.querySelectorAll('li'))
			.filter((li) => !li.classList.contains('disabled'))
			.map((li) => li.getAttribute('value'));

		let targetDate = targetDateEl.value;
		if (!targetDate) {
			window.api.showAlert('Please select a target date.', 'error');
			return;
		}

		let targetTime = document.getElementById('target-time-value').textContent;
		if (!targetTime) {
			window.api.showAlert('Please select a target tee time.', 'error');
			return;
		}

		try {
			let sessionId = await window.api.fetchSessionId();
			let bearerToken = await window.api.logIn(sessionId);

			let minTime = document.getElementById('target-time-min').textContent;
			let maxTime = document.getElementById('target-time-max').textContent;

			let i = 0;
			let teeTimes = [];
			while (teeTimes.length === 0 && i < courseScheduleIds.length) {
				let courseScheduleId = courseScheduleIds[i++];
				teeTimes = await window.api.fetchTeeTimes(sessionId, bearerToken, targetDate, courseScheduleId, minTime, maxTime);
			}
			if (teeTimes.length === 0) {
				window.api.showAlert('No tee times available.');
				return;
			}

			let closestTeeTime = teeTimes.reduce((prev, curr) => {
				if (!prev || !curr || !prev.time || !curr.time) {
					return prev || curr;
				}

				if (prev.time.includes(' ')) {
					prev.time = prev.time.split(' ')[1];
				}
				if (curr.time.includes(' ')) {
					curr.time = curr.time.split(' ')[1];
				}

				let prevTimeParts = prev.time.split(':');
				let currTimeParts = curr.time.split(':');
				let targetTimeParts = targetTime.split(' ')[0].split(':');

				let prevDate = new Date(1970, 0, 1, prevTimeParts[0], prevTimeParts[1], prevTimeParts[2] || 0);
				let currDate = new Date(1970, 0, 1, currTimeParts[0], currTimeParts[1], currTimeParts[2] || 0);
				let targetDate = new Date(1970, 0, 1, targetTimeParts[0], targetTimeParts[1], targetTimeParts[2] || 0);

				let prevDiff = Math.abs(prevDate - targetDate);
				let currDiff = Math.abs(currDate - targetDate);

				return prevDiff <= currDiff ? prev : curr;
			});

			let closestTimeParts = closestTeeTime.time.split(':');
			let hours = parseInt(closestTimeParts[0], 10);
			let minutes = closestTimeParts[1];
			let ampm = hours >= 12 ? 'PM' : 'AM';
			closestTeeTime.time = `${hours % 12 || 12}:${minutes} ${ampm}`;

			window.api.showAlert(`Closest tee time is at ${closestTeeTime.time} at ${closestTeeTime.course_name}.`);
		} catch (error) {
			console.error('Error fetching tee times:', error);
			window.api.showAlert('Failed to fetch tee times.', 'error');
		}
	});
});
