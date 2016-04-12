/**
 * Created with IntelliJ IDEA.
 * User: zhangyan
 * Date: 13-6-24
 * Time: 下午5:55
 * @fileoverview 1.防止同一个ajax同时发送多次
 * 2.用ajaxform处理post的跨域请求
 */
define(function(require, exports, module) {
	var Uri = require('uri');
	var secret = require('modules/yinyuetai/secret');

	var _requestList = [];
	var equal = function(obj1, obj2) {
		if (typeof(obj1) === 'string' && typeof(obj2) === 'string') {
			return obj1 === obj2;
		} else if (typeof(obj1) === 'object' && typeof(obj2) === 'object') {
			return $.param(obj1) === $.param(obj2);
		}
		return false;
	};

	var isCrossDomain = function(url) {
		var host = new Uri(url).host();
		return host !== '' && host !== document.domain;
	};

	var createPostForm = function(settings) {
		var $form = $('<form method="post"></form>').attr({
			'action' : settings.url
		}).appendTo(document.body);
		var data = settings.data || '', datas, dataJSON = {};

		if (typeof data === 'string') {
			datas = data.split('&');
			$.each(datas, function(index, item) {
				item = item.split('=');
				dataJSON[item[0]] = item[1];
			})
		} else {
			dataJSON = data;
		}
		$.each(dataJSON, function(key, value) {
			$('<input type="hidden"/>').attr({
				name : key,
				value : value
			}).appendTo($form);
		});

		return $form;
	};

	var crossDomainPost = function(settings) {
		var AjaxForm = require("ajaxform");

		var $form = createPostForm(settings);

		new AjaxForm($form, {
			secretParam : settings.secretParam || function() {
				return [];
			},
			onComplete : function(result) {
				$($form.attr('target')).remove();
				$form.remove();
				if (settings.success) {
					settings.success(result);
				}
				if (_.isFunction(settings.complete)) {
					settings.complete(result);
				} else if (_.isArray(settings.complete)) {
					_.each(settings.complete, function(fun) {
						fun(result);
					})
				}
			}
		});
		$form.submit();
	};

	var beforeSend = function(settings) {
		for (var i = 0, len = _requestList.length; i < len; i++) {
			var _request = _requestList[i];
			if (settings.url == _request.url && equal(_request.data, settings.data)) {
				return false;
			}
		}
		_requestList.push(settings);

		var _type = settings.type.toLowerCase();
		if (isCrossDomain(settings.url)) {
			if (_type === 'post') {
				crossDomainPost(settings);
				return false;
			} else {
				settings.dataType = "jsonp";
			}
		} else if (_type === 'post') {
			var json = encrypt(settings.secretName, settings.secretParam);
			if (json) {
				if (settings.data) {
					if (typeof settings.data === 'string') {
						settings.data += '&' + $.param(json);
					} else {
						settings.data = $.extend(settings.data, json);
					}
				} else {
					settings.data = json;
				}
			}
		}
		return settings;
	};


	var encrypt = function(secretName, secretParam) {
		if (secret[secretName]) {
			return secret[secretName](secretParam());
		}
		return null;
		/*return require(['modules/yinyuetai/secret'], function(secret) {
		 if (secret[secretName]) {
		 return secret[secretName](secretParam());
		 }
		 return null;
		 });*/
	};

	return {
		ajax : function(options) {
			var complete = [function() {
				_requestList = _.without(_requestList, options);
			}];
			if (options.complete) {
				complete = complete.concat(options.complete);
			}
			options.complete = undefined;
			options = $.extend({
				timeout : 10000,
				jsonp : 'callback',
				type : 'get',
				secretName : 'des',
				secretParam : function() {
					return [];
				},
				complete : complete
			}, options);

			var checkResult = true;
			if (options.beforeSend && typeof options.beforeSend === "function") {
				checkResult = options.beforeSend();
			}
			if (checkResult === false) {
				return;
			}
			var settings = beforeSend(options);
			if (settings) {
				return $.ajax(settings);
			}
		},
		get : function(url, data, callback, dataType) {
			var options = {type : 'GET'};
			url && (options.url = url);
			data && (options.data = data);
			callback && (options.success = callback);
			dataType && (options.dataType = dataType);
			return this.ajax(options);
		},
		getJSON : function(url, data, callback) {
			return this.get(url, data, callback, 'json');
		},
		post : function(url, data, callback, dataType) {
			var options = {type : 'POST'};
			url && (options.url = url);
			data && (options.data = data);
			callback && (options.success = callback);
			dataType && (options.dataType = dataType);
			return this.ajax(options);
		}
	};
});
