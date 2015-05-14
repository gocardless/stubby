# Stubby

### AJAX Testing Stub Library

Stubby is a rich API on top of [Pretender](https://github.com/trek/pretender) to allow for browser integration testing and AJAX endpoint mocking.

Stubby will also validate any stubs given to it. URL parameters are treated as significant along with request parameters. You can stub request HTTP headers, url parameters, the response code and body. Stubby will match incoming requests against the stubs that have been defined. The library is primarily built for testing JSON APIs; JSON requests and responses are decoded for you.

Stubby allows for features to be added as plugins, such as JSON schema validation of requests and mocks, along with potential additional verifications for mocks preventing invalid mocks from being created. The library comes with a module for validating stubs against a [JSON Schema](http://json-schema.org/).

The JSON Schema Validation docs can be found at (schema-validator docs)[docs/modules/schema-validator.md].

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
stubby.stub(options).respondWith(status, data)
```

The allowed options for a stub are:

- `url`: The URL of the request. Can include query params, Stubby will strip them for you and match against them too.
- `params`: An object of query parameters that should be matched against. If these are given, Stubby will use these over any query parameters in the URL.
- `headers`: a list of headers for Stubby to match against
- `data`: an object that should be present in the request data.
- `method`: the type of request. Defaults to `GET`.

If you try to stub a request that is already stubbed, Stubby will error. You should first call `stubby.remove(options)` to remove the stub, and then restub it.

You should also [consult the Stubby specs](https://github.com/gocardless/stubby/blob/master/spec/stubby.spec.js) for many examples of how to stub requests.

### Stubby API

You can create a new instance of Stubby by initialising it:

```js
var stubby = new stubby.Stubby();
```

The instance provides the following methods that can be called:

##### `addModule(module)`

Adds a module to Stubby. See below for what these modules can do and how to write them.

##### `passthrough(url)`

By default Stubby blocks all requests, and will error if it gets a request that it can't match to a Stub. You can use this method to tell Stubby that it's fine to let requests matching this URL to hit the network. `stubby.passthrough('/foo')` would mean any request to `/foo` hits the network.

##### `verifyNoOutstandingRequests()`

When called, Stubby will check that every stub that it has been given has been called at least once, and error if it hasn't. This is useful to perform at the end of a test, to ensure all stubs were matched.

### Modules:

Stubby provides an API to add functionality through modules.

#### How to setup a module:

The included modules in the `modules/` folder are optional, officially supported parts of this project to supplement the functionality of Stubby but also to keep the core lightweight. Modules are registered by passing an instance of a module to `addModule`:

```js
var addonModule = new RandomAddonModule();
var stubby = new stubby.Stubby();
stubby.addModule(addonModule);
```

#### schema-validator:

While Stubby doesn't support JSON Schema validation out of the box, the included schema-validator module validates stubs against a JSON hyperschema.

To setup the validator, add a schema like so:

```js
var stubby = new stubby.Stubby();
var validator = new window.stubbySchemaValidator();
validator.addSchema('/', schemaJSON);
stubby.addModule(validator);
```

#### chaos-monkey:

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

