define(function (require, exports, module) {

    var VIDEO_INFO_URL = "http://ext.yinyuetai.com/main/get-h-mv-info",
        AD_INFO_URL = "http://www.yinyuetai.com/proment/get-play-medias?json=true&rd=yinyuetai.com",
        RELATED_VIDEO_INFO_URL = "http://ext.yinyuetai.com/main/related-videos?json=true";

    var startEnabled = false;

    var v_root;

    var Video = function (id, options) {
        v_root = this;
        v_root.options = {
            hasad: true,
            volume: 0.8,
            autoplay: true,
            seekEnabled: true,
            switchVideo: "auto"
        };
        v_root.videoId = id;
        _.extend(v_root.options, options);
    };
    Video.prototype = new Event();
    _.extend(Video.prototype, {
        startPlay: function () {
            new YYTApi(v_root);
            v_root.fetchVideoInfo();
        },
        fetchVideoInfo: function () {
            $.ajax({
                url: VIDEO_INFO_URL + "?json=true&videoId=" + v_root.videoId,
                dataType: "jsonp",
                type: "get",
                jsonp: "callback",
                success: function (result) {
                    if (result && !result.error && result.videoInfo && !result.videoInfo.coreVideoInfo.error) {
                        v_root.videoInfo = result.videoInfo;
                        v_root.videoModelIndex = 0;

                        v_root.setupPlayer();

                        if (v_root.options.autoplay) {
                            startEnabled = true;
                        } else {
                            var cover = new MediaCover(v_root.options.$container, v_root.videoInfo.coreVideoInfo.bigHeadImage);
                            cover.on(cover.MediaCoverViewEventType.CLICK_MEDIA_COVER, function () {
                                cover.$el.remove();
                                startEnabled = true;

                                if (v_root.options.hasad) {
                                    v_root.adInfo && v_root.adInfo.preroll ?
                                        v_root.startPlayAdHandler(v_root.adInfo.preroll) :
                                        v_root.startPlayVideo();
                                } else {
                                    v_root.startPlayVideo();
                                }
                            });
                        }


                        if (v_root.options.hasad) {
                            v_root.playPreRollAd();
                        } else {
                            v_root.startPlayVideo();
                        }

                    } else {
                        v_root.trigger("video_error", result.errorMsg || result.videoInfo.coreVideoInfo.errorMsg || "Error: get video info");
                    }
                }
            });
        },
        playPreRollAd: function () {
            v_root.requestAdInfo("preroll", function (result) {
                if (result.preroll) {
                    v_root.adInfo = v_root.adInfo || {};
                    v_root.adInfo.preroll = result.preroll;

                    v_root.playAd(v_root.adInfo.preroll, "preroll",
                        v_root.startPlayVideo, v_root.startPlayVideo, function () {
                            startEnabled && v_root.startPlayAdHandler(v_root.adInfo.preroll);
                        });
                } else {
                    v_root.startPlayVideo();
                }
            }, v_root.startPlayVideo);
        },
        playPauseRollAd: function () {
            v_root.requestAdInfo("pauseroll", function (result) {
                if (result.pauseroll) {
                    v_root.adInfo = v_root.adInfo || {};
                    v_root.adInfo.pauseroll = result.pauseroll;
                    v_root.playAd(v_root.adInfo.pauseroll, "pauseroll");

                    v_root.adEle.on(v_root.adEle.AdViewEventType.CLICK_VIDEO_RECT, function () {
                        v_root.mediaEle.resume();
                    });
                }
            }, function () {
                v_root.adEle.off(AdManagerContainer.AdViewEventType.CLICK_VIDEO_RECT);
                v_root.adEle.$el.hide();
            });
        },
        playOverRollAd: function () {
            function setupRelatedVideos() {
                v_root.trigger("media_list_complete");
                v_root.adEle.$el.hide();
                v_root.fatchRelatedVideoInfo(function (result) {
                    v_root.relatedVideoEle.$el.show();
                    v_root.relatedVideoEle.addVideos(result);
                });
            }

            v_root.requestAdInfo("overroll", function (result) {
                if (result && result.overroll) {
                    v_root.adInfo = v_root.adInfo || {};
                    v_root.adInfo.overroll = result.overroll;
                    v_root.playAd(v_root.adInfo.overroll, "overroll",
                        setupRelatedVideos, setupRelatedVideos, function () {
                            startEnabled && v_root.startPlayAdHandler(v_root.adInfo.overroll);
                        });
                } else {
                    setupRelatedVideos();
                }
            }, setupRelatedVideos);
        },
        requestAdInfo: function (position, successFn, failedFn) {
            var url = AD_INFO_URL + "&position=" + position + "&videoId=" + this.videoId;

            $.ajax({
                url: url,
                dataType: "jsonp",
                type: "get",
                jsonp: "callback",
                success: function (result) {
                    if (result && !result.error) {
                        successFn && successFn(result);
                    } else {
                        failedFn && failedFn("error");
                    }
                },
                error: function () {
                    failedFn && failedFn("error");
                }
            });
        },
        playAd: function (data, position, complete, failed, handler) {
            if (data && data.startUrl) {
                var img = document.createElement("img");

                img.setAttribute("src", data.startUrl);
                img.setAttribute("width", 1);
                img.setAttribute("height", 1);
                img.setAttribute("style", "display: none;");
                document.body.appendChild(img);
            }
            if (data && data.hide) {
                complete && complete();
                return;
            }
            if (data.format == "video") {
                v_root.playVideoAd(data, position, complete, failed, handler);
            } else if (data.format == "image") {
                v_root.playImageAd(data, position, complete, failed, handler);
            }
        },
        playImageAd: function (data, position, complete, failed, handler) {
            var adEle;

            adEle = v_root.renderAdElement();
            adEle.initialize(data, position);
            adEle.$el.show();
            adEle.on(adEle.AdViewEventType.CLOSE_AD + " " + adEle.AdViewEventType.AD_PLAY_COMPLETE, function () {
                v_root.removeAdBindListener();
                adEle.closeAd();
                complete && complete();
            });

            handler && handler();
        },
        startPlayAdHandler: function (data) {
            var adEle = v_root.adEle,
                mediaEle = v_root.mediaEle;

            if (data.format == "image") {
                adEle.startTimer();
            } else {
                mediaEle.play();
            }
        },
        playVideoAd: function (data, position, complete, failed) {
            var mediaEle,
                adEle;

            mediaEle = v_root.mediaEle;
            adEle = v_root.renderAdElement();
            adEle.$el.show();
            adEle.initialize(data, position);

            mediaEle.setConfig({
                seekEnabled: false,
                clickBackground: false,
                width: data.width,
                height: data.height
            });
            mediaEle.setFiles(data.url);
            v_root.bindAdListener(complete, failed, data);
        },
        bindAdListener: function (complete, failed, data) {
            var adEle = v_root.adEle,
                mediaEle = v_root.mediaEle;

            adEle.on(adEle.AdViewEventType.CLOSE_AD, function () {
                v_root.removeAdBindListener();
                adEle.closeAd();
                mediaEle.stop();
                complete && complete();
            });

            mediaEle.on("media_list_complete", function () {
                v_root.removeAdBindListener();
                adEle.closeAd();
                mediaEle.stop();
                complete && complete();
            });
            mediaEle.on("media_get_meta", function (dur) {
                if (v_root.options.autoplay || startEnabled) {
                    mediaEle.play();
                }
            });
            mediaEle.on("media_error", function (msg) {
                v_root.removeAdBindListener();
                adEle.closeAd();
                mediaEle.stop();
                complete && complete();
            });
            mediaEle.on("media_position", function (pos) {
                if (pos <= data.duration) {
                    adEle.updateTime(pos);
                } else {
                    v_root.removeAdBindListener();
                    adEle.closeAd();
                    mediaEle.stop();
                    complete && complete();
                }
            });
        },
        removeAdBindListener: function () {
            v_root.adEle.off(v_root.adEle.AdViewEventType.CLOSE_AD + " " + v_root.adEle.AdViewEventType.AD_PLAY_COMPLETE);
            v_root.mediaEle.off("media_list_complete media_get_meta media_error media_position");
        },
        startPlayVideo: function () {
            var adEle = v_root.adEle,
                mediaEle = v_root.mediaEle;

            mediaEle.setConfig({
                seekEnabled: true,
                clickBackground: true,
                controlbar: v_root.options.controlbar,
                width: 1,
                height: 1
            });

            if (v_root.config && v_root.config.controlbar == "over") {
                adEle && adEle.$el.addClass("ad-ui-y-translation");
            } else {
                adEle && adEle.$el.removeClass("ad-ui-y-translation");
            }
            var videoModels = v_root.videoInfo.coreVideoInfo.videoUrlModels,
                videoModelIndex = v_root.videoModelIndex;

            mediaEle.setFiles(videoModels[videoModelIndex].videoUrl);
            v_root.bindMediaPlayerListener();
            mediaEle.play();
        },
        setupPlayer: function (files) {
            var adEle,
                relatedVideoEle;

            adEle = v_root.renderAdElement();
            relatedVideoEle = v_root.renderRelatedElement();
            v_root.renderResolution();

            v_root.mediaEle = new YYTPlayer.MediaPlayer();
            v_root.mediaEle.initialize(files, {
                autoplay: v_root.options.autoplay,
                volume: v_root.options.volume,
                controlbar: v_root.options.controlbar,
                switchVideo: v_root.options.switchVideo,
                adUiContainer: adEle.$el,
                relatedVideoUi: relatedVideoEle.$el,
                seekEnabled: v_root.options.seekEnabled,
                clickBackground: true,
                controlsPlugins: [v_root.resolutionEle.$el]
            }, v_root.options.$container);
            v_root.mediaEle.setupVideo();
        },
        bindMediaPlayerListener: function () {
            var mediaEle = v_root.mediaEle;

            mediaEle.on("media_get_meta", function (dur) {
                if (v_root.options.autoplay || startEnabled) {
                    mediaEle.play();
                }
                v_root.trigger("start_play", dur, v_root.videoInfo.coreVideoInfo.videoUrlModels[v_root.videoModelIndex].videoUrl);
                v_root.sendVideoViewStatics();
            });
            mediaEle.on("media_complete", function (idx) {
            });
            mediaEle.on("media_request_pause_ad", function () {
                if (v_root.options.hasad) {
                    v_root.playPauseRollAd();
                }
            });
            mediaEle.on("media_status", function (newStat, oldStat) {
                if (newStat != oldStat && newStat == "playing") {
                    v_root.adEle.closeAd();
                }
                if (newStat != oldStat && v_root.relatedVideoEle.$el) {
                    v_root.relatedVideoEle.$el.hide();
                }
            });
            mediaEle.on("media_list_complete", function () {
                if (v_root.options.hasad) {
                    v_root.playOverRollAd();
                } else {
                    v_root.trigger("media_list_complete");
                }
            });
            mediaEle.on("media_error", function (msg) {
                v_root.trigger("media_error", msg);
            });
            mediaEle.on("media_switch_next", function () {
                v_root.trigger("media_switch_next");
            });

            $(".vp-yyt-logo").on("click", function () {
                window.open("http://www.yinyuetai.com");
            });
        },
        sendVideoViewStatics: function () {
            var info = v_root.videoInfo.coreVideoInfo;
            var url = "https://api.yinyuetai.com/mv/wap-video-view";

            $.ajax({
                url: url,
                dataType: "jsonp",
                data: {
                    json: true,
                    videoid: v_root.videoId,
                    artistid: info.artistIds
                },
                jsonp: "callback",
                success: function () {

                }
            });
        },
        renderAdElement: function () {
            this.adEle = this.adEle || new AdManagerContainer();
            return this.adEle;
        },
        renderRelatedElement: function () {
            this.relatedVideoEle = this.relatedVideoEle || new RelatedVideoContainer();
            return this.relatedVideoEle;
        },
        renderResolution: function () {
            if (v_root.resolutionEle) {
                v_root.resolutionEle.setData(v_root.videoInfo.coreVideoInfo.videoUrlModels);
            } else {
                v_root.resolutionEle = v_root.resolutionEle || new ResolutionToggle();
                v_root.resolutionEle.initialize(v_root.videoInfo.coreVideoInfo.videoUrlModels);
                v_root.resolutionEle.on("change_resolution", function (index) {
                    v_root.switchResolution(index);
                });
            }

            return v_root.resolutionEle;
        },

        switchResolution: function (index) {
            var videoModels = v_root.videoInfo.coreVideoInfo.videoUrlModels,
                videoModelIndex = v_root.videoModelIndex;

            if (index == videoModelIndex || index >= videoModels.length) {
                return false;
            } else {
                v_root.videoModelIndex = videoModelIndex = index;
                v_root.mediaEle.resolute(videoModels[videoModelIndex].videoUrl);
                v_root.resolutionEle.switch(index);
            }

            return true;
        },

        fatchRelatedVideoInfo: function (successFn, failedFn) {
            $.ajax({
                url: RELATED_VIDEO_INFO_URL + "&count=12&videoId=" + this.videoId,
                dataType: "jsonp",
                type: "get",
                jsonp: "callback",
                success: function (result) {
                    if (result && !result.error) {
                        successFn && successFn(result.relatedVideos);
                    } else {
                        failedFn && failedFn(result.message || "获取相关视频失败");
                    }
                },
                error: function () {
                    failedFn && failedFn("获取相关视频失败");
                }
            });
        },

        destroy: function () {
            var v = v_root.mediaEle;

            if (v) {
                v.destroy();
                v.off();
            }
        }
    });


    //播放视频之前的蒙版
    var MediaCover = function ($container, url) {
        var context = this;

        context.MediaCoverViewEventType = {
            CLICK_MEDIA_COVER: "click_media_cover"
        };

        createEle();
        addListener();

        function createEle() {
            var tpl = '<img class="vp-media-cover-image" src="' + url + '">' +
                '<span class="vp-media-cover-icon"></span>';

            context.$el = $('<div  class="vp-media-cover"></div>');
            context.$el.append(tpl);

            $container.append(context.$el);
        }

        function addListener() {
            context.$el.on("click", function () {
                context.trigger(context.MediaCoverViewEventType.CLICK_MEDIA_COVER);
                context.$el.remove();
            });
        }

        return context;
    };
    MediaCover.prototype = new Event();


    //码流切换模块
    var ResolutionToggle = function () {
        var context = this;

        context.ResolutionEventType = {
            CHANGE_RESOLUTION: "change_resolution"
        };
        createEle();

        function createEle() {
            var tpl = "<div class='vp-resolution-menu'>" + "<ul class='vp-resolution-menu-ul'></ul>" + "</div>" + "<div class='vp-resolution-basebar'><span class='vp-resolution-basebar-text'></span></div>";
            context.$el = $("<div class='vp-button fr vp-resolution-box'></div>");
            context.$el.append(tpl);
        }

        return context;
    };
    ResolutionToggle.prototype = new Event();
    ResolutionToggle.prototype.initialize = function (list, index) {
        var context = this;
        var $ul = this.$el.find(".vp-resolution-menu-ul");

        context.currentIndex = index = index ? index : 0;
        context.videoModels = list;
        context.createVideoListEle(list);
        list && list.length > 0 && context.$el.find(".vp-resolution-basebar-text").text(list[index].qualityLevelName);
        $ul.on("click", ".vp-resolution-menu-li", function (e) {
            e.stopPropagation();
            var target = $(e.currentTarget);
            var _index = target.data("index");

            if (_index != context.currentIndex) {
                context.changeResolution(_index);
            }
        })
    };
    ResolutionToggle.prototype.setData = function (list, index) {
        this.currentIndex = index = index ? index : 0;
        this.videoModels = list;
        this.createVideoListEle(list);
        list && list.length > 0 && this.$el.find("vp-resolution-basebar-text").text(list[index].qualityLevelName);
    };
    ResolutionToggle.prototype.createVideoListEle = function (list) {
        if (!list || list.length < 1) return;
        var $ul = this.$el.find(".vp-resolution-menu-ul");

        $ul.empty();
        for (var i = list.length - 1; i >= 0; i--) {
            var m = list[i];
            var $li = "<li class='vp-resolution-menu-li' data-index='" + i + "'><span class='vp-resolution-menu-li-text'>" + m.qualityLevelName + "</span></li>";
            $ul.append($li);
        }
        this.$el.find(".vp-resolution-menu").css("top", -list.length * 30);
    };
    ResolutionToggle.prototype.switch = function (index) {
        var videoModel = this.videoModels[index];

        this.currentIndex = index;
        this.$el.find(".vp-resolution-basebar-text").text(videoModel.qualityLevelName);
    };
    ResolutionToggle.prototype.changeResolution = function (index) {
        this.trigger(this.ResolutionEventType.CHANGE_RESOLUTION, index);
    };


    //广告模块
    var AdManagerContainer = function () {
        var img = "<img class='ad-ui-image-content'>";
        var tpl = "<div class='ad-ui-topbarbox'><div class='ad-ui-topbar'><a href='javascript:void(0);' class='ad-ui-close-button'>关闭广告</a><a href='javascript:void(0)' class='ad-ui-vip-noad-button'>会员去广告</a><a href='javascript:void(0)' class='ad-ui-last-reconds'>广告还剩<strong class='ad-ui-last-seconds-text'></strong>秒</a></div></div>";
        var clickRect = "<div class='ad-ui-click-rect'></div>";
        var pauseRect = "<div class='ad-ui-pause-clickrect'></div>";

        this.$el = $("<div class='ad-ui-container'></div>");
        this.$content = $("<div class='ad-ui-content'></div>");
        this.$box = $("<div class='ad-ui-box'></div>'");
        this.$box.append(img);
        this.$box.append(clickRect);
        this.$content.append(this.$box);
        this.$content.append(tpl);
        this.$el.append(pauseRect);
        this.$el.append(this.$content);
        return this;
    };
    AdManagerContainer.prototype = new Event();
    _.extend(AdManagerContainer.prototype, {
        AdViewEventType: {
            CLICK_VIDEO_RECT: "ad_manager_click_video_rect",
            CLOSE_AD: "ad_manager_close_ad",
            AD_PLAY_COMPLETE: "ad_manager_play_complete"
        },
        initialize: function (data, position) {
            var context = this,
                validW = (data.width > 0 && data.width <= 1) ? (data.width * 100 + "%") : (data.width + "px");

            context.data = data;
            context.currentTime = 0;

            position = position ? position : "preroll";
            if (position == "pauseroll") {
                context.$el.find(".ad-ui-content").addClass("ad-ui-pause-box");
                context.$el.find(".ad-ui-pause-clickrect").show();
                context.$el.find(".ad-ui-topbar").css("width", "auto");
            } else {
                context.$el.find(".ad-ui-content").removeClass("ad-ui-pause-box");
                context.$el.find(".ad-ui-topbar").css("width", validW);
                context.$el.find(".ad-ui-pause-clickrect").hide();
            }
            if (data.format == "image") {
                context.$el.find(".ad-ui-image-content").show();
                context.$el.find(".ad-ui-image-content").attr("src", data.url);

                if (position == "pauseroll") {
                    context.$el.find(".ad-ui-image-content").removeClass("vertical_mid");
                    context.$el.find(".ad-ui-content").css("width", validW);
                } else {
                    context.$el.find(".ad-ui-image-content").css("width", validW);
                    context.$el.find(".ad-ui-image-content").addClass("vertical_mid");
                }

            } else {
                context.$el.find(".ad-ui-image-content").hide();
            }
            context.$el.on("click", function (e) {
                var target = $(e.target);
                if (target.hasClass("ad-ui-click-rect")) {
                    e.stopPropagation();
                    window.open(context.data.link);
                } else if (target.hasClass("ad-ui-vip-noad-button")) {
                    e.stopPropagation();
                    window.open("http://vip.yinyuetai.com");
                } else if (target.hasClass("ad-ui-close-button")) {
                    e.stopPropagation();
                    context.trigger(context.AdViewEventType.CLOSE_AD);
                } else if (target.hasClass("ad-ui-image-content")) {
                    e.stopPropagation();
                    window.open(context.data.link);
                } else if (target.hasClass("ad-ui-pause-clickrect")) {
                    context.trigger(context.AdViewEventType.CLICK_VIDEO_RECT);
                }
            });
        },
        startTimer: function () {
            var context = this;

            setTimeout(function () {
                console.log("current: " + context.currentTime);
                if (context.currentTime < context.data.duration) {
                    context.updateTime(context.currentTime);
                    context.currentTime++;
                    context.startTimer();
                } else {
                    context.closeAd();
                    context.trigger(context.AdViewEventType.AD_PLAY_COMPLETE);
                }
            }, 1000)
        },
        updateTime: function (pos) {
            this.$el.find(".ad-ui-last-seconds-text").text(this.data.duration - pos);
        },
        closeAd: function () {
            this.$el.off("click");
            this.$el.hide();
        }
    });


    //推荐视频模块
    var RelatedVideoContainer = function () {
        this.$el = $("<div class='related-ui-container'></div>");
        this.$el.append("<div class='related-videos-content'><ul class='related-videos-ul'></ul></div>");
        return this;
    };
    RelatedVideoContainer.prototype = new Event();
    RelatedVideoContainer.prototype.addVideos = function (list) {
        var tpl = "";

        if (list && list.length > 0) {
            for (var i = 0; i < list.length; i++) {
                var itemData = list[i];
                var itemTpl = "<li class='related-video-li'><div class='related-video-item'>" +
                    "<img src='" + itemData.headImage + "'>" +
                    "<h3 class='related-video-item-videoname'>" + itemData.videoName + "</h3>" +
                    "</div>" +
                    "<a href='" + itemData.videoUrl + "' class='related-video-item-hoverbox'></a>" +
                    "</li>";

                tpl += itemTpl;
            }

            this.$el.find(".related-videos-ul").html(tpl);
        }
    };
    RelatedVideoContainer.prototype.removeVideos = function () {
        this.$el.find(".related-videos-ul").empty();
    };

    module.exports = Video;
})
