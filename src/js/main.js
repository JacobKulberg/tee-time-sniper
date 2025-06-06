const { app, BrowserWindow, ipcMain } = require('electron');
const { fetchSessionId, logIn } = require('./foreupService');
const path = require('path');
require('dotenv').config();

function createWindow() {
	const win = new BrowserWindow({
		width: 1000,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	win.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(() => {
	createWindow();

	ipcMain.handle('get-session-id', async () => {
		const sessionId = await fetchSessionId();
		return sessionId;
	});

	ipcMain.handle('log-in', async (event, sessionId) => {
		const bearerToken = await logIn(sessionId);
		return bearerToken;
	});
});
