window.addEventListener('DOMContentLoaded', () => {
	let fetchBtn = document.getElementById('fetch-teetimes');

	fetchBtn.addEventListener('click', async () => {
		let sessionId = await window.api.fetchSessionId();
		let bearerToken = await window.api.logIn(sessionId);

		console.log('Session ID:', sessionId);
		console.log('Bearer Token:', bearerToken);
	});
});
