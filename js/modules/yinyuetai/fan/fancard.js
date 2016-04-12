define(function(require, exports, module) {
	var Xhr = require('ajax'),
			juicer = require('juicer'),
			join = require('modules/yinyuetai/fan/join'),
			alertify = require('alertify');

	function fancard(container) {
		container = container || 'body';
		var $fancard = $('#fancard');
		var body = $('body');
		var tpl = ['{@if id>0}',
			'<div class="fancard_lft"></div>',
			'<div class="fancard_main">',
			'<div class="popup_card_arrow"><em class="arrow1">◆</em><span class="arrow2">◆</span></div>',
			'<div class="fancard_main_top">',
			'<a href="http://www.yinyuetai.com/fanclub/{{id}}" target="_blank">',
			'<img src="{{headImg}}" alt="{{title}}" style="float:left;" width="100" height="100"/></a>',
			'<dl>',
			'<dt><a href="http://www.yinyuetai.com/fanclub/{{id}}" target="_blank">{{title}}</a></dt>',
			'<dd><span>饭团成员：</span>{{memNum}}</dd>',
			'<dd><span>收录&nbsp;M&nbsp;V：</span>{{videoNum}}{@if addedVideoNum}（<span class="special">{{addedVideoNum}}</span>）{@/if}</dd>',
			'<dd><span>帖子总数：</span>{{topicNum}}{@if addedTopicNum}（<span class="special">{{addedTopicNum}}</span>）{@/if}</dd>',
			'<dd><span>照片总数：</span>{{photoNum}}{@if addedPhotoNum}（<span class="special">{{addedPhotoNum}}</span>）{@/if}</dd>',
			'{@if !isFanMember}',
			'<dd><span class="fancard_join_fanclub">',
			'<a href="http://www.yinyuetai.com/fanclub/{{id}}" class="J_join" target="_blank" data-fan-id="{{id}}">加入饭团</a></span>',
			'</dd>',
			'{@/if}',
			'</dl>',
			'</div>',
			'<h3 class="fancard_news_title">最近更新</h3>',
			'<ul class="fancard_news">',
			'{@if lastNewsId}',
			'<li><span>【帖子】</span><a href="http://www.yinyuetai.com/fanclub/newslog-detail/{{lastNewsId}}" target="_blank" title="{{lastNewsTitle}}">{{lastNewsTitle}}</a></li>',
			'{@/if}',
			'{@if lastTopicId}',
			'<li><span>【话题】</span><a href="http://www.yinyuetai.com/fanclub/topic-detail/{{lastTopicId}}" target="_blank" title="{{lastTopicTitle}}">{{lastTopicTitle}}</a></li>',
			'{@/if}',
			'{@if lastVideoId}',
			'<li><span>【&nbsp;M&nbsp;V】</span><a href="http://v.yinyuetai.com/video/{{lastVideoId}}" target="_blank" title="{{lastVideoTitle}}">{{lastVideoTitle}}</a></li>',
			'{@/if}',
			'</ul>',
			'</div>',
			'<div class="fancard_rht"></div>',
			'{@else}',
			'<div class="fancard_loading">',
			'<img style="margin:23px;" src="http://s.yytcdn.com/images/common/widget/fancard/indicator_technorati.gif" alt="饭团名片加载中…"/></div>',
			'{@/if}'].join('');
		var leavetimer = 0;
		var entertimer = 0;
		var buffer = {};
		var left = function(targetOffset, elSize, targetSize) {
					return {
						x : targetOffset.left + targetSize.w * .5 - elSize.w + 40,
						csslr : 'p_left'
					};
				},
				right = function(targetOffset, elSize, targetSize) {
					return {
						x : targetOffset.left + targetSize.w * .5 - 40,
						csslr : 'p_right'
					};
				},
				top = function(targetOffset, elSize, targetSize) {
					return {
						y : targetOffset.top - elSize.h - 5,
						csstb : 'p_top'
					};
				},
				bottom = function(targetOffset, elSize, targetSize) {
					return {
						y : targetOffset.top + targetSize.h + 10,
						csstb : 'p_bottom'
					}
				};
		$(container).on('mouseenter', '.J_fancard',function(e) {
			var $target = $(e.currentTarget), fid = $target.data('fanId');
			if (fid <= 0) {
				return;
			}
			entertimer = setTimeout(function() {
				entertimer = 0;
				if (!$fancard.length) {//building fancard dom if it doesn't exist
					$fancard = $('<div id="fancard" class="fancard"></div>').appendTo(document.body);
					$fancard.on('mouseenter',function() {
						if (leavetimer) {
							clearTimeout(leavetimer);
						}
					}).on('mouseleave',function() {
								$fancard.fadeOut();
							}).on('click', '.J_join', function(event) {
								var $target = $(event.currentTarget), id = $target.data('fanId');
								if (id) {
									join.joinFan(id, function(action) {
										alertify.success('加入饭团成功！');
										buffer[id]['isFanMember'] = true;
										$target.parent('span').remove();
									})
								}
								return false;
							});
				}
				$fancard.html(juicer.to_html(tpl, {'id' : 0}));

				var $win = $(window), targetOffset = $target.offset();
				var elSize = {
					w : 350 + 16,
					h : 234
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
				var resultPos = $.extend(top(targetOffset, elSize, targetSize), left(targetOffset, elSize, targetSize));
				if (targetOffset.left - $win.scrollLeft() <= winSize.w * .5) {//显示在右边
					resultPos = $.extend(resultPos, right(targetOffset, elSize, targetSize));
				}
				if (targetOffset.top - targetSize.h - $win.scrollTop() <= winSize.h * .5) {
					resultPos = $.extend(resultPos, bottom(targetOffset, elSize, targetSize));
				}
				$fancard.css({
					'display' : 'none',
					left : resultPos.x,
					top : resultPos.y
				}).fadeIn();
				//ajax here to re-render the tpl
				if (!buffer[fid]) {
					Xhr.getJSON(Y.domains.fanSite + '/get-fan-card', 'fanId=' + fid, function(data) {
						if (data.fanCard) {
							buffer[fid] = data.fanCard;
							$fancard.html(juicer.to_html(tpl, buffer[fid]));
							$fancard.find('.fancard_main').attr('class', 'fancard_main ' + resultPos.csslr + ' ' + resultPos.csstb);
						}
					});
				} else {
					$fancard.html(juicer.to_html(tpl, buffer[fid]));
					$fancard.find('.fancard_main').attr('class', 'fancard_main ' + resultPos.csslr + ' ' + resultPos.csstb);
				}
			}, 200);
		}).on('mouseleave', '.J_fancard', function() {
					if (entertimer) {
						clearTimeout(entertimer);
					} else {
						leavetimer = setTimeout(function() {
							leavetimer = 0;
							$fancard.fadeOut();
						}, 200);
					}
				});
	}

	fancard();
});