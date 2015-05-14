'use strict';
/*global phantom*/
/*eslint no-eval:0*/

var system = require('system');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: '1 == 1' or '$('#bar').is(':visible')' or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: '1 == 1' or '$('#bar').is(':visible')' or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001; //< Default Max Timeout is 3s
  var start = new Date().getTime();
  var condition = false;
  var interval = setInterval(function() {
      if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
        // If not time-out yet and condition not yet fulfilled
        condition = (typeof (testFx) === 'string' ? eval(testFx) : testFx()); //< defensive code
      } else if (!condition) {
        // If condition still not fulfilled (timeout but condition is 'false')
        console.log('\'waitFor()\' timeout');
        phantom.exit(1);
      } else {
        // Condition fulfilled (timeout and/or condition is 'true')
        console.log('\'waitFor()\' finished in ' + (new Date().getTime() - start) + 'ms.');
        if (typeof (onReady) === 'string') {
          eval(onReady);
        } else {
          onReady(); //< Do what it's supposed to do once the condition is fulfilled
        }
        clearInterval(interval); //< Stop this interval
      }
    }, 100); //< repeat check every 100ms
}

if (system.args.length !== 2) {
  console.log('Usage: run-jasmine.js URL');
  phantom.exit(1);
}

var page = require('webpage').create();

page.open(system.args[1], function(status) {
  if (status !== 'success') {
    console.log('Unable to access network');
    phantom.exit();
  } else {
    waitFor(function() {
      return page.evaluate(function() {
        return document.body.querySelector('.symbolSummary .pending') === null &&
          (document.body.querySelector('.alert > .bar.passed') !== null ||
           document.body.querySelector('.alert > .bar.failed') !== null);
      });
    }, function() {
      var exitCode = page.evaluate(function() {
        var i;
        var el;
        var name;
        var suite;
        var successList = document.body.querySelectorAll('.results > .summary .specs > .passed');
        var suites = {};
        if (successList && successList.length > 0) {
          for (i = 0; i < successList.length; ++i) {
            el = successList[i];
            name = el.children[0].innerText;
            suite = el.parentElement.parentElement.querySelector('.suite-detail').innerText;

            suites[suite] = suites[suite] || [];
            suites[suite].push({ status: 'success', name: name });
          }
        }

        var failedList = document.body.querySelectorAll('.results > .failures > .spec-detail.failed');
        if (failedList && failedList.length > 0) {
          console.log('');
          console.log(failedList.length + ' test(s) FAILED:');
          var msg;
          for (i = 0; i < failedList.length; ++i) {
            el = failedList[i];
            name = el.querySelector('.description').innerText;
            name = name.substring(0, name.length - 1);
            msg = el.querySelector('.result-message').innerText;
            suite = name.substring(0, name.indexOf(' '));

            suites[suite] = suites[suite] || [];
            suites[suite].push({ suite: suite, status: 'failed', name: name, message: name + ': ' + msg });
          }
        }

        for (var suiteKey in suites) {
          var tests = suites[suiteKey];
          console.log('started suite' + JSON.stringify({ suite: suiteKey }));
          for (i in tests) {
            var test = tests[i];
            console.log('test started:' + JSON.stringify({ name: test.name }));
            if (test.status === 'success') {
              console.log('test success √ (' + test.name + ')');
            } else if (test.status === 'failed') {
              console.log('test failed:' + JSON.stringify({ name: test.name, message: test.message }));
              console.log('');
              console.log(test.suite);
              console.log(test.message);
            }

            console.log('test finished:' + JSON.stringify({ name: test.name }));
          }

          console.log('suite finished:' + JSON.stringify({ suite: suiteKey }));
        }

        if (failedList && failedList.length > 0) {
          return 1;
        } else {
          console.log(document.body.querySelector('.alert > .bar.passed').innerText);
          return 0;
        }
      });
      phantom.exit(exitCode);
    });
  }
});
