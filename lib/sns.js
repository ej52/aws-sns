"use strict"

const $req = require('request');
const $log = require('arsenic-logger');
const $url = require('valid-url');
const $async = require('async');
const $low = require('lowdb')('./data/db.json');
$low.defaults({
	topics: [],
	subscriptions: []
})
.value();

function uuid(c,b,a){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):c?'':'-');return b}

var SNS = {

	UUID: function(dash) {
		return uuid(dash);
	},

	Publish: function(data, cb) {

		if (!('Message' in data && 'TopicArn' in data)) {
    	return cb('MissingParameter');
		}

		if (!$low.get('topics').find({id: data.TopicArn}).value()) {
			return cb('NotFound');
		}

		try {
      data.Message = JSON.parse(data.Message);
    } catch (e) {
      return cb('InvalidParameter');
    }

		if ('default' in data.Message) {
			data.Message = data.Message.default;
		}

		let subscriptions = $low.get('subscriptions').filter({
			topic: data.TopicArn
		}).value();

		data.MessageId = uuid();
		data.Type = 'Notification';
		delete data.Action;

		$async.map(subscriptions, function(subscription, done) {
			$req.post(subscription.endpoint, {
				form: data
			}, function (error, response, body) {
				if (error) {
					done(error.message);
				} else {
					done(null, subscription.id);
				}
			});
		}, function(err, success) {
			let sent = 0;
			for (let s of success) {
				if (s !== undefined) {
					sent++;
				}
			}

			if (sent < 1 && err) {
				cb('EndpointDisabled');
			} else {
				cb(null, data.MessageId);
			}
		});
	},

	createTopic: function(name, cb) {
		let topic = $low.get('topics').find({name: name}).value();
		if (topic) {
			return cb('Topic with name "' + name + '" already exists');
		}

		let id = "arn:aws:sns:local:" + uuid(1) + ":" + name;
		$low.get('topics').push({
			id: id,
			name: name
		}).value();

		cb(null, id);
	},

	deleteTopic: function(id, cb) {
		let topic = $low.get('topics').remove({id: id}).value();
		if (!topic) {
			return cb('NotFound');
		}

		cb(null);
	},

	subscribe: function(params, cb) {

		if (!params.topic || !params.endpoint) {
			return cb('MissingParameter');
		}

		if (!$url.isUrl(params.endpoint)) {
			return cb('InvalidParameter');
		}

		let topic = $low.get('topics').find({id: params.topic}).value();
		if (!topic) {
			return cb('NotFound');
		}

		let id = params.topic + ":" + uuid();
		$low.get('subscriptions').push({
			id: id,
			topic: params.topic,
			protocol: 'http',
			endpoint: params.endpoint,
			created: new Date()
		}).value();

		cb(null, id);
	},

	unsubscribe: function(id, cb) {
		let subscription = $low.get('subscriptions').remove({id: id}).value();
		if (!subscription) {
			return cb('NotFound');
		}

		cb(null);
	}
}

module.exports = SNS;
