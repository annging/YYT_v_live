// 参考资料：http://www.w3school.com.cn/jsref/dom_obj_video.asp
(function (root, factory) {
    root.YYTPlayer = factory(root, {});
}(this, function (root, YYTPlayer) {
    YYTPlayer.MediaStatus = {
        IDLE: "idle",
        BUFFER: "buffer",
        CANPLAY: "canplay",
        PLAYING: "playing",
        PAUSE: "pause",
        RESOLUTION: "resolution",
        SEEK: "seek"
    };
    YYTPlayer.MediaEventType = {
        MEDIA_STATUS: "media_status",
        MEDIA_VOLUME: "media_volume",
        MEDIA_MUTE: "media_mute",
        MEDIA_GET_META: "media_get_meta",
        MEDIA_CHANGE_DURATION: "media_change_duration",
        MEDIA_FULLSCREEN: "media_fullscreen",
        MEDIA_ESC_FULLSCREEN: "media_esc_fullscreen",
        MEDIA_POSITION: "media_position",
        MEDIA_ERROR: "media_error",
        MEDIA_ABORT: "media_abort",
        MEDIA_COMPLETE: "media_complete",
        MEDIA_BUFFERFULL_THROUGH: "media_bufferfull_through", //整个文件缓冲完毕
        MEDIA_LIST_COMPLETE: "media_list_complete", //整个视频列表播放完毕
        MEDIA_SWITCH_NEXT: "media_switch_next",
        MEDIA_SWITCH_PREVIOUS: "media_switch_previous",
        MEDIA_REQUEST_PAUSE_AD: "media_request_pause_ad"
    };
    YYTPlayer.version = "1.0.0.0";
    var UPDATE_TIME_INTERVAL = 500;
    var _p;

    var MediaElement = YYTPlayer.MediaElement = function () {
        _p = this;
    };
    //MediaElement继承自Event
    if (!window.Event) {
        throw ("Error: module Event is undefined!");
        return;
    }
    MediaElement.prototype = new Event();
    _.extend(MediaElement.prototype, {
        //播放
        mediaStatus: YYTPlayer.MediaStatus.IDLE,
        config: {
            volume: 0.5,
            controlbar: "fixed",
            switchVideo: "auto",
            seekEnabled: true,
            width: 1,
            height: 1
        },
        initialize: function (file, options) {
            _p.isFullscreen = false;
            _p.videoInfo = _p.videoInfo ? _p.videoInfo : {};
            file && _p.setupFiles(file);
            _p.setupConfigger(options);
        },
        setupFiles: function (file) {
            if (typeof file === "string") {
                _p.files = [file];
            } else if (isArray(file)) {
                _p.files = file;
            }
            _p.currentIndex = 0;
            _p.file = _p.files[_p.currentIndex];
        },
        setupConfigger: function (options) {
            _.extend(_p.config, options);
        },
        setupVideo: function () {
            if (_p.$videoNode) {
                _p.$videoNode.remove();
                _p.videoNode = null;
            }
            _p.$videoNode = _p.createVideoNode();
            _p.videoNode = _p.$videoNode[0];
            _p.bindVideoListener();
            _p.createTimer();
        },
        configVideo: function () {
            var config = _p.config;

            _p.videoNode.volume(config.volume);
        },
        play: function () {
            if (_p.mediaStatus === YYTPlayer.MediaStatus.PLAYING) return false;
            _p.videoNode.play();
            return true;
        },
        // 暂停
        pause: function () {
            if (_p.mediaStatus === YYTPlayer.MediaStatus.PAUSE) return;
            _p.videoNode.pause();
            triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_REQUEST_PAUSE_AD);
            _p.setStatus(YYTPlayer.MediaStatus.PAUSE);
        },
        // 恢复播放
        resume: function () {
            if (_p.mediaStatus === YYTPlayer.MediaStatus.PAUSE) {
                _p.videoNode.play();
                return true;
            }
            return false;
        },
        setFiles: function (file) {
            //在有些浏览器下video不可用的时候会出错
            try{
                if (_p.videoNode.src)_p.videoNode.currentTime = 0;
            }catch (e){

            }
            _p.updateTimer.stop();
            _p.videoInfo.position = 0;
            _p.videoInfo.duration = 0;
            if (typeof file === "string") {
                _p.files = [file];
            } else if (isArray(file)) {
                _p.files = file;
            }
            _p.currentIndex = 0;
            _p.file = _p.files[_p.currentIndex];
            _p.videoNode.src = _p.file;
            if (_p.config.autoplay) {
                _p.videoNode.play();
            }
        },
        //码流切换
        resolute: function (url) {
            var pos = _p.videoNode.currentTime;
            _p.updateTimer.stop();
            _p.file = url;
            _p.videoNode.src = url;
            _p.videoNode.currentTime = pos;
            _p.videoNode.play();
            _p.setStatus(YYTPlayer.MediaStatus.RESOLUTION);
        },
        seek: function (pos) {
            _p.updateTimer.stop();
            _p.videoNode.currentTime = pos;
            _p.videoNode.play();
            _p.setStatus(YYTPlayer.MediaStatus.SEEK);
        },
        previous: function () {
            if (_p.currentIndex > 0) {
                _p.currentIndex--;
                _p.file = _p.files[_p.currentIndex];
                _p.videoNode.src = _p.file;
                _p.play();
                triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_SWITCH_PREVIOUS, _p.currentIndex);
                return true;
            }
            return false;
        },
        next: function () {
            if (_p.currentIndex < (_p.files.length - 1)) {
                _p.currentIndex++;
                _p.file = _p.files[_p.currentIndex];
                _p.videoNode.src = _p.file;
                _p.play();
                triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_SWITCH_NEXT, _p.currentIndex);
                return true;
            }
            return false;
        },
        // 停止播放
        stop: function () {
            _p.updateTimer.stop();
            if(_p.videoNode.currentTime && _p.videoNode.currentTime > 0){
                _p.videoNode.currentTime = 0;
            }
            _p.videoInfo.position = 0;
            _p.videoNode.pause();
        },
        // 播放结束
        complete: function () {
            _p.updateTimer.stop();
            triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_COMPLETE, _p.currentIndex);
            if (!_p.next()) {
                triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_LIST_COMPLETE);
            }
        },
        width: function (w) {
            if (w) {
                //set width
                _p.$videoNode.attr("width", w);
                return w;
            } else {
                //get width
                return _p.videoNode.width;
            }
            return 0;
        },
        videoWidth: function () {
            return _p.videoNode.videoWidth;
        },
        height: function (h) {
            if (h) {
                //set height
                _p.$videoNode.attr("height", h);
                return h;
            } else {
                //get height
                return _p.videoNode.height;
            }
            return 0;
        },
        videoHeight: function () {
            return _p.videoNode.videoHeight;
        },
        getDuration: function () {
            return _p.videoInfo.duration;
        },
        getBuffered: function () {
            var len = _p.videoNode.buffered.length,
                buffered = _p.videoNode.buffered.end(len - 1);
            return buffered;
        },
        getBufferedPercent: function () {
            var dur = _p.videoInfo.duration,
                len = _p.videoNode.buffered.length;

            if (len > 0) {
                var buffered = _p.videoNode.buffered.end(len - 1);
                return dur ? (buffered / dur) : 0;
            }

            return 0;
        },
        changeDuration: function (dur) {
            _p.videoInfo.duration = parseInt(dur);
        },
        volume: function (vol) {
            vol = vol < 0 ? 0 : vol;
            vol = vol > 1 ? 1 : vol;
            _p.videoInfo.volume = vol;
            _p.videoNode.volume = vol;
            return _p.videoInfo.volume;
        },
        fullscreen: function (bool, ele) {
            if (bool !== null && bool !== undefined) {
                bool = String(bool);
                if (bool === "true") {
                    ele = ele ? ele : _p.videoNode;

                    //如果div不支持全屏，则全屏video
                    return requestFullscreenHandler(ele) || requestFullscreenHandler(_p.videoNode);
                } else if (bool === "false") {
                    ele = ele ? ele : _p.videoNode;

                    //同上
                    return cancelFullscreenHandler(ele) || cancelFullscreenHandler(_p.videoNode);
                }
            }
            return false;
        },
        getFullscreen: function () {
            return Boolean(document.fullScreen || document.mozFullScreen || document.msFullscreenElement || document.webkitIsFullScreen);
        },
        setStatus: function (sta) {
            _p.trigger(YYTPlayer.MediaEventType.MEDIA_STATUS, sta, _p.mediaStatus);
            _p.mediaStatus = sta;
        },
        mediaError: function (msg) {
            _p.updateTimer.stop();
            triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_ERROR, msg);
        },
        createVideoNode: function () {
            var config = _p.config,
                v = $("<video>");
            v.attr("class", "video-stream");
            if (_p.file) {
                v.attr("src", _p.file);
            }
            if (config.autoplay && (config.autoplay === true || config.autoplay === "true" || config.autoplay === "autoplay")) {
                v.attr("autoplay", "autoplay");
            }
            if (config.controls && (config.controls === true || config.controls === "true" || config.controls === "controls")) {
                v.attr("controls", "controls");
            }
            return v;
        },
        bindVideoListener: function () {
            var v = _p.$videoNode;

            v.on("abort", function () {
                triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_ABORT);
            });
            v.on("canplay", function () {
                triggerGlobalEvent.call(_p, YYTPlayer.MediaStatus.CANPLAY);
            });
            v.on("canplaythrough", function () {
                //整个视频缓冲完毕
                // canplaythrough： 当媒介能够无需因缓冲而停止即可播放至结尾时运行的脚本。
                triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_BUFFERFULL_THROUGH);
            });
            v.on("durationchange", function (e) {
                _p.changeDuration(e.currentTarget.duration);
                triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_CHANGE_DURATION);
            });
            v.on("emptied", function () {
                //当发生故障并且文件突然不可用时运行的脚本（比如连接意外断开时）。或者播放列表为空时
            });
            v.on("ended", function () {
                _p.complete();
            });
            v.on("error", function () {
                _p.mediaError("<p style='color:#ccc; font-size: 16px;'>文件错误，请<a href='' style='color: #fff; text-decoration: underline; padding: 0 10px;'>刷新</a>页面重试</p>");
            });
            v.on("loadeddata", function () {
            });
            v.on("loadedmetadata", function (e) {
                var dur = e.currentTarget.duration ? e.currentTarget.duration : _p.videoInfo.duration;
                triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_GET_META, dur);
            });
            v.on("loadstart", function () {
                //在文件开始加载且未实际加载任何数据前运行的脚本。
            });
            v.on("pause", function () {
                //视频播放完毕的时候同样会触发pause事件
                if (_p.updateTimer) _p.updateTimer.stop();
                _p.setStatus(YYTPlayer.MediaStatus.PAUSE);
            });
            v.on("play", function () {
                _p.setStatus(YYTPlayer.MediaStatus.CANPLAY);
            });
            v.on("playing", function () {
                if (_p.updateTimer) _p.updateTimer.start();
                _p.setStatus(YYTPlayer.MediaStatus.PLAYING);
            });
            v.on("progress", function (e) {
            });
            v.on("ratechange", function () {
            });
            v.on("readystatechange", function () {
            });
            v.on("seeked", function () {
            });
            v.on("seeking", function () {
            });
            v.on("stalled", function () {
                // 在浏览器不论何种原因未能取回媒介数据时运行的脚本。当试图获取媒体数据，但数据还不可用时产生该事件
            });
            v.on("suspend", function () {
                // 在媒介数据完全加载之前不论何种原因终止取回媒介数据时运行的脚本。
            });
            v.on("timeupdate", function (e) {
            });
            v.on("volumechange", function () {
            });
            v.on("waiting", function () {
            });
        },
        createTimer: function () {
            if (_p.updateTimer) {
                _p.updateTimer.destroy();
            } else {
                _p.updateTimer = new YYTPlayer.Timer(UPDATE_TIME_INTERVAL, function () {
                    _p.updatePosition();
                }, function () {
                });
            }
        },
        updatePosition: function () {
            _p.videoInfo.position = parseInt(_p.videoNode.currentTime);
            triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_POSITION, _p.videoInfo.position);
        },
        rerangeLayout: function (w, h) {
            // 视频等比缩放
            var _configW = _p.config.width,
                _configH = _p.config.height,
                _vw = _p.$videoNode.width(),
                _vh = _p.$videoNode.height(),
                _vr = _p.videoWidth() / _p.videoHeight(),
                boxw = w,
                boxh = h;
            //根据配置大小设置视频的最大宽高
            if (_configW > 0 && _configW < 1) {
                boxw = w * _configW;
            }
            if (_configH > 0 && _configH < 1) {
                boxh = h * _configH;
            }
            if (_configW > 1) {
                boxw = w > _configW ? _configW : w;
            }
            if (_configH > 1) {
                boxh = h > _configH ? _configH : h;
            }
            if (boxw / boxh > _vr) {
                _vh = boxh;
                _vw = _vr * _vh;
            } else {
                _vw = boxw;
                _vh = _vw / _vr;
            }
            _p.$videoNode.css("left", (w - boxw) / 2 + (boxw - _vw) / 2);
            _p.$videoNode.css("top", (h - boxh) / 2 + (boxh - _vh) / 2);
            _p.$videoNode.width(_vw);
            _p.$videoNode.height(_vh);
        },
        setConfig: function (config) {
            _.extend(_p.config, config);
        },
        destroy: function () {
            _p.$videoNode && _p.$videoNode.off();
        }
    });

    //必须渲染完html之后再根据配置对相应的element进行设置，没有建立dom之前element的宽高已经其他属性有可能会不正确，导致配置错误
    var MediaPlayer = YYTPlayer.MediaPlayer = function () {
        _p = this;
    };
    MediaPlayer.prototype = new MediaElement();
    _.extend(MediaPlayer.prototype, {
        initialize: function (file, options, parent) {
            _p.$parent = parent;
            _p.components = _p.components ? _p.components : {};
            MediaElement.prototype.initialize.apply(this, arguments);
        },
        setupVideo: function () {
            MediaElement.prototype.setupVideo();
            _p.renderElement();
            _p.$videoContainer ? _p.$videoContainer.prepend(_p.$videoNode) : _p.$el.prepend(_p.$videoNode);
            _p.configElement();
            _p.addListener();
            _p.files && _p.videoControls.updateCurrentItem(_p.currentIndex, _p.files.length);
        },
        setFiles: function (files) {
            MediaElement.prototype.setFiles(files);
            _p.videoControls.updateCurrentItem(_p.currentIndex, _p.files.length);
        },
        setSrc: function (file) {
            MediaElement.prototype.setSrc(file);
            _p.initView();
        },
        resolute: function (url) {
            MediaElement.prototype.resolute(url);
            _p.resizeHandler();
        },
        next: function () {
            var config = _p.config;

            if (config.switchVideo == "auto") {
                MediaElement.prototype.next();
                _p.videoControls.updateCurrentItem(_p.currentIndex, this.files.length);
            } else if (config.switchVideo == "display") {
                triggerGlobalEvent.call(_p, YYTPlayer.MediaEventType.MEDIA_SWITCH_NEXT);
            }
        },
        previous: function () {
            var config = _p.config;

            if (config.switchVideo == "auto") {
                MediaElement.prototype.previous();
                _p.videoControls.updateCurrentItem(_p.currentIndex, _p.files.length);
            } else if (config.switchVideo == "display") {
                triggerGlobalEvent.call(this, YYTPlayer.MediaEventType.MEDIA_SWITCH_PREVIOUS);
            }
        },
        renderElement: function () {
            _p.$el = $("<div>").attr("id", "player-" + createUid());
            _p.$el.attr("class", "html5-video-player");

            _p.renderVideoContainer();
            _p.renderVideoInfoComponent();
            _p.renderVideoControlbar();

            if (_p.$parent) {
                _p.$parent.prepend(_p.$el);
            }
            _p.addViewListener();
        },
        renderVideoContainer: function () {
            var loadingTpl = '<div class="vp-loading-box">' +
                '<div class="vp-loading"></div></div>';

            _p.$videoContainer = $("<div>").attr("class", "video-container");
            _p.$videoContainer && _p.$videoContainer.append(loadingTpl);
            _p.$el.append(_p.$videoContainer);
        },
        renderVideoInfoComponent: function () {
            var messageTpl = '<div class="vp-info-error"><span class="vp-info-error-icon"></span><div class="vp-info-error-text"></div></div>';

            _p.$videoInfoContainer = $("<div>").attr("class", "video-info-container");
            _p.$videoInfoContainer.html(messageTpl);
            _p.$el.append(_p.$videoInfoContainer);
        },
        renderVideoControlbar: function () {
            _p.videoControls = new Controlbar(_p);
            _p.$el.append(_p.videoControls.$el);
        },
        configElement: function () {
            var config = _p.config;

            config.adUiContainer && _p.$videoContainer.append(config.adUiContainer);
            config.relatedVideoUi && _p.$videoContainer.append(config.relatedVideoUi);
            _p.volume(config.volume);
        },
        addListener: function () {
            var config = _p.config;

            _p.on(YYTPlayer.MediaStatus.CANPLAY + "　" + YYTPlayer.MediaEventType.MEDIA_GET_META, function () {
                _p.resizeHandler();
            });
            $(document).on("webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange", function () {
                var _isFullscreen = _p.getFullscreen(),
                    _position = _p.videoInfo.position,
                    _duration = _p.videoInfo.duration;

                if (_isFullscreen) {
                    _p.$el.attr("data-fullscreen", "fullscreen");
                    _p.$el.find(".vp-button-fullscreen").addClass("vp-button-esc-fullscreen").removeClass("vp-button-fullscreen");
                    setTimeout(function () {
                        _p.rerangeLayout(_p.$el.width(), _p.$el.height());
                        _p.rerangePosition(_position, _duration);
                    }, 200);
                } else {
                    _p.$el.attr("data-fullscreen", "non-fullscreen");
                    _p.$el.find(".vp-button-esc-fullscreen").addClass("vp-button-fullscreen").removeClass("vp-button-esc-fullscreen");
                    setTimeout(function () {
                        _p.rerangeLayout(_p.$parent.width(), _p.$parent.height());
                        _p.rerangePosition(_position, _duration);
                    }, 200);
                }
            });

            _p.$videoNode.on("click", function () {
                if (config.clickBackground) {
                    if (_p.mediaStatus == YYTPlayer.MediaStatus.PAUSE) {
                        _p.resume();
                    } else {
                        _p.pause();
                    }
                }
            });
        },
        resizeHandler: function () {
            var _isFullscreen = _p.getFullscreen();

            if (_isFullscreen) {
                _p.rerangeLayout(_p.$el.width(), _p.$el.height());
            } else {
                _p.rerangeLayout(_p.$parent.width(), _p.$parent.height());
            }
        },
        play: function () {
            MediaElement.prototype.play();
        },
        // 暂停
        pause: function () {
            MediaElement.prototype.pause();
        },
        // 恢复播放
        resume: function () {
            MediaElement.prototype.resume();
        },
        seek: function (pos) {
            MediaElement.prototype.seek(pos);
            _p.videoInfo.position = pos;
            _p.rerangePosition(pos, _p.videoInfo.duration);
        },
        // 停止播放
        stop: function () {
            MediaElement.prototype.stop.call(_p);
            _p.rerangePosition(_p.videoInfo.position, _p.videoInfo.duration);
        },
        clearVideo: function () {
            _p.videoNode.src = "";
            _p.stop();
        },
        fullscreen: function (bool, ele) {
            return MediaElement.prototype.fullscreen.call(_p, bool, ele);
        },
        setStatus: function (sta) {
            var config = _p.config,
                controls = _p.videoControls;

            MediaElement.prototype.setStatus.call(_p, sta);
            _p.videoControls.setStatus(sta);
            switch (sta) {
                case YYTPlayer.MediaStatus.PLAYING:
                    _p.$videoContainer.find(".vp-loading-box").hide();
                    _p.$videoInfoContainer.find(".vp-info-error-text").html("");
                    _p.$videoInfoContainer.find(".vp-info-error").hide();
                    _p.$videoInfoContainer.hide();
                    break;
                case YYTPlayer.MediaStatus.PAUSE:
                    config.controlbar == "over" && controls.fadeIn();
                    break;
                case YYTPlayer.MediaStatus.RESOLUTION:
                    _p.$videoInfoContainer.show();
                    _p.$videoContainer.find(".vp-loading-box").show();
                    break;
                case YYTPlayer.MediaStatus.SEEK:
                    _p.$videoInfoContainer.show();
                    _p.$videoContainer.find(".vp-loading-box").show();
                    break;
                case YYTPlayer.MediaStatus.BUFFER:
                    _p.$videoContainer.find(".vp-loading-box").show();
                    _p.$videoInfoContainer.find(".vp-info-error-text").html("");
                    _p.$videoInfoContainer.find(".vp-info-error").hide();
                    _p.$videoInfoContainer.hide();
                    break;
                default:
                    break;
            }
        },
        changeDuration: function (dur) {
            MediaElement.prototype.changeDuration.call(_p, dur);
            _p.videoControls.setDuration(_p.getDuration());
        },
        volume: function (vol) {
            MediaElement.prototype.volume.call(_p, vol);
            _p.videoControls.setVolume(vol);
        },

        addViewListener: function () {
            var config = _p.config,
                controls = _p.videoControls;

            _p.$el.on("mouseenter", function () {
                config.controlbar == "over" && controls.fadeIn();
            });
            _p.$el.on("mouseleave", function () {
                config.controlbar == "over" && controls.fadeOut();
            });
            _p.$el.on("mousemove", function () {
                config.controlbar == "over" && controls.fadeIn();
            });
            controls.on(controls.ControlbarEventType.CONTROLBAR_PLAY, function () {
                _p.play();
            });
            controls.on(controls.ControlbarEventType.CONTROLBAR_PAUSE, function () {
                _p.pause();
            });
            controls.on(controls.ControlbarEventType.CONTROLBAR_FULLSCREEN, function () {
                _p.fullscreen(true, _p.$el[0]);
                controls.fadeIn();
            });
            controls.on(controls.ControlbarEventType.CONTROLBAR_ESC_FULLSCREEN, function () {
                _p.fullscreen(false, _p.$el[0]);
                controls.fadeIn();
            });
            controls.on(controls.ControlbarEventType.CONTROLBAR_CHANGE_VOLUME, function (per) {
                _p.volume(per);
            });
            controls.on(controls.ControlbarEventType.CONTROLBAR_SEEK, function (pos) {
                _p.seek(pos);
            });
            controls.on(controls.ControlbarEventType.CONTROLBAR_SWITCH_NEXT, function (pos) {
                _p.next();
            });
            controls.on(controls.ControlbarEventType.CONTROLBAR_SWITCH_PREVIOUS, function (pos) {
                _p.previous();
            });
        },
        mediaError: function (msg) {
            MediaElement.prototype.mediaError.call(this, msg);
            this.$videoInfoContainer.find(".vp-info-error").show();
            this.$videoInfoContainer.find(".vp-info-error-text").html(msg);
        },
        updatePosition: function () {
            var _position = _p.videoInfo.position,
                _duration = _p.videoInfo.duration;

            MediaElement.prototype.updatePosition.apply(_p, arguments);
            _p.rerangePosition(_position, _duration);
        },
        rerangePosition: function (pos, duration) {
            _p.videoControls.updatePosition(pos, duration, _p.getBufferedPercent());
        },
        rerangeLayout: function (w, h) {
            var config = _p.config;

            if (config.controlbar) {
                if (config.controlbar == "fixed") {
                    h = h - _p.videoControls.getHeight();
                }
            }
            _p.$videoContainer.width(w);
            _p.$videoContainer.height(h);
            MediaElement.prototype.rerangeLayout.call(_p, w, h);
            _p.videoControls.rerangeLayout(w, h);
        },
        setConfig: function (config) {
            MediaElement.prototype.setConfig.call(_p, config);
        },
        initView: function () {
            _p.videoControls.init();
        }
    });


    var Controlbar = function (player) {
        this.player = player;
        this.config = player.config;
        this.components = this.components || {};
        this.$el = $("<div>").attr("class", "video-controls-container");
        this.initialize();
        return this;
    };
    Controlbar.prototype = new Event();
    _.extend(Controlbar.prototype, {
        ControlbarEventType: {
            CONTROLBAR_PLAY: "controlbar_play",
            CONTROLBAR_PAUSE: "controlbar_pause",
            CONTROLBAR_FULLSCREEN: "controlbar_fullscreen",
            CONTROLBAR_ESC_FULLSCREEN: "controlbar_esc_fullscreen",
            CONTROLBAR_CHANGE_VOLUME: "controlbar_change_volume",
            CONTROLBAR_SEEK: "controlbar_seek",
            CONTROLBAR_SWITCH_NEXT: "controlbar_switch_next",
            CONTROLBAR_SWITCH_PREVIOUS: "controlbar_switch_previous"
        },
        initialize: function () {
            var context = this,
                config = context.config;
            var volumeControlbarTpl = '<div class="vp-volume-controlbar-container fl">' + '</div>';
            var timesliderControlbarTpl = '<div class="vp-time-slider-container"></div>';
            var controlsTpl = '<div class="vp-bottom-controls-container">' + '<div class="vp-button fl vp-button-previous"></div>' + '<div class="vp-button fl vp-button-play"></div>' + '<div class="vp-button fl vp-button-next"></div>' + volumeControlbarTpl + '<div class="vp-time-display fl">' + '<span class="vp-current-time">00:00</span>' + '<span>/</span>' + '<span class="vp-total-time">00:00</span>' + '</div>' + '<div class="vp-button fr vp-button-fullscreen"></div></div>' + timesliderControlbarTpl;
            context.$el.html(controlsTpl);
            if (config.controlbar == "over") {
                context.$el.css("opacity", 0);
                context.fadeIn();
            }
            if (config.autoplay) {
                context.$el.find(".vp-button-pause") && context.$el.find(".vp-button-pause").addClass("vp-button-pause").removeClass("vp-button-play");
            }
            if (config.controlsPlugins) {
                var _plugins = config.controlsPlugins;
                if (typeof _plugins === "string") {
                    var $plugin = $(_plugins);
                    if ($plugin.hasClass("fl")) {
                        context.$el.find(".vp-button-fullscreen").before($plugin);
                    } else {
                        context.$el.find(".vp-button-fullscreen").after($plugin);
                    }
                } else if (isArray(_plugins)) {
                    if (_plugins && _plugins.length > 0) {
                        for (var i = 0; i < _plugins.length; i++) {
                            var item = _plugins[i],
                                $item = $(item);
                            if ($item.hasClass("fl")) {
                                context.$el.find(".vp-button-fullscreen").before(item);
                            } else {
                                context.$el.find(".vp-button-fullscreen").after(item);
                            }
                        }
                    }
                }
            }
            context.setUpComponents();
            context.addViewLisetner();
        },
        init: function () {
            var context = this,
                _timeslider = context.components.timeslider;

            _timeslider.init();
            context.$el.find(".vp-current-time").text(formatDate(0));
            context.$el.find(".vp-total-time").text(formatDate(0));
        },
        setUpComponents: function () {
            this.setupVolumeCtrl();
            this.setupTimesliderCtrl();
        },
        setupVolumeCtrl: function () {
            var context = this;
            var _volume = new VolumeCtrlComponent(context.$el.find(".vp-volume-controlbar-container"));

            _volume.on(_volume.volumeEventType.CHANGE_VOLUME, function (per) {
                context.trigger(context.ControlbarEventType.CONTROLBAR_CHANGE_VOLUME, per);
            });
            _volume.on(_volume.volumeEventType.SWITCH_MUTE, function (bool) {
                if (bool) {
                    context.trigger(context.ControlbarEventType.CONTROLBAR_CHANGE_VOLUME, 0);
                } else {
                    context.trigger(context.ControlbarEventType.CONTROLBAR_CHANGE_VOLUME, 1);
                }
            });
            context.components.volume = _volume;
        },
        setupTimesliderCtrl: function () {
            var context = this;
            var _timeslider = new TimeSlider(context.$el.find(".vp-time-slider-container"), context.config);

            _timeslider.on(_timeslider.timesliderEventType.SEEK_VIDEO, function (per) {
                context.trigger(context.ControlbarEventType.CONTROLBAR_SEEK, per * context.duration);
            });
            context.components.timeslider = _timeslider;
        },
        addViewLisetner: function () {
            var context = this;

            context.$el.on("mouseenter", function () {
                context.config.seekEnabled && context.$el.addClass("autoshow");
            });
            context.$el.on("mouseleave", function () {
                context.config.seekEnabled && context.player.mediaStatus == YYTPlayer.MediaStatus.PLAYING && context.$el.removeClass("autoshow");
            });
            context.$el.on("click", function (e) {
                var target = $(e.target);
                if (target.hasClass("vp-button-play")) {
                    e.stopPropagation();
                    context.trigger(context.ControlbarEventType.CONTROLBAR_PLAY);
                } else if (target.hasClass("vp-button-pause")) {
                    e.stopPropagation();
                    context.trigger(context.ControlbarEventType.CONTROLBAR_PAUSE);
                } else if (target.hasClass("vp-button-fullscreen")) {
                    e.stopPropagation();
                    context.trigger(context.ControlbarEventType.CONTROLBAR_FULLSCREEN);
                } else if (target.hasClass("vp-button-esc-fullscreen")) {
                    e.stopPropagation();
                    context.trigger(context.ControlbarEventType.CONTROLBAR_ESC_FULLSCREEN);
                } else if (target.hasClass("vp-button-next")) {
                    e.stopPropagation();
                    context.trigger(context.ControlbarEventType.CONTROLBAR_SWITCH_NEXT);
                } else if (target.hasClass("vp-button-previous")) {
                    e.stopPropagation();
                    context.trigger(context.ControlbarEventType.CONTROLBAR_SWITCH_PREVIOUS);
                }
            });
        },
        fadeIn: function () {
            var context = this;
            if (context.$el.css("opacity") == 0) {
                context.$el.animate({
                    opacity: 1
                }, 200, "swing", function () {
                    clearTimeout(context.fadeTimeoutId);
                    context.fadeTimeoutId = setTimeout(function () {
                        context.fadeOut();
                    }, 3000);
                });
            } else {
                clearTimeout(context.fadeTimeoutId);
                context.fadeTimeoutId = setTimeout(function () {
                    context.fadeOut();
                }, 3000);
            }
        },
        switchFade: function () {
            var context = this;
            clearTimeout(context.fadeTimeoutId);
            if (context.$el.css("opacity") == 1) {
                context.fadeOut();
            } else if (context.$el.css("opacity") == 0) {
                context.fadeIn();
            }
        },
        fadeOut: function () {
            var context = this;
            clearTimeout(context.fadeTimeoutId);
            if (context.$el.css("opacity") == 1 && context.player.mediaStatus == YYTPlayer.MediaStatus.PLAYING) {
                context.$el.animate({
                    opacity: 0
                }, 200);
            }
        },
        updatePosition: function (pos, duration, bufferPer) {
            var context = this,
                _timeslider = context.components.timeslider;
            context.$el.find(".vp-current-time").text(formatDate(pos));
            !_timeslider.isDraging && _timeslider.updateProgress(pos / duration);
            _timeslider.updateLoaded(bufferPer);
        },
        rerangeLayout: function (w, h) {
            var context = this;
            context.components.timeslider.rerangeLayout();
        },
        setDuration: function (dur) {
            this.duration = dur;
            this.$el.find(".vp-total-time").text(formatDate(dur));
            this.components.timeslider.duration = dur;
        },
        setVolume: function (vol) {
            this.components.volume.setVolume(vol);
        },
        setStatus: function (sta) {
            var context = this;
            switch (sta) {
                case YYTPlayer.MediaStatus.PLAYING:
                    context.$el.find(".vp-button-play") && context.$el.find(".vp-button-play").addClass("vp-button-pause").removeClass("vp-button-play");
                    break;
                case YYTPlayer.MediaStatus.PAUSE:
                    context.$el.find(".vp-button-pause") && context.$el.find(".vp-button-pause").addClass("vp-button-play").removeClass("vp-button-pause");
                    break;
                case YYTPlayer.MediaStatus.RESOLUTION:
                    context.$el.find(".vp-button-play") && context.$el.find(".vp-button-play").addClass("vp-button-pause").removeClass("vp-button-play");
                    break;
                default:
                    break;
            }
        },
        getHeight: function () {
            return this.$el ? this.$el.height() : 0;
        },
        updateCurrentItem: function (current, length) {
            var context = this,
                config = context.config;
            if (config.switchVideo == "auto") {
                if (current <= 0) {
                    context.$el.find(".vp-button-previous").hide();
                } else {
                    context.$el.find(".vp-button-previous").show();
                }
                if (current < length - 1) {
                    context.$el.find(".vp-button-next").show();
                } else {
                    context.$el.find(".vp-button-next").hide();
                }
            } else if (config.switchVideo == "display") {
                context.$el.find(".vp-button-next").show();
            }
        }
    });
    //========================== 时间轴 start ========================================
    // updateProgress  更新时间进度
    // updateLoaded    更新加载进度
    var TimeSlider = function (parent, config) {
        var context = this;
        var tpl = '<div class="vp-time-slider">' + '<div class="vp-time-slider-line"></div>' + '<div class="vp-time-slider-loaded-line"></div>' + '<div class="vp-time-slider-progress-line"></div>' + '<div class="vp-time-slider-drag"></div>' + '<span class="vp-time-slider-scrubber-pull"></span>' + '</div>';

        context.config = config;
        context.$el = $(tpl);
        context.$line = context.$el.find(".vp-time-slider-line");
        context.$loaded = context.$el.find(".vp-time-slider-loaded-line");
        context.$progress = context.$el.find(".vp-time-slider-progress-line");
        context.$dragbtn = context.$el.find(".vp-time-slider-drag");
        context.$scrubber = context.$el.find(".vp-time-slider-scrubber-pull");
        parent.append(context.$el);
        context.initialize();
        return context;
    };
    TimeSlider.prototype = new Event();
    _.extend(TimeSlider.prototype, {
        timesliderEventType: {
            SEEK_VIDEO: "seek_video"
        },
        isDraging: false,
        initialize: function () {
            this.duration = 0;
            this.gap = this.$dragbtn.width() / 2;
            this.validWidth = this.$line.width() - this.gap * 2;
            this.updateProgress(0);
            this.updateLoaded(0);
            this.addViewLisetner();
        },
        init: function () {
            this.updateProgress(0);
            this.updateLoaded(0);
        },
        addViewLisetner: function () {
            var context = this;
            context.$el.on("mouseenter", function (e) {
                if (!context.config.seekEnabled) return;
                context.$scrubber.show();
                updateCurrentTime(e);
                context.$el.on("mousemove", function (evt) {
                    updateCurrentTime(evt);
                });

                function updateCurrentTime(e) {
                    var target = $(e.currentTarget),
                        per = (e.clientX - context.$el.offset().left - context.gap) / context.validWidth,
                        time = formatDate(per * context.duration),
                        pos = e.clientX - context.$el.offset().left - context.gap,
                        innerW = context.$scrubber.innerWidth();
                    pos = pos < innerW / 2 ? innerW / 2 : pos;
                    pos = pos > (context.$el.width() - context.$scrubber.width()) ? (context.$el.width() - context.$scrubber.width()) : pos;
                    context.$scrubber.css("left", pos - innerW / 2);
                    context.$scrubber.text(time);
                }
            });
            context.$el.on("mouseleave", function (e) {
                if (!context.config.seekEnabled) return;
                context.$scrubber.hide();
            });
            context.$el.on("mousedown", function (e) {
                if (!context.config.seekEnabled) return;
                var target = $(e.currentTarget),
                    x = e.clientX - context.$el.offset().left - context.gap * 2,
                    per = x / context.validWidth;
                triggerGlobalEvent.call(context, context.timesliderEventType.SEEK_VIDEO, per);
            });
            context.$dragbtn.on("mousedown", function (e) {
                if (!context.config.seekEnabled) return;
                startDrag();
            });

            function startDrag() {
                context.isDraging = true;
                context.$el.on("mousemove", updateDragPos);
                $(document).on("mouseup mouseleave", stopDrag);
            }

            function updateDragPos(e) {
                var target = $(e.currentTarget);
                if (target.hasClass("vp-time-slider") || isChild(context.$el[0], target[0])) {
                    var x = e.clientX - context.$el.offset().left - context.gap,
                        per = x / context.validWidth;
                    if (x <= context.$el.width()) {
                        context.$dragbtn.css("left", x);
                        context.$progress.css("width", x + context.gap);
                    }
                } else {
                    stopDrag();
                }
            }

            function stopDrag() {
                var x = context.$dragbtn.offset().left - context.$el.offset().left - context.gap * 2,
                    per = x / context.validWidth;
                triggerGlobalEvent.call(context, context.timesliderEventType.SEEK_VIDEO, per);
                context.isDraging = false;
                context.$el.off("mousemove", updateDragPos);
                $(document).off("mouseup mouseleave");
            }
        },
        updateProgress: function (per) {
            var context = this;
            context.$progress.css("width", per * context.validWidth + context.gap);
            context.$dragbtn.css("left", per * context.validWidth);
        },
        updateLoaded: function (per) {
            var context = this;
            context.$loaded.css("width", per * context.validWidth + context.gap);
        },
        rerangeLayout: function () {
            this.gap = this.$dragbtn.width() / 2;
            this.validWidth = this.$line.width() - this.gap * 2;
        }
    });
    //========================== 时间轴 end ==================================
    //======================== start components ==========================
    //方法：
    // 	initialize: 初始化组件
    // 	setVolume: 设置声音   参数：vol     范围：0 ~ 1
    //属性：
    // 	isMute: 是否静音
    //事件：
    // 	组件配发的事件
    // 	change_volume: 声音改变
    // 	switch_mute : 静音/非静音切换
    var VolumeCtrlComponent = function (parent) {
        var context = this;
        var tpl = '<div class="vp-volume-controlbar">' + '<div class="vp-button vp-volume-basebar"></div>' + '<div class="vp-volume-slider-container">' + '<div class="vp-volume-slider">' + '<div class="vp-vs-bg-line"></div>' + '<div class="vp-vs-selected-line"></div>' + '<div class="vp-vs-drag-bar"></div>' + '</div>' + '</div>' + '</div>';
        context.$el = $(tpl);
        context.$slider = context.$el.find(".vp-volume-slider");
        context.$sliderBase = context.$el.find(".vp-volume-basebar");
        context.$sliderLine = context.$el.find(".vp-vs-bg-line");
        context.$selectedLine = context.$el.find(".vp-vs-selected-line");
        context.$dragBar = context.$el.find(".vp-vs-drag-bar");
        parent.append(context.$el);
        context.initialize();
        return context;
    };
    VolumeCtrlComponent.prototype = new Event();
    _.extend(VolumeCtrlComponent.prototype, {
        volumeEventType: {
            CHANGE_VOLUME: "change_volume",
            SWITCH_MUTE: "switch_mute"
        },
        isMute: false,
        initialize: function () {
            var context = this;
            context.$el.on("mouseenter", function () {
                context.$slider.show();
            });
            context.$slider.on("mousedown", function (e) {
                var offsetX = e.clientX - context.$slider.offset().left,
                    per = offsetX / context.$sliderLine.width();
                if ($(e.currentTarget).hasClass("vp-volume-slider")) {
                    e.stopPropagation();
                    if (per <= 0) {
                        triggerGlobalEvent.call(context, context.volumeEventType.SWITCH_MUTE, true);
                    } else if (per >= 1) {
                        triggerGlobalEvent.call(context, context.volumeEventType.SWITCH_MUTE, false);
                    } else {
                        triggerGlobalEvent.call(context, context.volumeEventType.CHANGE_VOLUME, per);
                    }
                }
            });
            context.$sliderBase.on("click", function (e) {
                var target = $(e.target),
                    level = target.data("level");
                switch (level) {
                    case 0:
                        triggerGlobalEvent.call(context, context.volumeEventType.CHANGE_VOLUME, 0.5);
                        break;
                    case 1:
                        triggerGlobalEvent.call(context, context.volumeEventType.CHANGE_VOLUME, 1);
                        break;
                    case 2:
                        triggerGlobalEvent.call(context, context.volumeEventType.CHANGE_VOLUME, 0);
                        break;
                    default:
                        break;
                }
            });
            context.$dragBar.on("mousedown", function (e) {
                startDrag();
            });

            function startDrag() {
                context.$slider.on("mousemove", function (e) {
                    var target = $(e.currentTarget);
                    if (target.hasClass("vp-volume-slider") || isChild(context.$slider[0], target[0])) {
                        var x = e.clientX - context.$slider.offset().left;
                        if (x <= context.$slider.width()) {
                            context.$dragBar.css("left", x);
                            triggerGlobalEvent.call(context, context.volumeEventType.CHANGE_VOLUME, x / context.$slider.width());
                        }
                    } else {
                        stopDrag();
                    }
                });
                $(document).on("mouseup mouseleave", stopDrag);
            }

            function stopDrag() {
                context.$slider.off("mousemove");
                $(document).off("mouseup mouseout");
            }
        },
        setVolume: function (vol) {
            var context = this;
            var w = context.$sliderLine.width() * vol;
            context.isMute = (vol <= 0 ? true : false);
            context.$selectedLine.width(w);
            context.$dragBar.css("left", w);
            if (vol <= 0) {
                context.$sliderBase.attr({
                    "class": "vp-button vp-volume-basebar vp-volume-basebar-zero"
                });
                context.$sliderBase.attr("data-level") ? context.$sliderBase.data("level", 0) : context.$sliderBase.attr("data-level", 0);
            } else if (vol > 0 && vol <= 0.5) {
                context.$sliderBase.attr({
                    "class": "vp-button vp-volume-basebar vp-volume-basebar-one"
                });
                context.$sliderBase.attr("data-level") ? context.$sliderBase.data("level", 1) : context.$sliderBase.attr("data-level", 1);
            } else {
                context.$sliderBase.attr({
                    "class": "vp-button vp-volume-basebar vp-volume-basebar-two"
                });
                context.$sliderBase.attr("data-level") ? context.$sliderBase.data("level", 2) : context.$sliderBase.attr("data-level", 2);
            }
        }
    });
    //======================== end components ============================


    //======================== 计时器 start ======================================
    YYTPlayer.Timer = function (delay, fun, complete, count) {
        this.delay = delay;
        this.fun = fun;
        this.complete = complete;
        this.count = count ? count : 0;
        this.currentCount = 0;
    };
    YYTPlayer.Timer.prototype = {
        start: function () {
            var context = this;
            if (context.timeoutId) clearInterval(context.timeoutId);
            context.timeoutId = setInterval(function () {
                if (context.count > 0 && context.currentCount >= context.count) {
                    context.complete && context.complete();
                    context.stop();
                    return;
                }
                context.fun();
                context.currentCount++;
            }, context.delay);
        },
        stop: function () {
            this.timeoutId && clearInterval(this.timeoutId);
        },
        reset: function () {
            this.currentCount = 0;
        },
        destroy: function () {
            this.timeoutId && clearInterval(this.timeoutId);
        }
    };
    //======================== 计时器 end ===============================


    //======================== 格式化时间 ===============================
    function formatDate(time, format) {
        var _format = format ? format : "xx:xx",
            _formatType = 1,
            _out;
        time = parseInt(time);
        _out = time;
        if (_format == "xx") {
            _formatType = 1;
        } else if (_format == "xx:xx") {
            _formatType = 2;
        } else if (_format == "xx:xx:xx") {
            _formatType = 3;
        }
        switch (_formatType) {
            case 1:
                _out = time;
                break;
            case 2:
                var m = Math.floor(time / 60);
                var s = time - m * 60;
                m = m > 9 ? m : ("0" + m);
                s = s > 9 ? s : ("0" + s);
                _out = m + ":" + s;
                break;
            case 3:
                var h = Math.floor(time / 3600);
                var m = Math.floor((time - h * 3600) / 60);
                var s = time - h * 3600 - m * 60;
                h = h > 9 ? h : ("0" + h);
                m = m > 9 ? m : ("0" + m);
                s = s > 9 ? s : ("0" + s);
                _out = h + ":" + m + ":" + s;
                break;
            default:
                break;
        }
        return _out;
    }

    //================================ end 格式化时间 =========================

    //=============================== start 生成uid =======================
    function createUid(len, radix) {
        var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
            chars = CHARS,
            uuid = [],
            i;
        radix = radix || chars.length;
        if (len) {
            // Compact form
            for (i = 0; i < len; i++) {
                uuid[i] = chars[0 | Math.random() * radix];
            }
        } else {
            // rfc4122, version 4 form
            var r;
            // rfc4122 requires these characters
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            // Fill in random data.  At i==19 set the high bits of clock sequence as
            // per rfc4122, sec. 4.1.5
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }
        return uuid.join('');
    }

    //=================================  end 生成uid =======================

    function requestFullscreenHandler(ele) {
        // 对全屏的实现各个浏览器都不太一样，目前没有一个统一的标准
        if (ele) {
            if (ele.requestFullscreen) {
                // w3c定义
                ele.requestFullscreen();
                return true;
            } else if (ele.requestFullScreen) {
                ele.requestFullScreen();
                return true;
            } else if (ele.webkitEnterFullScreen) {
                ele.webkitEnterFullScreen();
                return true;
            } else if (ele.webkitRequestFullScreen) {
                // webkit定义
                ele.webkitRequestFullScreen();
                return true;
            } else if (ele.mozRequestFullScreen) {
                // firefox定义
                ele.mozRequestFullScreen();
                return true;
            } else if (ele.msRequestFullscreen) {
                ele.msRequestFullscreen();
                return true;
            }
        }
        return false;
    }

    function cancelFullscreenHandler() {
        var doc = document;
        if (doc.exitFullscreen) {
            // w3c定义
            doc.exitFullscreen();
            return true;
        } else if (doc.webkitExitFullscreen) {
            // webkit定义
            doc.webkitExitFullscreen();
            return true;
        } else if (doc.mozCancelFullScreen) {
            // firefox定义
            doc.mozCancelFullScreen();
            return true;
        } else if (doc.msExitFullscreen) {
            //ie定义
            doc.msExitFullscreen();
            return true;
        }
        return false;
    }

    function isChild(oParent, obj) {
        while (obj) {
            if (obj == oParent) return true;
            obj = obj.parentNode;
        }
        return false;
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }

    function triggerGlobalEvent(eventType, param) {
        var context = this;
        if (context instanceof Event) {
            context.trigger(eventType, param);
        } else {
            $(document).trigger(eventType, param);
        }
    }

    return YYTPlayer;
}))
