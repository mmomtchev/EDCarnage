const { contextBridge, ipcRenderer } = require('electron')
const handlebars = require('handlebars');

const helpers = require('../handlebars/helpers');
for (const helper of Object.keys(helpers))
    handlebars.registerHelper(helper, helpers[helper]);
const hbsMain = require('../handlebars/main.hbs');

contextBridge.exposeInMainWorld('EDCarnage', {
    hbsMain,
    ipcRenderer
});
