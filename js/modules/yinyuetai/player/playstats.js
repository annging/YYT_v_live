define(function(require) {
	return function(params) {
		$("<div id='viewStatus'></div>").css({
			width : 0,
			height : 0,
			overflow : 'hidden',
			fontSize : 0
		}).appendTo(document.body);
		$.ajax({
			url : 'https://api.yinyuetai.com/video/ajax/playstats',
			data : params,
			dataType : 'jsonp',
			jsonp : 'callback',
			success : function(result) {
				if (result.swf && result.flashVars) {
					require(['modules/yinyuetai/player/flashloader'], function(flashloader) {
						var vars = result.flashVars.split('&'), flashVars = {};
						$.each(vars, function(index, item) {
							var items = item.split('=');
							flashVars[items[0]] = items[1];
						});

						if ($('a[data-artist-id]').length !== 0) {
							flashVars.artistId = [];

							$('a[data-artist-id]').each(function(index, item) {
								flashVars.artistId.push($(item).data('artistId'));
							});

							flashVars.artistId = flashVars.artistId.join(',');
						}

						flashloader.render('viewStatus', {
							swfUrl : result.swf,
							vars : flashVars,
							properties : {
								id : 'viewStatusFlash',
								name : 'viewStatusFlash'
							}
						});
					})
				}
			}
		})
	}
});