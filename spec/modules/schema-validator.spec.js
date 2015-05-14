'use strict';

// [!] URLs are relative to the test runner html file, not this javascript file.
var schemaStr = window.get({url: './modules/test-schema.json', async: false}).responseText;
var schema = JSON.parse(schemaStr);

describe('uses modules to validate json schema', function() {
  var stubby;
  beforeEach(function() {
    stubby = new window.stubby.Stubby();

    var validator = new window.stubbySchemaValidator.SchemaValidator();
    validator.addSchema('/', schema);
    stubby.addModule(validator);
    return stubby;
  });

  describe('stubbing out validated api queries', function() {
    it('can send a valid customers list request', function(done) {
      stubby.stub({
        url: '/customers?limit=11',
        method: 'GET'
      }).respondWith(200, { meta: {}, customers: [] });

      window.get('/customers?limit=11', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ meta: {}, customers: [] });
        done();
      });
    });

    it('can match on GET data', function() {
      expect(function() {
        stubby.stub({
          url: '/payments?undefined=blah&fubar',
          method: 'GET'
        }).respondWith(200, { });
      }).toThrowError();
    });

    it('throws with an invalid request', function() {
      expect(function() {
        stubby.stub({
          url: '/payments?age=1,2,3,4',
          method: 'GET'
        }).respondWith(200, []);
      }).toThrowError();
    });

    it('throws an invalid post request', function() {
      stubby.stub({
        url: '/customers',
        method: 'POST'
      }).respondWith(422, {});

      expect(function() {
        window.post({
          url: '/customers', data: { invalid: 'data' }
        }, function() {
          // Should throw.
        });
      }).toThrowError();
    });
  });

  describe('stubbing out wildcard routed urls', function() {
    it('can validate a wildcard url', function(done) {
      stubby.stub({
        url: '/customers/234235',
        method: 'GET'
      }).respondWith(200, {name: 'hi'});

      window.get('/customers/234235', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({name: 'hi'});
        done();
      });
    });

    it('fails when not given a valid wildcard url', function() {
      expect(function() {
        stubby.stub({
          url: '/customers/asdf/asfd/a//a',
          method: 'GET'
        }).respondWith(200, {customers: []});
      }).toThrow();
    });

    it('fails when parameters are given to a parameterless request', function() {
      expect(function() {
        stubby.stub({
          url: '/customers/123?param=fail',
          method: 'GET'
        }).respondWith(200, {name: 'hi'});
      }).toThrowError();
    });
  });
});
