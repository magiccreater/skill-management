var convict = require('convict');
var fs = require('fs');

var config = convict({
    env: {
        doc: 'The applicaton environment.',
        format: ['production', 'development', 'test'],
        default: 'development',
        env: 'NODE_ENV',
        arg: 'env'
    },
    cluster: {
        workerCount: {
            doc: 'No of worker Thread',
            format: Number,
            default: 2
        }
    },
    server: {
        port: {
            doc: 'HTTP port to bind',
            format: 'port',
            default: 3001,
            env: 'PORT'
        },
        enableHttpLogging: {
            doc: 'Enable HTTP Logging',
            format: Boolean,
            default: true
        },
        enableCompression: {
            doc: 'Enable HTTP compression',
            format: Boolean,
            default: true
        },
        enableStatic: {
            doc: 'Enable Express static server',
            format: Boolean,
            default: false
        },
        staticDirectory:{
            doc:'',
            format:String,
            default:'/talentaleApp'
        },
        security: {
            enableXframe: {
                doc: 'Enable Iframe protection',
                format: Boolean,
                default: true
            },
            enableHidePoweredBy: {
                doc: 'Hide X powered by Header',
                format: Boolean,
                default: true
            },
            enableNoCaching: {
                doc: 'Enable No caching',
                format: Boolean,
                default: false
            },
            enableCSP: {
                doc: 'Enable CSP policy',
                format: Boolean,
                default: false
            },
            enableHSTS: {
                doc: 'Enable HSTS',
                format: Boolean,
                default: false
            },
            enableXssFilter: {
                doc: 'Enable XSS filter protection',
                format: Boolean,
                default: true
            },
            enableForceContentType: {
                doc: 'Enable force content type',
                format: Boolean,
                default: false
            },
            enableCORS: {
                doc: 'Enable CORS',
                format: Boolean,
                default: true
            }
        },
        CORS: {
            allowedHosts: {
                doc: 'Allowed Host for CORS',
                format: Array,
                default: []
            },
            allowedMethods: {
                doc: 'Allowed HTTP Methods for CORS',
                format: String,
                default: 'GET,POST,OPTIONS'
            },
            allowedHeaders: {
                doc: 'Allowed HTTP Headers for CORS',
                format: String,
                default: 'accept, x-xsrf-token,content-type, x-location, certificate'
            },
            exposedHeaders: {
                doc: 'Exposed HTTP Headers for CORS',
                format: String,
                default: 'XSRF-TOKEN'
            }
        },
        session: {
            sidname: {
                doc: 'Name of a session',
                format: String,
                default: 'connect.sid'
            },
            path: {
                doc: 'Path of a session',
                format: String,
                default: '/'
            },
            httpOnly: {
                doc: 'httpOnly cookie',
                format: Boolean,
                default: true
            },
            secure: { // should be set to true when using https
                doc: 'Http security of a session',
                format: Boolean,
                default: false
            },
            maxAge: {
                doc: 'Maximum age of a session',
                format: Number,
                default: 30 * 60 * 1000 // one hour
            },
            proxy: { // should set to true when using https and reverse proxy
                // like HAproxy
                doc: 'Http proxy',
                format: Boolean,
                default: false
            },
            rolling: { // should set to true when want to have sliding window
                // session
                doc: 'For sliding window of a session',
                format: Boolean,
                default: true
            }
        },
        bodyParser: {
            limit: {
                doc: 'maximum request body size',
                format: String,
                default: '100kb'
            }
        }
    },
    logger: {
        httpLogFormat: {
            doc: 'HTTP log format',
            format: String,
            default: ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms ":referrer" ":user-agent"'
        },
        httpLogFileName: {
            doc: 'HTTP log File name',
            format: String,
            default: 'http.log'
        },
        logFileName: {
            doc: 'Log File name',
            format: String,
            default: 'logs.log'
        },
        exceptionLogFileName: {
            doc: 'Exception log File name',
            format: String,
            default: 'exceptions.log'
        },
        logFileSize: {
            doc: 'logs File Max File size',
            format: Number,
            default: 5242880
        }
    },
    mongodb: {
        url:{
            doc:'',
            format:String,
            default:'mongodb://localhost/'
        },
        defaultCollection:{
            doc:'',
            format:String,
            default:'talentaleDB'
        },
        sessionCollection:{
            doc:'',
            format:String,
            default:'session'
        }
    },
    mailer: {
        host: {
            doc: 'Node mailer Host.',
            format: String,
            default: 'Gmail',
        },
        email: {
            doc: 'Sender Mail Address.',
            format: String,
            default: 'talentalemail@gmail.com',
        },
        password: {
            doc: 'Sender password.',
            format: String,
            default: 'talentale@2016',
        },
        port: {
            doc: 'Port number. (25 - default, 465 - for secure ssl connection, 587 - for secure tls connection)',
            format: Number,
            default: 465,
        },
        registration:{
            subject:{
                doc:'',
                format:String,
                default:'Registration Confirmation'
            },
            text:{
                doc:'',
                format:String,
                default:'Registration has been successfully completed.'
            }
        }     
    },
	strategies: {
        linkedin: {
            api_key: {
                doc: '',
                format: String,
                default: '75a4uxlo20lwp5'
            },
            secret: {
                doc: '',
                format: String,
                default: 'Vdffr7FTQ53y4Bxr'
            },
            accessTokenApi: {
                doc: '',
                format: String,
                default: 'https://www.linkedin.com/uas/oauth2/accessToken'
            },
            dataApi: {
            	  doc: '',
                  format: String,
                  default: 'https://api.linkedin.com/v1/people/~:(id,public-profile-url,first-name,last-name,email-address,location,positions)?format=json&oauth2_access_token='
            },
            dataFields: {
          	    doc: '',
                format: String,
                default: 'id,first-name,last-name'
            },
            csrfToken: {
            	 doc: '',
                 format: String,
                 default: 'https://www.linkedin.com/uas/oauth2/authorization'
            },
            redirect_uri: {
                doc: '',
                format: String,
                default: 'http://localhost:3000'
            }
        }
    },
    indeedApi:{
        url: {
            doc: '',
            format: String,
            default: 'http://api.indeed.com/ads/apisearch?'
        },
        publisherId: {
            doc: '',
            format: String,
            default: '443716833092306'
        },
        version: {
            doc: '',
            format: String,
            default: '2'
        }
    },
    basePath : {
    	doc: 'Api base path',
        format: String,
        default: 'http://localhost:3000/#/RegisterationConfirmation?reqId='
    }
});

config.loadFile('./config-' + config.get('env') + '.json');

config.set('logger.httpLogFileName', config.get('logger.path') + config.get('logger.httpLogFileName'));
config.set('logger.logFileName', config.get('logger.path') + config.get('logger.logFileName'));
config.set('logger.exceptionLogFileName', config.get('logger.path') + config.get('logger.exceptionLogFileName'));

// validate
config.validate();

module.exports = config;