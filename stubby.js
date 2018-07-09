'use strict';

/**
* Depends on:
* - lodash [bower_components/lodash/lodash.js]
* - pretender [bower_components/pretender/pretender.js]
* - route-recognizer [bower_components/route-recognizer/dist/route-recognizer.js]
*/

var stubbyFactory = function(deps) {

  var Pretender = deps.pretender;
  var _ = deps.lodash;
  var queryString = deps.querystring;

  var Stubby = function() {
    this.stubs = {};
    this.pretender = new Pretender();

    this.events = {
      handlers: {},
      whitelist: ['setup', 'routesetup', 'request']
    };
  };

  Stubby.prototype.addModule = function(module) {
    if (!('register' in module)) {
      throw new Error('Valid modules need to have a .register method.');
    }
    module.register(this);
  };

  Stubby.prototype.emit = function(name) {
    if (!this.events.handlers[name]) { return; }
    var args = [].slice.call(arguments, 1);
    this.events.handlers[name].forEach(function(hook) {
      hook.apply(null, args);
    });
  };

  Stubby.prototype.on = function(name, handler, thisArg) {
    if (this.events.whitelist && !_.contains(this.events.whitelist, name)) {
      throw new Error('"' + name + '" is not a valid event handler');
    }
    this.events.handlers[name] = this.events.handlers[name] || [];
    if (thisArg) { handler = _.bind(handler, thisArg); }
    this.events.handlers[name].push(handler);
  };

  Stubby.prototype.passthrough = function(url) {
    this.pretender.get(url, Pretender.prototype.passthrough);
  };

  Stubby.prototype.findStubForRequest = function(req) {
    var stubs = this.stubs[req.url.split('?')[0]];
    var data = req.requestBody;
    var contentType = 'requestHeaders' in req && req.requestHeaders['Content-Type'] || '';
    if (contentType.match('application/json')) {
      data = JSON.parse(req.requestBody) || {};
    }

    if (!data) { data = {}; }

    return _.find(stubs, function(stub) {
      return this.stubMatchesRequest(stub, {
        data: data,
        method: req.method,
        requestHeaders: req.requestHeaders,
        queryParams: req.queryParams
      });
    }, this);
  };

  Stubby.prototype.stubMatchesRequest = function(stub, request) {
    var queryParams = request.queryParams;
    var method = request.method;

    this.emit('setup', stub, request);

    function isRegex(regex) {
      return regex && regex.match && regex.match(/^\/(.+)\/([gimy])?$/);
    }

    function testRegex(regex, test) {
      var match = isRegex(regex);
      return match && new RegExp(match[1], match[2]).test(test);
    }

    var methodsMatch = stub.request.method === method;

    var paramKeys = _.uniq(_.keys(stub.queryParams).concat(_.keys(queryParams)));
    var queryParamsMatch = paramKeys.every(function(key) {
      if (!(key in queryParams) || !(key in stub.queryParams)) { return false; }

      if (isRegex(stub.queryParams[key])) {
        return testRegex(stub.queryParams[key], queryParams[key]);
      } else {
        return stub.queryParams[key] === queryParams[key];
      }
    });

    var dataRequestMatch;

    var stubbedRequestData = stub.request.data;
    var requestData = request.data;

    // if no stub data was given, we just say that we matched
    if (!_.isEmpty(stubbedRequestData)) {
      // if the data is a string we assume it is JSON string
      if (typeof requestData === 'string') {
        try {
          var parsedRequestData = JSON.parse(requestData);
          dataRequestMatch = _.isEqual(stubbedRequestData, parsedRequestData);
        } catch (e) {
          dataRequestMatch = _.isEqual(stubbedRequestData, requestData);
        }
      } else {
        dataRequestMatch = _.isEqual(stubbedRequestData, requestData);
      }
    } else {
      dataRequestMatch = true;
    }

    var headersMatch = _.every(Object.keys(request.requestHeaders || {}), function(requestHeader) {
      var stubHeaderValue = stub.request.headers[requestHeader];
      var requestHeaderValue = request.requestHeaders[requestHeader];

      if (!_.includes(Object.keys(stub.request.headers), requestHeader)) {
        // if the request header wasn't in the stub, then just
        // ignore it and don't match against it
        return true;
      }

      if (isRegex(stubHeaderValue) && testRegex(stubHeaderValue, requestHeaderValue)) {
        return true;
      }

      return _.isEqual(stubHeaderValue, requestHeaderValue);
    });

    // Request data doesn't need to match if we're validating.
    if (stub.internal.skipDataMatch) { dataRequestMatch = true; }

    return methodsMatch && queryParamsMatch && dataRequestMatch && headersMatch;
  };

  Stubby.StubInternal = function(stubby, options) {
    var urlsplit = options.url.split('?');
    this.url = urlsplit[0];
    this.internal = {options: options.options || {}};
    this.queryParams = options.params || queryString.parse(urlsplit[1]);
    this.overrideStub = options.overrideStub || false;

    // convert all queryParam values to string
    // this means we don't support nested query params
    // we do this because later we compare to the query params in the body
    // where everything is kept as a string
    Object.keys(this.queryParams).forEach(function(p) {
      if (this.queryParams[p] == null) { this.queryParams[p] = ''; }
      this.queryParams[p] = this.queryParams[p].toString();
    }, this);

    this.requestCount = 0;

    this.setupRequest = function(requestOptions) {
      this.request = {
        headers: requestOptions.headers || {},
        data: requestOptions.data || {},
        method: requestOptions.method || 'GET'
      };
    };

    this.setupRequest(options);

    this.stubMatcher = function(stubbyInstance) {
      var self = this;
      return function(stubToMatch) {
        return stubbyInstance.stubMatchesRequest(self, {
          data: stubToMatch.request.data,
          queryParams: stubToMatch.queryParams,
          headers: stubToMatch.request.headers,
          method: stubToMatch.request.method
        });
      };
    };

    this.respondWith = function(status, data, responseOptions) {
      var url = this.url;

      if (typeof status !== 'number') {
        throw new Error('Status (' + JSON.stringify(status) + ') is invalid.');
      }

      this.response = {
        data: data || {},
        status: status
      };

      if (responseOptions && responseOptions.headers) {
        this.response.headers = responseOptions.headers;
      }

      if (!stubby.stubs[this.url]) { stubby.stubs[this.url] = []; }

      var matchingStub = _.find(stubby.stubs[this.url], this.stubMatcher(stubby));

      if (matchingStub) {
        if (this.overrideStub) {
          stubby.remove(options);
        } else {
          throw new Error('Matching stub found. Cannot override.');
        }
      }

      stubby.stubs[this.url].push(this);

      stubby.emit('routesetup', {}, this);

      stubby.pretender[this.request.method.toLowerCase()](this.url, function(req) {
        var matchedStub = stubby.findStubForRequest(req);
        if (matchedStub) {
          stubby.emit('request', req, matchedStub);
          ++matchedStub.requestCount;
          return stubby.response(matchedStub);
        } else {
          console.log('Could not match stub for request: ', req);

          var result = {
            method: req.method,
            url: url
          };

          _.each(
            {
              params: req.queryParams,
              data: req.requestBody,
              headers: req.requestHeaders
            },
            function appendToResult(value, key) {
              var res;
              try {
                res = JSON.parse(value);
              } catch (err) {
                res = value;
              } finally {
                if (!_.isEmpty(res)) {
                  _.set(result, key, res);
                }
              }
            }
          );

          throw new Error(
            'Stubby: no stub found for this request. ' +
            'You can stub this request with:\n\n' +
            'window.stubby.stub(' +
            JSON.stringify(result, null, 2) +
            ')\n' +
            '.respondWith(' + status + ', ' + JSON.stringify(data, null, 2) + ');'
          );
        }
      });

      return this;
    };
  };

  Stubby.prototype.stub = function(options) {
    return new Stubby.StubInternal(this, options);
  };

  Stubby.prototype.remove = function(options) {
    var stubToMatch = new Stubby.StubInternal(this, options);
    var stubsArray = this.stubs[stubToMatch.url];
    if (!stubsArray) {
      throw new Error('No stubs exist for this base url');
    }
    var stubsArrayOriginalLength = stubsArray.length;
    _.remove(stubsArray, stubToMatch.stubMatcher(this));
    if (stubsArrayOriginalLength === stubsArray.length) {
      throw new Error('Couldn\'t find the specified stub to remove');
    }
  };

  Stubby.prototype.verifyNoOutstandingRequest = function() {
    var outstandingStubs = _.chain(this.stubs)
      .values()
      .flatten()
      .filter(function(stub) { return stub.requestCount === 0; })
      .map(function(stub) {
        return stub.request.method + ' ' + stub.url + '/' +
          queryString.stringify(stub.queryParams);
      })
      .value();

    if (outstandingStubs.length !== 0) {
      throw new Error('Stub(s) were not called: ' + outstandingStubs.join(', '));
    }
  };

  Stubby.prototype.response = function(stub) {
    var headers = stub.response.headers || {};

    if (!('Content-Type' in headers)) { headers['Content-Type'] = 'application/json'; }

    return [stub.response.status, headers, JSON.stringify(stub.response.data)];
  };

  Stubby.prototype.passthrough = function(url) {
    this.pretender.get(url, Pretender.prototype.passthrough);
  };


  return Stubby;
};

if (typeof module === 'undefined') {
  var dependencies = {
    lodash: window._,
    pretender: window.Pretender,
    querystring: window.queryString
  };
  Object.keys(dependencies).forEach(function(dependencyName) {
    if (typeof dependencies[dependencyName] === 'undefined') {
      throw new Error(['[stubby] Missing `', dependencyName, '` library.'].join(''));
    }
  });
  window.Stubby = stubbyFactory(dependencies);
} else {
  module.exports = stubbyFactory;
}
