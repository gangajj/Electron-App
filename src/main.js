"user strict";
const electron = require('electron');
var {app, BrowserWindow, Tray, Menu, session, globalShortcut, Notification, protocol, ipcMain } = require('electron');
var request = require('request');
const fs = require('fs');
const path = require('path');

global.envConfig = null;
global.appRoot = path.resolve(__dirname);
appRoot = (appRoot.indexOf("resources") > -1) ? appRoot.substring(0, appRoot.indexOf("resources")) : appRoot;

if(fs.existsSync(path.join(__dirname, 'env.json'))) {
    envConfig = require('./env.json');
} else {
    envConfig = require('./config/env-test.json');
}
//const logger = require('./logger.js');

var isSingleInstanceLock = app.requestSingleInstanceLock();
if (!isSingleInstanceLock) {
    app.exit(0);
}

let mainWindow, contextMenu, tray = null;
const windowAspectRatio = 16 / 9;
const header_y = 40;
const footer_y = 70;

app.on('second-instance', (event, argv, cwd) => {
    if(mainWindow) {
        mainWindow.setSkipTaskbar(false);
        mainWindow.show();
        mainWindow.focus();
    }  
});

function createWindow() {
    mainWindow = new BrowserWindow({
        backgroundColor : '#111924',
        alwaysOnTop: false,
        frame: false,
        title: 'CallApp',
        titleBarStyle : 'hidden-inset',
        icon : `${__dirname}/image/icon.png`,
        useContentSize: false,
        webPreferences : {
            nodeIntegration : true,
            webSecurity: false
        }
    });

    mainWindow.once('ready-to-show', () => {
        console.log('App is ready to show');
        mainWindow.show();
    });
    mainWindow.on('beforeunload', (e) => {
        console.log('On before upload');
        e.returnValue = false;
    });
    mainWindow.once('close', (e) => {
        console.log('MainWindow - On close event');
        e.preventDefault();
        mainWindow.hide();

        const notification = {
            title : 'CallApp is still running',
            body : 'CallApp will continue to run and receive call notifications in the background. If you wish to open or quit the app, please right click on the CallApp icon in the tray area.'
        };
        const myNotification = new Notification(notification);
        myNotification.show();

        mainWindow.setSkipTaskbar(true);
        return console.log('APP_WINDOW_CLOSE');
    });
    mainWindow.once('closed', (e) => {
        console.log('MainWindow_Closed');
        mainWindow = null;
    });
    mainWindow.once('focus', (e) => {
        mainWindow.setSkipTaskbar(false);
    });
    electron.powerMonitor.on('lock-screen', () => {
        console.log('The system is getting locked');
        lockedWindow = true;
    });
    electron.powerMonitor.on('unlock-screen', () => {
        console.log('The system is getting unlocked');
        lockedWindow = false;
    });
    console.log('APP_LAUNCHED');
    
    setTimeout(load, 2000);
}

function createTray(){
    const iconPath = `${__dirname}/images/icon16.png`;
    const trayIcon = electron.nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon);
    var cntxtMenu = Menu.buildFromTemplate([{
        label: 'Open',
        //accelerator: 'Ctrl+O',
        click: function() {
            console.log('APP_OPEN_FROM_TRAY');
            if(mainWindow && !mainWindow.isDestroyed()){
                mainWindow.show();
                return mainWindow.setSkipTaskbar(false);
            }
        }
    },{
        label: 'Quit',
        //accelerator: 'Command+Q',
        selector: 'terminate:',
        click: function(){
            console.log('APP_OPEN_FROM_TRAY');
            app.exit(0);
        }
    },{
        label: 'Restart',
        //accelerator: 'Command+R',
        selector: 'terminate:',
        click: function(){
            console.log('APP_RESTART_FROM_TRAY');
            setTimeout(() => {
                try {
                    app.exit(0);
                    app.relaunch();
                } catch (err) {
                    console.log('Error while restart the app from tray');
                    app.exit(0);
                    app.relaunch();
                }
            }, 10);
            app.exit(0);
        }
    }]);
    tray.setToolTip('CallApp');
    tray.on('double-click', () => {
        if(mainWindow && !mainWindow.isDestroyed()){
            mainWindow.show();
        }
    });
    tray.setContextMenu(cntxtMenu);
    return cntxtMenu;
}

function load(){
    contextMenu = createTray();
    ipcMain
        .on('incomingCall', (event, data) => {
            console.log('Receiving call from ' + data);
            mainWindow.flashFrame(true);
            mainWindow.show();
        });
    
    let loadUrlOptions = {};
    session.defaultSession.allowNTLMCredentialsForDomains("*");
    mainWindow.loadURL(envConfig.applicationUrl, loadUrlOptions);

    if(envConfig.enableDevTools){
        globalShortcut.register('CommandOrControl+Shift+-', () => {
            mainWindow.openDevTools({mode: 'detach'});
        });
    }
}

app.setAppUserModelId("ganga-callapp");

app.on('ready', createWindow, () => {
    protocol.registerHttpProtocol('atom', "...");
    session.defaultSession.webRequest.onHeadersreceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ['default-src \'none\'']
            }
        });
    });
});

app.on('activate', () => {
    console.log('On app activate');
    if (mainWindow === null) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

global.sendWindowMessage = function(type, data) {
    mainWindow.webContents.send(type, data);
}