'use strict';

describe('uses chaos money to randomise response status codes', function() {
  var stubby;

  beforeEach(function() {
    stubby = new window.stubby.Stubby();
    stubby.addModule(new window.stubbyChaosMonkey.ChaosMonkey());
  });

  describe('stubbing out normal requests', function() {
    it('will ignore requests with no chaos option', function(done) {
      stubby.stub({
        url: '/test'
      }).respondWith(200, { ok: true });

      window.get('/test', function(xhr) {
        expect(xhr.status).toEqual(200);
        expect(JSON.parse(xhr.responseText)).toEqual({ ok: true });
        done();
      });
    });

    it('will explode if the response port is not 43', function() {
      expect(function() {
        stubby.stub({
          url: '/test',
          options: {
            chaos: true
          }
        }).respondWith(200, []);
      }).toThrowError();
    });

  });

  describe('stubbing out chaotic requests', function() {
    it('will give a random response within a status range for a proper chaotic request', function(done) {
      stubby.stub({
        url: '/test',
        options: {
          chaos: true
        }
      }).respondWith(43, { ok: false });

      var testResponseCheck = function(xhr) {
        expect(xhr.status).toBeGreaterThan(100-1);
        expect(xhr.status).toBeLessThan(600);
        expect(JSON.parse(xhr.responseText)).toEqual({ ok: false });
      };


      for (var i = 0; i < 100; i++) {
        window.get('/test', testResponseCheck);
        if (i === 99) {
          setTimeout(done, 1);
        }
      }
    });
  });
});
