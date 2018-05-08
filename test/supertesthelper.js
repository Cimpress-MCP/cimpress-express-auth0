var request = require("supertest-as-promised"),
  express = require("express");

module.exports = function (middleware, mwconfig, logger, cache) {
  var app = express(),
    config = mwconfig,
    me = this;

  // allow a user to modify the request/response before middleware
  app.use(function (req, res, next) {
    me.finishedRequest = req;
    me.finishedResponse = res;
    if (me.setup) {
      me.setup(req, res);
    }
    next();
  });

  if (!logger) {
    logger = require('./spylogger.js');
  }

  if (cache) {
    // invoke the thing for real
    middleware(app, config, logger, cache);
  } else {
    // invoke the thing for real
    middleware(app, config, logger);
  }

  // grab the request and response after the middleware
  app.use(function (req, res, next) {
    me.finishedResponse = res;
    me.finishedRequest = req;
    next();
  });

  app.get("/", function (req, res) {
    res.status(200).json({ name: "tobi" });
  });

  this.app = app;

  this.execute = function (path) {
    path = path || "/";
    return request(app).get(path);
  };

  this.post = function (path) {
    path = path || "/";
    return request(app).post(path);
  };
};
