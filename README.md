# Stubby

### AJAX Testing Stub Library

Stubby is a rich API on top of [Pretender](https://github.com/trek/pretender) to allow for browser integration testing and AJAX endpoint mocking.

Stubby will also validate any stubs given to it. URL parameters are treated as significant along with request parameters. You can stub request HTTP headers, url parameters, the response code and body. Stubby will match incoming requests against the stubs that have been defined. The library is primarily built for testing JSON APIs; JSON requests and responses are decoded for you.

Stubby allows for features to be added as plugins, such as JSON schema validation of requests and mocks, along with potential additional verifications for mocks preventing invalid mocks from being created. The library comes with a module for validating stubs against a [JSON Schema](http://json-schema.org/).

## Installing Stubby

There are two ways you can use Stubby. The first is to simply add `dist/stubby-bundle.min.js` to your page. This is a Browserify compiled build that includes Stubby and all its dependencies.

If you'd rather deal with loading the dependencies yourself, you should include `stubby.js` along with its dependencies, which are:

- [RouteRecognizer](https://github.com/tildeio/route-recognizer)
- [Pretender](https://github.com/trek/pretender)
- [LoDash](https://github.com/lodash/lodash)

If you find any bugs or issues with Stubby, please feel free to raise an issue on this repository.

## Usage Examples:

See the demo in `example/demo.html` by running `npm run demo`.

Server code:

```js
stubby.stub({
  url: '/foo',
  params: { b: 1 },
}).respondWith(200, { b: 1});
```

This code stubs out a server at that responds to `GET /foo?b=1` with `{b:1}`.

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

### Stubbing a URL

Given an instance of stubby, you can call `stub` to stub a URL. This returns a `Stubby.StubInternal` object, that you can then call `respondWith` to define what Stubby should return:

```js
stubby.stub(options).respondWith(status, data, responseOptions)
```

The allowed options for a stub are:

- `url`: The URL of the request. Can include query params, Stubby will strip them for you and match against them too.
- `params`: An object of query parameters that should be matched against. If these are given, Stubby will use these over any query parameters in the URL.
- `headers`: a list of headers for Stubby to match against
- `data`: an object that should be present in the request data.
- `method`: the type of request. Defaults to `GET`.
- `overrideStub`: pass `true` here to state that this stub should override a matching stub if one exists. Defaults to `false`.

If you try to stub a request that is already stubbed, Stubby will error. You should first call `stubby.remove(options)` to remove the stub, and then restub it.

You should also [consult the Stubby specs](https://github.com/gocardless/stubby/blob/master/spec/stubby.spec.js) for many examples of how to stub requests.

`respondWith` takes three arguments:

- `status`: the status code that will be returned
- `data`: the body that will be returned as JSON
- `responseOptions`: an optional third argument that can set extra options. You can pass in a `headers` object here to set response headers.

An instance of `Stubby` also has the following methods that can be called:

##### `addModule(module)`

Adds a module to Stubby. See below for what these modules can do and how to write them.

##### `passthrough(url)`

By default Stubby blocks all requests, and will error if it gets a request that it can't match to a Stub. You can use this method to tell Stubby that it's fine to let requests matching this URL to hit the network. `stubby.passthrough('/foo')` would mean any `GET` request to `/foo` hits the network. It is currently only possible to passthrough on `GET` requests.

##### `verifyNoOutstandingRequests()`

When called, Stubby will check that every stub that it has been given has been called at least once, and error if it hasn't. This is useful to perform at the end of a test, to ensure all stubs were matched.

### Modules:

Stubby provides an API to add functionality through modules.

#### How to setup a module:

The included modules in the `modules/` folder are optional, officially supported parts of this project to supplement the functionality of Stubby but also to keep the core lightweight. Modules are registered by passing an instance of a module to `addModule`:

```js
var addonModule = new RandomAddonModule();
var stubby = new window.Stubby();
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

While Stubby doesn't support JSON Schema validation out of the box, the included schema-validator module validates stubs against a JSON hyperschema.

To setup the validator, add a schema like so:

```js
var stubby = new Stubby();
var validator = new window.StubbySchemaValidator();
validator.addSchema('/', schemaJSON);
stubby.addModule(validator);
```

- **chaos-monkey**:

A demo module that responds with random http status codes instead of the ones specified with the stub with the option `{chaos: true}` set in the stub.
It also verifies that the response http status is equal to 42 in order to allow for chaos.

This module demonstrates how to write a simple module to integrate within the stubby framework, for usage examples, see the definitions file and corresponding spec.

### Development:

When you clone the repo, you should ensure all dependencies are installed:

```
npm install
bower install
```

You can run `npm test` to run all the tests.

In order to recompile the browserify modules, run `./script/build` to rebuild. To force a build, run `./script/build -f`.

If you don't want to use the Browserify build, manually take `stubby.js`, its dependencies and any modules from the `modules` folder.

### Limitations:

Since stubby was created for JSON APIs, it might be better to use the raw pretender API instead of stubby for other types of data.

Additionally, Pretender doesn't allow for mocking JSONP or cross-origin ajax requests, so stubby only works for the same hostname/protocol/port ajax requests.


### Changelog

##### V0.0.6
- fix schema validation for non-object request payloads

##### V0.0.5
- print expected stub when no stubs where found

##### V0.0.4
- allow stubs to have response headers specified

##### V0.0.3
- allow stubs to override existing match with `overrideStub` option

##### V0.0.2
- stop skipping data matches in schema validation plugin
- if a request has data but the stub has none defined, it will now match that request to that stub

##### V0.0.1
- initial release
