define(function(require, exports, module) {
	var PowerTextarea = require('modules/widget/textarea/powertextarea');
	var juicer = require('juicer');
	var Ajax = require('ajax');
	var CommentForm = require('modules/yinyuetai/comment/commentform');
	var Page = require('page');
	var alertify = require('alertify');
	var user = require('user');
	var usercard = require('modules/yinyuetai/user/usercard');

	var CommentList = Backbone.View.extend({
		options : {
			maxCount : 500,
			listUrl : Y.comment.listUrl,
			hotListUrl : Y.comment.hotListUrl,
			commentUrl : Y.comment.createUrl,
			replyUrl : Y.comment.replyUrl,
			supportUrl : Y.comment.supportUrl,
			reportUrl : "report/create-report"
		},
		events : {
			'click .J_show_reply' : 'showReply',
			'click .J_support' : 'support',
			'click .J_report' : 'report',
			'click .J_add_reply' : 'addReply',
			'click .J_syn' : 'addSyn',
			'click .J_page' : 'loadPage',
			'click .J_goto' : 'goto',
			'click .J_share' : 'share'
		},
		commentListTpl : [
			'<ul class="ct_box">',
			'{@each comments as comment}',
			'<li class="ct_list" data-floor="{{comment.floorInt}}">',
			'<a href="http://i.yinyuetai.com/{{comment.userId}}" target="_blank" class="avatar J_usercard" data-user-id="{{comment.userId}}" title="{{comment.userName}}">',
			'<img src="{{comment.userHeadImg}}" width="50" height="50" alt="{{comment.userName}}"></a>',
			'<div class="ct_content">',
			'<a href="http://i.yinyuetai.com/{{comment.userId}}" target="_blank" {@if comment.vipLevel>0} class="name txt_vip_levels J_usercard"{@else} class="name special J_usercard"{@/if} data-user-id="{{comment.userId}}" title="">{{comment.userName}}</a>',
			'{@if comment.vipLevel>0}<a title="VIP{{comment.vipLevel}}级" class="ico_vip_levels ico_vip_levels_{{comment.vipLevel}}" href="http://vip.yinyuetai.com" target="_blank"></a>&nbsp;{@/if}',
			'<span class="c_9">{{comment.dateCreated}}</span>',
			'{@if comment.repliedFloorInt}',
			'<span class="pd_l10 c_9">回复</span>',
			'<a href="javascript:;" class="special J_goto" data-floor="{{comment.repliedFloorInt}}" title="{{comment.repliedUserName}}">{{comment.repliedFloorInt}}楼:</a>',
			'{@/if}',

			'<p class="ct_info">',
			'{{{comment.content}}}',
			'</p>',
			'{@if comment.quotedContent}',
			'<div class="ct_reply clearfix">',
			'<div class="arrow_top">',
			'<em class="arrow_top1">◆</em>',
			'<span class="arrow_top2">◆</span>',
			'</div>',

			'<a href="http://i.yinyuetai.com/{{comment.repliedUserId}}" target="_blank" class="avatar J_usercard" data-user-id="{{comment.repliedUserId}}" title="{{comment.repliedUserName}}">',
			'<img src="{{comment.repliedHeadImg}}" width="30" height="30" alt="{{comment.repliedUserName}}"></a>',
			'<a href="http://i.yinyuetai.com/{{comment.repliedUserId}}" {@if comment.repliedUserVipLevel>0} class="txt_vip_levels name J_usercard"{@else}  class="special name J_usercard"{@/if} data-user-id="{{comment.repliedUserId}}" title="{{comment.repliedUserName}}">{{comment.repliedUserName}}</a>{@if comment.repliedUserVipLevel>0}<a title="VIP{{comment.repliedUserVipLevel}}级" class="ico_vip_levels ico_vip_levels_{{comment.repliedUserVipLevel}}" href="http://vip.yinyuetai.com" target="_blank"></a>{@/if}&nbsp;: ',
			'{{{comment.quotedContent}}}',
			'</div>',
			'{@/if}',
			'<div class="ct_oper">',
			'{@if comment.floorInt}',
			'<span class="fl c_9 pd_r10">{{comment.floorInt}}楼</span>',
			'{@/if}',
			'{@if comment.sourceType && comment.sourceType != "" && comment.sourceType != "Web端"}',
			'<a href="http://www.yinyuetai.com/apps/mobile" target="_blank" class="fl pd_r10" style="color:#999;" title="来自{{comment.sourceType}}">来自{{comment.sourceType}}</a>',
			'{@/if}',
			'<a href="javascript:;" class="fl ct_report J_report" data-id="{{comment.commentId}}" title="举报">举报</a>',
			'<a href="javascript:;" class="fr special J_show_reply" title="回复" data-id="{{comment.commentId}}">回复</a> <span class="fr line">|</span>',
			'{@if !comment.supported}',
			'<a href="javascript:;" class="fr ct_support special J_support" title="支持" data-id="{{comment.commentId}}" data-total-supports="{{comment.totalSupports}}">支持{@if comment.totalSupports>0}({{comment.totalSupports}}){@/if}</a>',
			'{@else}',
			'<span class="fr c_9" title="已支持">已支持({{comment.totalSupports}})</span>',
			'{@/if}',
			'{@if comment.shareUrl}',
			'<span class="fr line">|</span><a href="{{comment.shareUrl}}" target="_blank" class="fr special ct_support J_share" data-id="{{comment.commentId}}" title="转发到新浪微博"><span class="ico_ct_sina"></span>转发（<span class="J_share_count">{{comment.totalShares}}</span>）</a>',
			'{@/if}',
			'</div>',
			'</div>',
			'</li>',
			'{@/each}',
			'</ul>'],
		initialize : function() {
			var self = this;
			if (this.options.onLoad) {
				this.on('load', _.bind(this.options.onLoad, this));
			}
			this.index = null;
			this.load(1);
			if (!this.options.isHotComment) {
				this.page = new Page()
				this.on('add', function(status) {
					self.load(1, status);
				});
			}
		},
		loadPage : function(e) {
			this.load($(e.currentTarget).data('page'));
		},
		load : function(pageNo, status) {
			this.$el.html('<span class="ico_loading"></span>');
			var self = this;
			this.pageNo = pageNo;
			var data = {
				belongId : this.options.belongId,
				page : pageNo,
				order : this.options.order,
				commentType : this.options.commentType
			};

			if (status === 'new') {
				this.index = new Date().getTime();
			}

			if (this.index && this.options.order !== 'hot') {
				data.index = this.index;
			}

			Ajax.ajax({
				url : self.options.isHotComment ? this.options.hotListUrl : this.options.listUrl,
				dataType : 'jsonp',
				jsonpCallback : self.options.isHotComment ? 'ajsonp' + new Date().getTime() : 'ajsonp',
				method : 'GET',
				data : data,
				cache : true,
				success : function(json) {
					self.trigger('load', json);
					if (json.data.length > 0) {
						self.render({comments : json.data});
						if (!self.options.isHotComment) {
							self.$el.append(self.page.render(Math.ceil(json.commentCount / json.pageSize),
									json.page, json.maxShowPage));
						} else {
							self.$el.parent().show();
						}
					} else {
						if (self.options.order == "hot") {
							self.$el.html("请耐心等待有才的人出现……什么？您就是！赶紧说几句吧，获得支持就可出现在这里^^");
						} else {
							self.$el.html("暂时还没有悦友发表过评论，赶快说两句抢沙发吧。");
						}
					}
				}
			});
			/*Ajax.getJSON(self.options.isHotComment ? this.options.hotListUrl : this.options.listUrl, {
			 belongId : this.options.belongId,
			 page : pageNo,
			 order : this.options.order,
			 commentType : this.options.commentType
			 },
			 function(json) {
			 self.trigger('load', json);
			 if (json.data.length > 0) {
			 self.render({comments : json.data});
			 if (!self.options.isHotComment) {
			 self.$el.append(self.page.render(Math.ceil(json.commentCount / json.pageSize),
			 json.page, json.maxShowPage));
			 } else {
			 self.$el.parent().show();
			 }
			 } else {
			 if (self.options.order == "hot") {
			 self.$el.html("请耐心等待有才的人出现……什么？您就是！赶紧说几句吧，获得支持就可出现在这里^^");
			 } else {
			 self.$el.html("暂时还没有悦友发表过评论，赶快说两句抢沙发吧。");
			 }
			 }
			 })*/
		},
		render : function(data) {
			this.$el.hide().html(juicer.to_html(this.commentListTpl.join(''), data)).fadeIn();
		},
		showReply : function(e) {
			var self = this;
			var $target = $(e.currentTarget);
			var $container = $target.parents('.ct_content'), $replyBox = $container.find('.J_reply_box');
			if ($replyBox.length == 0) {
				var quotedContent = $container.find('.ct_info').html();
				var $replyBox = $('<form class="ct_release clearfix J_reply_box" method="post"></form>').appendTo($container);
				var commentForm = new CommentForm({
					el : $replyBox,
					maxCount : self.options.maxCount,
					params : {
						belongId : this.options.belongId,
						repliedId : $target.data('id'),
						quotedCB : true,
						quotedContent : quotedContent,
						commentType : this.options.commentType
					},
					action : this.options.replyUrl,
					synInfo : false
				})
				commentForm.on('success', function() {
					$replyBox.hide();
					self.trigger('add');
				})
			}
			this.hideAllReply();
			$replyBox.show().find('textarea').focus();
		},
		hideAllReply : function() {
			$('.J_reply_box').hide();
		},
		support : function(e) {
			var self = this;
			user.login(function() {
				var $target = $(e.currentTarget);
				Ajax.post(self.options.supportUrl, {commentId : $target.data('id'), belongId : self.options.belongId}, function(result) {
					if (!result.error) {
						$target.replaceWith('<span class="fr c_9" title="已支持">已支持(' + ($target.data('totalSupports') + 1) + ')</span>');
					} else {
						alertify.error(result.message);
						$target.replaceWith('<span class="fr c_9" title="已支持">已支持(' + $target.data('totalSupports') + ')</span>');
					}
				})
			})
		},
		setOrder : function(order) {
			this.options.order = order;
		},
		goto : function(e) {
			var targetFloor = $(e.currentTarget).data('floor');
			var pageFloor = this.$el.find('li').eq(0).data('floor');
			var jump = Math.floor((pageFloor - targetFloor) / 15);
			this.load(this.pageNo + jump);
		},
		report : function(e) {
			var self = this;
			require(['modules/yinyuetai/report'], function(report) {
				report.show({
					commentId : $(e.currentTarget).data('id'),
					belongId : self.options.belongId,
					reportItems : 'video'
				});
			})
		},
		share : function(e) {
			var $target = $(e.currentTarget);
			var $shareCount = $target.find('.J_share_count');
			$shareCount.html(+$shareCount.html() + 1);
			Ajax.get('http://comment.yinyuetai.com/add-comment-share-log', 'commentId=' + $target.data('id'));
		}
	})

	module.exports = CommentList;
})
