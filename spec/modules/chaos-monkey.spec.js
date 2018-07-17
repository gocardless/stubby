describe('uses chaos money to randomise response status codes', () => {
  var stubby;

  beforeEach(() => {
    const xhrMockClass = () => ({
      open: jest.fn(),
      send: jest.fn(),
      setRequestHeader: jest.fn()
    });

    global.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);

    stubby = new global.Stubby();
    stubby.addModule(new global.StubbyChaosMonkey());
  });

  describe('stubbing out normal requests', () => {
    it('will ignore requests with no chaos option', (done) => {
      stubby.stub({
        url: '/test'
      }).respondWith(200, { ok: true });

      window.get('/test', (xhr) => {
        expect(xhr.status).toEqual(200);
        expect(JSON.parse(xhr.responseText)).toEqual({ ok: true });
        done();
      });
    });

    it('will explode if the response port is not 43', () => {
      expect(() => {
        stubby.stub({
          url: '/test',
          options: {
            chaos: true
          }
        }).respondWith(200, []);
      }).toThrowError();
    });

  });

  describe('stubbing out chaotic requests', () => {
    it('will give a random response within a status range for a proper chaotic request', (done) => {
      stubby.stub({
        url: '/test',
        options: {
          chaos: true
        }
      }).respondWith(43, { ok: false });

      for (var i = 0; i < 100; i++) {

        window.get('/test', (xhr) => {
          expect(xhr.status).toBeGreaterThan(99);
          expect(xhr.status).toBeLessThan(600);
          expect(JSON.parse(xhr.responseText)).toEqual({ ok: false });
        });

        if (i === 99) {
          setTimeout(done, 1);
        }
      }
    });
  });
});
