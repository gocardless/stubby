const stubbyFactory = require('./stubby');
const StubbyChaosMonkey = require('./modules/chaos-monkey');
const _ = require('lodash');
const URL = require('url-parse');
const queryString = require('query-string');

require('./spec/spec-helper');

global.StubbySchemaValidator = require('./modules/schema-validator');

// We need to mock Object.prototype.toString so that pretender
// thinks its in a test enviorment
// Start mock
const toString = Object.prototype.toString;
Object.prototype.toString = jest.fn().mockImplementation(() => '[object Object]');
const originalDocumentCreateElement = document.createElement;

document.createElement = jest.fn().mockImplementation((tagName) => {
  // WHY? This is here because pretender utilises an anchor tag to parse their urls.
  if (tagName === 'a') {
    return {
      set href(path) {
        const url = new URL(path);
        this.pathname = url.pathname;
        this.search = url.query;
        this.hash = url.hash;
        this.fullpath = path;
      }
    }
  }
  return originalDocumentCreateElement(tagName);
})

const Pretender = require('pretender');

// End mock
Object.prototype.toString = toString;

global.Stubby = stubbyFactory({
  lodash: _,
  pretender: Pretender,
  querystring: queryString
});

global.StubbyChaosMonkey = StubbyChaosMonkey;
