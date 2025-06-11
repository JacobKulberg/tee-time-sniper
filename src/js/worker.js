const { CronJob } = require('cron');
const { getSessionId, logIn, getClosestTeeTime, reserveTeeTime, getIsSniping6AM, getIsSnipingWhenAvailable, getTeeTimeOptions, setIsSniping6AM, setIsSnipingWhenAvailable } = require('./foreupService');

let sessionId = null;
let bearerToken = null;
(async () => {
	sessionId = await getSessionId();
	bearerToken = await logIn(sessionId);
})();

async function stopSniping6AM(win, reservation) {
	await setIsSniping6AM(false);

	win.webContents.send('stop-sniping-6am', reservation);
	win.webContents.send('send-reservation-email', reservation);
}

async function stopSnipingWhenReady(win, reservation) {
	await setIsSnipingWhenAvailable(false);

	win.webContents.send('stop-sniping-when-ready', reservation);
	win.webContents.send('send-reservation-email', reservation);
}

function startWorkers(win) {
	//* Reserve Tee Time at 6AM *//
	new CronJob(
		'0 6 * * *',
		async () => {
			let isSniping6AM = await getIsSniping6AM();
			if (!isSniping6AM) return;

			let teeTimeOptions = await getTeeTimeOptions();

			sessionId = await getSessionId();
			bearerToken = await logIn(sessionId);
			let closestTeeTime = await getClosestTeeTime(sessionId, bearerToken, teeTimeOptions);

			if (!closestTeeTime) {
				await stopSniping6AM(win, null);
				return;
			}

			let reservation = await reserveTeeTime(sessionId, bearerToken, closestTeeTime);

			await stopSniping6AM(win, reservation);
		},
		null,
		true,
		'America/New_York'
	);

	//* Reserve Tee Time When Available *//
	new CronJob(
		'*/15 * * * * *',
		async () => {
			let isSnipingWhenAvailable = await getIsSnipingWhenAvailable();
			if (!isSnipingWhenAvailable) return;

			let teeTimeOptions = await getTeeTimeOptions();
			let closestTeeTime = await getClosestTeeTime(sessionId, bearerToken, teeTimeOptions);
			if (!closestTeeTime) return;

			sessionId = await getSessionId();
			bearerToken = await logIn(sessionId);
			let reservation = await reserveTeeTime(sessionId, bearerToken, closestTeeTime);

			await stopSnipingWhenReady(win, reservation);
		},
		null,
		true,
		'America/New_York'
	);

	//* Get Session ID and Bearer Token *//
	new CronJob(
		'0 * * * *',
		async () => {
			sessionId = await getSessionId();
			bearerToken = await logIn(sessionId);
		},
		null,
		true,
		'America/New_York'
	);
}

module.exports = {
	startWorkers,
};
