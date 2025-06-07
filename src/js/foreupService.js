const moment = require('moment');
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
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
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

async function fetchTeeTimes(sessionId, bearerToken, date, courseScheduleId = 7480, minTime = '07:00', maxTime = '10:30') {
	date = moment(date, 'YYYY/MM/DD').format('MM-DD-YYYY');

	let url = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${date}&holes=18&players=0&booking_class=87&schedule_id=${courseScheduleId}&specials_only=0&api_key=no_limits&is_aggregate=true`;

	let response = await fetch(url, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			Cookie: sessionId,
			Authorization: `Bearer ${bearerToken}`,
		},
	});

	let times = await response.json();
	times = times.filter((time) => {
		time.time = time.time.split(' ')[1];
		return moment(time.time, 'HH:mm').isBetween(moment(minTime, 'HH:mm'), moment(maxTime, 'HH:mm'), null, '[]');
	});

	return times;
}

module.exports = { fetchSessionId, logIn, fetchTeeTimes };
