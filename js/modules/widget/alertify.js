/**
 *如果使用zepto，fadeIn,fadeOut,innerHeight等函数不被支持
 */
define(function(require) {

	var prober = require("prober");
	var isIE = prober.browser.name == "ie",
		isIE6 = isIE && prober.browser.version < "7";

	function Alertify() {
		this.iframe = $("<iframe></iframe>").addClass("alertify-wrapper-iframe");
		this.el = $("<div/>").addClass("alertify-wrapper clearfix");
		this.ctn = $("<div/>").addClass("alertify-wrapper-ctn");
		this.ctnInner = $("<div/>").addClass("alertify-wrapper-ctn-inner");
		this.ctnInnerContWrapper = $("<div/>");
		this.contElStr = "<i></i>";
		this.body = $("body");
		this.init();
	}

	Alertify.prototype = {
		constructor : Alertify,
		init : function() {
			this.runningTime = 400;
			this.stayTime = 1000;
			this.timeId = null;
			this.ctn.appendTo(this.el);
			this.ctnInner.appendTo(this.ctn);
			if ( isIE ) {
				this.iframe.appendTo(this.ctnInner);
			}
			this.ctnInnerContWrapper.appendTo(this.ctnInner);
			this.el.appendTo(this.body);
		},
		showInfo: function (css, mess, callback, delay) {
			var self = this;
			var stayTime = delay ? delay : self.stayTime;

			if (typeof mess !== "undefined" && $.trim(mess) !== "") {
				clearTimeout(self.timeId);
				if (this.running) {
					try{
						this.el.stop().hide();
					}catch(e){}
					this.ctnInnerContWrapper.removeClass();
					clearTimeout(this.timeId);
					typeof self.callback === "function" && self.callback();
				}
				this.callback = callback;
				//标示alertify是否为显示状态
				this.running = true;

				this.ctnInnerContWrapper.addClass(css).html(this.contElStr + mess);

				this.setPosition();

                try{
                    this.el.fadeIn(this.runningTime, function() {
                        if (_.indexOf(Alertify.manualType, self.currentType) === -1) {
                            self.timeId = setTimeout(function() {
                                self.hideInfo();
							}, stayTime);
                        }
                    });
                }catch(e){
                    this.el.css({
                        "opacity":1,
                        "display":"block"
                    });
                    self.timeId = setTimeout(function(){
                        self.hideInfo();
					}, stayTime);
                }

			}
		},
		hideInfo : function() {
			var self = this;
            try{
                this.el.fadeOut(this.runningTime, function() {
                    typeof self.callback === "function" && self.callback();
                    self.ctnInnerContWrapper.removeClass();
                    self.running = false;
                });
            }catch(e){
                this.el.css({
                    "opacity": 0,
                    "display": "none"
                });
                typeof self.callback === "function" && self.callback();
                self.ctnInnerContWrapper.removeClass();
                self.running = false;
            }

		},
		setPosition : function() {
			var clientHeight = document.documentElement.clientHeight;
            try{
                var alertifyHeight = this.el.innerHeight();
            }catch (e){
                var alertifyHeight = this.el.height();
            }

			var alertifyTop = (clientHeight - alertifyHeight) / 2;

			this.iframe.css("height", alertifyHeight+"px");

			if (isIE6) {
				var stylesInIE = {
					position : "absolute",
					top : alertifyTop + $(window).scrollTop() + "px"
				};
				this.el.css(stylesInIE);
			} else {
				this.el.css("top", alertifyTop + "px");
			}
		},
		hide : function(time, callback) {
			var time = typeof time === "number" ? time : this.runningTime,
					self = this;
			if (!this.running) {
				return;
			}

			if (this.el.fadeOut) {
				this.el.fadeOut(time, function () {
					typeof callback === "function" && callback();
					self.ctnInnerContWrapper.removeClass();
					self.running = false;
				});
			} else {
				this.el.hide();
				self.ctnInnerContWrapper.removeClass();
				self.running = false;
			}
		}
	};

	//alertify控件支持的类型，{如需要新增类型，直接在此属性加入即可}
	Alertify.automaticType = ["log", "error", "success"];
	Alertify.manualType = ["loading"];

	var alertify = new Alertify(),
			exportsObj = {
				hide : function(time, callback) {
					var time = time, callback = callback;
					if (arguments.length === 1 && typeof arguments[0] === "function") {
						callback = time;
						time = null;
					}
					alertify.hide(time, callback);
				}
			};

	_.each(Alertify.automaticType.concat(Alertify.manualType), function(type, index) {
		exportsObj[type] = function() {
			var message = arguments[0];
			if (type === "loading") {
				message || (message = "加载中，请稍后...");
			}
			alertify.currentType = type;
			alertify.showInfo("alertify-" + type, message, arguments[1], arguments[2]);
		}
	});

	/**
	 * interface 对外的接口
	 * @return {
	 *      log: function() {},         常态输出
	 *      loading: function() {},     loading状态
	 *      error: function() {},       错误输出
	 *      success: function() {}      成功输出
	 *      hide: function() {}         关闭提示组件,可传入回调
	 * }
	 * 每个方法都接受二个参数message和callback回调,callback不是必须的。(hide接受的是time和callback参数,可直接单独传入callback)
	 */
	return exportsObj;
});
