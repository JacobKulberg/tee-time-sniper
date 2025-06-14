const { contextBridge, ipcRenderer } = require('electron');
const log = require('electron-log');

contextBridge.exposeInMainWorld('api', {
	EMAIL: process.env.EMAIL,
	EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
	EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID,
	EMAILJS_USER_ID: process.env.EMAILJS_USER_ID,

	getSessionId: () => ipcRenderer.invoke('get-session-id'),
	logIn: (sessionId) => ipcRenderer.invoke('log-in', sessionId),
	fetchTeeTimes: (sessionId, bearerToken, date, courseScheduleId, minTime, maxTime, numPlayers) => ipcRenderer.invoke('fetch-tee-times', sessionId, bearerToken, date, courseScheduleId, minTime, maxTime, numPlayers),

	showAlert: (message, type = 'none') => ipcRenderer.invoke('show-alert', message, type),
	onShowAlert: (callback) => ipcRenderer.on('show-alert', (event, message, type) => callback(message, type)),

	getIsSniping6AM: () => ipcRenderer.invoke('get-is-sniping-6am'),
	getIsSnipingWhenAvailable: () => ipcRenderer.invoke('get-is-sniping-when-available'),
	getTeeTimeOptions: () => ipcRenderer.invoke('get-tee-time-data'),

	setIsSniping6AM: (value) => ipcRenderer.invoke('set-is-sniping-6am', value),
	setIsSnipingWhenAvailable: (value) => ipcRenderer.invoke('set-is-sniping-when-available', value),
	setTeeTimeOptions: (data) => ipcRenderer.invoke('set-tee-time-data', data),

	onStopSniping6AM: (callback) => ipcRenderer.on('stop-sniping-6am', (event, reservation) => callback(reservation)),
	onStopSnipingWhenReady: (callback) => ipcRenderer.on('stop-sniping-when-ready', (event, reservation, forceStop = false) => callback(reservation, forceStop)),

	sendReservationEmail: (callback) => ipcRenderer.on('send-reservation-email', (event, reservation) => callback(reservation)),

	info: (...args) => log.info(...args),
	error: (...args) => log.error(...args),
});
