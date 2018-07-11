const schema = require('./test-schema.json');

describe('uses modules to validate json schema', () => {
  var stubby;
  beforeEach(() => {
    const xhrMockClass = () => ({
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn()
    });

    global.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);

    stubby = new global.Stubby();

    var validator = new global.StubbySchemaValidator();
    validator.addSchema('/', schema);
    stubby.addModule(validator);
    return stubby;
  });

  describe('stubbing out validated api queries', () => {
    it('can send a valid customers list request', (done) => {
      stubby.stub({
        url: '/customers',
        queryParams: {
          limit: 11
        },
        method: 'GET'
      }).respondWith(200, { meta: {}, customers: [] });

      window.get('/customers?limit=11', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ meta: {}, customers: [] });
        done();
      });
    });

    it('can match on GET data', () => {
      expect(() => {
        stubby.stub({
          url: '/payments?undefined=blah&fubar',
          method: 'GET'
        }).respondWith(200, { });
      }).toThrowError();
    });

    it('throws with an invalid request', () => {
      expect(() => {
        stubby.stub({
          url: '/payments?age=1,2,3,4',
          method: 'GET'
        }).respondWith(200, []);
      }).toThrowError();
    });

    it('throws an invalid post request', () => {
      stubby.stub({
        url: '/customers',
        method: 'POST'
      }).respondWith(422, {});

      expect(() => {
        window.post({
          url: '/customers', data: { invalid: 'data' }
        }, () => {
          // Should throw.
        });
      }).toThrowError();
    });
  });

  describe('stubbing out wildcard routed urls', () => {
    it('can validate a wildcard url', (done) => {
      stubby.stub({
        url: '/customers/234235',
        method: 'GET'
      }).respondWith(200, {name: 'hi'});

      window.get('/customers/234235', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({name: 'hi'});
        done();
      });
    });

    it('fails when not given a valid wildcard url', () => {
      expect(() => {
        stubby.stub({
          url: '/customers/asdf/asfd/a//a',
          method: 'GET'
        }).respondWith(200, {customers: []});
      }).toThrow();
    });

    it('fails when parameters are given to a parameterless request', () => {
      expect(() => {
        stubby.stub({
          url: '/customers/123?param=fail',
          method: 'GET'
        }).respondWith(200, {name: 'hi'});
      }).toThrowError();
    });
  });
});
