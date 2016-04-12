define(function(require, exports, module) {
	var flashLoader = require("modules/yinyuetai/player/flashloader");
	var prober = require("prober");

	$config.flashStorageReady = function() {
		setTimeout(function() {     //解决IE8下回调的时�?�storage为undefined情况
			storage.flashStorage = storage.$el.children()[0];
			storage._setCacheData();
			storage._callGetDataEvents();
		}, 100);
	};

	$config.flashLocalStorageComplete = function(result) {
		storage.storeComplete(result.name, result.data);
	};

	var Storage = Backbone.View.extend({
		id: "flash_local_storage",
		cache: [],
		getDataEventsCache: [],
		attributes: {
			style: "position:fixed;top:0;left:0;width:800px;height:41px;overflow:hidden;z-index:1;_position:absolute"
		},
		initialize: function() {
			this.render();
			this.loadFlash();
			this.bindEvent();
		},
		render: function() {
			this.$el.appendTo(document.body);
		},
		loadFlash: function() {
			flashLoader.render(this.id, {
				swfUrl : Y.domains.urlStatic + "/swf/common/flashlocalstorage.swf?t=2015092512",
				vars : {
					readycallback: "$config.flashStorageReady"
				},
				params: {
					wmode: "transparent",
					bgcolor: ""
				},
				properties: {
					width: 200,
					height: 41
				}
			});
		},
		bindEvent: function() {
			var self = this;
			if ( prober.browser.name == "ie" && prober.browser.version == 6 ) {
				$(window).on('scroll', function() {
					self.$el.css("top", $(window).scrollTop()+"px");
				});
			}
		},
		_setCacheData: function() {
			for(var i= 0,len=this.cache.length;i<len;i++) {
				var obj = this.cache[i];
				this._updateDate(obj.name, obj.value);
			}
			this.cache.length = 0;
		},
		setData: function(id, data) {
			if ( this.isDelete ) {
				return this._deleteData(id);
			}
			if ( !this.flashStorage ) {
				this.cache.push({name: id, value: data});
				return false;
			}
			this._setCacheData();
			return this._updateDate(id, data);
		},
		_deleteData: function(id) {
			if ( !this.flashStorage ) return true;
			return this.flashStorage.clearData(id);
		},
		_updateDate: function(id, value) {
			return this.flashStorage.setData(id, value, "$config.flashLocalStorageComplete");
		},
		storeComplete: function(id, data) {
			exp.change && exp.change(id, data);
		},
		getData: function(id) {
			return this.flashStorage ? this.flashStorage.getData(id).data : false;
		},
		getDataAsync: function(id, callback) {
			if ( this.flashStorage ) {
				callback && callback(this.flashStorage.getData(id));
			} else {
				callback && this.getDataEventsCache.push({
					id: id,
					callback: callback
				});
			}
		},
		_callGetDataEvents: function() {
			for( var i= 0,len=this.getDataEventsCache.length; i<len; i++ ) {
				var dataEvent = this.getDataEventsCache[i];
				dataEvent.callback(this.getData(dataEvent.id));
			}
		}
	});

	var storage = new Storage;

	var exp = {
		setItem: function(key, value) {
			storage.isDelete = false;
			return storage.setData(key, value);
		},
		//异步的获取数据方法，防止获取数据的时候flash对象尚未加载成功
		getItemAsync: function(id, callback) {
			storage.isDelete = false;
			storage.getDataAsync(id, callback);
		},
		getItem: function(key) {
			storage.isDelete = false;
			return storage.getData(key);
		},
		updateItem: function(key, value) {
			storage.isDelete = false;
			return storage.setData(key, value);
		},
		removeItem: function(key) {
			storage.isDelete = true;
			return storage.setData(key, "");
		}
		/*
		change 每次保存成功后悔自动回调此方法
		change: function(id, data) {}
		*/
	};

	module.exports = exp;
});
