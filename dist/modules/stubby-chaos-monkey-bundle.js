(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StubbyChaosMonkey = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
    // Request is empty on route setup.
    handler.on('setup', this.onRequestSetup, this);

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

  this.onRequestSetup = function() {
    // console.log('[requestsetup] ', request, stub);
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

},{}]},{},[1])(1)
});
