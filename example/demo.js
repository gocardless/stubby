var stubby = new stubby.Stubby();
stubby.stub({ url: '/widgets' }).respondWith(200, [
  { id: 1, colour: '#245454', title: 'iPad',        company: 'apple'      },
  { id: 2, colour: '#225222', title: 'moto 360º',   company: 'motorola'   },
  { id: 3, colour: '#000000', title: 'black whole', company: 'hollywood'  },
  { id: 4, colour: '#000000', title: 'dont click',  company: 'undefinedd' }
]);

stubby.stub({
  url: '/widget', params: { id: 3 }, method: 'POST'
}).respondWith(404, {error: 'Item not Found'});

stubby.stub({
 url: '/widget?id=2', method: 'POST'
}).respondWith(200, {message: 'Shiny :)'});

stubby.stub({
  url: '/widget?id=1', method: 'POST', headers: {'X-Action-Method': 'click'}
}).respondWith(412, {error: 'Insufficient funds :('});

window.onerror = function(err) {
  alert(err);
}

window.loadWidget = function(id) {
  post({url: '/widget?id=' + id, headers: {'X-Action-Method': 'click'}}, function(res) {
    var body = JSON.parse(res.responseText);
    if (res.status != 200) {
      alert('Error: ' + body.error);
    } else {
      alert('Success: ' + body.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  var widget_list = document.getElementById('widget-list');
  get('/widgets', function(res) {
    try {
      var widgets = JSON.parse(res.responseText);
      document.getElementById('widget-list').innerHTML = '';
      widgets.map(function(widget) {
        var newEl = document.createElement('li')
        newEl.innerHTML = widget.title;
        newEl.style.color = widget.colour;
        newEl.addEventListener('click', function() {
          window.loadWidget(widget.id);
        });
        document.getElementById('widget-list').appendChild(newEl);
      });
    } catch (e) {
      alert(e);
    }
  });
});
