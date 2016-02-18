var path = require('path');
var compression = require('compression');
var helmet = require('helmet');
var config = require('../config');
var logger = require('../utils/logger');

exports = module.exports = function (app, express, root) {
    //Enable http logging
    if (config.get('server.enableHttpLogging'))
        app.use(logger.startHttpLogger());
    
    //Enable compression
    if (config.get('server.enableCompression'))
        app.use(compression());
    
    // Prevent opening page in frame or iframe to protect from clickjacking
    if (config.get('server.security.enableXframe'))
        app.use(helmet.xframe());
    
    //Remove X-Powered-By
    if (config.get('server.security.enableHidePoweredBy'))
        app.use(helmet.hidePoweredBy());
    
    //Prevents browser from caching and storing page
    if (config.get('server.security.enableNoCaching'))
        app.use(helmet.cacheControl());
    
    // Allow loading resources only from white-listed domains
    if (config.get('server.security.enableCSP'))
        app.use(helmet.csp());
    
    // Allow communication only on HTTPS
    if (config.get('server.security.enableHSTS'))
        app.use(helmet.hsts());
    
    // Enable XSS filter in IE (On by default)
    if (config.get('server.security.enableXssFilter'))
        app.use(helmet.xssFilter());
    
    // Forces browser to only use the Content-Type set in the response header instead of sniffing or guessing it
    if (config.get('server.security.enableForceContentType'))
        app.use(helmet.nosniff());
    
    
    //Eanble CORS support
    if (config.get('server.security.enableCORS'))
        require('./CORS')(app);
    
    //Enable paths that we want to have it served statically
    if (config.get('server.enableStatic'))
        app.use(express.static(path.join(root, config.get('server.static.directory')), config.get('server.static.options')));
};
