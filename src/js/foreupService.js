const moment = require('moment');
const fetch = require('node-fetch');

let isSniping6AM = false;
let isSnipingWhenAvailable = false;
let teeTimeOptions = {};

async function getIsSniping6AM() {
	return isSniping6AM;
}

async function getIsSnipingWhenAvailable() {
	return isSnipingWhenAvailable;
}

async function getTeeTimeOptions() {
	return teeTimeOptions;
}

async function setIsSniping6AM(value) {
	isSniping6AM = value;
}

async function setIsSnipingWhenAvailable(value) {
	isSnipingWhenAvailable = value;
}

async function setTeeTimeOptions(data) {
	teeTimeOptions = data;
}

async function getSessionId() {
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

async function fetchTeeTimes(sessionId, bearerToken, date, courseScheduleId, minTime, maxTime, numPlayers) {
	date = moment(date, 'YYYY/MM/DD').format('MM-DD-YYYY');

	let url = `https://foreupsoftware.com/index.php/api/booking/times?time=all&date=${date}&holes=18&players=${numPlayers}&booking_class=87&schedule_id=${courseScheduleId}&specials_only=0&api_key=no_limits&is_aggregate=true`;

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

async function getClosestTeeTime(sessionId, bearerToken, teeTimeOptions) {
	let i = 0;
	let teeTimes = [];
	while (teeTimes.length === 0 && i < teeTimeOptions.courseScheduleIds.length) {
		let courseId = teeTimeOptions.courseScheduleIds[i++];
		teeTimes = await fetchTeeTimes(sessionId, bearerToken, teeTimeOptions.targetDate, courseId, teeTimeOptions.minTime, teeTimeOptions.maxTime, teeTimeOptions.numPlayers);
	}
	if (teeTimes.length === 0) {
		// no tee times found for any course
		return null;
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

		let prevDate = moment(prev.time, 'HH:mm');
		let currDate = moment(curr.time, 'HH:mm');
		let targetDate = moment(teeTimeOptions.targetTime.split(' ')[0], 'HH:mm');

		let prevDiff = Math.abs(prevDate.diff(targetDate));
		let currDiff = Math.abs(currDate.diff(targetDate));

		return prevDiff <= currDiff ? prev : curr;
	});

	return closestTeeTime;
}

async function reserveTeeTime(sessionId, bearerToken, closestTeeTime) {
	let pendingReservationUrl = `https://foreupsoftware.com/api_rest/courses/${closestTeeTime.course_id}/oco/bag/pending_reservation`;
	let pendingReservationResponse = await fetch(pendingReservationUrl, {
		method: 'POST',
		headers: {
			Accept: '*/*',
			'Content-Type': 'application/json',
			Cookie: sessionId,
			'X-Authorization': `Bearer ${bearerToken}`,
		},
		body: JSON.stringify({
			time: `${teeTimeOptions.targetDate} ${closestTeeTime.time}`,
			holes: closestTeeTime.holes,
			players: teeTimeOptions.numPlayers,
			carts: true,
			schedule_id: closestTeeTime.schedule_id,
			teesheet_side_id: closestTeeTime.teesheet_side_id,
			course_id: closestTeeTime.course_id,
			booking_class_id: 87,
			duration: 1,
			foreup_discount: closestTeeTime.foreup_discount,
			foreup_trade_discount_rate: closestTeeTime.foreup_trade_discount_rate,
			trade_min_players: closestTeeTime.trade_min_players,
			cart_fee: closestTeeTime.cart_fee,
			cart_fee_tax: closestTeeTime.cart_fee_tax,
			green_fee: closestTeeTime.green_fee,
			green_fee_tax: closestTeeTime.green_fee_tax,
		}),
	});

	let pendingReservation = await pendingReservationResponse.json();
	let reservationId = pendingReservation.reservation_id;

	let reservationUrl = 'https://foreupsoftware.com/index.php/api/booking/users/reservations';
	let reservation = await fetch(reservationUrl, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Cookie: sessionId,
			'X-Authorization': `Bearer ${bearerToken}`,
			'Api-key': 'no_limits',
		},
		body: JSON.stringify({
			notes: [],
			players: teeTimeOptions.numPlayers,
			holes: closestTeeTime.holes,
			customer_message: null,
			carts: true,
			green_fee: closestTeeTime.green_fee,
			green_fee_tax_rate: closestTeeTime.green_fee_tax_rate,
			guest_green_fee: closestTeeTime.guest_green_fee,
			guest_green_fee_tax_rate: closestTeeTime.guest_green_fee_tax_rate,
			cart_fee: closestTeeTime.cart_fee,
			cart_fee_tax_rate: closestTeeTime.cart_fee_tax_rate,
			guest_cart_fee: closestTeeTime.guest_cart_fee,
			guest_cart_fee_tax_rate: closestTeeTime.guest_cart_fee_tax_rate,
			total: teeTimeOptions.numPlayers * closestTeeTime.green_fee,
			purchased: false,
			pay_players: teeTimeOptions.numPlayers,
			pay_carts: 0,
			pay_total: teeTimeOptions.numPlayers * closestTeeTime.green_fee,
			pay_subtotal: teeTimeOptions.numPlayers * closestTeeTime.green_fee,
			paid_player_count: 0,
			discount_percent: 0,
			discount: 0,
			has_special: closestTeeTime.has_special,
			special_discount_percentage: closestTeeTime.special_discount_percentage,
			promo_code: '',
			promo_discount: 0,
			group_id: closestTeeTime.group_id,
			player_list: [{ position: 2, name: '', type: 'text', person_id: '', placeholder: 'Search Players' }],
			booking_fee_required: closestTeeTime.booking_fee_required,
			details: '',
			booking_class_id: '87',
			pending_reservation_id: reservationId,
			duration: 1,
			allow_mobile_checkin: 0,
			airQuotesCart: [{ type: 'item', description: 'Green Fee', price: closestTeeTime.green_fee, quantity: teeTimeOptions.numPlayers, subtotal: teeTimeOptions.numPlayers * closestTeeTime.green_fee }],
			preTaxSubtotal: teeTimeOptions.numPlayers * closestTeeTime.green_fee,
			estimatedTax: 0,
			subtotal: teeTimeOptions.numPlayers * closestTeeTime.green_fee,
			time: `${teeTimeOptions.targetDate} ${closestTeeTime.time}`,
			start_front: closestTeeTime.start_front,
			course_id: closestTeeTime.course_id,
			course_name: closestTeeTime.course_name,
			schedule_id: closestTeeTime.schedule_id,
			teesheet_id: closestTeeTime.teesheet_id,
			schedule_name: closestTeeTime.schedule_name,
			require_credit_card: closestTeeTime.require_credit_card,
			teesheet_holes: closestTeeTime.teesheet_holes,
			teesheet_side_id: closestTeeTime.teesheet_side_id,
			teesheet_side_name: closestTeeTime.teesheet_side_name,
			teesheet_side_order: closestTeeTime.teesheet_side_order,
			reround_teesheet_side_id: closestTeeTime.reround_teesheet_side_id,
			reround_teesheet_side_name: closestTeeTime.reround_teesheet_side_name,
			available_spots: closestTeeTime.available_spots,
			available_spots_9: closestTeeTime.available_spots_9,
			available_spots_18: closestTeeTime.available_spots_18,
			maximum_players_per_booking: closestTeeTime.maximum_players_per_booking,
			minimum_players: closestTeeTime.minimum_players,
			allowed_group_sizes: closestTeeTime.allowed_group_sizes,
			special_id: closestTeeTime.special_id,
			booking_fee_price: closestTeeTime.booking_fee_price,
			booking_fee_per_person: closestTeeTime.booking_fee_per_person,
			trade_min_players: closestTeeTime.trade_min_players,
			trade_cart_requirement: closestTeeTime.trade_cart_requirement,
			trade_hole_requirement: closestTeeTime.trade_hole_requirement,
			trade_available_players: closestTeeTime.trade_available_players,
			green_fee_tax: closestTeeTime.green_fee_tax,
			green_fee_tax_9: closestTeeTime.green_fee_tax_9,
			green_fee_tax_18: closestTeeTime.green_fee_tax_18,
			guest_green_fee_tax: closestTeeTime.guest_green_fee_tax,
			guest_green_fee_tax_9: closestTeeTime.guest_green_fee_tax_9,
			guest_green_fee_tax_18: closestTeeTime.guest_green_fee_tax_18,
			cart_fee_tax: closestTeeTime.cart_fee_tax,
			cart_fee_tax_9: closestTeeTime.cart_fee_tax_9,
			cart_fee_tax_18: closestTeeTime.cart_fee_tax_18,
			guest_cart_fee_tax: closestTeeTime.guest_cart_fee_tax,
			guest_cart_fee_tax_9: closestTeeTime.guest_cart_fee_tax_9,
			guest_cart_fee_tax_18: closestTeeTime.guest_cart_fee_tax_18,
			foreup_discount: closestTeeTime.foreup_discount,
			pay_online: closestTeeTime.pay_online,
			green_fee_9: closestTeeTime.green_fee_9,
			green_fee_18: closestTeeTime.green_fee_18,
			guest_green_fee_9: closestTeeTime.guest_green_fee_9,
			guest_green_fee_18: closestTeeTime.guest_green_fee_18,
			cart_fee_9: closestTeeTime.cart_fee_9,
			cart_fee_18: closestTeeTime.cart_fee_18,
			guest_cart_fee_9: closestTeeTime.guest_cart_fee_9,
			guest_cart_fee_18: closestTeeTime.guest_cart_fee_18,
			rate_type: closestTeeTime.rate_type,
			special_was_price: closestTeeTime.special_was_price,
			cart_fee_18_hole: closestTeeTime.cart_fee_18_hole,
			cart_fee_9_hole: closestTeeTime.cart_fee_9_hole,
			teesheet_logo: closestTeeTime.teesheet_logo,
			teesheet_color: closestTeeTime.teesheet_color,
			teesheet_initials: closestTeeTime.teesheet_initials,
			bypass_cc_id_validation: true,
		}),
	});

	let reservationData = await reservation.json();
	return reservationData;
}

module.exports = { getSessionId, logIn, fetchTeeTimes, getClosestTeeTime, reserveTeeTime, getIsSniping6AM, getIsSnipingWhenAvailable, getTeeTimeOptions, setIsSniping6AM, setIsSnipingWhenAvailable, setTeeTimeOptions };
