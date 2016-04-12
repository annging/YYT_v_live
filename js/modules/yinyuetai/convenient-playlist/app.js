define(function(require, exports, module) {
	var juicer = require('juicer'), ajax = require("ajax"), alertify = require("alertify"), user = require("user");
	var prober = require("prober");
	var flashStorage = require("modules/widget/flashstorage");
	var cookieStore = require("cookie");
	require("scrollbar");

	var mvCollection, playStatus, controller;

	var actionUrl = Y.domains.vSite,
		playerUrl = Y.domains.vSite+"/convenientplaylist/play";

	var tmpl = {
		miniApp: '<span class="convenient-mini-total J_convenient_mini_total"><span></span>首</span>'+
				'<span class="convenient-mini-inner">'+
				'<span class="convenient-icons J_convenient_mini_name convenient-mini-name"></span>'+
				'<a class="convenient-icons J_convenient_mini_icon convenient-mini-empty" href="'+playerUrl+'" target="_blank"></a>'+
				'</span>',
		app: '<div class="convenient-app-title">'+
				'<h3 class="convenient-icons">便捷悦单</h3>'+
				'<a href="javascript:void(0);" class="J_switch"><i class="convenient-icons"></i></a>'+
				'<span>当前共<strong class="J_convenient_number">0</strong>首</span>'+
				'</div>'+

				'<div class="convenient-app-content J_convenient_app_content">'+

				'<div class="scrollbar fr">'+
				'<div class="track">'+
				'<div class="thumb">'+
				'<div class="end"></div>'+
				'</div>'+
				'</div>'+
				'</div>'+
				'<div class="viewport">'+
				'<div class="overview">'+

				'<div class="convenient-app-fetching J_list_fetching">悦单信息获取中...</div>'+
				'<div class="convenient-icons convenient-app-empty J_list_empty"></div>'+
				'<ul class="convenient-app-items-ctn">'+
				'</ul>'+

				'</div>'+
				'</div>'+

				'</div>'+

				'<div class="convenient-app-operator" id="convenient_app_operator">'+
				'<a style="display: none" href="'+playerUrl+'" target="_blank" onclick="_hmt.push(['+"'_trackEvent', '便捷悦单', '播放便捷悦单'"+']);" class="J_play_convenient convenient-app-status convenient-app-status-play"><i class="convenient-icons"></i></a>'+
				'<p style="display: none" class="J_operator_convenient">'+
				'<span class="J_save_convenient_saving" style="display: none">保存中...</span>'+
				'<a href="javascript:void(0);" onclick="_hmt.push(['+"'_trackEvent', '便捷悦单', '保存便捷悦单'"+']);" class="J_save_convenient">保存</a>'+
				'<a href="javascript:void(0);" onclick="_hmt.push(['+"'_trackEvent', '便捷悦单', '清空便捷悦单'"+']);" class="J_clear_convenient">清空</a>'+
				'</p>'+
				'</div>',
		list: '<div class="convenient-basic clearfix">'+
					'<a class="convenient-song-name J_play_single" href="'+playerUrl+'#videoId={{id}}" target="_blank" title="{{song}}">{{song}}</a>'+
					'<div class="convenient-singer">--<a class="J_play_single" href="'+playerUrl+'#videoId={{id}}" target="_blank" title="{{singer}}">{{singer}}</a></div>'+
				'</div>'+
				'<div class="convenient-rich">'+
					'<a class="J_play_single convenient-rich-item-ctn clearfix" href="'+playerUrl+'#videoId={{id}}" onclick="_hmt.push(['+"'_trackEvent', '便捷悦单', '播放便捷悦单中单个MV'"+']);" target="_blank">'+
						'<span class="convenient-icon">'+
							'<i class="convenient-icons"></i>'+
							'<img src="{{headImg}}" />'+
						'</span>'+
						'<span class="convenient-info">'+
							'<span class="convenient-song-name" title="{{song}}">{{song}}</span>'+
							'<span class="convenient-singer">-- <span title="{{singer}}">{{singer}}</span></span>'+
						'</span>'+
					'</a>'+
					'<a href="javascript:void(0);" onclick="_hmt.push(['+"'_trackEvent', '便捷悦单', '删除便捷悦单单个MV'"+']);" title="删除" class="convenient-icons convenient-item-operator convenient-delete J_delete"></a>'+
				'</div>'
	};

	var Mv = Backbone.Model.extend({
		defaults: {
			song: "...",
			singer: "...",
			headImg: "...",
			artists: []
		},
		isNew: function() {
			return true;
		}
	});
	var MvCollection = Backbone.Collection.extend({
		fetchQueue: 0,
		model: Mv,
		initialize: function() {
			this.on({
				"add": function() {
					this.changeAmount();
					this.saveData();
				},
				"destroy": function(model) {
					this.changeAmount();
					this.saveData();
					flashStorage.setItem("playlistDestroyId", model.id);
				},
				"reset": function() {
					this.changeAmount();
				}
			});
		},
		changeAmount: function() {
			this.trigger("changeAmount", this.length);
		},
		saveData: function() {
			flashStorage.setItem("playlistData", this.toJSON());
		},
		sync: function(playlistName) {
			var self = this,
				data = {
				title: playlistName || "便捷悦单",
				videoIds: this.pluck("id").join(";")
			};
			user.login(function() {
				self.trigger("saveStart");
				ajax.ajax({
					url: actionUrl+"/q/save-playlist",
					type: "POST",
					data: data,
					success: function(data) {
						self.trigger("saveComplete", data);
					}
				});
			});
		},
		fetch: function(id) {
			this.getServerData(actionUrl+"/q/add-video", "videoId="+id);
		},
		fetchList: function(ids, callback) {
			this.getServerData(actionUrl+"/q/add-videos", "videoId="+ids.join(";"), callback);
		},
		getServerData: function(url, data, callback) {
			var self = this;
			this.trigger("fetchStart");
			this.fetchQueue++;
			ajax.ajax({
				url: url,
				type: "POST",
				data: data,
				success: function(result) {
					if ( --self.fetchQueue == 0 ) {
						self.trigger("fetchComplete");
						callback && callback(result);
					}
					self.processServerData(result);
				}
			});
		},
		processServerData: function(data) {
			if ( !data.error ) {
				if ( (!data.video && !data.videos) || (data.videos && !data.videos.length) ) {
					alertify.error(data.message || "该视频不存在！");
					return;
				}
				if ( data.video ) {
					this.processVideo(data.video);
					return;
				}
				if ( data.videos ) {
					_.each(data.videos, function(video) {
						this.processVideo(video);
					}, this);
				}
			} else {
				alertify.error(data.message || "加入快捷悦单失败！");
			}
		},
		processVideo: function(video) {
			var dataVideo = video || {};
			var songData = {
				song: dataVideo.title,
				headImg: dataVideo.image,
				id: dataVideo.videoId,
				singer: "暂无演唱者"
			};
			if ( dataVideo.artists && dataVideo.artists.length > 0 ) {
				songData.singer = _.pluck(dataVideo.artists, "artistName").join(" & ");
				songData.artists = dataVideo.artists;
			}
			this.add(songData);
		}
	});

	//播放控制对象
	var PlayStatus = Backbone.Model.extend({
		defaults: {
			playerStatus: "PAUSED",
			lastCurrentIndex: -1,
			currentIndex: -1,
			currentId: -1,
			isPlayerWeb: false
		},
		initialize: function() {
			this.on("change:currentId", function() {
				this.changeIndex();
			}, this);
			this.listenTo(mvCollection, "reset", function() {
				if ( mvCollection.length == 0 ) {
					flashStorage.setItem("playlistCurrentId", -1);
				}
			});
			this.on("playerStatusSwitch", function(status) {
				flashStorage.setItem("playlistPlayerStatus", status);
				flashStorage.setItem("playlistControllPlayerStatus", status);
			}, this);
		},
		setInitStatus: function(status) {
			var id = flashStorage.getItem("playlistCurrentId");
			id && this.set("currentId", id);
			status && this.set("playerStatus", status);
		},
		changeIndex: function() {
			var ids = mvCollection.pluck("id"),
				target =  _.indexOf(ids, this.get("currentId"));
			flashStorage.setItem("playlistLastCurrentIndex", this.get("currentIndex"));
			flashStorage.setItem("playlistCurrentIndex", target);
		},
		resetCurrentId: function() {
			var len = mvCollection.length,
				id;
			if ( this.get("currentId") != mvCollection.destroyId ) {
				return this.changeIndex();
			}

			if ( len == 0 ) {
				id = -1;
			} else if ( this.get("currentIndex") == 0 ) {
				id = mvCollection.at(len-1).id;
			} else {
				id = mvCollection.at(this.get("currentIndex")-1).id;
			}
			this.set("currentId", id);
			flashStorage.setItem("playlistCurrentId", id);
		}
	});

	var List = Backbone.View.extend({
		tagName: "li",
		initialize: function() {
			this.listenTo(this.model, "destroy", this.removeItem);
		},
		render: function() {
			this.$el.html(juicer(tmpl.list, this.model.toJSON()));
			return this;
		},
		events: {
			"click .J_delete": "deleteItem",
			"click": "setCurrentId"
		},
		deleteItem: function(e) {
			this.model.destroy();
			e.stopPropagation();
		},
		removeItem: function() {
			this.remove();
		},
		setCurrentId: function() {
			var id = this.model.get("id");
			playStatus.set("currentId", id);
			flashStorage.setItem("playlistCurrentId", id);
		}
	});

	var RichApp = Backbone.View.extend({
		className: "convenient-app",
		currentClass: "current-playlist-item",
		hoverClass: "hover-playlist-item",
		itemBasicClass: "convenient-basic",
		itemRichClass: "convenient-rich",
		buttonPlayClass: "convenient-app-status-play",
		buttonPauseClass: "convenient-app-status-pause",
		initialize: function() {
			this.render();
			this.setElements();
			this.initScrollbar();
			this.listenTo(mvCollection, "add", this.unshiftOne);
			this.listenTo(mvCollection, "changeAmount", this.changeStatus);
			this.listenTo(playStatus, "change:playerStatus", this.changePlayerButtonStatus);
			this.listenTo(playStatus, "change:currentIndex", function() {
				this.setCurrentItem();
			});
			this.listenTo(playStatus, "richAppComing", this.showView);
			this.listenTo(mvCollection, "saveStart", this.saveStart);
			this.listenTo(mvCollection, "saveComplete", this.saveComplete);
			this.listenTo(mvCollection, "fetchStart", this.fetchStart);
			this.listenTo(mvCollection, "fetchComplete", this.fetchComplete);
			this.listenTo(mvCollection, "reset", this.unshiftAll);
		},
		render: function() {
			this.$el.html(juicer(tmpl.app, {}));
			this.$el.appendTo(controller.elems.container);
		},
		setElements: function() {
			this.elems = {
				content: this.$(".J_convenient_app_content"),
				itemsCtn: this.$(".convenient-app-items-ctn"),
				emptyTip: this.$(".J_list_empty"),
				operator: this.$(".J_operator_convenient"),
				play: this.$(".J_play_convenient"),
				number: this.$(".J_convenient_number"),
				saving: this.$(".J_save_convenient_saving"),
				save: this.$(".J_save_convenient"),
				clear: this.$(".J_clear_convenient"),
				fetching: this.$(".J_list_fetching")
			};
		},
		initScrollbar: function() {
			this.elems.content.tinyscrollbar();
		},
		unshiftOne: function(mv) {
			var item = new List({model: mv});
			this.elems.itemsCtn.prepend(item.render().el);
		},
		unshiftAll: function() {
			this.elems.itemsCtn.empty();
			if ( mvCollection.length == 0 ) return;
			mvCollection.each(this.unshiftOne, this);
		},
		changeStatus: function(amount) {
			this.elems.number.text(amount);
			this.elems.content.tinyscrollbar_update();
			if ( amount == 0 ) {
				this.elems.emptyTip.show();
				this.elems.itemsCtn.empty();
				this.elems.play.hide();
				this.elems.operator.hide();
				return;
			}
			this.elems.play.show();
			this.elems.operator.show();
			this.elems.emptyTip.hide();
		},
		changePlayerButtonStatus: function() {
			var playerStatus = flashStorage.getItem("playlistPlayerStatus");
			if ( playerStatus == "PLAYING" || playerStatus == "BUFFERING" ) {
				this.elems.play.addClass(this.buttonPauseClass);
				this.elems.play.prop("title", "暂停播放");
				return;
			}
			this.elems.play.removeClass(this.buttonPauseClass);
			this.elems.play.prop("title", "开始播放");
		},
		setCurrentItem: function() {
			var currentIndex = playStatus.get("currentIndex"),
				currentItem;
			if ( currentIndex == -1 ) return;
			currentItem = this.elems.itemsCtn.find("li").eq(mvCollection.length-playStatus.get("currentIndex")-1);
			this.resetItemDisplay();
			this.elems.itemsCtn.find("li").removeClass(this.currentClass);
			currentItem.addClass(this.currentClass);
			currentItem.find("."+this.itemBasicClass).hide();
			currentItem.find("."+this.itemRichClass).show();
		},
		showView: function() {
			this.setContainer();
			this.$el.css("right", "-"+this.$el.innerWidth()+"px").show().animate({
				right: 0
			}, 200);
			this.setIframe();
		},
		hideView: function() {
			var self = this;
			this.$el.animate({
				right: "-"+this.$el.innerWidth()+"px"
			}, 100, function() {
				self.$el.hide();
				playStatus.trigger("basicAppComing");
			});
		},
		setContainer: function() {
			controller.elems.container.css({
				width: this.$el.innerWidth()+"px",
				height: this.$el.innerHeight()+"px"
			});
		},
		setIframe: function() {
			controller.elems.iframe.css({
				height: this.$el.innerHeight()+"px"
			});
		},
		events: {
			"mouseenter li": "toggleItem",
			"click .J_save_convenient": "save",
			"click .J_clear_convenient": "clearAll",
			"click .J_switch": "switchDisplay",
			"click .J_play_convenient": "playAll",
			"click .J_play_single": "play",
			"mouseleave": "leaveApp",
			"mouseenter": "clearCountTime"
		},
		toggleItem: function(e) {
			var hoverItem = $(e.currentTarget);
			this.resetItemDisplay();
			this.elems.itemsCtn.find("li").removeClass(this.hoverClass);
			hoverItem.addClass(this.hoverClass);
			hoverItem.find("."+this.itemBasicClass).hide();
			hoverItem.find("."+this.itemRichClass).show();
			this.elems.content.tinyscrollbar_update("relative");
		},
		resetItemDisplay: function() {
			this.$("li").removeClass();
			this.$("."+this.itemBasicClass).show();
			this.$("."+this.itemRichClass).hide();
		},
		save: function() {
			if ( $("#convenient_save_dialog_input").length == 1 ) return;
			(new SaveListDialog).showDialog();
		},
		clearAll: function() {
			mvCollection.reset();
			flashStorage.setItem("playlistData", "");
		},
		switchDisplay: function() {
			this.hideView();
		},
		play: function(e) {
			if ( cookieStore.get("playlistHasPlayer") ) {
				e.preventDefault();
			}
		},
		playAll: function(e) {
			if ( cookieStore.get("playlistHasPlayer") ) {
				e.preventDefault();
			}
			var status = flashStorage.getItem("playlistPlayerStatus");
			if ( status == "PLAYING" || status == "BUFFERING" ) {
				playStatus.trigger("playerStatusSwitch", "PAUSED");
				return;
			}
			playStatus.trigger("playerStatusSwitch", "PLAYING");
		},
		leaveApp: function() {
			this.setCurrentItem();
			this.startCountTime();
		},
		startCountTime: function() {
			var self = this;
			if ( !playStatus.get("isPlayerWeb") ) return;
			this.countTime = setTimeout(function() {
				self.hideView();
			}, 3000);
		},
		clearCountTime: function() {
			clearTimeout(this.countTime);
		},
		saveStart: function() {
			this.elems.save.hide();
			this.elems.clear.hide();
			this.elems.saving.show();
		},
		saveComplete: function(data) {
			this.elems.saving.hide();
			this.elems.save.show();
			this.elems.clear.show();
			if ( !data.error ) {
				alertify.success(data.message||"保存悦单成功！");
				return;
			}
			alertify.error(data.message||"保存悦单失败！");
		},
		fetchStart: function() {
			this.elems.fetching.show();
		},
		fetchComplete: function() {
			this.elems.fetching.hide();
		}
	});

	var SaveListDialog = Backbone.View.extend({
		tmpl: '<div class="convenient-icons convenient-save-dialog">'+
				'<label for="convenient_save_dialog_input">悦单名称：</label><div><input id="convenient_save_dialog_input" type="text" value="便捷悦单" /></div>'+
				'<p>'+
					'<a href="javascript:void(0);" onclick="_hmt.push(['+"'_trackEvent', '便捷悦单', '确定保存便捷悦单'"+']);" class="convenient-icons convenient-save-positive">确定</a><a href="javascript:void(0);" onclick="_hmt.push(['+"'_trackEvent', '便捷悦单', '取消保存便捷悦单'"+']);" class="convenient-icons convenient-save-negative">取消</a>'+
				'</p>'+
			'</div>',
		className: "convenient-save-dialog-container",
		defaultValue: "便捷悦单",
		initialize: function() {
			this.create();
			this.bindEvents();
			this.listenTo(mvCollection, "changeAmount", function() {
				this.hideDialog();
			});
		},
		create: function() {
			this.$el.html( this.tmpl );
			this.$el.appendTo($("#convenient_app_operator"));
			this.elems = {
				container: this.$(".convenient-save-dialog"),
				input: $("#convenient_save_dialog_input"),
				positive: this.$(".convenient-save-positive"),
				negative: this.$(".convenient-save-negative")
			}
		},
		bindEvents: function() {
			var self = this;
			this.elems.positive.on("click", function() {
				if ( $.trim(self.elems.input.val()) == "" ) {
					alertify.error("请输入要保存悦单的名字！");
					return;
				}
				self.hideDialog(function() {
					mvCollection.sync(self.playlistName);
				});
			});
			this.elems.negative.on("click", function() {
				self.hideDialog();
			});
			this.elems.input.on({
				focus: function() {
					if ($.trim(self.elems.input.val()) == self.defaultValue) {
						self.elems.input.val("");
					}
					self.elems.input.css("color", "#666");
				},
				blur: function() {
					self.elems.input.css("color", "#CCC");
					self.playlistName = $.trim(self.elems.input.val());
				},
				keydown: function(e) {
					if (e.keyCode == 13) {
						self.elems.input.blur();
						self.elems.positive.trigger("click");
					}
				}
			});
		},
		hideDialog: function(callback) {
			var self = this;
			this.elems.container.animate({
				top: this.$el.innerHeight()+"px"
			}, 400, function() {
				self.remove();
				callback && callback();
			});
		},
		showDialog: function() {
			var self = this;
			this.elems.container.animate({
				top: 0
			}, 400, function() {
				self.elems.input.trigger("focus");
			});
		}
	});

	var BasicApp = Backbone.View.extend({
		tagName: "a",
		className: "convenient-mini",
		emptyName: "convenient-mini-empty",
		listName: "convenient-mini-list",
		pauseName: "convenient-mini-pause",
		playName: "convenient-mini-play",
		attributes: {
			href: "javascript:void(0);"
		},
		initialize: function() {
			this.isRunning = true;
			this.render();
			this.setElements();
			this.setIframe();
			this.listenTo(mvCollection, "changeAmount", function(amount) {
				this.changeStatus(amount);
				this.updateTotal(amount);
			});
			this.listenTo(playStatus, "basicAppComing", this.showView);
			this.listenTo(playStatus, "change:playerStatus", this.changePlayerButtonStatus);
			this.setContainer();
		},
		render: function() {
			this.$el.html(juicer(tmpl.miniApp, {}));
			this.$el.appendTo(controller.elems.container);
		},
		setElements: function() {
			this.elems = {
				total: this.$(".J_convenient_mini_total"),
				icon: this.$(".J_convenient_mini_icon"),
				name: this.$(".J_convenient_mini_name")
			};
		},
		setContainer: function() {
			controller.elems.container.css({
				width: this.$el.innerWidth()+"px",
				height: this.$el.innerHeight()+"px"
			});
		},
		setIframe: function() {
			controller.elems.iframe.css({
				height: this.$el.innerHeight()+"px"
			});
		},
		changeStatus: function(amount) {
			if ( amount == 0 ) {
				this.elems.icon.removeClass(this.playName);
				this.elems.icon.removeClass(this.pauseName);
				this.elems.icon.addClass(this.emptyName);
				this.elems.icon.prop("title", "播放列表为空");
				return;
			}
			if ( this.elems.icon.hasClass(this.pauseName) ) return;
			this.elems.icon.removeClass(this.emptyName).addClass(this.playName);
			this.elems.icon.prop("title", "开始播放");
		},
		updateTotal: function(amount) {
			if ( amount == 0 ) {
				this.elems.total.hide();
			} else {
				this.elems.total.css("display", "block").find("span").text(amount>999?"999+":amount);
			}
			if ( this.isRunning ) {
				this.setContainer();
				this.setIframe();
			}
		},
		showView: function() {
			this.setContainer();
			this.$el.show().animate({
				right: 0
			}, 300);
			this.setIframe();
			this.isRunning - true;
		},
		hideView: function() {
			var self = this;
			this.$el.show().animate({
				right: "-"+this.$el.innerWidth()+"px"
			}, 200, function() {
				self.$el.hide();
				playStatus.trigger("richAppComing");
				self.isRunning = false;
			});
		},
		events: {
			"click": "switchDisplay",
			"click .J_convenient_mini_icon": "processPlayerStatus"
		},
		switchDisplay: function() {
			playStatus.trigger("hideTip", true);
			this.hideView();
		},
		processPlayerStatus: function(e) {
			playStatus.trigger("hideTip", true);
			if ( mvCollection.length == 0 ) {
				e.preventDefault();
				return;
			}
			e.stopPropagation();
			if ( cookieStore.get("playlistHasPlayer") ) {
				e.preventDefault();
				var playerStatus = flashStorage.getItem("playlistPlayerStatus");
				if ( playerStatus == "PLAYING" || playerStatus == "BUFFERING" ) {
					playStatus.trigger("playerStatusSwitch", "PAUSED");
					return;
				}
				playStatus.trigger("playerStatusSwitch", "PLAYING");
			}
		},
		changePlayerButtonStatus: function() {
			if ( mvCollection.length == 0 ) return;
			var playerStatus = flashStorage.getItem("playlistPlayerStatus");
			if ( playerStatus == "PLAYING" || playerStatus == "BUFFERING" ) {
				this.elems.icon.removeClass(this.playName);
				this.elems.icon.addClass(this.pauseName);
				this.elems.icon.prop("title", "暂停播放");
				return;
			}
			this.elems.icon.removeClass(this.pauseName);
			this.elems.icon.addClass(this.playName);
			this.elems.icon.prop("title", "开始播放");
		}
	});

	var Controller = Backbone.View.extend({
		el: document.body,
		initialize: function() {
			this.elems = {
				container: $('<div class="convenient-container"></div>'),
				iframe: $('<iframe class="convenient-iframe" scrolling="no" frameborder="0"></iframe>'),
				tip: $('<div class="convenient-tip"></div>')
			};
			this.elems.container.appendTo(this.$el);
			this.elems.iframe.appendTo(this.elems.container);
			this.setTip();
			this.bindEvents();
			this.targetOffset = {};
			this.targetOffset.top = parseInt(this.elems.container.css("top"));  //修改top值定位不准的问题
		},
		bindEvents: function() {
			var self = this;
			if ( prober.browser.name == "ie" && prober.browser.version == 6 ) {
				var initTop = parseInt(this.elems.container.css("top"));
				$(window).on('scroll', function() {
					self.elems.container.css("top", $(window).scrollTop()+initTop+"px");
					if ( self.tipTop ) {
						self.elems.tip.css("top", $(window).scrollTop()+self.tipTop+"px");
					}
				});
			}
		},
		setTip: function() {
			var self = this;
			flashStorage.getItemAsync("playlistNoTip", function(noTip) {
				if ( noTip ) return;
				var $close = $('<a href="javascript:void(0)" class="convenient-icons"></a>');
				$close.appendTo(self.elems.tip);
				self.elems.tip.appendTo(self.$el);
				self.tipTop = parseInt(self.elems.tip.css("top"));
				self.listenToOnce(playStatus, "hideTip", function(flag) {
					if ( !flag ) return;
					self.elems.tip.remove();
					flashStorage.setItem("playlistNoTip", true);
				});
				$close.click(function() {
					playStatus.trigger("hideTip", true);
				});
			});
		},
		events: {
			"mouseenter .J_add_convenient_container": "showButton",
			"mouseleave .J_add_convenient_container": "hideButton",
			"click .J_add_convenient": "addPlaylistId",
			"click .J_add_all_convenient": "addPlaylistIds"
		},
		showButton: function(e) {
			var $target = $(e.currentTarget);
			$target.find(".J_add_convenient").show();
		},
		hideButton: function(e) {
			var $target = $(e.currentTarget);
			$target.find(".J_add_convenient").hide();
		},
		addPlaylistId: function(e) {
			var self = this,
				$target = $(e.currentTarget),
				id = $target.attr("data-video-id"),
				visible = $target.attr("data-visible") == 1;
			id && mvCollection.fetch(id);
			if ( !visible ) {
				$target.addClass("J_add_convenient_active");
			}
			e.preventDefault();
			var $parent = $target.parents(".J_add_convenient_container");
			setTimeout(function() {
				if ( !visible ) {
					$target.remove();
				}
				self.animateToConvenient($parent);
			}, 200);
		},
		addPlaylistIds: function() {
			var videoItems = this.$el.find("[data-video-id]");
			if ( !videoItems.length ) return;
			var ids = [];
			videoItems.each(function() {
				ids.push( $(this).attr("data-video-id") );
			});
			mvCollection.fetchList(ids);
		},
		animateToConvenient: function($parent, callback) {
			var $ele = $parent,
				$clone = $ele.clone().appendTo(this.$el),
				offset = $ele.offset();
			this.targetOffset.left = this.elems.container.offset().left;
			$clone.css({
				position: "absolute",
				opacity: 0.8,
				width: $ele.innerWidth()+"px",
				top: offset.top+"px",
				left: offset.left+"px",
				zIndex: 500
			});
			$clone.animate({
				top: this.targetOffset.top+$(window).scrollTop()+"px",
				left: this.targetOffset.left-$clone.width()+"px",
				opacity: 0
			}, 600, function() {
				$clone.remove();
				callback && callback();
			});
		}
	});

	flashStorage.change = function(id, data) {
		if ( id == "playlistCurrentId" ) {
			playStatus.set("currentId", data);
			return;
		}
		if ( id == "playlistData" ) {
			if ( data && data.length > 0 ) {
				mvCollection.add(data);
			} else {
				mvCollection.reset();
			}
			return;
		}
		if ( id == "playlistPlayerStatus" ) {
			playStatus.set("playerStatus", data);
			return;
		}
		if ( id == "playlistControllPlayerStatus" ) {
			playStatus.set("controllPlayerStatus", data);
			return;
		}
		if ( id == "playlistLastCurrentIndex" ) {
			playStatus.set("lastCurrentIndex", data);
			return;
		}
		if ( id == "playlistCurrentIndex" ) {
			playStatus.set("currentIndex", data);
			return;
		}
		if ( id == "playlistDestroyId" ) {
			mvCollection.destroyId = data;
			playStatus.resetCurrentId();
		}
	};

	function init() {
		mvCollection = new MvCollection;
		playStatus = new PlayStatus;
		controller = new Controller();
		new BasicApp();
		new RichApp();

		flashStorage.getItemAsync("playlistData", function(mvs) {
			if ( mvs && mvs.length > 0 ) {
				mvCollection.add(mvs);
			}
		});
		flashStorage.getItemAsync("playlistPlayerStatus", function(status) {
			playStatus.setInitStatus(status);
		});
	}

	var devices = "pc, mac";
	if (devices.indexOf(prober.device.name) !== -1) {
		init();
	}


	module.exports = {
		mvCollection: mvCollection,
		playStatus: playStatus,
		flashStorage: flashStorage,
		cookieStore: cookieStore,
		playerUrl: playerUrl,
		addDataToConvenient: function(data, callback) {
			if ( typeof data == "object" && data.length ) {
				for(var i=0,range=10;i<data.length;i+=range) {
					mvCollection.fetchList(data.slice(i, i+range).reverse(), callback);
				}
			} else {
				mvCollection.fetch(data);
			}
		},
		animateToConvenient: function($ele, callback) {
			controller.animateToConvenient($ele, callback);
		}
	};
});