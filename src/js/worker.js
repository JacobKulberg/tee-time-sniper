const { CronJob } = require('cron');
const { getSessionId, logIn, reserveTeeTime, getIsSniping, getTeeTimeOptions, setIsSniping } = require('./foreupService');

async function stopSniping(win, reservation) {
	await setIsSniping(false);

	win.webContents.send('stop-sniping', reservation);
}

function startWorkers(win) {
	//* Reserve Tee Time *//
	new CronJob(
		'0 6 * * *',
		async () => {
			let isSniping = await getIsSniping();
			if (!isSniping) return;

			let teeTimeOptions = await getTeeTimeOptions();

			let sessionId = await getSessionId();
			let bearerToken = await logIn(sessionId);
			let reservation = await reserveTeeTime(sessionId, bearerToken, teeTimeOptions);

			await stopSniping(win, reservation);
		},
		null,
		true,
		'America/New_York'
	);
}

module.exports = {
	startWorkers,
};
