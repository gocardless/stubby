'use strict';

describe('stubbing a URL', function() {
  var stubby;

  beforeEach(function() {
    stubby = new window.Stubby();
  });

  it('lets a URL be stubbed', function(done) {
    stubby.stub({
      url: '/foo'
    }).respondWith(200, { foo: 2 });

    window.get('/foo', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ foo: 2 });
      expect(xhr.status).toEqual(200);
      done();
    });
  });

  it('differentiates on query params', function(done) {
    stubby.stub({
      url: '/foo?a=1'
    }).respondWith(200, { a: 1});

    stubby.stub({
      url: '/foo?b=2',
      params: { b: 1 }
    }).respondWith(200, { b: 1 });

    window.get('/foo?a=1', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });

  it('doesn\'t match a stub with query params against a URL without', function() {
    stubby.stub({
      url: '/foo?a=1'
    }).respondWith(200);

    expect(function() {
      window.get('/foo', function() {});
    }).toThrowError();
  });

  it('works with query params in both orders', function(done) {
    stubby.stub({
      url: '/foo?a=1&b=2'
    }).respondWith(200, { a: 1, b: 2 });

    stubby.stub({
      url: '/foo?b=3'
    }).respondWith(200, { b: 3 });

    window.get('/foo?b=2&a=1', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1, b: 2 });
      done();
    });
  });

  it('lets you define query params', function(done) {
    stubby.stub({
      url: '/foo',
      params: { a: 1 }
    }).respondWith(200, { a: 1 });

    window.get('/foo?a=1', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });

  it('lets you match on headers', function(done) {
    stubby.stub({
      url: '/foo',
      headers: {
        foo: 'bar'
      }
    }).respondWith(200, { a: 1 });

    window.get({
      url: '/foo',
      headers: {
        foo: 'bar'
      }
    }, function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });

  it('lets you match on regex headers', function(done) {
    stubby.stub({
      url: '/foo',
      headers: { a: '/\\w|\\d/g' }
    }).respondWith(200, { a: 1 });

    window.get({
      url: '/foo',
      headers: {
        a: 1
      }
    }, function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });

  it('ignores headers in the request not present in the stub', function(done) {
    stubby.stub({
      url: '/foo',
      headers: { a: 1 }
    }).respondWith(200, { a: 1 });

    window.get({
      url: '/foo',
      headers: {
        a: 1,
        b: 2
      }
    }, function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });

  it('matches on regex query param values', function(done) {
    stubby.stub({
      url: '/foo',
      params: { a: '/\\w|\\d/g' }
    }).respondWith(200, { a: 1 });

    window.get('/foo?a=1', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });

  it('all params are matched', function(done) {
    stubby.stub({
      url: '/foo',
      params: { a: '/\\w|\\d/g', c: 1 }
    }).respondWith(200, { a: 1 });

    stubby.stub({
      url: '/foo',
      params: { b: 1, c: 1, a: '/\\w|\\d/g' }
    }).respondWith(200, { is: 'not matched' });

    window.get('/foo?a=1&c=1', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });
});

describe('allows plugins on setup and on request', function() {
  var stubby;
  beforeEach(function() {
    stubby = new window.Stubby();
  });

  describe('creates a new stub', function() {
    var spies;
    beforeEach(function() {
      stubby = new window.Stubby();
      spies = {
        setup: jasmine.createSpy('setup'),
        request: jasmine.createSpy('request'),
        routesetup: jasmine.createSpy('routesetup')
      };
      stubby.addModule({
        register: function(stubbyInstance) {
          stubbyInstance.on('setup', spies.setup);
          stubbyInstance.on('routesetup', spies.routesetup);
          stubbyInstance.on('request', spies.request);
        }
      });
      stubby.stub({
        url: '/test'
      }).respondWith(200, {});
    });

    it('makes one request when a stub is made for setup', function() {
      expect(spies.routesetup).toHaveBeenCalled();
      expect(spies.setup).not.toHaveBeenCalled();
      expect(spies.request).not.toHaveBeenCalled();
    });
    it('makes one request to setup and one request to request when set', function(done) {
      expect(spies.routesetup).toHaveBeenCalled();
      window.get('/test', function() {
        expect(spies.setup).toHaveBeenCalled();
        expect(spies.request).toHaveBeenCalled();
        done();
      });
    });
  });
});

describe('verifiying that stubs have been used', function() {
  var stubby;
  beforeEach(function() {
    stubby = new window.Stubby();
  });

  it('errors if a stub is not used', function() {
    stubby.stub({ url: '/foo' }).respondWith(200, {});

    expect(function() {
      stubby.verifyNoOutstandingRequest();
    }).toThrowError();
  });

  it('doesn\'t error when all stubs are satisfied', function(done) {
    stubby.stub({ url: '/foo' }).respondWith(200, {});
    stubby.stub({ url: '/bar' }).respondWith(200, {});

    window.get('/foo', function() {
      window.get('/bar', function() {
        try {
          expect(function() {
            stubby.verifyNoOutstandingRequest();
          }).not.toThrow();
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it('errors if multiple stubs aren\'t used', function() {
    stubby.stub({ url: '/foo' }).respondWith(200, {});
    stubby.stub({ url: '/foo', method: 'POST' }).respondWith(200, {});

    expect(function() {
      stubby.verifyNoOutstandingRequest();
    }).toThrowError('Stub(s) were not called: GET /foo/, POST /foo/');
  });

  it('can deal with multiple stubs', function(done) {
    stubby.stub({ url: '/foo' }).respondWith(200, {});
    stubby.stub({ url: '/bar' }).respondWith(200, {});

    window.get('/foo', function() {
      expect(function() {
        stubby.verifyNoOutstandingRequest();
      }).toThrowError();

      done();
    });
  });

  it('can deal with query params', function(done) {
    stubby.stub({ url: '/foo', params: { a: 1 } }).respondWith(200, {});
    stubby.stub({ url: '/foo', params: { b: 1 } }).respondWith(200, {});

    window.get('/foo?a=1', function() {
      expect(function() {
        stubby.verifyNoOutstandingRequest();
      }).toThrowError();

      done();
    });
  });
});

describe('stubbing a POST url', function() {
  var stubby;
  beforeEach(function() {
    stubby = new window.Stubby();
  });

  it('stubs a post URL', function(done) {
    stubby.stub({
      url: '/foo',
      method: 'POST'
    }).respondWith(200, { a: 1 });

    window.post('/foo', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });

  it('can match on POST data', function(done) {
    stubby.stub({
      url: '/foo',
      data: { b: 2 },
      method: 'POST'
    }).respondWith(200, { a: 1 });

    window.post({ url: '/foo', data: { b: 2 } }, function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
      done();
    });
  });

  it('can differentiate between POST and PUT data', function(done) {
    stubby.stub({
      url: '/foobar',
      method: 'GET'
    }).respondWith(200, { method: 'get' });

    stubby.stub({
      url: '/foobar',
      method: 'PUT'
    }).respondWith(200, { method: 'put' });

    window.put('/foobar', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ method: 'put' });
      done();
    });
  });

  it('can differentiate between a GET and PUT', function(done) {
    stubby.stub({
      url: '/foobar',
      method: 'PUT'
    }).respondWith(200, { method: 'put' });
    stubby.stub({
      url: '/foobar',
      method: 'GET'
    }).respondWith(200, { method: 'get' });

    window.get('/foobar', function(xhr) {
      expect(JSON.parse(xhr.responseText)).toEqual({ method: 'get' });
      done();
    });
  });
});

describe('stubbing the same URL twice', function() {
  var stubby;
  beforeEach(function() {
    stubby = new window.Stubby();
  });

  it('fails when a matching stub is redeclared', function() {
    stubby.stub({ url: '/foo' }).respondWith(200, { first: true });

    expect(function() {
      stubby.stub({ url: '/foo' }).respondWith(200, { first: false });
    }).toThrow();
  });
});
