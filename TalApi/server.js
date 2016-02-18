// Import required external node modules
var http = require('http');
var express = require('express');
var util = require('util');
var config = require('./config');
var logger = require('./utils/logger');
var middlewares = require('./middlewares/index');
var routes = require('./routes/index');
var app = express();

app.set('trust proxy', true);

// set port.
app.set('port', config.get('server.port'));

// app.use(express.static(__dirname + '/talentaleApp'));

// setup middlewares
middlewares(app);

// setup routes
routes(app);

// start http server
http.createServer(app).listen(app.get('port'), function() {
	logger.info(util.format('telnet api server with pid:%s listening on port:%s', process.pid, app.get('port')));
	logger.info(util.format('Environment:%s', config.get('env')));
});

process.on('uncaughtException',function(err){
	console.error('Uncaught Exception:- %s', err.stack);
})