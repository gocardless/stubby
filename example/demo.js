/* global Stubby */
'use strict';

var stubby = new Stubby();

stubby.stub({ url: '/widgets' }).respondWith(200, [
  { id: 1, colour: '#245454', title: 'iPad', company: 'apple' },
  { id: 2, colour: '#225222', title: 'moto 360º', company: 'motorola' },
  { id: 3, colour: '#000000', title: 'black whole', company: 'hollywood' },
  { id: 4, colour: '#000000', title: 'dont click', company: 'undefinedd' }
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

function showNotification(message, colour) {
  if (!colour) { colour = 'black'; }
  var modalContainer = document.getElementById('modal-container');
  var modal = document.createElement('code');
  modal.style.color = colour;
  modal.className = 'modal';
  modal.innerHTML = message;
  modalContainer.appendChild(modal);
  setTimeout(function() {
    modalContainer.removeChild(modal);
  }, 3000);
}

window.onerror = function(err) {
  showNotification(err, 'maroon');
};

window.loadWidget = function(id) {
  window.post({url: '/widget?id=' + id, headers: {'X-Action-Method': 'click'}}, function(res) {
    var body = JSON.parse(res.responseText);
    if (res.status !== 200) {
      showNotification('Error: ' + body.error, 'maroon');
    } else {
      showNotification('Success: ' + body.message, 'black');
    }
  });
};

document.addEventListener('DOMContentLoaded', function() {
  var widgetList = document.getElementById('widget-list');
  window.get('/widgets', function(res) {
    try {
      var widgets = JSON.parse(res.responseText);
      document.getElementById('widget-list').innerHTML = '';
      widgets.map(function(widget) {
        var newEl = document.createElement('li');
        newEl.innerHTML = widget.title;
        newEl.style.color = widget.colour;
        newEl.addEventListener('click', function() {
          window.loadWidget(widget.id);
        });
        widgetList.appendChild(newEl);
      });
    } catch (e) {
      showNotification(e, 'maroon');
    }
  });
});
