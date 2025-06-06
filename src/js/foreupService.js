const fetch = require('node-fetch');

async function fetchSessionId() {
	let url = 'https://foreupsoftware.com/index.php/booking/a/21262/21';
	let response = await fetch(url, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	});

	let sessionId = response.headers.raw()['set-cookie'][0].split('; ')[0];
	return sessionId;
}

async function logIn(sessionId) {
	let url = 'https://foreupsoftware.com/index.php/api/booking/users/login';
	let response = await fetch(url, {
		method: 'POST',
		headers: {
			Accept: 'application/json, text/javascript, */*; q=0.01',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			Cookie: sessionId,
			'Api-key': 'no_limits',
		},
		body: new URLSearchParams({
			username: process.env.FOREUP_USERNAME,
			password: process.env.FOREUP_PASSWORD,
			booking_class_id: '87',
			api_key: 'no_limits',
			course_id: '21262',
		}),
	});

	if (!response.ok) {
		throw new Error(`Login failed: ${response.statusText}`);
	}

	let bearerToken = (await response.json()).jwt;
	return bearerToken;
}

module.exports = { fetchSessionId, logIn };
