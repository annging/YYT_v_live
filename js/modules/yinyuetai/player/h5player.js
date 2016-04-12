/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 13-7-2
 * Time: 上午10:24
 * @fileoverview html5播放器
 */
define(function(require, exports, module) {

	var juicer = require('juicer');

	var Ajax = require('ajax');

	var Player = Backbone.View.extend({
		TIMEOUT : 5000, //隔5s controls自动消失
		controlsShowing : true,
		tpl : ['<div class="controls">',
			'<div class="progressbar_bg">',
			'<div class="progressbar">',
			'<div class="track"></div>',
			'<div class="handle" draggable="true"></div>',
			'</div>',
			'</div>',
			'<div class="player_buttons">',
			'<a class="fl player_button start" href="javascript:void(0)"><span>开始/暂停</span></a>',
			'<div class="fl time"><span class="current">00:00</span>|<span class="duration">{{duration|formatTime}}</span></div>',
			'<a class="fr player_button fullscreen" href="javascript:void(0)"><span>全屏/退出全屏</span></a>',
			'<div class="fr controls_playmode">',
			'{@if hcVideoUrl}<a class="fl player_button hc active" data-mode="hc" href="javascript:void(0)">流畅</a>{@/if}',
			'{@if hdVideoUrl}<a class="fl player_button hd" data-mode="hd" href="javascript:void(0)">高清</a>{@/if}',
			'{@if heVideoUrl}<a class="fl player_button he" data-mode="he" href="javascript:void(0)">超清</a>{@/if}',
			'</div>',
			'</div>',
			'</div>',
			'</div>'].join(''),
		options : {
			videoId : 531656,
			playerId : 192073//不支持
		},
		initialize : function(options) {
			juicer.register('formatTime', this.formatTime);
			this.$el.addClass('player_html5');
			var context = this;
			context.$video = context.$el.find('video');
			context.video = context.$video[0];
			context.video.controls = false;

			context.options = $.extend(context.options, options);
			context.duration = context.options.duration * 1;
			$(juicer.to_html(context.tpl, context.options)).appendTo(context.$el);
			context.$controls = context.$el.find('.controls');
			context.$progressbar = context.$el.find('.progressbar');
			context.$track = context.$el.find('.track');
			context.$handle = context.$el.find('.handle');
			context.$play = context.$el.find('.start');
			context.$duration = context.$el.find('.duration');
			context.$current = context.$el.find('.current');
			context.$fullscreen = context.$el.find('.fullscreen');
			context.$playmode = context.$el.find('.controls_playmode');
			var $progressbarWidth = context.$progressbar.width() - 10;//减掉padding
			context.$handleWidth = context.$handle.width() - 3;//变成偶数
			context.$progressbar.css('width', $progressbarWidth + 'px');
			context.maxHandelLeft = $progressbarWidth - context.$handleWidth;
			context.maxTrackWidth = $progressbarWidth;
			context.bind();
			context.fadeTimer = setTimeout(function() {
				context.fadeOut();
			}, context.TIMEOUT);
		},
		bind : function() {
			var context = this, $doc = $(document.body);
			var cantouch = "ontouchend" in document;
			if (cantouch) {
				this.$el.on('touchstart', function(e) {
					if (context.video.paused || context.video.ended) {
						return;
					}
					if (context.controlsShowing) {
						context.fadeOut();
					} else {
						context.fadeIn();
					}
				});
				this.$el.on('touchend', function() {
					if (context.controlsShowing) {
						context.fadeTimer = setTimeout(function() {
							context.fadeOut();
						}, context.TIMEOUT);
					}
				});
			}
			this.$el.on({
				'mouseenter' : $.proxy(this.fadeIn, this),
				'mouseleave' : $.proxy(this.fadeOut, this)
			});
			this.video.addEventListener('play', $.proxy(this.onPlay, this), false);
			this.video.addEventListener('pause', $.proxy(this.onPause, this), false);
			this.video.addEventListener('ended', $.proxy(this.onPause, this), false);

			this.video.addEventListener('durationchange', function() {
				context.duration = context.video.duration;
				context.$duration.text(context.formatTime(context.duration));
			}, false);
			this.video.addEventListener('timeupdate', $.proxy(this.onTimeupdate, this), false);
			//this.video.addEventListener('webkitfullscreenchange', this.onFullscreen.bind(this), false);

			/**************用户事件***********/
			this.$controls.on('touchstart', function(e) {
				if (context.controlsShowing) {
					clearTimeout(context.fadeTimer);
					e.stopPropagation();
				}
			});
			//播放暂停
			this.$play.on('click', function(e) {
				if (context.video.paused) {
					context.video.play();
				} else if (context.video.ended) {
					context.video.currentTime = 0;
					context.video.play();
				} else {
					context.video.pause();
				}
			});
			//全屏
			var fullScreened = false;
			var enterFullScreen = function() {
				fullScreened = true;
				context.$fullscreen.addClass('fullscreen_esc');
				context.$el.addClass('player_fullscreen');
				$doc.css({
					'height' : '100%',
					'overflow' : 'hidden'
				});
				var $win = $(window);
				$(context.video).css({
					'width' : $win.width(),
					'height' : $win.height()
				})
			};
			var exitFullScreen = function() {
				fullScreened = false;
				context.$fullscreen.removeClass('fullscreen_esc');
				context.$el.removeClass('player_fullscreen');
				$doc.css({
					'height' : 'auto',
					'overflow' : 'visible'
				});
				$(context.video).css({
					'width' : this.options.width,
					'height' : this.options.height
				})
			};
			this.$fullscreen.on('click', function(e) {
				var video = document.createElement('video');
				if (video.webkitEnterFullScreen) {
					context.video.webkitEnterFullScreen();
				} else if (video.mozRequestFullScreen) {
					context.video.mozRequestFullScreen();
				} else if (video.requestFullScreen) {//和下面的只有S大小写区别，小写为W3C
					context.video.requestFullScreen();
				} else if (video.requestFullscreen) {
					context.video.requestFullscreen();
				} else {//不支持全屏APi的IE10
					if (!fullScreened) {
						$doc.off('keyup').on('keyup', function(event) {
							if (event.code == 27) {//按esc键
								if (fullScreened) {
									exitFullScreen();
								}
							}
						});
						enterFullScreen();
					} else {
						exitFullScreen();
					}
				}
			});
			//拖拽
			this.$handle[0].addEventListener((cantouch) ? 'touchstart' : 'mousedown', function(e) {
				e = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
				context.onDragStart(e);
			});
			$doc[0].addEventListener((cantouch) ? 'touchend' : 'mouseup', function(e) {
				e = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
				context.onDrop(e);
			});
			$doc[0].addEventListener((cantouch) ? 'touchmove' : 'mousemove', function(e) {
				e = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
				context.onDrag(e);
			});
			//定位
			this.$progressbar.on('click', function(e) {
				var posX = e.pageX - context.$progressbar.offset().left - context.$handleWidth * .5;
				context.$handle.css('left', posX + 'px');
				var percent = posX / context.maxHandelLeft;
				context.video.currentTime = Math.floor(context.duration * percent);
				context.video.play();
			});
			//清晰度
			var $playmodes = this.$playmode.find('a');
			this.$playmode.on('click', 'a', function(evt) {
				var target = $(evt.target);
				if (target.hasClass('active')) {
					return;
				}
				$playmodes.removeClass('active');
				target.addClass('active');
				var playMode = target.data('mode');
				context.onChangePlayMode(playMode);

			});
		},
		onChangePlayMode : function(playMode) {
			var context = this;
			var currentTime = context.video.currentTime * 1;
			var flvUrl = context.options[playMode + 'VideoUrl'] + '&rd=html5';
			if (flvUrl) {
				var continuePlay = function() {
					context.video.removeEventListener('canplay', continuePlay, false);
					setTimeout(function() {
						context.video.currentTime = currentTime;
						context.video.play();
					}, 1000);//延迟1s
				};
				context.video.addEventListener('canplay', continuePlay, false);
				context.$video.attr('src', flvUrl);
				context.$video.find('source').attr('src', flvUrl);
				context.video.load();
			}
		},
		onDragStart : function(e) {
			e.preventDefault && e.preventDefault();//ipad不支持preventDefault
			this.dragstart = true;
			this.handlePosX = e.pageX - this.$handle.position().left;

		},
		onDrag : function(e) {
			e.preventDefault && e.preventDefault();
			if (this.dragstart) {
				var posX = e.pageX - this.$progressbar.position().left - this.handlePosX;
				if (posX < 0 || posX > this.maxHandelLeft) {
					return;
				}
				this.$handle.css('left', posX + 'px');
			}
		},
		onDrop : function(e) {
			if (this.dragstart) {
				this.dragstart = false;
				var left = this.$handle.position().left;
				var percent = left / this.maxHandelLeft;
				this.video.currentTime = Math.floor(this.duration * percent);
				this.video.play();
			}
		},
		fadeIn : function() {
			clearTimeout(this.fadeTimer);
			this.controlsShowing = true;
			this.$controls.fadeIn();
		},
		fadeOut : function() {
			if (this.video.paused || this.video.ended) {
				return;
			}
			clearTimeout(this.fadeTimer);
			this.controlsShowing = false;
			this.$controls.fadeOut();
		},
		onPlay : function() {
			this.$play.attr('class', this.$play.attr('class').replace('start', 'pause'));
		},
		onPause : function() {
			this.$play.attr('class', this.$play.attr('class').replace('pause', 'start'));
			this.fadeIn();
		},
		onTimeupdate : function() {
			var currentTime = this.video.currentTime;
			this.$current.text(this.formatTime(currentTime));
			if (!this.dragstart) {
				var percent = currentTime / this.duration;
				var width = Math.ceil(percent * this.maxTrackWidth),
						left = Math.ceil(percent * this.maxHandelLeft);
				this.$track.css('width', width + 'px');
				this.$handle.css('left', left + 'px');
			}
		},
		formatTime : function(time) {
			time = Math.round(time);
			var sec = time % 60, min = Math.floor(time / 60);
			return ("0" + min).substr(-2) + ":" + ("0" + sec).substr(-2);
		},
		onFullscreen : function() {
			//this.$fullscreen.toggleClass('fullscreen_esc');
		}
	});

	function H5player(element, options) {
		options = options || {};
		options.el = element;
		return new Player(options);
	}

	return H5player;
});