window.addEventListener('DOMContentLoaded', () => {
	let getClosestTeeTimeButton = document.getElementById('get-closest-tee-time');
	let targetTimeInput = document.getElementById('target-time');
	let course = document.getElementById('golf-course');

	let twoWeeksFromNow = new Date();
	twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
	twoWeeksFromNow.setHours(4, 30, 0, 0);
	targetTimeInput.value = twoWeeksFromNow.toISOString().slice(0, 16);

	getClosestTeeTimeButton.addEventListener('click', async () => {
		let courseScheduleId = course.value;

		let targetTime = targetTimeInput.value;
		if (!targetTime) {
			alert('Please select a target tee time.');
			return;
		}

		try {
			let sessionId = await window.api.fetchSessionId();
			let bearerToken = await window.api.logIn(sessionId);

			let date = targetTime.split('T')[0];
			let teeTimes = await window.api.fetchTeeTimes(sessionId, bearerToken, date, courseScheduleId);

			if (teeTimes.length === 0) {
				alert('No tee times available.');
				return;
			}

			targetTime = targetTime.split('T')[1];
			let closestTeeTime = teeTimes.reduce((prev, curr) => {
				if (prev.time.includes(' ')) {
					prev.time = prev.time.split(' ')[1];
				}
				curr.time = curr.time.split(' ')[1];

				let prevTimeParts = prev.time.split(':');
				let currTimeParts = curr.time.split(':');
				let targetTimeParts = targetTime.split(':');

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

			alert(`Closest tee time is at ${closestTeeTime.time}`);
		} catch (error) {
			console.error('Error fetching tee times:', error);
			alert('Failed to fetch tee times. Please try again later.');
		}
	});
});
