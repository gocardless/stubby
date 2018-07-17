function _specHelper(scope = {}) {
  return ['get', 'post', 'put', 'delete'].forEach(method => {
    scope[method] = function(url, cb) {
      var options = {};
      if (typeof url === 'string') {
        options.url = url;
      } else {
        options = url;
      }

      if (!options.headers) {
        options.headers = {};
      }
      if (options.async === undefined) {
        options.async = true;
      }

      var xhr = new XMLHttpRequest();

      xhr.open(method.toUpperCase(), options.url, !!options.async);

      xhr.setRequestHeader('Content-Type', 'application/json');
      Object.keys(options.headers).forEach(function(header) {
        xhr.setRequestHeader(header, options.headers[header]);
      });

      var postBody = options.data ? JSON.stringify(options.data) : null;

      if (typeof cb === 'function') {
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            cb(xhr);
          }
        };
      }

      xhr.send(postBody);

      return xhr;
    };
  });
}

if (typeof global !== 'undefined') {
  _specHelper(global);
}

if (typeof window !== 'undefined') {
  _specHelper(window);
}
