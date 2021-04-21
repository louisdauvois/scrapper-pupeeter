const browserObject = require('./browser');
const scraperController = require('./pageController');


var fs = require("fs");


var cluster = require('cluster');
if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });
}

if (cluster.isWorker) {
      let browserInstance = browserObject.startBrowser();
      scraperController(browserInstance)
}

