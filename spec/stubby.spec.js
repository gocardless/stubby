describe('create stubby', () => {
  var stubby;

  beforeEach(() => {
    stubby = new global.Stubby();
  });

  describe('stubbing a URL', () => {
    it('lets a URL be stubbed', (done) => {
      stubby
        .stub({
          url: '/foo'
        })
        .respondWith(200, { foo: 2 });

      global.get('/foo', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ foo: 2 });
        expect(xhr.status).toEqual(200);
        done();
      });
    });

    it('differentiates on query params', (done) => {
      stubby
        .stub({
          url: '/foo?a=1'
        })
        .respondWith(200, { a: 1 });

      stubby
        .stub({
          url: '/foo?b=2',
          params: { b: 1 }
        })
        .respondWith(200, { b: 1 });

      global.get('/foo?a=1', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
        done();
      });
    });

    it('doesn\'t match a stub with query params against a URL without', () => {
      stubby
        .stub({
          url: '/foo?a=1'
        })
        .respondWith(200);

      expect(() => {
        global.get('/foo', () => {});
      }).toThrowError();
    });

    it('works with query params in both orders', (done) => {
      stubby
        .stub({
          url: '/foo?a=1&b=2'
        })
        .respondWith(200, { a: 1, b: 2 });

      stubby
        .stub({
          url: '/foo?b=3'
        })
        .respondWith(200, { b: 3 });

      global.get('/foo?b=2&a=1', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ a: 1, b: 2 });
        done();
      });
    });

    it('lets you define query params', (done) => {
      stubby
        .stub({
          url: '/foo',
          params: { a: 1 }
        })
        .respondWith(200, { a: 1 });

      global.get('/foo?a=1', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
        done();
      });
    });

    it('lets you match on headers', (done) => {
      stubby
        .stub({
          url: '/foo',
          headers: {
            foo: 'bar'
          }
        })
        .respondWith(200, { a: 1 });

      global.get(
        {
          url: '/foo',
          headers: {
            foo: 'bar'
          }
        },
        function(xhr) {
          expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
          done();
        }
      );
    });

    it('lets you stub response headers', (done) => {
      stubby
        .stub({
          url: '/foo'
        })
        .respondWith(
          200,
          { a: 1 },
        {
          headers: { foo: 'bar' }
        }
        );

      global.get(
        {
          url: '/foo'
        },
        function(xhr) {
          expect(xhr.getResponseHeader('foo')).toEqual('bar');
          done();
        }
      );
    });

    it('lets you match on regex headers', (done) => {
      stubby
        .stub({
          url: '/foo',
          headers: { a: '/\\w|\\d/g' }
        })
        .respondWith(200, { a: 1 });

      global.get(
        {
          url: '/foo',
          headers: {
            a: 1
          }
        },
        function(xhr) {
          expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
          done();
        }
      );
    });

    it('ignores headers in the request not present in the stub', (done) => {
      stubby
        .stub({
          url: '/foo',
          headers: { a: 1 }
        })
        .respondWith(200, { a: 1 });

      global.get(
        {
          url: '/foo',
          headers: {
            a: 1,
            b: 2
          }
        },
        function(xhr) {
          expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
          done();
        }
      );
    });

    it('matches on regex query param values', (done) => {
      stubby
        .stub({
          url: '/foo',
          params: { a: '/\\w|\\d/g' }
        })
        .respondWith(200, { a: 1 });

      global.get('/foo?a=1', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
        done();
      });
    });

    it('all params are matched', (done) => {
      stubby
        .stub({
          url: '/foo',
          params: { a: '/\\w|\\d/g', c: 1 }
        })
        .respondWith(200, { a: 1 });

      stubby
        .stub({
          url: '/foo',
          params: { b: 1, c: 1, a: '/\\w|\\d/g' }
        })
        .respondWith(200, { is: 'not matched' });

      global.get('/foo?a=1&c=1', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
        done();
      });
    });
  });

  describe('allows plugins on setup and on request', () => {
    describe('creates a new stub', () => {
      var spies;
      beforeEach(() => {
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
        stubby
          .stub({
            url: '/test'
          })
          .respondWith(200, {});
      });

      it('makes one request when a stub is made for setup', () => {
        expect(spies.routesetup).toHaveBeenCalled();
        expect(spies.setup).not.toHaveBeenCalled();
        expect(spies.request).not.toHaveBeenCalled();
      });
      it('makes one request to setup and one request to request when set', (done) => {
        expect(spies.routesetup).toHaveBeenCalled();
        global.get('/test', () => {
          expect(spies.setup).toHaveBeenCalled();
          expect(spies.request).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('verifiying that stubs have been used', () => {
    it('errors if a stub is not used', () => {
      stubby.stub({ url: '/foo' }).respondWith(200, {});

      expect(() => {
        stubby.verifyNoOutstandingRequest();
      }).toThrowError();
    });

    it('doesn\'t error when all stubs are satisfied', (done) => {
      stubby.stub({ url: '/foo' }).respondWith(200, {});
      stubby.stub({ url: '/bar' }).respondWith(200, {});

      global.get('/foo', () => {
        global.get('/bar', () => {
          try {
            expect(() => {
              stubby.verifyNoOutstandingRequest();
            }).not.toThrow();
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });

    it('errors if multiple stubs aren\'t used', () => {
      stubby.stub({ url: '/foo' }).respondWith(200, {});
      stubby.stub({ url: '/foo', method: 'POST' }).respondWith(200, {});

      expect(() => {
        stubby.verifyNoOutstandingRequest();
      }).toThrowError('Stub(s) were not called: GET /foo/, POST /foo/');
    });

    it('can deal with multiple stubs', (done) => {
      stubby.stub({ url: '/foo' }).respondWith(200, {});
      stubby.stub({ url: '/bar' }).respondWith(200, {});

      global.get('/foo', () => {
        expect(() => {
          stubby.verifyNoOutstandingRequest();
        }).toThrowError();

        done();
      });
    });

    it('can deal with query params', (done) => {
      stubby.stub({ url: '/foo', params: { a: 1 } }).respondWith(200, {});
      stubby.stub({ url: '/foo', params: { b: 1 } }).respondWith(200, {});

      global.get('/foo?a=1', () => {
        expect(() => {
          stubby.verifyNoOutstandingRequest();
        }).toThrowError();

        done();
      });
    });
  });

  describe('stubbing a POST url', () => {
    it('stubs a post URL', (done) => {
      stubby
        .stub({
          url: '/foo',
          method: 'POST'
        })
        .respondWith(200, { a: 1 });

      global.post('/foo', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
        done();
      });
    });

    it('can match on POST data', (done) => {
      stubby
        .stub({
          url: '/foo',
          data: { b: 2 },
          method: 'POST'
        })
        .respondWith(200, { a: 1 });

      global.post({ url: '/foo', data: { b: 2 } }, function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
        done();
      });
    });

    it('matches a stub if the stub has no data but the request does', (done) => {
      stubby
        .stub({
          url: '/foo',
          method: 'POST'
        })
        .respondWith(200, { a: 1 });

      global.post({ url: '/foo', data: { b: 2 } }, function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ a: 1 });
        done();
      });
    });

    it('can differentiate between POST and PUT data', (done) => {
      stubby
        .stub({
          url: '/foobar',
          method: 'POST'
        })
        .respondWith(200, { method: 'get' });

      stubby
        .stub({
          url: '/foobar',
          method: 'PUT'
        })
        .respondWith(200, { method: 'put' });

      global.put('/foobar', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ method: 'put' });
        done();
      });
    });

    it('can differentiate between a GET and PUT', (done) => {
      stubby
        .stub({
          url: '/foobar',
          method: 'PUT'
        })
        .respondWith(200, { method: 'put' });
      stubby
        .stub({
          url: '/foobar',
          method: 'GET'
        })
        .respondWith(200, { method: 'get' });

      global.get('/foobar', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ method: 'get' });
        done();
      });
    });
  });

  describe('stubbing the same URL twice', () => {
    it('fails when a matching stub is redeclared', () => {
      stubby.stub({ url: '/foo' }).respondWith(200, { first: true });

      expect(() => {
        stubby.stub({ url: '/foo' }).respondWith(200, { first: false });
      }).toThrow();
    });

    it('lets you override if you pass the overrideStub param', (done) => {
      stubby.stub({ url: '/foo' }).respondWith(200, { first: true });

      expect(() => {
        stubby.stub({ url: '/foo', overrideStub: true }).respondWith(200, { first: false });
      }).not.toThrow();

      global.get('/foo', function(xhr) {
        expect(JSON.parse(xhr.responseText)).toEqual({ first: false });
        done();
      });
    });
  });
});
