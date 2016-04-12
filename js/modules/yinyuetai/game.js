/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 13-11-19
 * Time: ����6:29
 * To change this template use File | Settings | File Templates.
 */
define(function(require) {
	var juicer = require('juicer');
	var Ajax = require('ajax');
	var Slide = require('modules/widget/slider');
	var tpl = [
		'<div class="small-icon">',
		'<a class="prev-game-nav J_toggle" data-direction="prev" href="javascript:;" style="display:none"></a>',
		'<a class="next-game-nav J_toggle" data-direction="next" href="javascript:;" style="display:none"></a>',
		'<ul>',
		'{@each smalls as small}',
		'<li>',
		'<a href="{{small.url}}" target="_blank"><img width="75" height="75" src="{{small.image}}" alt="{{small.image}}"></a>',
		'<a href="{{small.url}}" target="_blank">{{small.title}}</a>',
		'</li>',
		'{@/each}',
		'</ul>',
		'</div>',
		'<div class="big-icon">',
//		'<a class="hand-btn J_web_type" href="http://partner.yinyuetai.com/game/#web-games"></a>',
//		'<a class="page-btn J_page_type" href="http://partner.yinyuetai.com/game/#web-games/#mobile-games"></a>',
		'<a href="{{big.url}}" target="_blank"><img width="225" height="116" src="{{big.bigImage}}" alt="{{big.title}}"></a>',
		'<a href="{{big.url}}" target="_blank">{{big.title}}</a>',
		'</div>'
	].join('');

	var $el = $('#J_topbar_game');
	var data = null;
	$el.on('mouseenter', function() {
		if (data) {
			return;
		}
		Ajax.getJSON('http://www.yinyuetai.com/nav/get', null, function(result) {
			data = result;
			$el.find('.top_game').html(juicer.to_html(tpl, {smalls : data.smalls, big : data.bigs[0]}));
		})
	})

	var $mobile = $("#mobile-games"), $webTop = $("#web-games");
	if ( $mobile.length > 0 ) {
		var $mobileTop = $mobile.offset().top - 40 + "px";
		var $webTop = $webTop.offset().top - 40 + "px";
		$el.on("click", ".J_web_type", function() {
			$("html,body").animate({
				scrollTop: $mobileTop
			}, 600);
		});

		$el.on("click", ".J_page_type", function() {
			$("html,body").animate({
				scrollTop:  $webTop
			}, 600);
		});
	}
})

