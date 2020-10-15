// Modules to control application life and create native browser window
const {app, BrowserWindow  , dialog , Menu, ipcMain} = require('electron');
var macaddress = require('macaddress');
var CVR = require('./script/cvr');
const path = require('path')
const log = require('electron-log');

/** 日志配置 */
// 日志文件等级，默认值：false
log.transports.file.level = 'debug';
// 日志控制台等级，默认值：false
log.transports.console.level = 'debug';
// 日志文件名，默认：main.log
log.transports.file.fileName = 'main.log';
// 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
// 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
log.transports.file.maxSize = 1048576;
// 日志文件位置：C:\Users\%USERPROFILE%\AppData\Roaming\Electron\logs
// 完整的日志路径：log.transports.file.file，优先级高于 appName、fileName
log.transports.file.file = path.join((__dirname.includes(".asar") ? process.resourcesPath : __dirname), 'log.log');
// 代替console
Object.assign(console, log.functions);

/** 自动更新log文件记录日志 */
const { autoUpdater } = require('electron-updater');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;
const debug = /--debug/.test(process.argv[2]);
function sendStatusToWindow(text) {
  mainWindow.webContents.send('message', text);
}
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    webPreferences: {
      nodeIntegration:true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  
  // Menu.setApplicationMenu(null)


    mainWindow.webContents.openDevTools()   
    mainWindow.loadFile('index.html');

  
  // mainWindow.maximize();
  
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 2000);
 
  
}).catch(error=>{
  // log.info('whenReady', JSON.stringify(error))
  console.error(error)
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (ev, info) => {
  sendStatusToWindow('Update available.'+ JSON.stringify(ev) + '--'+ JSON.stringify(info));
})
autoUpdater.on('update-not-available', (ev, info) => {
  sendStatusToWindow('Update not available.'+ JSON.stringify(ev) + '--'+ JSON.stringify(info));
})
autoUpdater.on('error', (ev, err) => {
  sendStatusToWindow('Error in auto-updater.'+ JSON.stringify(ev) + '--'+ JSON.stringify(err));
})
autoUpdater.on('download-progress', (ev, progressObj) => {
  sendStatusToWindow('Download progress...'+ JSON.stringify(ev));
})
autoUpdater.on('update-downloaded', (ev, info) => {
  sendStatusToWindow('Update downloaded; will install in 5 seconds'+ JSON.stringify(ev)+ '--'+ JSON.stringify(info));
});




ipcMain.handle('get-mac' , (event,data)=>{
  return macaddress.all(function (err, all) {   
    return JSON.stringify(all);
  });  
})






ipcMain.handle('get-idcard' , function(event,data){
  var iRetUSB = CVR.InitComm()
  console.log('iRetUSB', iRetUSB)
  if (iRetUSB != 1) {
    return "iRetUSB:"+iRetUSB;
  }
  var authenticate = CVR.Authenticate();
  console.log('authenticate', authenticate);
  if (authenticate != 1) {
    CVR.CloseComm()
    return "authenticate:"+authenticate;
  }

  var readContent = CVR.ReadContent()
  console.log('readContent',readContent)
  if (readContent != 1) {
    CVR.CloseComm()
    return "readContent:"+readContent;
  }
  var name =CVR.GetPeopleName().trim();
  var card = CVR.GetPeopleIDCode().trim();
  CVR.CloseComm()
  return {name,card};
})

