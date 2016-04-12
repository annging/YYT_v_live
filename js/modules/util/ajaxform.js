define(function(require) {
	var Class, Uri, secret;

	Uri = require('uri');
	secret = require('modules/yinyuetai/secret');

	Class = Backbone.View.extend({
		options : {
			secretName : 'des',
			secretParam : function() {
				return [];
			},
			onRequest : function() {
				return true;
			},
			onComplete : function(data) {},
			onError : function(msg) {}
		},
		initialize : function(options) {
			var form, frameId;

			form = this.$el;

			//一个跨域的form表单，多次提交只产生一个iframe element
			if (form.attr('target') && $(form.attr('target')).length != 0) {
				return;
			}

			if (new Uri(form.attr('action')).host() !== '' || form.find('[type=file]').length !== 0) {
				frameId = 'f' + new Date().getTime();
				form.attr('target', frameId);
				this.iframe = iframe.call(this, frameId);
			} else {
				ajax.call(this);
			}
		}
	});

	function ajax() {
		var form, options;

		form = this.$el;
		options = this.options;

		form.submit(function(e) {
			e.preventDefault();
			encrypt(form, secret[options.secretName].apply(window, options.secretParam()));
			if (options.onRequest.call(form)) {
				$.ajax({
					type : 'POST',
					url : form.attr('action'),
					data : form.serialize(),
					success : function(data) {
						options.onComplete.call(form, data);
					}
				});
			}
		});
	}

	function iframe(frameId) {
		var form, options, iframe, innerText, secretName, secretParam, requesting;//requesting 防止重复提交的变量
		form = this.$el;
		options = this.options;
		secretName = options.secretName;
		secretParam = options.secretParam;

		$('<input />').attr({
			type : 'hidden',
			name : 'cross_post',
			value : '1'
		}).appendTo(form);

		iframe = $('<iframe name=' + frameId + '/>').attr({
			id : frameId,
			src : 'about:blank'
		}).css('display', 'none').appendTo(document.body);

		iframe.on('load', function() {
			var body , iframeWindow , response;
			try {
				body = $('#' + frameId)[0].contentWindow.document.body;
				iframeWindow = $('#' + frameId)[0].contentWindow;
			} catch (e) {				
				options.onError.call('上传错误');
			}
			requesting = false;
			try {//如果后台没有作跨域处理，则需手动触发onComplete
				var body = $('#' + frameId)[0].contentWindow.document.body;
				innerText = body.innerText;
				if (!innerText) {
					innerText = body.innerHTML;
				}
				if (innerText) {
					responseJson = decodeURIComponent(iframeWindow.location.search.split('json=')[1]);
					options.onComplete.call(null, $.parseJSON(responseJson));
				}
			} catch (e) {
				options.onComplete.call(null);
			}
		});

		form.on('submit', submit);

		function submit(e) {
			e.preventDefault();
			if (options.onRequest.call(form)) {
				if (requesting) {
					return false;
				}
				requesting = true;
				form.off('submit');
				//加密处理
				encrypt(form, secret[secretName].apply(window, secretParam()));
				form.submit();
				form.on('submit', submit);
			}
		}

		return iframe;
	}

	function encrypt(element, secret) {
		$.each(secret, function(key, value) {
			var $item = element.find('[name=' + key + ']');
			if ($item.length === 0) {
				$('<input />').attr({
					type : 'hidden',
					name : key,
					value : value
				}).appendTo(element);
			} else {
				$item.val(value);
			}
		});
	}

	function AjaxForm(element, options) {
		options = options || {};
		options.el = element;
		return new Class(options);
	}

	return AjaxForm;
});
