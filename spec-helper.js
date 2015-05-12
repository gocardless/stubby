'get post put delete'.split(' ').forEach(function(method) {
  window[method] = function(url, data, cb) {
    var headers;
    var isAsync;
    if (_.isObject(url)) {
      data = url.data;
      cb = url.cb;
      headers = url.headers || {};
      isAsync = url.async !== false;
      url = url.url;
    } else {
      headers = {};
    }

    var xhr = new XMLHttpRequest();
    xhr.open(method.toUpperCase(), url, isAsync);

    Object.keys(headers).forEach(function(header) {
      xhr.setRequestHeader(header, headers[header]);
    });

    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    if (data && typeof data !== 'function') {
      data = JSON.stringify(data);
    } else {
      cb = data;
      data = null;
    }
    xhr.send(data);

    cb = cb || function() {};

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        cb(xhr);
      }
    };
    return xhr;
  };
});
