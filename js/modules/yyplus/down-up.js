define(function(require, exports, module){
    var LOCOLHOST = 'http://127.0.0.1';
    /****************juicer********************/
    var juicer = require('juicer');
    var Alertify  = require("alertify");
    //var Suggest = require('suggest');

    Y.api = {
        api: false,
        get: function (callback) {
            var context = this;
            if (context.api) {
                callback && callback(context.api);
                return;
            }
            $.ajax({
                url: 'http://www.yinyuetai.com/api/client/api?json=true',
                dataType: "jsonp",
                jsonp: "callback",
                success: function(result){
                    context.api = result;
                    callback && callback(context.api);
                }
            });
            /*
            new Request.JSONP({
                secret: false,
                url: 'http://www.yinyuetai.com/api/client/api?json=true',
                onComplete: function (result) {

                }
            }).send();
            */
        }
    };

    Y.CONFIG = {
        p2pServer: LOCOLHOST + ':8080'
    };

    Y.download = {
        model: {
            id: 0,//videoId
            title: '',
            pic: '',
            videoFileInfo: {
                md5: ''
            }
        },
        models: {},
        getVideoFileInfo: function (videoId, callback) {
            var context = this;
            if (context.models[videoId]) {
                callback(context.models[videoId]);
                return;
            }
            $.ajax({
                url: 'http://www.yinyuetai.com/api/client/get-video-file-info?json=true&videoId=' + videoId,
                dataType: 'jsonp',
                jsonp: "callback",
                success: function(result){
                    if (result.error) {
                        Alertify.error(result.message);
                    } else {
                        context.models[videoId] = {
                            id: videoId,
                            title: result.title,
                            pic: result.bigHeadImg,
                            videoFileInfo: result.videoFileInfo
                        };
                        callback(context.models[videoId]);
                    }
                }
            });
            /*
            new Request.JSONP({
                secret: false,
                url: 'http://www.yinyuetai.com/api/client/get-video-file-info?json=true&videoId=' + videoId,
                onComplete: function (result) {
                    if (result.error) {
                        Alertify.error(result.message);
                    } else {
                        context.models[videoId] = {
                            id: videoId,
                            title: result.title,
                            pic: result.bigHeadImg,
                            videoFileInfo: result.videoFileInfo
                        };
                        callback(context.models[videoId]);
                    }
                }
            }).send();
            */
        },
        start: function (data, success) {
            $.ajax({
                url: Y.CONFIG['p2pServer'] + '/download?userId=' + userId,
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function(result){
                    if (result.error) {
                        Alertify.error(result.msg || result.message);
                    } else {
                        success && success(result);
                    }
                }
            });
        },
        pause: function (md5, success) {
            $.ajax({
                url: Y.CONFIG['p2pServer'] + '/download/pause?userId=' + userId,
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function(result){
                    if (result.error) {
                        Alertify.error(result.msg || result.message);
                    } else {
                        Alertify.success('操作成功!');
                        success && success(result);
                    }
                }
            });
        },
        remove: function (md5, success) {
            $.ajax({
                url: Y.CONFIG['p2pServer'] + '/download/remove?userId=' + userId,
                data: {id: md5},
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function (result) {
                    if (result.error) {
                        Alertify.error(result.msg || result.message);
                    } else {
                        Alertify.success('删除成功！');
                        success && success(result);
                    }
                }
            });
        },
        resume: function (data, success) {
            this.getVideoFileInfo(data.videoId, function (model) {
                Array.some(model.videoFileInfo, function (item, index) {
                    if (item.bitrate == data.bitrate) {
                        $.ajax({
                            url: Y.CONFIG['p2pServer'] + '/download/resume?userId=' + userId,
                            dataType: 'jsonp',
                            jsonp: 'callback',
                            data: {
                                id: data.id,
                                src: item.videoUrl
                            },
                            success: function(result){
                                if (result.error) {
                                    Alertify.error(result.msg || result.message);
                                } else {
                                    Alertify.success('操作成功!');
                                    success && success(result);
                                }
                            }
                        });
                    }
                });
            })
        }
    };

    Y.upload = {
        model: {
            fileMd5: '',//id
            remoteFileName: '',
            remoteFileLength: 0,
            aspect: '',//视频比例如16：9
            uploadFileId: 0,
            uploadServerIp: '',
            uploadServerFtpRoot: ''
        },
        models: {},
        getMd5ByPath: function (path, success) {
            Alertify.loading('正在验证视频信息，请稍候……');
            var context = this;
            $.ajax({
                url: Y.CONFIG['p2pServer'] + '/upload?path=' + encodeURIComponent(path),
                dataType: 'jsonp',
                jsonp: 'callback',
                data: 'userId=' + userId,
                success: function (result) {
                    if (result.error) {
                        //Y.loading.kill_msg();
                        Alertify.error(result.msg || result.message);
                    } else {
                        context.models[result.fileMd5] = result;
                        context.checkFileMd5(result.fileMd5, success);
                        Alertify.success(result.msg || result.message);
                    }
                }
            });
        },
        checkFileMd5: function (fileMd5, success) {
            var context = this;
            Y.api.get(function (api) {
                var urlApi = api['CheckUploadFileMd5Task'];
                $.ajax({
                    url: urlApi['remoteServer'] + urlApi['uri'],
                    data: {
                        fileMd5: fileMd5,
                        json: true,
                        userId: userId
                    },
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    success: function(result){
                        Y.loading.kill_msg();
                        if (!result.error && result.md5Status) {
                            Alertify.success('此MV可以上传，请继续完善信息');
                            success && success(context.models[fileMd5]);
                        } else {
                            Alertify.error(result.message);
                        }
                    }
                });
            });
        },
        start: function (md5, success) {
            var model = this.models[md5];
            Y.api.get(function (result) {
                var api = result['FinishUserUploadTask'];
                $.ajax({
                    url: Y.CONFIG.p2pServer + '/upload/start',
                    data: {
                        uploadFileId: model['uploadFileId'],
                        uploadServerIp: model['uploadServerIp'],
                        uploadServerFtpRoot: model['uploadServerFtpRoot'],
                        id: model['fileMd5'],
                        userId: userId,
                        finishUpload: api['remoteServer'] + api['uri']
                    },
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    success: function(result){
                        if (result.error) {
                            Alertify.error(result.msg || result.message);
                        } else {
                            success && success();
                        }
                    }
                });
            })
        },
        finish: function (data) {//上传完成后通知客户端
//		Y.api.get(function (result) {
//			var api = result['FinishUserUploadTask'];
//			new Request.JSONP({
//				secret: false,
//				url: api['remoteServer'] + api['uri'],
//				data: {
//					remoteFileName: data['remoteFileName'],
//					uploadFileId: data['uploadFileId'],
//					userId: userId,
//					json: true
//				},
//				onComplete: function (result) {
//					if (result.error) {
//						errorMessage(result.message);
//					}
//				}
//			}).send();
//		});
        },
        pause: function (md5) {
            $.ajax({
                url: Y.CONFIG.p2pServer + '/upload/pause',
                dataType: 'jsonp',
                jsonp: 'callback',
                data: {
                    id: md5,
                    'userId': userId
                },
                success: function(result){
                    if (result.error) {
                        Alertify.error(result.msg || result.message);
                    } else {
                        Alertify.success('操作成功！');
                    }
                }
            });
        },
        remove: function (md5, success) {
            $.ajax({
                url: Y.CONFIG.p2pServer + '/upload/remove',
                dataType: 'jsonp',
                jsonp: 'callback',
                data: {
                    id: md5,
                    'userId': userId
                },
                success: function(result){
                    if (result.error) {
                        Alertify.error(result.msg || result.message);
                    } else {
                        Alertify.success('删除成功！');
                        success && success();
                    }
                }
            });
        },
        resume: function (md5, success) {
            $.ajax({
                url: Y.CONFIG['p2pServer'] + '/upload/resume?userId=' + userId,
                dataType: 'jsonp',
                jsonp: 'callback',
                data: {id: md5},
                success: function(result){
                    if (result.error) {
                        Alertify.error(result.msg || result.message);
                    } else {
                        Alertify.success('操作成功！');
                        success && success(result);
                    }
                }
            });
        },
        config: function () {
            $.ajax({
                url: 'http://www.yinyuetai.com/api/client/settings?json=true',
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function(result){
                    if (result.error) {
                        Alertify.error(result.message);
                    } else {
                        $.ajax({
                            url: Y.CONFIG.p2pServer + '/config',
                            dataType: 'jsonp',
                            jsonp: 'callback',
                            data: result
                        });
                    }
                }
            });
        }
    };

    Y.view = {
        init: function () {
            var $bom = $('bom'), context = this;
            //$bom && $bom.addEvents(({
            //参看http://blog.sina.com.cn/s/blog_946e765101015psn.html
            //暂时放下。再改。重点
            $bom && $bom.on(({
                'click:relay(.J_down_mv)': function (event, target) {
                    event.preventDefault();
                    var id = target.get('data-id');//videoId
                    if (!id) {
                        return;
                    }
                    context.downloadMbox(id);
                },
                'click:relay(.J_pause_down)': function (event, target) {
                    event.preventDefault();
                    var md5 = target.get('data-id');
                    Y.download.pause(md5, function () {
                        target.removeClass('J_pause_down').addClass('paused J_resume_down');
                    })
                },
                'click:relay(.J_resume_down)': function (event, target) {
                    event.preventDefault();
                    var md5 = target.get('data-id'), videoId = target.get('data-videoId'),
                        bitrate = target.get('data-bitrate');
                    Y.download.resume({id: md5, videoId: videoId, bitrate: bitrate}, function () {
                        target.removeClass('paused J_resume_down').addClass('J_pause_down');
                    })
                },
                'click:relay(.J_remove_down)': function (event, target) {
                    event.preventDefault();
                    var md5 = target.get('data-id');
                    var content = '<h4>确定要删除此MV吗？</h4><p>删除后将不可恢复</p>';
                    mbox.show("deleteOneAction" + md5, "<em></em>删除操作", content, {
                        closeBtn: true,
                        className: 'notice',
                        ctrlButtons: [
                            {'title': '确定', 'type': 'click', 'func': function (mbox) {
                                Y.download.remove(md5, function () {
                                    target.getParent('li').dispose();
                                    mbox.hide();
                                })
                            }},
                            {'title': '取消', 'type': 'click', 'func': function (mbox) {
                                mbox.hide();
                            }}
                        ]
                    });
                },
                'click:relay(.J_upload_mv)': function (event, target) {
                    event.preventDefault();
                    login.popupLogin(function () {
                        var html = '<iframe src="http://yyplus.yinyuetai.com/upload/upload-simple" height="96%" width="100%" scrolling="yes"></iframe>';
                        mbox.show('upload_mv_mbox' + Date.now(), '<em></em>上传高清MV', html, {
                            width: 799,
                            height: 590,
                            className: 'upload_popup'
//						onInit: function (mbox) {
//							loadMessage('正在初始化，请稍候……');
//							Y.api.get(function (result) {
//								var api = result['CreateUserUploadTask'],
//										url = api['remoteServer'] + api['uri'];
//								new Request.JSONP({
//									secret: false,
//									url: 'http://www.yinyuetai.com/api/client/settings?json=true',
//									onComplete: function (result) {
//										if (result.error) {
//											errorMessage(result.message);
//										} else {
//											Y.loading.kill_msg();
//											context.initUploadBox(mbox, url, JSON.decode(result.VideoSourceType));
//										}
//									}
//								}).send();
//							});
//						}
                        });
                    });
                },
                'click:relay(.J_pause_upload)': function (event, target) {
                    event.preventDefault();
                    var md5 = target.get('data-md5');
                    Y.upload.pause(md5);
                },
                'click:relay(.J_resume_upload)': function (event, target) {
                    event.preventDefault();
                    var md5 = target.get('data-md5');
                    Y.upload.resume(md5);
                },
                'click:relay(.J_remove_upload)': function (event, target) {
                    event.preventDefault();
                    var md5 = target.get('data-md5');
                    var content = '<h4>确定要删除此MV吗？</h4><p>删除后将不可恢复</p>';
                    mbox.show("deleteOneAction" + md5, "<em></em>删除操作", content, {
                        closeBtn: true,
                        className: 'notice',
                        ctrlButtons: [
                            {'title': '确定', 'type': 'click', 'func': function (mbox) {
                                Y.upload.remove(md5, function () {
                                    target.getParent('tr').dispose();
                                    mbox.hide();
                                });
                            }},
                            {'title': '取消', 'type': 'click', 'func': function (mbox) {
                                mbox.hide();
                            }}
                        ]
                    });
                },
                'click:relay(.J_folder)': function (event, target) {
                    event.preventDefault();
                    var file = target.get('data-file'), localpath = decodeURIComponent(target.get('data-localpath'));
                    if (localpath) {
                        if (file) {
                            window.external.CB_OpenFile(localpath + '\\' + file, 'Y.external.CB_OpenFile');
                        } else {
                            window.external.CB_OpenFolder("main", localpath, 'Y.external.CB_OpenFolder');
                        }
                    } else {
                        Y.setting.get(function (result) {
                            var cachepath = result.cachepath;
                            window.external.CB_OpenFolder("main", cachepath, 'Y.external.CB_OpenFolder');
                        });
                    }
                }
            }))
        },
        downloadMbox: function (videoId) {
            var context = this;
            login.popupLogin(function () {
                Alertify.loading("正在获取视频信息，请稍候……");
                Y.setting.get(function (setting) {
                    Y.download.getVideoFileInfo(videoId, function (model) {
                        Alertify.hide();
                        model.cachepath = setting.cachepath;
                        var html = juicer.to_html($('download_tpl').innerHTML, model);
                        //mbox和suggest一样，要用到mootools中的东西。暂放
                        mbox.show('download_mv_mbox' + videoId, '<em></em>下载MV：' + model.title, html, {
                            width: 480,
                            className: 'down_popup',
                            onInit: function (mbox) {
                                mbox.box.addEvents({
                                    'click:relay(.dl_btn)': function (event, target) {
                                        event.preventDefault();
                                        context.download(target, model, function () {
                                            mbox.hide();
                                        });
                                    },
                                    'click:relay(.J_select)': function (event, target) {//选择下载文件夹
                                        Y.external.CB_ChooseFolderDownload = function (folder) {
                                            var $input = target.getPrevious('input');
                                            $input.value = folder;
                                            Y.setting.set({'cachepath': folder});
                                        };
                                        window.external.CB_ChooseFolder('download', model.cachepath, 'Y.external.CB_ChooseFolderDownload');
                                    }
                                });
                            }
                        })
                    });
                });
            });
        },
        download: function (target, model, onCheckSuccess) {
            var context = this;
            if (target.retrieve('disabled')) {
                return;
            }
            target.retrieve('disabled', 'true');

            var bitrateType = target.get('data-bitrate-type');
            var bitrateTypeint = target.get('data-bitrate-type-int');
            var checkSuccess = function (videoUrl) {
                onCheckSuccess && onCheckSuccess();
//			mbox.hide();
                target.eliminate('disabled');
                var data;
                Array.each(model.videoFileInfo, function (item, index) {
                    if (item.bitrateType == bitrateTypeint) {
                        data = {
                            src: videoUrl,
                            len: item.fileSize,
                            id: item.md5,
                            title: model.title + item.QualityLevelName + '版',
                            pic: model.pic,
                            videoId: model.id
                        }
                    }
                });
                Y.download.start(data, function () {
                    Alertify.success('MV已开始下载~');
                });
            };
            var checkError = function () {
                target.eliminate('disabled');
            };
            context.checkDownload(model.id, bitrateType, checkSuccess, checkError);
        },
        checkDownload: function (videoid, bitrateType, success, error) {
            Y.api.get(function (api) {
                var urlApi = api['DoDownload'];
                $.ajax({
                    url: urlApi['remoteServer'] + urlApi['uri'],
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    data: {
                        videoId: videoid,
                        videoFileType: bitrateType
                    },
                    success: function(result){
                        if (!result.error) {
                            success && success(result.videoUrl);
                        } else {
                            Alertify.error(result.message);
                            error();
                        }
                    }
                });
            });
        },
        initUploadBox: function (mbox, url, videoSourceType) {
            var $el = mbox.box, $form = mbox.getElement('form'),
                $path = $form.getElement('.J_path'),
                $title = $($form['videoName']),
                $artistIds = $($form['artistIds']),
                $artistName = $form['artistName'],
                $userId = $($form['userId']),
                $videoSourceType = $($form['videoSourceType']);
            var options = "<option value=''>请选择视频类型</option>";
            for (var key in videoSourceType) {
                options += "<option value='" + key + "'>" + videoSourceType[key] + "</option>";
            }
            $videoSourceType.set('html', options);
            $form.action = url;
            $el.addEvents({
                'click:relay(.J_file)': function () {
                    Y.external.CB_ChooseFile = function (file) {
                        $path.value = file;
                        var fileTitle = file.substring(file.lastIndexOf('\\') + 1, file.lastIndexOf('.'));
                        $title.value = fileTitle.substr(0, 128);//保证title不超过128字
                        Y.upload.getMd5ByPath(file, function (result) {
                            Object.each(result, function (item, key) {
                                var $input = $form[key];
                                if (!$input) {
                                    $input = new Element('input', {
                                        'type': 'hidden',
                                        'name': key
                                    }).inject($form, 'top');
                                }
                                $input.value = item;
                            })
                        });
                    };
                    window.external.CB_ChooseFile('Y.external.CB_ChooseFile');
                },
                'focus:relay(input)': function (event, target) {
                    target.removeClass('err_input');
                }
            });
            this.artist($form);
            this.tag($form);
            ajaxForm.init($form, {
                crossDomain: true,
                onRequest: function () {
                    if (!$form['fileMd5']) {
                        Alertify.error('请先选择你要上传的视频哦~');
                        $path.addClass('err_input');
                        return false;
                    }
                    if ($title.value.trim() == '') {
                        Alertify.error('请输入视频标题');
                        $title.addClass('err_input');
                        return false;
                    }
                    if ($title.value.trim().length > 128) {
                        Alertify.error('视频标题最好不超过128个字哦~');
                        $title.addClass('err_input');
                        return false;
                    }
                    if ($artistIds.value == '' && $artistName.value == '') {
                        Alertify.error('请输入艺人名称');
                        $form.getElement('.J_artist').addClass('err_input');
                        return false;
                    }
                    if (!$videoSourceType.value) {
                        Alertify.error('请选择视频类型');
                        return false;
                    }
                    $userId.value = userId;
                    return true;
                },
                onComplete: function (result) {
                    if (result.error) {
                        Alertify.error(result.message);
                    } else {
                        var md5 = $form['fileMd5'].value;
                        Object.merge(Y.upload.models[md5], {fileMd5: md5}, result);
                        Y.upload.start(md5, function () {
                            mbox.hide();
                            Alertify.success('MV已开始上传，请稍候……');
                        });
                    }
                }
            })
        },
        artist: function ($form) {
            var $artist = $form.getElement('.J_artist'),
                $add = $artist.getNext('a'),
                $err = $form.getElement('.J_artist_err'),
                $artistIds = $form['artistIds'],
                $artistName = $form['artistName'],
                artistIds = [], artistNames = [], addData;//artistNames用来记录不是从下拉中选择的艺人

            new Suggest($artist, {
                url: 'http://www.yinyuetai.com/api/search/client-auto-complete',
                useJSONP: true,
                resultField: 'artists',
                keyword: 'keyword',
                onSelect: function (data) {
                    addData = data;
                    $artist.blur();
                    $add.fireEvent('click');
                    return false;
                }
            })

            $artist.addEvents({
                'focus': function () {
                    $err.setStyle('display', 'none');
                }
            });
            $add.addEvent('click', function (e) {
                if (e) {
                    e.preventDefault();
                }
                var val = $artist.value.trim();
                if (val == '') {
                    $err.set('text', '请输入艺人名称~').setStyle('display', 'block');
                    return;
                }
                if (getStrLength(val) > 50) {
                    $err.set('text', '艺人名称最多50个字符哦').setStyle('display', 'block');
                    return;
                }
                if (artistIds.length + artistNames.length >= 5) {
                    $err.set('text', '最多只能添加5个艺人哦~').setStyle('display', 'block');
                    return;
                }
                var addedHtml = '';
                if (addData) {//从下拉中选择传参artistIds
                    if (artistIds.contains("\"" + addData.id + "\"")) {
                        $err.set('text', '该艺人你已经添加过了~').setStyle('display', 'block');
                        return;
                    }
                    addedHtml = addData.txt + '<a href="javascript:;" class="J_del" data-id="' + addData.id + '"></a>'
                    artistIds.push("\"" + addData.id + "\"");
                    $artistIds.value = artistIds.length ? "[" + artistIds + "]" : "";
                } else {//非下拉选择传参artistName
                    if (artistNames.contains("\"" + val + "\"")) {
                        $err.set('text', '该艺人你已经添加过了~').setStyle('display', 'block');
                        return;
                    }
                    addedHtml = val + '<a href="javascript:;" class="J_del" data-artist="' + val + '"></a>';
                    artistNames.push("\"" + val + "\"");
                    $artistName.value = artistNames.length ? "[" + artistNames + "]" : "";
                }
                var $p = new Element('p', {
                    'class': 'tag new',
                    'html': addedHtml,
                    'events': {
                        'click:relay(.J_del)': function (event, target) {
                            event.preventDefault();
                            var id = target.get('data-id'), artistName = target.get('data-artist');
                            if (id) {
                                artistIds.erase("\"" + id + "\"");
                                $artistIds.value = artistIds.length ? "[" + artistIds + "]" : "";
                            } else if (artistName) {
                                artistNames.erase("\"" + artistName + "\"");
                                $artistName.value = artistNames.length ? "[" + artistNames + "]" : "";
                            }
                            $p.dispose();
                        }
                    }
                }).inject($artist.getParent('p'), 'before');
                $artist.value = '';
                addData = undefined;
            })
        },
        tag: function ($form) {
            var $tag = $form.getElement('.J_tag'),
                $add = $tag.getNext('a'),
                $err = $form.getElement('.J_tag_err'),
                $tags = $form['tags'],
                dataArr = [];
            $add.addEvent('click', function (e) {
                e && e.preventDefault();
                var val = $tag.value.trim();
                if (val == '') {
                    $err.set('text', '请输入标签~').setStyle('display', 'block');
                    return;
                }
                if (getStrLength(val) > 20) {
                    $err.set('text', '标签最多10个汉字哦').setStyle('display', 'block');
                    return;
                }
                if (dataArr.length >= 5) {
                    $err.set('text', '最多只能添加5个标签哦~').setStyle('display', 'block');
                    return;
                }
                if (dataArr.contains("\"" + val + "\"")) {
                    $err.set('text', '该标签你已经添加过了').setStyle('display', 'block');
                    return;
                }
                dataArr.push("\"" + val + "\"");
                $tags.value = dataArr.length ? "[" + dataArr + "]" : "";
                var $p = new Element('p', {
                    'class': 'tag new',
                    'html': val + '<a href="javascript:;" class="J_del" data-tag="' + val + '"></a>',
                    'events': {
                        'click:relay(.J_del)': function (event, target) {
                            event.preventDefault();
                            var tag = target.get('data-tag');
                            dataArr.erase("\"" + val + "\"");
                            $tags.value = dataArr.length ? "[" + dataArr + "]" : "";
                            $p.dispose();
                        }
                    }
                }).inject($tag.getParent('p'), 'before');
                $tag.value = '';
            });
            $tag.addEvent('focus', function () {
                $err.setStyle('display', 'none');
            })
        }
    };

//设置
    Y.setting = {
        model: {
            "autorun": true,
            "autoupdate": true,
            "cachepath": "",
            "closequit": false,
            "notice": {
                "done": true,
                "error": true,
                "exit": true
            }
        },
        loading: false,
        get: function (callback) {
            var context = this;
            if (this.loading) {
                setTimeout(function () {
                    context.get(callback);
                }, 50);
                return;
            }
            this.loading = true;
            $.ajax({
                url: Y.CONFIG['p2pServer'] + '/setting/get',
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function(result){
                    context.loading = false;
                    if (result.error) {
                        Alertify.error(result.msg || result.message);
                    } else {
                        context.model = result.setting;
                        callback && callback(context.model);
                    }
                }
            });
        },
        set: function (data) {
            Object.merge(this.model, data);
            $.ajax({
                url: Y.CONFIG['p2pServer'] + '/setting',
                dataType: 'jsonp',
                jsonp: 'callback',
                data: Object.toQueryString(this.model),
                success: function(result){
                    if (result && result.error) {
                        Alertify.error(result.msg || result.message);
                    }
                }
            });
        }
    };

    /***************************与客户端调用接口回调的全局变量**************************************/
    Y.external = {
        CB_OpenFolder: function (data) {//打开文件夹
            if (data < 0) {
                alert('您所选择的文件夹已删除或不存在~');
            }
        },
        CB_OpenFile: function (data) {//打开文件
            if (data < 0) {
                alert('您所点击的视频已删除或更改路径~');
            }
        },
        CB_GetPort: function (data) {
            var port = data > 0 ? data : 8080
            Y.CONFIG.p2pServer = LOCOLHOST + ':' + port;
        }
    };

//通知
    Y.notice = {
        data: {//正在上传和正在下载的ids，todo 都是md5
            uploading: [],
            downloading: []
        },
        init: function () {
            var context = this;
            $.ajax({
                url: Y.CONFIG['p2pServer'] + '/uploading-downloading-ids',
                dataType: 'jsonp',
                jsonp: 'callback',
                success: function(result){
                    context.data = Object.merge(context.data, result);
                    context.connect();
                    if (context.data.downloading.length > 0) {
                        $(".my_download").attr('display', 'block');
                    }
                }
            });
//		setInterval(function () {
//			new Request.JSONP({
//				secret: false,
//				url: Y.CONFIG['p2pServer'] + '/checkfinishupload',
//				onComplete: function (result) {
//					if (result && result.length > 0) {
//						for (var i = 0; i < result.length; i++) {
//							var item = result[i];
//							context.data.uploading.erase(item.id);
//							context.completeMsg(item.msg);
//							Y.upload.finish(item);
//						}
//					}
//				}
//			}).send();
//		}, 5000)
        },
        connect: function () {
            var context = this;
            setTimeout(function () {
                $.ajax({
                    url: Y.CONFIG['p2pServer'] + '/notice',
                    dataType: 'jsonp',
                    jsonp: 'callback',
                    success: function(result){
                        context.connect();
                        switch (result.code) {
                            case 0://下载任务
                                Y.view.downloadMbox(result.id);
                                break;
                            case 6://下载开始
                                context.data.downloading.include(result.id);
                                break;
                            case 3://上传开始
                                context.data.uploading.include(result.id);
                                break;
                            case 1://下载出错
                            case 4://上传出错
                                context.errMsg(result.msg);
                                break;
                            case 2://下载完成
                                context.data.downloading.erase(result.id);
                                context.completeMsg(result.msg);
                                break;
                            case 5://上传完成
                                context.data.uploading.erase(result.id);
                                context.completeMsg(result.msg);
                                Y.upload.finish(result);
                                break;
                        }
                        if (context.data.downloading.length > 0) {
                            $(".my_download").attr('display', 'block');
                        }else{
                            $(".my_download").attr('display', 'none');
                        }
                    }
                });
            }, 1000);
        },
        completeMsg: function (msg) {
            window.external.CB_Msg(msg);
        },
        errMsg: function (msg) {
            window.external.CB_ErrMsg(msg);
        },
        quitMsg: function (msg) {
            window.external.CB_QuitMsg(msg);
        }
    };

    function init(){
        listener();
        addWindowExternal();
        //setupLoginCallback();
        juicerRegister();
    }
    function listener(){
        $(window).load(function(){
            Y.view.init();
            //Y.notice.init();
        });
    }
    function addWindowExternal(){
        /*******客户端api end********/
        window.external.CB_GetPort && window.external.CB_GetPort('main', 'Y.external.CB_GetPort');
    }
    //function setupLoginCallback(){
    //    login.callbacks.push(function () {
    //        Y.notice.init();
    //    });
    //}
    function juicerRegister(){
        juicer.register('formatFileSize', function (filesize) {
            var k = Math.ceil(filesize / 1024), m, g;
            if (k > 1024) {
                m = Math.ceil(k / 1024);
                if (m > 1024) {
                    g = Math.ceil(m / 1024);
                    return g + "G"
                }
                return m + "M";
            }
            return k + "K";
        });
        juicer.register('getFileProgress', function (item, index, width, type) {
            var progress = item.progress;
            return Math.floor(progress * width);
        });
    }


    /*******客户端api start********/
    function YYT_Port(port) {//加速器端口号
        Y.CONFIG['p2pServer'] = LOCOLHOST + ":" + port;
    }

    function YYT_Close() {//关闭窗口时调用
        if (Y.notice.data.downloading.length || Y.notice.data.uploading.length) {
//		Y.notice.quitMsg('您还有未完成的上传/下载，是否要退出客户端？');
            Y.notice.quitMsg("");
        } else {
            Y.notice.quitMsg("");
        }
    }

    return {
        init: init
    }
})

