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

async function fetchTeeTimes(sessionId, bearerToken) {
	let twoWeeksFromNow = moment().add(2, 'weeks').format('MM-DD-YYYY');
	let url1 = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${twoWeeksFromNow}&holes=18&players=0&booking_class=87&schedule_id=7480&schedule_ids[]=7480&schedule_ids[]=7481&schedule_ids[]=7483&schedule_ids[]=7476&specials_only=0&api_key=no_limits&is_aggregate=true`;
	let url2 = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${twoWeeksFromNow}&holes=18&players=0&booking_class=87&schedule_id=7481&schedule_ids[]=7480&schedule_ids[]=7481&schedule_ids[]=7483&schedule_ids[]=7476&specials_only=0&api_key=no_limits&is_aggregate=true`;
	let url3 = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${twoWeeksFromNow}&holes=18&players=0&booking_class=87&schedule_id=7483&schedule_ids[]=7480&schedule_ids[]=7481&schedule_ids[]=7483&schedule_ids[]=7476&specials_only=0&api_key=no_limits&is_aggregate=true`;

	const urls = [url1, url2, url3];
	const responses = await Promise.all(
		urls.map((url) =>
			fetch(url, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					Cookie: sessionId,
					Authorization: `Bearer ${bearerToken}`,
				},
			}).then((response) => {
				if (!response.ok) throw new Error(`Fetch failed for ${url}: ${response.statusText}`);
				return response.json();
			})
		)
	);

	return responses;
}

module.exports = { fetchSessionId, logIn, fetchTeeTimes };
