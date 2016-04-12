/*
 Syntax:
 var slide = new Slide(element,[,options]);
 options:
 data : [{
 src : '/v2/images/file/index_focus.jpg',
 title : '泛欧西',
 text : '比利时/意大利流行天后 Lara Fabian 新作《Deux Ils, Deux Elles》。<br>Lara Fabian：1970年1月9日出生于比利时-埃尔泰贝克，比利时/意大利国际流行天后，同时拥有加拿大国籍。主要演唱法语、意大利语和英语歌曲，但她还会用西班牙语、葡萄牙语、俄语、希伯来语、希腊语和德语演唱。'
 }],
 effect : 'fade'/'slide'
 */
define(function(require, exports, module) {
	require('jquery.touchswap');

	var View = Backbone.View.extend({
		options : {
			effect : 'fade',
			duration : 7000
		},
		events : {
			"click .J_toggle" : "toggle",
			"click .J_goto" : "goto",
			"mouseenter" : "pause",
			"mouseleave" : "play"
		},
		initialize : function(options) {
			$.extend(this.options, options);
			var context = this;
			this.render(options.data);
			this.current = 0;
			this.show(this.current);
			this.$el.swipe({
				//Generic swipe handler for all directions
				swipe : function(event, direction, distance, duration, fingerCount) {
					if (direction == "right") {
						context.go('prev');
					} else {
						context.go('next');
					}
				},
				excludedElements : [],
				fingers : 'all'
			});
		},
		render : function(data) {
			var juicer = require('juicer'), $nav;
			if (data) {
				this.count = data.length;
				this.$el.html(juicer.to_html(this.tpl, {images : data}));
			}
			else {
				var count = this.count = this.$el.find('li').length;
				if (this.count > 1) {
					var html = [];
					for (var i = 0; i < count; i++) {
						if (i == 0) {
							html.push('<a href="javascript:;" class="J_goto cur" data-index="' + i + '">●</a>');
						} else {
							html.push('<a href="javascript:;" class="J_goto" data-index="' + i + '">●</a>');
						}
					}
					$nav = this.$el.find('.J_nav');
					$nav.html(html.join(''));

					this.$el.find('.J_toggle').show();
				}
			}
			$nav = $nav || this.$el.find('.J_nav');
			$nav.css('margin-left', 0 - $nav.width() / 2);
			this.$item = this.$el.find('li');
			this.$pointer = $nav.find('a');
			if (this.options.effect == "slide") {
				this.slideInit();
			}
		},
		tpl : [
			'{@if images.length>0}',
			'<a href="javascript:;" class="index_focus_pre J_toggle" data-direction="prev" title="上一张">上一张</a>',
			'<a href="javascript:;" class="index_focus_next J_toggle" data-direction="next" title="下一张">下一张</a>',
			'{@/if}',
			'<ul>',
			'{@each images as image}',
			'<li>',
			'<a href="#" class="pic" title="">',
			'<div class="index_focus_info J_focus_info">',
			'<h3>{{image.title}}</h3>',
			'<p class="text">{{{image.text}}}</p>',
			'</div>',
			'<img class="pic" src="{{image.src}}" width="1600" height="600" alt=""/>',
			'</a>',
			'</li>',
			'{@/each}',
			'</ul>',
			'<div class="slide_nav J_nav">',
			'{@if images.length>0}',
			'{@each images as image,index}',
			'<a href="javascript:;" class="J_goto" data-index="{{index}}"{@if index==0} class="cur"{@/if}>●</a>',
			'{@/each}',
			'{@/if}',
			'</div>'].join(''),
		toggle : function(e) {
			var direction = $(e.currentTarget).data().direction;
			this.go(direction);
		},
		go : function(direction) {
			if (direction == 'prev') {
				var index = this.current - 1;
				if (index < 0) {
					index = this.count - 1;
				}
			} else {
				var index = this.current + 1;
				if (index >= this.count) {
					index = 0;
				}
			}
			this.show(index, direction);
		},
		goto : function(e) {
			var index = $(e.currentTarget).data().index;
			if (this.current != index) {
				this.show(index, this.current > index ? 'prev' : 'next');
			}
		},
		auto : function() {
			if (this.count > 1) {
				var context = this;
				clearTimeout(this._t);
				if (!this.isPause) {
					this._t = setTimeout(function() {
						context.go('next');
					}, this.options.duration);
				}
			}
		},
		show : function(index, direction) {
			var $prevImg = $(this.$item[this.current]), $nextImg = $(this.$item[index]);
			if (this.options.effect == "fade") {
				this.fade($prevImg, $nextImg);
			} else if (this.options.effect == "slide") {
				if (direction) {
					this.slide($prevImg, $nextImg, direction);
				} else {
					$nextImg.show();
					this.onShowNext($nextImg);
				}
			}
			$(this.$pointer[this.current]).removeClass('cur');
			$(this.$pointer[index]).addClass('cur');
			this.current = index;
		},
		fade : function($prevImg, $nextImg) {
			var context = this;
			$prevImg.stop(true, true).fadeOut(600, function() {
				context.onHidePrev($prevImg);
			});

			$nextImg.stop(true, true).fadeIn(600, function() {
				context.onShowNext($(this));
			});
		},
		slide : function($prevImg, $nextImg, direction) {
			var context = this, $clone = $nextImg.clone().show(), toward;
			if (direction == 'next') {
				$prevImg.after($clone);
				toward = -this.imgWidth;

			} else if (direction == 'prev') {
				$prevImg.before($clone);
				this.$ul.css('margin-left', -this.imgWidth);
				toward = 0;
			}
			this.$ul.stop(true, true).animate({'margin-left' : toward}, 600, function() {
				$clone.remove();
				$prevImg.hide();
				$nextImg.show();
				context.$ul.css('margin-left', 0);
				context.onHidePrev($prevImg);
				context.onShowNext($nextImg);
			});
		},
		slideInit : function() {
			this.$ul = this.$el.find('ul');
			this.imgWidth = this.$item.width();
			this.$ul.css('width', this.imgWidth * 2);
		},
		onHidePrev : function($prevImg) {
			this.findInfo($prevImg).hide();
			this.findTitle($prevImg).stop(true, true).hide();
			this.findText($prevImg).hide();
		},
		onShowNext : function($nextImg) {
			var context = this;
			this.findInfo($nextImg).show();
			this.findTitle($nextImg).fadeIn().queue(function() {
				var $this = $(this);
				context.findText($nextImg).fadeIn(function() {
					$this.dequeue();
				})
			});
			this.auto();
		},
		findInfo : function($Img) {
			return $Img.find('.J_focus_info');
		},
		findTitle : function($Img) {
			return $Img.find('h3');
		},
		findDesc : function($Img) {
			return $Img.find('h4');
		},
		findText : function($Img) {
			return $Img.find('.text');
		},
		pause : function() {
			clearTimeout(this._t);
			this.isPause = true;
		},
		play : function() {
			this.isPause = false;
			this.auto();
		}
	});

	var Slide = function(el, opts) {
		var options = opts || {};
		options.el = el;
		return new View(options);
	};
	module.exports = Slide;
})
