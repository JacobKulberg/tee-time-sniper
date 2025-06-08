const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { getSessionId, logIn, fetchTeeTimes, getIsSniping, getTeeTimeOptions, setIsSniping, setTeeTimeOptions } = require('./foreupService');
const { startWorkers } = require('./worker');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function createWindow() {
	const win = new BrowserWindow({
		width: 1000,
		height: 800,
		icon: path.join(__dirname, '../../assets/icon.ico'),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	win.loadFile(path.join(__dirname, '../index.html'));

	return win;
}

app.whenReady().then(() => {
	let win = createWindow();
	startWorkers(win);

	ipcMain.handle('get-session-id', async () => {
		const sessionId = await getSessionId();
		return sessionId;
	});

	ipcMain.handle('log-in', async (event, sessionId) => {
		const bearerToken = await logIn(sessionId);
		return bearerToken;
	});

	ipcMain.handle('fetch-tee-times', async (event, sessionId, bearerToken, date, courseScheduleId, minTime, maxTime, numPlayers) => {
		const teeTimes = await fetchTeeTimes(sessionId, bearerToken, date, courseScheduleId, minTime, maxTime, numPlayers);
		return teeTimes;
	});

	ipcMain.handle('show-alert', (event, message, type) => {
		return dialog.showMessageBox({
			type,
			title: 'Tee Time Sniper',
			message,
			buttons: ['OK'],
		});
	});

	ipcMain.handle('get-is-reserving', () => {
		return getIsSniping();
	});

	ipcMain.handle('get-tee-time-data', () => {
		return getTeeTimeOptions();
	});

	ipcMain.handle('set-is-reserving', (event, value) => {
		setIsSniping(value);
	});

	ipcMain.handle('set-tee-time-data', (event, data) => {
		setTeeTimeOptions(data);
	});
});
