(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.stubbyChaosMonkey = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
  * Stubby Chaos Money Demo Module
  */

var StubbyChaosMonkey = function(deps) {

  /* min is inclusive, and max is exclusive */
  var getRandomArbitrary = function(min, max) {
      return Math.random() * (max - min) + min;
  }

  var getRandomHTTPStatus = function() {
    return getRandomArbitrary(100, 600);
  }

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

  this.onRequestSetup = function(request, stub) {
    // noop
  };

  this.onRequestExecute = function(request, stub) {
    if (stub.internal.options.chaos) {
      stub.response.status = getRandomHTTPStatus();
    }

  };
};


if (typeof module === 'undefined') {
  window.stubbyChaosMonkey = StubbyChaosMonkey;
} else {
  module.exports = StubbyChaosMonkey;
}

},{}]},{},[1])(1)
});