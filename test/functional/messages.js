var assert = require('assert')
  , config = require('../../config')
  , core = require('nitrogen-core')
  , fixtures = require('../fixtures')
  , log = require('winston')
  , request = require('request');

describe('messages endpoint', function() {
    it('should create and fetch a message', function(done) {
        request.post(config.messages_endpoint, {
            json: [{
                type: "_messageTest",
                body: {
                    reading: 5.1
                }
            }],
            headers: {
                Authorization: core.fixtures.models.accessTokens.user.toAuthHeader()
            }
        }, function(err, resp, body) {
            assert(!err);
            assert.equal(resp.statusCode, 200);

            body.messages.forEach(function(message) {
                assert.equal(message.body.reading, 5.1);
                assert(message.id);
            });

            done();
        });
    });
});
