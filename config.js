var azureProviders = require('nitrogen-azure-providers') 
  , log = require('winston')
  , Loggly = require('winston-loggly').Loggly
  , localProviders = require('nitrogen-local-providers')
  , redisProviders = require('nitrogen-redis-providers');

var config = null;

if (process.env.NODE_ENV === "production") {
    config = {
        internal_port: process.env.PORT || 8080,
        protocol: process.env.PROTOCOL || "https"
    };

    if (!process.env.ACCESS_TOKEN_SIGNING_KEY) {
        console.log('FATAL ERROR: you must provide an ACCESS_TOKEN_SIGNING_KEY as an environmental variable.');
        process.exit(0);
    }
} else if (process.env.NODE_ENV === "test") {
    config = {
        external_port: 3052,
        internal_port: 3052,
        protocol: process.env.PROTOCOL || "http",
        mongodb_connection_string: "mongodb://localhost/nitrogen_test",
        proxy_messages_endpoint: "http://localhost:3053/api/v1/messages",
        web_admin_uri: "http://localhost:9000"
    };
} else {
    config = {
        external_port: 3032,
        protocol: process.env.PROTOCOL || "http",
        mongodb_connection_string: "mongodb://localhost/nitrogen_dev",
        proxy_messages_endpoint: "http://localhost:3033/api/v1/messages",
        web_admin_uri: "http://localhost:9000"
    };
}

config.internal_port = config.internal_port || 3032;
config.external_port = config.external_port || 443;

config.access_token_signing_key = process.env.ACCESS_TOKEN_SIGNING_KEY || '12345678901234567890123456789012';

// Endpoint URI configuration

config.api_path = "/api/";
config.v1_api_path = config.api_path + "v1";

config.host = process.env.HOST_NAME || config.host || "localhost";

config.base_endpoint = config.protocol + "://" + config.host + ":" + config.external_port;
config.api_endpoint = config.base_endpoint + config.v1_api_path;

config.messages_path = config.v1_api_path + "/messages";
config.messages_endpoint = config.base_endpoint + config.messages_path;

config.ops_path = config.v1_api_path + "/ops";
config.ops_endpoint = config.base_endpoint + config.ops_path;

config.request_log_format = ':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ":referrer" ":user-agent"';

// You can use Loggly's log service by specifying these 4 environmental variables
if (process.env.LOGGLY_SUBDOMAIN && process.env.LOGGLY_INPUT_TOKEN &&
    process.env.LOGGLY_USERNAME && process.env.LOGGLY_PASSWORD) {

    log.add(Loggly, {
        "subdomain": process.env.LOGGLY_SUBDOMAIN,
        "inputToken": process.env.LOGGLY_INPUT_TOKEN,
        "auth": {
            "username": process.env.LOGGLY_USERNAME,
            "password": process.env.LOGGLY_PASSWORD
        }
    });
}

log.remove(log.transports.Console);
log.add(log.transports.Console, { colorize: true, timestamp: true, level: 'info' });

config.password_hash_iterations = 10000;
config.password_hash_length = 128;
config.salt_length_bytes = 64;
config.reset_password_length = 10;
config.minimum_password_length = 8;

config.auth_code_bytes = 16;
config.api_key_bytes = 16;
config.unassigned_apikey_pool_size = 10;

config.nonce_bytes = 32;
config.nonce_lifetime_seconds = 5 * 60;
config.public_key_bits = 2048;
config.public_key_exponent = 65537;

config.auth_code_lifetime_seconds = 60 * 60; // seconds (default: 1 hour)

config.device_secret_bytes = 128;

config.access_token_bytes = 32;
config.access_token_lifetime = 1; // days
config.access_token_signing_key = process.env.ACCESS_TOKEN_SIGNING_KEY || '12345678901234567890123456789012';

config.blob_cache_lifetime = 2592000; // seconds

// # of days a message should be remain in indexed storage by default
config.default_message_indexed_lifetime = 7; // days

config.permissions_for_cache_lifetime_minutes = 24 * 60; // minutes
config.principals_cache_lifetime_minutes = 24 * 60; // minutes

// In the azure storage provider, flatten the JSON body of messages to "columns"
config.flatten_messages = true;

// when the token gets within 10% (default) of config.access_token_lifetime,
// refresh it with a new token via the response header.
config.refresh_token_threshold = 0.1;

config.redis_servers = {
    "n2-redis-1": {
        "host": process.env.REDIS_HOST || "localhost",
        "port": process.env.REDIS_PORT || 6379,
        "password": process.env.REDIS_PASSWORD
    }
};

// By default the server uses a dev setup with local providers.
// For production deployments, you should replace these with their scaleable counterparts.

if (process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_KEY) {
    console.log('archive_provider: using Azure Table storage.');
    config.archive_providers = [ new azureProviders.AzureArchiveProvider(config, log) ];

    console.log('blob_provider: using Azure Blob storage.');
    config.blob_provider = new azureProviders.AzureBlobProvider(config, log);

    config.images_endpoint = config.blob_provider.base_endpoint + "/images";
} else {
    console.log('archive_provider: using local storage.');
    config.archive_providers = [ new localProviders.NullArchiveProvider(config, log) ];

    console.log('blob_provider: using local storage.');
    config.blob_storage_path = './storage';
    config.blob_provider = new localProviders.LocalBlobProvider(config, log);
}

console.log('cache_provider: Using redis cache provider.');
config.cache_provider = new redisProviders.RedisCacheProvider(config, log);

console.log('pubsub_provider: using redis pubsub.');
config.pubsub_provider = new redisProviders.RedisPubSubProvider(config, log);

console.log('email_provider: using null provider.');
config.email_provider = new localProviders.NullEmailProvider(config, log);

// You can use Loggly's log service by specifying these 4 environmental variables

// if you'd like additional indexes applied to messages at the database layer, you can specify them here.
config.message_indexes = [
];

// Claim codes are what users use to claim devices they have added to the service when IP matching fails.
// Longer claim codes are more secure but less convienent for users.
config.claim_code_length = 8;

// run the janitor every minute
config.janitor_interval = 60 * 1000; // ms

// Validate all message schemas to conform to all core and installed schemas.
config.validate_schemas = true;

// Email address that the service should use for administrative emails.
config.service_email_address = "admin@nitrogen.io";

// Migration configuration
config.migrations_relative_path = "/node_modules/nitrogen-core/migrations/";

// Validate all message schemas to conform to all core and installed schemas.
config.validate_schemas = true;

module.exports = config;
