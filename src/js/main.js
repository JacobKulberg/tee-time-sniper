const { app, BrowserWindow, ipcMain, dialog, Menu, Tray } = require('electron');
const { getSessionId, logIn, fetchTeeTimes, getIsSniping6AM, getIsSnipingWhenAvailable, getTeeTimeOptions, setIsSniping6AM, setIsSnipingWhenAvailable, setTeeTimeOptions } = require('./foreupService');
const { startWorkers } = require('./worker');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

function createWindow() {
	let tray = null;

	const win = new BrowserWindow({
		width: 700,
		height: 675,
		icon: path.join(__dirname, '../../assets/icon.ico'),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	const contextMenu = Menu.buildFromTemplate([
		{
			label: 'Show',
			click: () => {
				win.show();

				tray.destroy();
			},
		},
		{
			label: 'Quit Tee Time Sniper',
			click: () => {
				app.isQuitting = true;
				app.quit();
			},
		},
	]);

	win.loadFile(path.join(__dirname, '../index.html'));

	win.on('minimize', async (e) => {
		e.preventDefault();
		win.hide();

		let isSniping = (await getIsSniping6AM()) || (await getIsSnipingWhenAvailable());
		let iconPath = isSniping ? '../../assets/trayRed.ico' : '../../assets/trayGreen.ico';

		tray = new Tray(path.join(__dirname, iconPath));
		tray.setToolTip('Tee Time Sniper');
		tray.setContextMenu(contextMenu);
	});

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

	ipcMain.handle('get-is-sniping-6am', () => {
		return getIsSniping6AM();
	});

	ipcMain.handle('get-is-sniping-when-available', () => {
		return getIsSnipingWhenAvailable();
	});

	ipcMain.handle('get-tee-time-data', () => {
		return getTeeTimeOptions();
	});

	ipcMain.handle('set-is-sniping-6am', (event, value) => {
		setIsSniping6AM(value);
	});

	ipcMain.handle('set-is-sniping-when-available', (event, value) => {
		setIsSnipingWhenAvailable(value);
	});

	ipcMain.handle('set-tee-time-data', (event, data) => {
		setTeeTimeOptions(data);
	});
});
