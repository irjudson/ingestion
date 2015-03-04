var express = require('express')
  , app = express()
  , azureProviders = require('nitrogen-azure-providers')
  , core = require('nitrogen-core')
  , mongoose = require('mongoose')
  , server = require('http').createServer(app)
  , BearerStrategy = require('passport-http-bearer').Strategy
  , controllers = require('./controllers')
  , jwt = require('jsonwebtoken')
  , middleware = require('./middleware')
  , passport = require('passport')
  , utils = require('./utils');

core.config = require('./config');
core.log = require('winston');

core.log.remove(core.log.transports.Console);
core.log.add(core.log.transports.Console, { colorize: true, timestamp: true, level: 'info' });

app.use(express.logger(core.config.request_log_format));
app.use(express.compress());
app.use(express.bodyParser());

app.use(passport.initialize());
passport.use(new BearerStrategy({}, core.services.accessTokens.verify));

/*
passport.use(new BearerStrategy({}, function(token, done) {
    jwt.verify(token, config.access_token_signing_key, function(err, jwtToken) {
        if (err) return done(err);

        var principal = {
            id: jwtToken.iss,

            rawJwtToken: token,
            jwtToken: jwtToken
        };

        done(null, principal);
    });
}));
*/

app.use(middleware.crossOrigin);

app.enable('trust proxy');
app.disable('x-powered-by');

core.services.initialize(function (err) {
    if (err) return core.log.error("service failed to initialize: " + err);
    if (!core.services.principals.servicePrincipal) return core.log.error("Service principal not available after initialize.");

    server.listen(core.config.internal_port);

    app.get(core.config.ops_path + '/health', controllers.ops.health);
    app.post(core.config.messages_path, middleware.accessTokenAuth, controllers.messages.create);

    core.log.info("ingestion service has initialized and exposed external api at: " + core.config.api_endpoint + " on internal port: " + core.config.internal_port);

    module.exports.readyState = 1;
});