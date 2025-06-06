const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
	fetchSessionId: () => ipcRenderer.invoke('get-session-id'),
	logIn: (sessionId) => ipcRenderer.invoke('log-in', sessionId),
});
