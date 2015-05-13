'use strict';

var Stubby = require('./stubby')({
	lodash: require('lodash'),
	pretender: require('pretender'),
	querystring: require('query-string'), 
});

module.exports = Stubby;