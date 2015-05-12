# stubby

### AJAX Testing Stub Library

Stubby is a rich api on top of pretender to allow for browser integration testing and AJAX endpoint mocking. Stubby also is a validator that tends to be more strict and explicit than forgiving. All URL parameters are treated as significant along with request parameters. HTTP Headers can be sent and optionally matched, but are not a built in matcher. Things that are matched include: `url parameters`, `url` and a response `code` and `body` must be included in all mock responses. Since the library is primarily built for testing JSON apis, stubby automatically decodes JSON requests and responses for you when sending a JSON responses and when a JSON accept content-type header is sent.

Since the API is rich and pluggable, stubby also allows for features to be added as plugins, such as JSON schema validation of requests and mocks, along with potential additional verifications for mocks preventing invalid mocks from being created.

A runtime example of using stubby is within Phantom.js testing an web application completely client-side without having to worry about the normal integration testing issues of setting up an isolated web environment on a test database. The benefits of this approach are primarily speed, or when you're working with a 3rd party API where the responses can't be automatically tested but can be mocked for easy client-side testing.

Additionally, helpers for using this library within the server context of phantom.js are included as well.

JSON Schema Validation docs can be found at (schema-validator docs)[docs/modules/schema-validator.md].

## Usage Examples:

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

