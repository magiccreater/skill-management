var convict = require('convict');
var config = convict({
    env: {
        doc: 'The applicaton environment.',
        format: ['production', 'development'],
        'default': 'development',
        env: 'NODE_ENV',
        arg: 'env'
    },
    cluster: {
        workerCount: {
            doc: 'No of worker Thread',
            format: Number,
            'default': 2
        }
    },
    server: {
        port: {
            doc: 'HTTP port to bind',
            format: 'port',
            'default': 3000,
            env: 'PORT'
        },
        enableHttpLogging: {
            doc: 'Enable HTTP Logging',
            format: Boolean,
            'default': true
        },
        enableCompression: {
            doc: 'Enable HTTP compression',
            format: Boolean,
            'default': true
        },
        enableStatic: {
            doc: 'Enable Express static server',
            format: Boolean,
            'default': true
        },
        static: {
            directory: {
                doc: 'Express static server content directory',
                format: String,
                'default': 'talentaleApp'
            },
            options: {
                doc: 'Express static server options',
                format: Object,
                'default': { maxAge: 0 }
            }
        },
        security: {
            enableXframe: {
                doc: 'Enable Iframe protection',
                format: Boolean,
                'default': true
            },
            enableHidePoweredBy: {
                doc: 'Hide X powered by Header',
                format: Boolean,
                'default': true
            },
            enableNoCaching: {
                doc: 'Enable No caching',
                format: Boolean,
                'default': false
            },
            enableCSP: {
                doc: 'Enable CSP policy',
                format: Boolean,
                'default': false
            },
            enableHSTS: {
                doc: 'Enable HSTS',
                format: Boolean,
                'default': false
            },
            enableXssFilter: {
                doc: 'Enable XSS filter protection',
                format: Boolean,
                'default': true
            },
            enableForceContentType: {
                doc: 'Enable force content type',
                format: Boolean,
                'default': false
            },
            enableCORS: {
                doc: 'Enable CORS',
                format: Boolean,
                'default': true
            }
        },
        CORS: {
            allowedHosts: {
                doc: 'Allowed Host for CORS',
                format: Array,
                'default': []
            },
            allowedMethods: {
                doc: 'Allowed HTTP Methods for CORS',
                format: String,
                'default': 'GET,OPTIONS'
            },
            allowedHeaders: {
                doc: 'Allowed HTTP Headers for CORS',
                format: String,
                'default': 'X-Requested-With,X-XSRF-TOKEN'
            },
        }
    },
    logger: {
        httpLogFormat: {
            doc: 'HTTP log format',
            format: String,
            'default': ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms ":referrer" ":user-agent"'
        },
        httpLogFileName: {
            doc: 'HTTP log File name',
            format: String,
            'default': './logs/http.log'
        },
        logFileName: {
            doc: 'Log File name',
            format: String,
            'default': './logs/logs.log'
        },
        exceptionLogFileName: {
            doc: 'Exception log File name',
            format: String,
            'default': './logs/exceptions.log'
        },
        logFileSize: {
            doc: 'logs File Max File size',
            format: 'int',
            'default': '5242880'
        }
    }
});

config.loadFile('./config-' + config.get('env') + '.json');
    // validate
config.validate();

module.exports = config;