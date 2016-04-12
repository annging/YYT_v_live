define(function (require, exports, module) {
    var XHR = require('ajax');

    var PARTNER_URL = "/partner/get-partner-code";

    var iframes = {}, $box;

    return {
        getCode: function (placeIds, callback, videoId) {
            if (typeof placeIds == 'string') {
                placeIds = [placeIds];
            }
            var json = {
                placeIds: placeIds.join(',')
            };

            if (videoId) {
                json.videoId = videoId;
            }

            XHR.ajax({
                type: 'get',
                url: Y.domains.mainSite + PARTNER_URL,
                data: json,
                success: function (data) {
                    if (data && !data.error) {
                        if (callback) {
                            callback(data);
                        } else {
                            placeIds.each(function (item) {
                                var con = data[item];
                                if (con) {
                                    $('#' + item).html(con);
                                }
                            })
                        }
                    }
                }
            });
        },
        loadIframe: function (url, callback) {
            if (!$box) {
                $box = $('<div></div>').css({
                    'width': 1,
                    'height': 1,
                    'overflow': 'hidden',
                    'position': 'absolute',
                    'top': '-10000px',
                    'left': '-10000px'
                }).appendTo(document.body);
            }
            if (iframes[url] && iframes[url].length) {
                iframes[url].remove();
                iframes[url] = undefined;
            }
            iframes[url] = $('<iframe src="' + url + '"/>').css({
                'width': 1,
                'height': 1, 'overflow': 'hidden'
            }).appendTo($box);

            callback && callback();
        },
        setContents: function (list) {
            this.contents = list;
        },
        getContents: function () {
            return this.contents.concat([]);
        },
        videoPagePartner: function (videoId) {
            var context = this;

            if (window.top === window.self && document.domain != 'beta.yinyuetai.com') {
                var Ids = 'play_control';

                context.getCode(Ids, function (data) {
                    data = data['play_control'];

                    if (data) {
                        try {
                            var contents = $.parseJSON(data);
                            context.setContents(contents.concat([]));


                            var runTime = function () {
                                setTimeout(function () {
                                    if (!contents || contents.length < 1) {
                                        contents = context.getContents();
                                    }
                                    var item = contents.shift();
                                    context.loadIframe(item.page, runTime);
                                }, 1000);
                            };

                            runTime();
                        } catch (e) {
                        }
                    }
                }, videoId);
            }
        }
    }
});
