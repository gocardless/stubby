'use strict';

/**
  * Stubby Chaos Money Demo Module
  */

var StubbyChaosMonkey = function() {

  /* min is inclusive, and max is exclusive */
  var getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
  };

  var getRandomHTTPStatus = function() {
    return getRandomArbitrary(100, 600);
  };

  this.register = function(handler) {
    // Called before a request and response are matched
    handler.on('routesetup', this.onRouteSetup, this);

    // Called after a request and response are matched
    handler.on('request', this.onRequestExecute, this);
  };

  this.onRouteSetup = function(request, stub) {
    if (!stub.internal.options.chaos) {
      return;
    }
    if (stub.response.status !== 43) {
      throw new Error('Response status needs to be `43` for a valid chaos response');
    }
  };

  this.onRequestExecute = function(request, stub) {
    if (stub.internal.options.chaos) {
      stub.response.status = getRandomHTTPStatus();
    }
  };
};


if (typeof module === 'undefined') {
  window.StubbyChaosMonkey = StubbyChaosMonkey;
} else {
  module.exports = StubbyChaosMonkey;
}
