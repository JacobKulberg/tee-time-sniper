window.addEventListener('DOMContentLoaded', () => {
	let fetchBtn = document.getElementById('fetch-tee-times');

	fetchBtn.addEventListener('click', async () => {
		let sessionId = await window.api.fetchSessionId();
		let bearerToken = await window.api.logIn(sessionId);
		console.log('Session ID:', sessionId);
		console.log('Bearer Token:', bearerToken);

		let teeTimes = await window.api.fetchTeeTimes(sessionId, bearerToken);
		console.log('Tee Times:', teeTimes);
	});
});
