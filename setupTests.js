const stubbyFactory = require('./stubby');
const StubbyChaosMonkey = require('./modules/chaos-monkey');
const _ = require('lodash');
const queryString = require('query-string');

global.StubbySchemaValidator = require('./modules/schema-validator');

// We need to mock Object.prototype.toString so that pretender
// thinks its in a test enviorment
// Start mock
const toString = Object.prototype.toString;
Object.prototype.toString = jest.fn().mockImplementation(() => '[object Object]');

const Pretender = require('pretender');

// End mock
Object.prototype.toString = toString;

['get', 'post', 'put', 'delete'].forEach(method => {
  global[method] = function(url, cb) {
    var options = {};
    if (typeof url === 'string') {
      options.url = url;
    } else {
      options = url;
    }

    if (!options.headers) {
      options.headers = {};
    }
    if (options.async === undefined) {
      options.async = true;
    }

    var xhr = new XMLHttpRequest();

    xhr.open(method.toUpperCase(), options.url, !!options.async);

    xhr.setRequestHeader('Content-Type', 'application/json');
    Object.keys(options.headers).forEach(function(header) {
      xhr.setRequestHeader(header, options.headers[header]);
    });

    var postBody = options.data ? JSON.stringify(options.data) : null;

    if (typeof cb === 'function') {
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          cb(xhr);
        }
      };
    }

    xhr.send(postBody);

    return xhr;
  };
});

global.Stubby = stubbyFactory({
  lodash: _,
  pretender: Pretender,
  querystring: queryString
});

global.StubbyChaosMonkey = StubbyChaosMonkey;
