define(function(require, exports, module) {
	var ua = (window.navigator.userAgent || "").toLowerCase(),
		isIE6 = ua.indexOf("msie 6") !== -1;

	var store = require("store");

	var Ajax=require("ajax");



	require("http://qzonestyle.gtimg.cn/open/canvas/pcpush/main.js");

	window.PCPUSH = window.PCPUSH || [];

	var body = $(document.body);

	function PcPusher() {

		var self=this;
		var artistId = 0;

		if (Y.leftWindowArtistId) {
			artistId = Y.leftWindowArtistId;
		}

		Ajax.ajax({
			type : "get",
			url : "http://www.yinyuetai.com/partner/get-partner-code?placeIds=left_window&artistId=" + artistId,
			success : function(result) {
				self.container = $('<div class="pc-push-container"></div>');
				if (result.left_window) {
					self.html = result.left_window.replace('[timestamp]', new Date().getTime());
				}else{
					self.html = '<div class="pc-push-baby pc-push-baby-handclap" id="pc_push_baby"></div>'+
							'<a href="javascript:void(0);" class="pc-push-icons pc-push-closer"></a>'+
							'<div class="pc-push-icons pc-push-info"></div>'+
							'<div class="pc-push-icons pc-push-function"><div class="pc-push-function-inner" id="pc_push_function"></div></div>';

				}
				self.container = $('<div class="pc-push-container"></div>');
				self.bottomDistance = 200;
				self.classNames = {
					pleased: "pc-push-baby pc-push-baby-pleased",
					handclap: "pc-push-baby pc-push-baby-handclap"
				};
				self.init();
			}
		});


	}

	PcPusher.prototype = {
		constructor: PcPusher,

		_getRandomStyle: function() {
			var styles = ["handclap", "pleased"];
			return styles[Math.round(Math.random())];
		},

		_initEvent: function() {
			var self = this;

			var closer = this.container.find("a.pc-push-closer"); 
			closer.on("click", function() {
				self.close();
				store.set("pcpusher_close",1);
			});
		},

		_initPosition: function() {
			var self = this, containerHeight = self.container.innerHeight(), minDis = 200;
			if ( isIE6 ) {
				// 修复IE6闪烁
				$("<style type='text/css'> * html { background:url(null) no-repeat fixed; } </style>").appendTo("head");
				$(window).on("scroll.pcpush", function() {
					self.container.css("top", $(this).scrollTop()+
							(document.documentElement.clientHeight-containerHeight-self.bottomDistance)+"px");
				});
			} else {
				var topDis = document.documentElement.clientHeight-containerHeight-self.bottomDistance;
				$(window).on("resize.pcpush", function() {
					topDis = document.documentElement.clientHeight-containerHeight-self.bottomDistance;
					if ( topDis > minDis ) {
						self.container.css("top", "auto");
					} else {
						self.container.css("top", minDis+"px");
					}
				});
				self.container.css("top", topDis > minDis ? "auto" : minDis+"px");
			}
		},

		_initStyle: function() {
			this.currentStyle = this._getRandomStyle();
			$("#pc_push_baby").attr("class", this.classNames[this.currentStyle]);
		},

		init: function() {
			this.container.html(this.html);
			body.append(this.container);
			this._initStyle();
			this._initPosition();
			this._initEvent();
			PCPUSH.push(["pc_push_function", "1101071937", this.currentStyle, {}]);
		},

		close: function() {
			this.container.remove();
			$(window).off(".pcpush");
		}
	};

	if ( Y.siteName && Y.siteName == "www" ||
			document.documentElement.clientWidth <= 1355 ||
			"https:" == document.location.protocol ||
			store.get("pcpusher_close") == 1 ||
			Y.notRequirePcpusher ) {
		return;
	}
	new PcPusher();
});