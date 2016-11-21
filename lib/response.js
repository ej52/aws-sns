"use strict"

const $builder = require('xmlbuilder');

function uuid(c,b,a){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):c?'':'-');return b}

module.exports.error = function(res, code, request_id) {
	let response = $builder.create('ErrorResponse');
	response.att('xmlns', 'http://sns.amazonaws.com/doc/2010-03-31/');
	let error = response.ele('Error');
	error.ele('Type', 'Sender');

	switch (code) {
		case 'InvalidAction':
			error.ele('Message', 'The action or operation requested is invalid.');
			res.statusCode = 400;
			break;

		case 'MissingAction':
			error.ele('Message', 'The request is missing an action or operation parameter.');
			res.statusCode = 400;
			break;

		case 'MissingParameter':
			error.ele('Message', 'An input parameter that is mandatory for processing the request is not supplied.');
			res.statusCode = 400;
			break;

		case 'InvalidParameter':
			error.ele('Message', 'An input parameter is invalid.');
			res.statusCode = 400;
			break;

		case 'TopicLimitExceeded':
			error.ele('Message', 'The maximum limit of topics has been exceeded.');
			res.statusCode = 403;
			break;

		case 'NotFound':
			error.ele('Message', 'The requested resource does not exist.');
			res.statusCode = 404;
			break;

		case 'Unimplemented':
			error.ele('Message', 'This functionality has not been implemented yet.');
			res.statusCode = 400;
			break;

		case 'EndpointDisabled':
			error.ele('Message', 'The endpoint could not be reached.');
			res.statusCode = 400;
			break;

		default:
			error.ele('Message', code);
			code = 'InternalError';
			res.statusCode = 500;
			//throw new Error('Unknown error code "' + code + '"');
	}

	error.ele('Code', code);

	response.ele('RequestId', request_id);
	res.end(response.end({pretty: true, indent: '  '}));
};

module.exports.success = {
	publish: function(res, id, request_id) {
		var response = $builder.create('PublishResponse');
	  response.att('xmlns', 'http://sns.amazonaws.com/doc/2010-03-31/');
	  var result = response.ele('PublishResult');
	  result.ele('MessageId', id);
	  var metadata = response.ele('ResponseMetadata');
	  metadata.ele('RequestId', request_id);

	  res.end(response.end({pretty: true, indent: '  '}));
	}
}
