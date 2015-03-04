var config = require('../config')
  , core = require('nitrogen-core')
  , utils = require('../utils');

exports.create = function(req, res) {
    core.services.messages.createMany(req.user, req.body, function(err, messages) {
        if (err) return core.utils.handleError(res, err);
        res.send({ "messages": messages });
    });
};
