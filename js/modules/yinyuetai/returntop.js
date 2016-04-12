define(function(require, exports, module) {
	var _hmt = _hmt || "";

	var isIE6 = navigator.userAgent.indexOf("MSIE 6.0") !== -1;

	function ReturnTop() {
		this.el = $("<div></div>").addClass("return_top_wrapper");
		this.actionEl = $("<a></a>").attr({
			"href": "javascript:void(0)",
			"title": "返回顶部"
		}).addClass("return_top_static");
		this.runningEl = $("<a></a>").attr({
			"href": "javascript:void(0)"
		}).addClass("return_top_running");
		this.bottomDistance = 100;   //回到顶部区域距底部的距离
		this.goTopTime = 800;       //页面回到顶部所用时间
		this.hideDistance = 50;
		this.init();
	}
	ReturnTop.prototype = {
		init: function() {
			var self = this;
			$("<div></div>").appendTo(this.el);
			this.actionEl.appendTo(this.el);
			this.runningEl.appendTo(this.el);
			this.win = $(window);
			$(document).ready(function() {
				self.el.appendTo(document.body);
				self.scrollEvent();
			});
			this.bindEvent();
		},
		bindEvent: function() {
			var self = this;

			var throttled = _.throttle(self.scrollEvent, 400),
				throttledResize = _.throttle(self.resizeEvent, 400);

			this.win.scroll(function() {
				throttled.call(self);
			});
			this.win.resize(function() {
				throttledResize.call(self);
			});

			this.el.click(function(e) {
				if ( self.isRunning ) return;
				self.startRunning();
				$("html, body").animate({
					scrollTop: 0
				}, self.goTopTime);
				self.el.animate({
					top: "-"+self.el.innerHeight()
				}, self.goTopTime, function() {
					self.endRunning();
				});
				_hmt && _hmt.push(['_trackEvent', '主站右侧回到顶部', '回到顶部按钮点击次数']);
				e.stopPropagation();
			});
		},
		startRunning: function() {
			this.isRunning = true;
			this.actionEl.css("left", "-"+this.hideDistance+"px");
			this.runningEl.css("left", 0);
		},
		endRunning: function() {
			this.isRunning = false;
			this.runningEl.css("left", "-"+this.hideDistance+"px");
			this.actionEl.css("left", 0);
		},
		scrollEvent: function() {
			var scrollTop = this.win.scrollTop(),
				clientHeight = document.documentElement.clientHeight,
				marginBottom = clientHeight-this.el.innerHeight()-this.bottomDistance;
			var self = this;
			if ( self.isRunning ) return;
			if ( scrollTop >= clientHeight ) {
				if ( isIE6 ) {
					this.el.show().css({
						top: scrollTop+marginBottom
					});
				} else {
					if ( !this.hasShow ) {
						//从底部出现
						this.el.css({
							top: clientHeight
						}).show().animate({
							top: marginBottom
						}, 600);
						this.hasShow = true;
					}
				}
			} else {
				this.el.hide();
				this.hasShow = false;
			}
		},
		resizeEvent: function() {
			var scrollTop = this.win.scrollTop(),
				clientHeight = document.documentElement.clientHeight,
				marginBottom = clientHeight-this.el.innerHeight()-this.bottomDistance;
			if ( scrollTop < clientHeight ) return;
			this.el.css({
				top: isIE6 ? scrollTop+marginBottom : marginBottom
			});
		}
	};
	module.exports = new ReturnTop();
});