define(function(require) {
	var Class, ajax, juicer, prober;

	ajax = require('ajax');
	juicer = require('juicer');
	prober = require('prober');

	juicer.register('encodeURIComponent', encodeURIComponent);

	function fixClick(object) {
		var evt = document.createEvent("MouseEvents");
		evt.initEvent("click", true, true);
		object.dispatchEvent(evt);
	}

	Class = Backbone.View.extend({
		options : {
			source : 'url',
			template : '',
			container : ''
		},
		events : {
			'keyup' : '_keyup'
		},
		initialize : function() {
			var self = this;
			this._timer = 0;
			this._index = -1;
			this._enter();

			this.$el.on('focus', _.bind(this._keyup, this));

			$(document.body).on('click', function(e) {
				if ($(e.target).attr('name') != 'keyword') {
					setTimeout(function() {
						self.destroy();
					}, 200);
				}
			});

			this.iframeshim = createIframeShim.call(this);
		},
		_keyup : function(e) {
			var list, val;

			val = $.trim(this.$el.val());

			if (val == '') {
				shownormal.call(this);
			}

			if (e.keyCode != 38 && e.keyCode != 40) {
				this._setData(val);
				return false;
			}

			list = this.options.container.find('li');
			if (e.keyCode == 38) {//上键
				this._up(list)
			}
			if (e.keyCode == 40) {//下键
				this._down(list);
			}
		},
		_up : function(list) {
			if (this._index > -1) {
				this._index--;
			}
			if (this._index == -1) {
				this._index = list.length - 1;
			}
			if (list.eq(this._index).hasClass('dotted') || list.eq(this._index).hasClass('h39')) {
				this._index -= 1;
				if (this._index == -1) {
					this._index = list.length - 1;
				}
			}
			list.removeClass('active').eq(this._index).addClass('active');
		},
		_down : function(list) {
			this._index++;
			if (this._index == list.length) {
				this._index = 0;
			}
			if (list.eq(this._index).hasClass('dotted') || list.eq(this._index).hasClass('h39')) {
				this._index += 1;
			}
			list.removeClass('active').eq(this._index).addClass('active');
		},
		_enter : function() {
			var list, link, form, callback;

			form = this.$el.parents('form');
			callback = $.proxy(function(e) {
				e.preventDefault();
				list = this.options.container.find('li');

				if (list.hasClass('active')) {
					link = list.eq(this._index).find('a')[0];
					if (prober.engine.webkit) {
						fixClick(link);
					} else {
						link.click();
					}
					this._index = -1;
					this.destroy();
					this.$el.blur();
				} else {
					form.off();
					this.destroy();
					if (this.$el.val() == '') {
						form.attr('action', this.$el.data('url'));
					} else {
						form.attr('action', 'http://so.yinyuetai.com');
					}
					form.submit();
					this.$el.blur();
					form.on('submit', callback);
				}
			}, this);
			form.on('submit', callback);
		},
		_setData : function(key) {
			clearTimeout(this._timer);
			this._timer = setTimeout($.proxy(function() {
				this._readDataForDB(key, this.render);
			}, this), 200);
		},
		_readDataForDB : function(key, callback) {
			ajax.getJSON(this.options.source, {
				q : key,
				type : 'All',
				maxResults : 2
			}, $.proxy(callback, this));
		},
		render : function(data) {
			if (!data.videos) {
				if ($.trim(this.$el.val()) != '') {
					this.destroy();
				} else {
					shownormal.call(this);
				}
			} else {
				this.options.container.removeClass('autocompletehide');
				this.options.container.html(juicer.to_html(this.options.template, data));
				if (this.iframeshim) {
					this.iframeshim.css({
						display : 'block',
						width : '104%',
						height : (this.options.container.find('li').length - 1) * 30 + 1,
						left : -4
					});
				}
			}
		},
		destroy : function() {
			this.options.container.addClass('autocompletehide');
			this.options.container.html('');
			if (this.iframeshim) {
				this.iframeshim.css('display', 'none');
			}
		}
	});

	function shownormal() {
		this.options.container.removeClass('autocompletehide');
		this.options.container.html($('#autocompletenormalTpl').html());
		if (this.iframeshim) {
			this.iframeshim.css({
				display : 'block',
				width : '104%',
				height : (this.options.container.find('li').length - 1) * 30 + 3,
				left : -4
			});
		}
	}

	function createIframeShim() {
		var iframeshim = iframe().css({
			position : 'absolute',
			top : '34px',
			display : 'none'
		}).appendTo(this.$el.parents('.search'));

		return iframeshim;
	}

	function iframe() {
		return $('<iframe />').attr({
			'frameborder' : 0,
			'scrolling' : 'no',
			'class' : 'iframeshim'
		});
	}

	function AutoComplete(element, options) {
		options = options || {};
		options.el = element;
		return new Class(options);
	}

	return AutoComplete;
});