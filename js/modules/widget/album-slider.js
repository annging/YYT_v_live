define(function(require, exports, module) {
	function AlbumSlider(container, config) {
		if ( !(this.container = container) ) return;
		this.config = _.extend({
			slideTime: 800,
			stayTime: 5000,
			auto: true,
			itemsContainer: this.container.find( ".slider-items-container")
		}, config||{});

		this._init();
	}
	_.extend(AlbumSlider.prototype, {
		//初始化入口
		_init: function() {
			this._initData();
			if ( this.itemsNumber == 1 ) return;
			if ( this.config.auto ) {
				this._countTime();
			}
		},
		_initData: function() {
			//内容容器
			this.content = this.config.itemsContainer.children();
			this.itemsNumber = this.content.size();
			//单个内容条目的宽度
			this.itemWidth = this.content.eq(0).innerWidth();
			//设置滚动容器的宽度
			this.config.itemsContainer.css("width", this.itemWidth*this.itemsNumber);
			//设置图片容器信息
			this.config.itemsContainer.css("position", "absolute");

			this.index = 0;
		},

		_countTime: function() {
			var self = this;
			this._count = setTimeout(function() {
				self._go(1);
			}, this.config.stayTime);
		},
		//执行动画的方法
		_switchTo: function(dir, item) {
			var self = this,
				item = item || 1,
				dirString = dir > 0 ? "-=" : "+=";
			if ( dir > 0 && this.index == 0 ) {
				this.content.eq(this.index).css({
					position: "relative",
					left: this.itemsNumber*this.itemWidth+"px"
				});
			} else if ( dir < 0 && this.index == this.itemsNumber-1 ) {
				this.content.eq(this.index).css({
					position: "relative",
					left: "-"+this.itemsNumber*this.itemWidth+"px"
				});
			}
			this.config.itemsContainer.animate({
				left: dirString+(item*this.itemWidth)+"px"
			}, this.config.slideTime, function() {
				if ( dir > 0 && self.index == 0 ) {
					self.content.eq(self.index).css({
						left: 0
					});
					self.config.itemsContainer.css("left", 0);
				} else if ( dir < 0 && self.index == self.itemsNumber-1 ) {
					self.content.eq(self.index).css({
						left: 0
					});
					self.config.itemsContainer.css("left", "-"+(self.itemsNumber-1)*self.itemWidth+"px");
				}
				self._sliding = false;
				self.config.end && self.config.end(self.index);
				if ( self.config.auto ) {
					self._countTime();
				}
			});
		},
		_go: function(dir) {
			if ( this._sliding ) return;
			this._sliding = true;
			if ( dir > 0 ) {
				if ( this.index == this.itemsNumber-1 ) {
					this.index = 0;
				} else {
					this.index++;
				}

			} else {
				if ( this.index == 0 ) {
					this.index = this.itemsNumber-1;
				} else {
					this.index--;
				}

			}
			this.config.start && this.config.start(this.index);
			this._switchTo(dir);
		},
		switchTo: function(index) {
			var dir, item;
			if ( index < 0 || index > this.itemsNumber-1 || this._sliding || this.index == index ) return;
			dir = index > this.index ? 1 : -1;
			this._sliding = true;
			item = Math.abs(this.index-index);
			this.index = index;
			clearTimeout(this._count || null);
			this.config.start && this.config.start(this.index);
			this._switchTo(dir, item);
		},
		go: function(dir) {
			if ( typeof dir != "number" || this.itemsNumber == 1 ) return;
			clearTimeout(this._count || null);
			if ( dir >= 0 ) {
				this._go(1);
			} else {
				this._go(-1);
			}
		}
	});

	/*
	对外接口：
	{
		switchTo: function(index) {} 指定跳转到的位置
		start: function(index) {} 切换开始
		end: function(index) {} 切换结束
	}
	 */

	module.exports = AlbumSlider;
});