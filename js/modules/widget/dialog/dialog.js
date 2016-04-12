define(function (require, exports, module) {
	var Class, mask, closeTpl, titleTpl;

	mask = require('modules/widget/dialog/mask');
	closeTpl = '<a href="javascript:void(0);" class="ico_close J_close">关闭</a>';
	titleTpl = '<h3 class="dialog_title J_title">{title}</h3>';

	/**
	 * Example :
	 *      require(['dialog'], function(Dialog) {
	 *          var dialog = new Dialog('<html/>', {
	 *              width : 300,
	 *              height : 300,
	 *              onShow : fn,
	 *              onHide : fn
	 *          });
	 *      });
	 *
	 * PS: 没有针对IE6下不支持position:fixed做处理
	 */

	Class = Backbone.View.extend({
		options: {
			width: '',    //box宽度
			height: '',   //box高度
			hasMark: true, //是否显示遮罩层
			hasClose: true,    //是否显示关闭按钮
			isRemoveAfterHide: true,   //隐藏后是否自动销毁相关dom
			isAutoShow: true,  //是否自动显示dialog
			title: '',
			className: '',
			effect: 'fade',    //显示效果 可选none, fade
			draggable: true,
			onShow: function () {},
			onHide: function () {}
		},
		events: {
			'click .J_close': '_close'
		},
		initialize: function (obj) {
			if(obj){
				this.options = _.extend(this.options, obj);
			}
			this._status = false;
			this.$el = $('<div class="dialog"/>').append(this.$el.show())
					.addClass(this.options.className)
					.appendTo(document.body);

			this._isShowTitle();
			this._isShowClose();
			this._adjustPosition();
			this.on('show', function () {
				this._status = true;
				this._toggle('show');
			});
			this.on('hide', function () {
				this._status = false;
				this._toggle('hide');
			});

			this.on('show', this.options.onShow, this.$el);
			this.on('hide', this.options.onHide, this.$el);

			if (this.options.isAutoShow) {
				this.trigger('show');
			}

			this._setDraggable();
		},
		_getStyle: function (style) {
			var width, height;

			width = this.options.width;
			height = this.options.height;

			if (height && this.options.title != '') {
				height = height + 30;
			}

			var style = {
				'width': width,
				'height': height,
				'margin-left': -(width / 2),
				'margin-top': -(height / 2)
			};
			return style;
		},
		_isShowTitle: function () {
			var title = this.options.title;

			if (title != '') {
				this.$title = $(titleTpl.replace('{title}', title)).prependTo(this.$el);
			}
		},
		_isShowClose: function () {
			if (this.options.hasClose) {
				$(closeTpl).attr('hidefocus', 'true').appendTo(this.$el);
			}
		},
		_close: function () {
			this.trigger('hide');
		},
		_toggle: function (action) {
			var effect, temp;

			effect = this.options.effect;
			temp = this;

			if (action == 'show') {
				if (effect === 'none') {
					this.$el.css('display', 'block');
				} else if (effect === 'fade') {
					this.$el.fadeIn();
				}
			} else if (action == 'hide') {
				if (effect === 'none') {
					this.$el.css('display', 'none');
				} else if (effect === 'fade') {
					this.$el.fadeOut();
				}
				if (this.options.isRemoveAfterHide) {
					setTimeout(function () {temp.$el.remove();}, 2000);
				}
			}

			this._toggleMask(action);
		},
		_toggleMask: function (action) {
			if (this.options.hasMark) {
				if (action == 'show') {
					mask.show();
				} else if (action == 'hide') {
					mask.hide();
				}
			}
		},
		_adjustPosition: function () {
			var size = {
				width: this.options.width || this.$el.innerWidth(),
				height: this.options.height ? (this.options.title != '' ? this.options.height+30 : this.options.height) : this.$el.innerHeight()
			};
			this.$el.css(_.extend({
				marginLeft: -(size.width / 2),
				marginTop: -(size.height / 2)
			}, size));
		},
		_setDraggable: function() {
			var self = this,
				draggable = this.options.draggable,
				title = this.options.title;
			if ( draggable ) {
				require(["modules/widget/jquery-draggable-min"], function() {
					var config = {
						containment: mask.element || "body",
						scroll: false
					}, ele;
					if ( title ) {
						ele = "h3.J_title";
						config.handle = ele;
						$(ele).css("cursor", "move");
					}
					self.$el.draggable(config);
				});
			}
		},
		status: function () {
			return this._status ? 'show' : 'hide';
		},
		show: function () {
			this.trigger('show');
			return this;
		},
		hide: function () {
			this.trigger('hide');
			return this;
		},
		destroy: function () {
			this.$el.remove();
			mask.hide();
		},
		resize: function (width, height) {
			this.options.width = width;
			this.options.height = height;
			this._adjustPosition();
			return this;
		},
		title: function (title) {
			this.$title && this.$title.html(title);
			return this;
		}
	});

	function Dialog(content, options) {
		options = options || {};
		options.el = content || '<b></b>';
		return new Class(options);
	}

	return Dialog;
});
