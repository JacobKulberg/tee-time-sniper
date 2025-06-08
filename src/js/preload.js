const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
	getSessionId: () => ipcRenderer.invoke('get-session-id'),
	logIn: (sessionId) => ipcRenderer.invoke('log-in', sessionId),
	fetchTeeTimes: (sessionId, bearerToken, date, courseScheduleId, minTime, maxTime, numPlayers) => ipcRenderer.invoke('fetch-tee-times', sessionId, bearerToken, date, courseScheduleId, minTime, maxTime, numPlayers),
	showAlert: (message, type = 'none') => ipcRenderer.invoke('show-alert', message, type),

	getIsSniping: () => ipcRenderer.invoke('get-is-reserving'),
	getTeeTimeOptions: () => ipcRenderer.invoke('get-tee-time-data'),

	setIsSniping: (value) => ipcRenderer.invoke('set-is-reserving', value),
	setTeeTimeOptions: (data) => ipcRenderer.invoke('set-tee-time-data', data),

	onStopSniping: (callback) => ipcRenderer.on('stop-sniping', (event, reservation) => callback(reservation)),
});
