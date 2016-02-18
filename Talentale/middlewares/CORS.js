var config = require('../config');
exports = module.exports = function (app) {
    app.use(function (req, res, next) {
        if (config.get('server.CORS.allowedHosts').indexOf(req.headers.origin) !== -1) {
            res.header('Access-Control-Allow-Origin', req.headers.origin);
            res.header('Access-Control-Allow-Methods', config.get('server.CORS.allowedMethods'));
            res.header('Access-Control-Allow-Headers', config.get('server.CORS.allowedHeaders'));
            res.header('Access-Control-Allow-Credentials', true);
            next();
        }
        else {
            next();
        }
    });

    app.options('*', function (req, res) {
        res.status(200).end();
    });
};
