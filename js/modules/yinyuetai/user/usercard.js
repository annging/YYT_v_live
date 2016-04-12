/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 13-6-24
 * Time: 下午5:55
 * @fileoverview 用户名片
 */
define(function(require, exports, module) {
	var juicer = require('juicer'),
			follow = require('modules/yinyuetai/user/follow'),
			medal = require("modules/yinyuetai/user/medal"),
			Xhr = require('ajax');

	var DELAY_TIME = 200; //延迟触发时间

	var Card = Backbone.Model.extend({
		initialize : function(json) {
			this.set(json);
		}
	});

	var Cards = Backbone.Collection.extend({
		model : Card
	});
	var cards = new Cards();

	var CardView = Backbone.View.extend({
		options : {
		},
		events : {
			'click .J_follow' : 'follow',
			'click .J_followed,.J_mutualFollowed' : 'removeFollow',
			'click .J_letter' : 'letter',
			'click .J_remark' : 'remark'
		},
		tpl : [
			'<div style="position:relative;z-index:2">',
			'<div class="popup_card_arrow"><em class="arrow1">◆</em><span class="arrow2">◆</span></div>',
			'<div class="popup_card">',
			'<span class="p_name_roun"></span>',
			'<div class="p_name_info c_6">',
			'<div class="avatar">',
			'<a href="http://i.yinyuetai.com/{{userId}}" title="{{userFullName}}" target="_blank">',
			'<img src="{{headImg}}" width="60" height="60" alt="{{userFullName}}">',
			'</a>',
			'{@if isOnline}',
			'<span class="user_online"></span>',
			'{@/if}',
			'</div>',
			'<h4 name="userInfo">',
			'{@if logined && remarkName}',
			'<a href="http://i.yinyuetai.com/{{userId}}" title="{{remarkName}}" {@if vipLevel>0} class="txt_vip_levels"{@else} class="special"{@/if}  target="_blank" class="special" name="remarkName">{{remarkName}}</a> ',
			'&nbsp;(<span name="userName" {@if vipLevel>0}style="color:#C00"{@/if} title="{{userFullName}}">{{userFullName}}</span>)&nbsp;',
			'{@if authReward.iconUrl}',
			'<a href="http://i.yinyuetai.com/authen/index" target="_blank" title="认证" style="cursor: pointer;"><img src="{{authReward.iconUrl}}" width="17" height="17" title="{{authReward.description}}" alt="{{authReward.description}}"></a>&nbsp;',
			'{@/if}',
			'{@if vipLevel>0}<a title="VIP{{vipLevel}}级" class="ico_vip_levels ico_vip_levels_{{vipLevel}}" href="http://vip.yinyuetai.com" target="_blank"></a>{@/if}&nbsp;',
			'<a href="javascript:;" title="修改备注" class="p_gender c_6 J_remark">修改</a>',

			'{@else}',
			'<a href="http://i.yinyuetai.com/{{userId}}" title="{{userFullName}}"  {@if vipLevel>0} class="txt_vip_levels"{@else} class="special"{@/if} target="_blank" name="userName">{{userFullName}}</a> ',
			'{@if authReward.iconUrl}',
			'<a href="http://i.yinyuetai.com/authen/index" target="_blank" title="认证" style="cursor: pointer;"><img src="{{authReward.iconUrl}}" width="17" height="17" title="{{authReward.description}}" alt="{{authReward.description}}"></a>&nbsp;',
			'{@/if}',
			'{@if vipLevel>0}<a title="VIP{{vipLevel}}级" class="ico_vip_levels ico_vip_levels_{{vipLevel}}" href="http://vip.yinyuetai.com" target="_blank"></a>{@/if}&nbsp;&nbsp;',
			'{@if logined && isFollow}<a href="javascript:;" title="设置备注" class="c_6 J_remark" flag="1">备注</a>{@/if}',

			'{@/if}',
			'</h4>',
			'<div class="p_gender c_9"><span class="ico_boy">{{sex}}</span> ',
			'{@if address}',
			'<span class="ico_address"><em class="c_c"> 来自：</em>{{address}}</span>',
			'{@/if}',
			'</div>',

			'<ul class="p_userdata">',
			'<li><a href="http://i.yinyuetai.com/{{userId}}/friend" target="_blank">关注</a>{{myFollower}}</li>',
			'<li><a href="http://i.yinyuetai.com/{{userId}}/friend/fans" target="_blank">粉丝</a>{{myFans}}</li>',
			'<li><a href="http://i.yinyuetai.com/{{userId}}"  target="_blank">等级</a> {{level}}</li>',
			'</ul>',
			'</div>',

			'<div class="p_conbg">',
			'{@if medalSimpleViewModels.length > 0}', //用户勋章start
			'<div class="p_card_btn medalBox">',
			'{@if medalSimpleViewModels.length > 10}<a class="left"><i></i></a>{@/if}',
			'<div class="medals">',
			'<div class="items" style="position:relative;width:2000px">',
			'{@each medalSimpleViewModels as list,index}',
			'<img src="{{list.medalImg}}" class="fl" title="{{list.medalName}}" alt="{{list.medalName}}">',
			'{@/each}',
			'</div>',
			'</div>',
			'{@if medalSimpleViewModels.length > 10}<a class="right"><i></i></a>{@/if}',
			'</div>',
			'{@/if}', //用户勋章end

			'<p class="p_userinfo c_6">', //用户签名start
			'{@if signature}',
			'{{signature}}</p>',
			'{@else}',
			'这家伙很懒，什么也没留下~',
			'{@/if}', ////用户签名end

			'<div class="p_card_btn">', //关注按钮，发私信
			'{@if !isSelf}',
			'<a href="javascript:void(0)" title="发站内信" class="ico_card_letter fr mr_l10 J_letter" name="send_message">发私信<span></span></a>',
			'{@if isFriend &&  isFollow}',
			'<a href="javascript:void(0)" title="取消关注" class="ico_card_mutual fr J_mutualFollowed">互相关注</a>',
			'{@else if isFollow && !isFriend}',
			'<a href="javascript:void(0)" title="取消关注" class="ico_card_has fr J_followed">已关注</a>',
			'{@else}',
			'<a href="javascript:;" title="加关注" class="ico_card_follow fr J_follow">加关注</a>',
			'{@/if}',
			'{@/if}',
			'</div>',
			'</div>',
			'</div>',
			'</div>'
		].join(''),
		loadingTpl : ['<div style="position:relative;z-index:2">',
			'<div class="popup_card_arrow"><em class="arrow1">◆</em><span class="arrow2">◆</span></div>',
			'<div class="popup_card"><span class="p_name_roun"></span>',
			'<div class="p_conbg p_loading">',
			'加载中，请稍候……',
			'</div>',
			'</div>',
			'</div>'].join(''),
		initialize : function(options) {
			var $target = this.options.$target;

			this.userId = $target.data('userId') || $target.attr('userid');

			this.fetch();

		},
		fetch : function() {
			var context = this;
			var card = cards.get(this.userId);
			if (card && context.model) {
				context.model = card;
				context.modelEvents();
				context.render();
				return;
			}
			this.xhr = Xhr.ajax({
				url : Y.domains.homeSite + '/person/get-user-card',
				data : 'userId=' + this.userId,
				beforeSend : function() {
					context.loading();
				},
				success : function(result) {
					if (result.error) {
						//alert(result.message);
					} else {
						context.logined = result.logined;
						var options = $.extend(result.userCard, {
							id : context.userId
						});
						card = context.model = new Card(options);
						context.modelEvents();

						cards.add(card);
						context.render();
					}
				}
			})
		},
		iframe : function() {
			return $('<iframe />').attr({
				'frameborder' : 0,
				'scrolling' : 'no',
				'class' : 'iframeshim'
			}).css({
						'position' : 'absolute',
						'top' : 1,
						'left' : 1,
						'width' : '99.2%',
						'height' : '100%',
						'zIndex' : 1,
						'background' : 'transparent'
					});
		},
		modelEvents : function() {
			var context = this;
			this.model.bind('change:isFollow', function() {
				context.render();
			});
		},
		render : function($target) {
			if ($target && $target.length > 0) {
				this.options.$target = $target;
			}
			var data = this.model.toJSON();
			data['logined'] = this.logined;
			this.$el.html(juicer.to_html(this.tpl, data));
			this.iframe().prependTo(this.$el);
			this.setPosition();
			this.medals();//勋章
		},

		setPosition : function() {
			var $target = this.options.$target, $win = $(window);
			var targetOffset = $target.offset();
			var elSize = {
				w : this.$el.width(),
				h : this.$el.height()
			};
			var targetSize = {
				w : $target.width(),
				h : $target.height()
			};

			var winSize = {
				w : $win.width(),
				h : $win.height()
			};

			//默认位置在上方，左对齐
			var resultPos = $.extend(this.top(targetOffset, elSize, targetSize), this.left(targetOffset, elSize, targetSize));
			if (targetOffset.left - $win.scrollLeft() <= winSize.w * .5) {//显示在右边
				resultPos = $.extend(resultPos, this.right(targetOffset, elSize, targetSize));
			}
			if (targetOffset.top - targetSize.h - $win.scrollTop() <= winSize.h * .5) {
				resultPos = $.extend(resultPos, this.bottom(targetOffset, elSize, targetSize));
			}

			this.$el.css({
				left : resultPos.x,
				top : resultPos.y
			});
			this.$el.attr('class', 'usercard_box ' + resultPos.csslr + ' ' + resultPos.csstb);
			this.show();
		},
		left : function(targetOffset, elSize, targetSize) {
			return {
				x : targetOffset.left + targetSize.w * .5 - elSize.w + 40,
				csslr : 'p_left'
			};
		},
		right : function(targetOffset, elSize, targetSize) {
			return {
				x : targetOffset.left + targetSize.w * .5 - 40,
				csslr : 'p_right'
			};
		},
		top : function(targetOffset, elSize, targetSize) {
			return {
				y : targetOffset.top - elSize.h - 5,
				csstb : 'p_top'
			};
		},
		bottom : function(targetOffset, elSize, targetSize) {
			return {
				y : targetOffset.top + targetSize.h + 10,
				csstb : 'p_bottom'
			}
		},

		loading : function() {
			this.$el.html(this.loadingTpl);
			this.iframe().prependTo(this.$el);
			this.setPosition();
		},
		hide : function() {
			if (this.xhr) {
				this.xhr.abort();
			}
			this.$el.fadeOut();
		},
		show : function() {
			this.$el.fadeIn();
		},
		follow : function() {
			var context = this;
			follow.follow(this.userId, function(userId, isFriend) {
				if (isFriend) {
					context.model.set({
						'isFriend' : true
					});
				}
				context.model.set({
					'isFollow' : true
				});
			});
		},
		removeFollow : function() {
			var context = this;
			follow.removeFollow(this.userId, function() {
				context.model.set({
					'isFollow' : false,
					'isFriend' : false
				});
			});
		},
		letter : function() {
			var model, data = {};

			model = this.model;
			data = {
				userId : model.get("userId"),
				imgUrl : model.get("headImg"),
				userName : model.get("remarkName") ? model.get("remarkName") : model.get("userFullName")
			};

			require(['modules/yinyuetai/user/letter'], function(letter) {
				letter(data);
			});
		},
		remark : function() {
			var model, data = {}, callback;

			model = this.model;
			data = {
				userId : model.get("userId"),
				remarkName : model.get("remarkName")
			};

			callback = function(ret) {
				if (!ret.error && ret.personRemark) {
					model.set({remarkName : ret.personRemark.remarkName});
				}
			};

			require(["modules/yinyuetai/user/remark"], function(remark) {
				remark(data, callback);
			});
		},
		medals : function(){//勋章
			var box = $(".medalBox"),
				slide = new medal(box);

			box.on("click",".left",function(){
				slide.left();
			});
			box.on("click",".right",function(){
				slide.right();
			});
		}
	});

	var AppView = Backbone.View.extend({
		options : {
			el : 'body'
		},
		events : {
			'mouseenter .usercard,.J_usercard' : '_mouseenter',
			'mouseleave .usercard,.J_usercard' : '_mouseleave'
		},
		initialize : function(options) {
			this.entertimers = [];
			this.leavetimers = [];
			this.cardViews = [];
		},
		_mouseenter : function(e) {
			this.onMouseEnter($(e.currentTarget));
		},
		_mouseleave : function(e) {
			this.onMouseLeave($(e.currentTarget));
		},
		onMouseEnter : function($target) {
			var context = this;
			var userId = $target.data('userId') || $target.attr('userid');
			var view = context.cardViews[userId];
			clearTimeout(this.leavetimers[userId]);
			this.entertimers[userId] = setTimeout(function() {
				if (view) {
					if (view.options.$target !== $target) {
						view.render($target);
					}
				} else {
					context.destroyOtherView();
					var options = {};
					options.$target = $target;
					options.el = $('<div class="usercard_box"></div>').appendTo(document.body);
					view = context.cardViews[userId] = new CardView(options);
					options.el.hover(function() {
						context.onMouseEnter(view.options.$target);
					}, function() {
						context.onMouseLeave(view.options.$target);
					});
				}
			}, DELAY_TIME);
		},
		onMouseLeave : function($target) {
			var context = this;
			var userId = $target.data('userId') || $target.attr('userid');
			var view = context.cardViews[userId];
			clearTimeout(this.entertimers[userId]);
			this.leavetimers[userId] = setTimeout(function() {
				if (view) {
					view.hide();
				}
			}, DELAY_TIME);
		},
		destroyOtherView : function() {
			this.cardViews = [];
			$('.usercard_box').remove();
		}
	});

	module.exports = new AppView();
});