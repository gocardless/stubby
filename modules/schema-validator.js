var StubbySchemaValidator = function() {
  this.validator = window.tv4.freshApi();
  this.schemaCount = 0;
  this.hyperschemaUrls = {};
  this.router = new window.RouteRecognizer();

  this.addSchema = function(uri, schema) {
    this.validator.addSchema(uri, schema);
    this.processNewHyperschema(schema);
    this.schemaCount += 1;
  };

  this.register = function(handler) {
    handler.on('setup', this.onRequestPrepare, this);
    handler.on('request', this.onRequestExecute, this);
    handler.on('routesetup', this.onRequestExecute, this);
  };

  this.onRequestPrepare = function(stub) {
    stub.internal.skipDataMatch = true;
  };

  this.onRequestExecute = function(request, stub) {
    if (stub.internal.options.validateSchema === false) return;
    return this.validate(request, stub);
  };

  this.parseQueryParamsSchema = function(params) {
    var paramsParsed = {};
    Object.keys(params).forEach(function(paramName) {
      var paramMatch = paramName.match(/^(.+)\[(.+)\]$/);
      var paramValue = params[paramName];
      if (paramMatch) {
        var matchPath = paramsParsed[paramMatch[1]];
        if (!matchPath) {
          matchPath = {};
        }
        matchPath[paramMatch[2]] = paramValue;
      } else {
        paramsParsed[paramName] = paramValue;
      }
    });
    return paramsParsed;
  };

  this.processNewHyperschema = function(rawSchema) {
    var self = this;
    Object.keys(rawSchema.definitions).forEach(function(descKey) {
      var val = rawSchema.definitions[descKey];
      val.links.forEach(function(linkSchema) {
        var urlToAdd = linkSchema.href;

        if (!self.hyperschemaUrls[urlToAdd]) {
          self.hyperschemaUrls[urlToAdd] = [];
        }

        self.hyperschemaUrls[urlToAdd].push(linkSchema);
        if (urlToAdd.match(/\{(.+)\}/)) {
          var paramsToMatch = decodeURIComponent(urlToAdd);
          var doReplaceParam = function(match, param) {
            linkSchema.baseUrlToAdd = param;
            return ':id';
          };
          urlToAdd = paramsToMatch.replace(/\{\(([^)]+)\)\}/, doReplaceParam);
        }
        self.router.add([{path: urlToAdd, handler: linkSchema.href}]);
      });
    });
  };

  this.getSchemaForRoute = function(stub, routeRef) {
    return _.find(this.hyperschemaUrls[routeRef], function(schema) {
      if (schema.method === stub.request.method) {
        return true;
      }
    });
  };

  this.validateRequestSchema = function(stub, request, schema) {
    var keyTraverse = _.find(Object.keys(request.data), function(key) {
      return (stub.url.indexOf(key) !== -1);
    });
    var requestData = request.data;
    if (keyTraverse) {
      requestData = requestData[keyTraverse];
    }

    var queryParams = this.parseQueryParamsSchema(stub.queryParams);
    var req = _.extend({}, queryParams, requestData);

    // An empty request is valid. (in the case of gocardless' schema)
    if (_.isEmpty(req)) return;

    var valResponse = this.validator.validateMultiple(req, schema, true, false);
    if (valResponse.errors.length > 0 || valResponse.missing.length > 0) {
      var stubInfo = stub.method + ' ' + stub.url + ' (' + JSON.stringify(req) + ')';
      throw new Error('Validation Failed for request: ' + stubInfo + ' ' + JSON.stringify(valResponse));
    }
  };

  this.validateEmptyQueryParams = function(stub) {
    if (!_.isEmpty(stub.request.data) && !_.isEmpty(stub.queryParams)) {
      throw new Error('Parameters provided to a parameterless route (' +
                      JSON.stringify([stub.request, stub.queryParams, stub.url]) + ')');
    }
  };

  this.validate = function(request, stub) {
    request.data = {};
    if (request.requestBody) {
      request.data = JSON.parse(request.requestBody) || {};
    }

    var routes = this.router.recognize(stub.url);
    if (!routes) {
      throw new Error('URL (' + stub.url + ') is undefined for the API');
    }
    var routeSchema = this.getSchemaForRoute(stub, routes[0].handler);
    if (routeSchema) {
      this.validateRequestSchema(stub, request, routeSchema.schema);
    } else {
      this.validateEmptyQueryParams(stub);
    }
  };
};

window.StubbySchemaValidator = StubbySchemaValidator;
