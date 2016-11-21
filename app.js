"use strict"

const $sns = require('./lib/sns.js');
const $res = require('./lib/response.js');
const $log = require('arsenic-logger');
const $app = require('express')();
const $body = require('body-parser');

$app.use($body.urlencoded({ extended: false }));
$app.use($body.json());

$app.post('/', function (req, res) {
	res.set('Content-Type', 'text/xml');
	let request_id = $sns.UUID();

	if (req.body.Action !== "Publish") {
		$res.error(res, 'Unimplemented', request_id);
	} else {
		$log.info(request_id + ': recieved');
		$sns.Publish(req.body, function(err, id) {
			if (err) {
				$log.error(request_id + ': ' + err);
				$res.error(res, err, request_id);
			} else {
				$log.info(request_id + ': published');
				$res.success.publish(res, id, request_id);
			}
		});
	}
});

let port = process.env.PORT || 9292;
$app.listen(port, function() {
	$log.info('Server listening on port ' + port);
});
