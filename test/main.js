var assert = require('assert')
  , async = require('async')
  , core = require('nitrogen-core')
  , server = require('../server');

var removeAll = function (modelType, callback) {
    modelType.remove({}, callback);
};

before(function(done) {
    var modelTypes = Object.keys(core.models).map(function(key) {
        return core.models[key];
    });

    async.each(modelTypes, removeAll, function(err) {
        assert(!err);

        core.config.pubsub_provider.resetForTest(function(err) {
            assert(!err);

            core.fixtures.reset(function(err) {
                assert(!err);

                core.log.debug("FIXTURES: creation finished...");
                setInterval(function() {
                	if (server.readyState === 1) done();
                }, 500);
            });
        });
    });
});
