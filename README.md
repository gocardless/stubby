# stubby

### AJAX Testing Stub Library

Stubby is a rich API on top of pretender to allow for browser integration testing and AJAX endpoint mocking. Stubby also is a validator that tends to be more strict and explicit than forgiving. All URL parameters are treated as significant along with request parameters. HTTP Headers can be sent and optionally matched, but are not a built in matcher. Things that are matched include: `url parameters`, `url` and a response `code` and `body` must be included in all mock responses. Since the library is primarily built for testing JSON APIs, stubby automatically decodes JSON requests and responses for you when sending a JSON responses and when a JSON accept content-type header is sent.

Since the API is rich and pluggable, stubby also allows for features to be added as plugins, such as JSON schema validation of requests and mocks, along with potential additional verifications for mocks preventing invalid mocks from being created.

A runtime example of using stubby is within Phantom.js testing an web application completely client-side without having to worry about the normal integration testing issues of setting up an isolated web environment on a test database. The benefits of this approach are primarily speed, or when you're working with a 3rd party API where the responses can't be automatically tested but can be mocked for easy client-side testing.

Additionally, helpers for using this library within the server context of phantom.js are included as well.

JSON Schema Validation docs can be found at (schema-validator docs)[docs/modules/schema-validator.md].

## Usage Examples:

See the demo in `example/demo.html` by running `npm run demo`.

Server code:
```js
stubby.stub({
  url: '/foo',
  params: { b: 1 },
}).respondWith(200, { b: 1});
```

This code stubs out a server at that responds to `GET /foo?b=1` with `{b:1}`

Client-side code:
```js
$.get('/foo?b=1', function(response) {
	if (response.body['b'] === 1) {
		alert('ok :)');
	} else {
		alert('fail');
	}
})
```

### Modules:

#### How to setup a module:

The included modules in the `modules/` folder are optional, officially supported parts of this project to supplement the functionality of stubby but also to keep the core lightweight. Eventually, these may be seperated into their own modules. Modules are registered by calling:

```js
var addonModule = new RandomAddonModule();
var stubby = new stubby.Stubby();
stubby.addModule(addonModule);
```

#### Modules API:

A module needs to expose an javascript object or function with a prototype or method called register.
The register method is passed an object that listeners within that class can be registered with:
```js
function DemoModule(api_version){
  // Method to register the module as a handler.
  this.register = function(handler) {
    // handler.on(event, callback(request, stub), callback context);
    // Handler called when the route is setup calling `.stub`.
    handler.on('setup', function(req, stub) { }, this);
    // Handler called when a route is being matched (allows for changes or checks before matching routes).
    handler.on('routesetup', function(req, stub) { }, this);
    // Handler is called when a request is about to be fuffiled by the passed in matching route
    handler.on('request', function(req, stub) { this.inject_api_version(stub); }, this);
  };
  this.inject_api_version = function(stub) {
    stub.response.headers['api-version'] = api_version;
  };
}
```

#### Included Modules:

- **schema-validator**:

While stubby doesn't support json schema validation out of the box, the included schema-validator module validates stubs across a JSON hyperschema. The module is included within the modules folder with a test in spec/modules validating all stubbed requests, checking request bodies against the schema instead of manually coding them into the matcher.  
This verification of proper stubbing also prevents errors in mocking by matching across a canonical schema.

To setup the validator, add a schema by calling `var module = new window.stubbySchemaValidator(); validator.addSchema('/', schemaJSON);`. The module is bundled in `dist/stubby-schema-validator-bundle.js`, which can be included exposing the module to the global `window` object.

- **chaos-monkey**:

A demo module that responds with random http status codes instead of the ones specified with the stub with the option `{chaos: true}` is set in the stub.
It also verifies that the response http status is equal to 42 in order to allow for chaos.
This module demonstrates how to write a simple module to integrate within the stubby framework, for usage examples, see the definitions file and corresponding spec.

### Development:

In order to recompile the browserify modules, run `./script/build` to rebuild. To force a build, run `./script/build -f`.

If you choose to not user browserify modules, include all dependencies and the `stubby.js` and the appropiate modules `modules/MODULE_NAME.js`, it's recommended to use bower to download client-side dependencies.


### Limitations:

Since stubby was created for JSON APIs, it might be better to use the raw pretender API instead of stubby for other types of data.

Additionally, pretender doesn't allow for mocking JSONP or cross-origin ajax requests, so stubby only works for the same hostname/protocol/port ajax requests.

