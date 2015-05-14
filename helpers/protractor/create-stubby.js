/**
 * Stubby Protractor helper
 *
 * Usage example:
 *
 * // Example Protractor test with helper:
 * var createStubby = require('../helpers/create-stubby');
 * var userFixture = require('../fixtures/user.json');
 * describe('exampletest', function() {
 *   var stubby = crateStubby(browser);
 *
 *   beforeEach(function() {
 *     stubby.withModule('testModule', function(userFixture) {
 *       stubby.stub({
 *         url: '/users'
 *       }).respondWith(200, userFixture);
 *     }, userFixture);
 *   });
 *   
 *   afterEach(function() {
 *    stubby.verifyNoOutstandingRequests();
 *   });
 *
 *   it('tests stubby', function() {
 *    browser.get('/userlist.html');
 *    expect(element(by.binding('.users').getText()).toContain(userFixture[0].name);
 *   });
 * });
 *
 */

module.exports = function(browser) {

  var schemaURL = '/schema/schema-latest.json';
  var passthroughURLs = [
    '/asserts/svgs/:type/:icon.svg',
    '/assets/svgs/:icon.svg'
  ];

  beforeEach(function() {
    function createStubby() {
      return angular.module('createStubby', []).run([
        function() {

          var xmlHTTPReq = new XMLHttpRequest();
          xmlHTTPReq.open('GET', schemaURL, false);
          xmlHTTPReq.send();
          var schema = JSON.parse(xmlHTTPReq.responseText);

          var stubby = new window.stubby.Stubby();

          var validator = new window.stubbySchemaValidator();
          validator.addSchema('/', schema);
          stubby.addModule(validator);

          passthroughURLs.forEach(function(url) {
            stubby.passthrough(url);
          });

          window.stubbyInstance = stubby;
        }
      ]);
    }

    browser.addMockModule('createStubby', createStubby);
  });

  afterEach(function() {
    browser.clearMockModules();
  });

  return {
    verifyNoOutstandingRequests: function() {
      browser.executeScript(function(){
        window.stubbyInstance.verifyNoOutstandingRequest();
      });
    },
    passthrough: function(url) {
      browser.executeScript(function() {
        window.stubbyInstance.passthrough(url);
      });
    },
    stub: function(options) {
      return {
        respondWith: function(status, data) {
          browser.executeScript(function(options, status, data) {
            window.stubbyInstance.stub(options).respondWith(status, data);
          }, options, status, data);
        }
      };
    },
    withModule: function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var modName = args.shift();
      var fn = args.shift();

      if (typeof modName !== 'string')
        throw new Error('Module Name (arg0) needs to be a string');
      if (typeof fn !== 'function')
        throw new Error('Function (arg1) needs to be a function');

      function angularModule(modName, fn, args) {
        return angular.module(modName, []).run([function() {
          eval('(' + fn.toString() + ').apply(window, ' + JSON.stringify(args) + ');');
        }]);
      }
      browser.addMockModule(modName.toString(), angularModule, modName, fn, args);
    }
  };
};
