/**
 * 验证码输入模块
 */
define(function(require, exports, module){
    var ajax,juicer,alertify;
    var pickNum = 0;

    ajax = require('ajax');
    juicer = require('juicer');
    alertify = require('alertify');



    function authCode(options) {
        var self = this;
        self.params = [];
        var tpl = [
            '<div class="zh_authcode_component zh_authcode_grid">',
            '<div class="zh_authcode_grid_head clearfix">',
            '<div class="zh_authcode_title">验证码</div>',
            '<div class="tzh_authcode_input_wrap">',
            '<div class="zh_authcode_grid_input">',
            '<ul>',
            '<li>',
            '<div></div>',
            '<div></div>',
            '<div></div>',
            '<div></div>',
            '</li>',
            '</ul>',
            '<div class="zh_authcode_backspace J_captcha_backspace"></div>',
            '</div>',
            '</div>',
            '</div>',
            '<div class="zh_authcode_grid_content">',
            '<span class="zh_authcode_img" style="background-image: url(http://i.yinyuetai.com{{imgUrl}})"></span>',
            '<a class="vCodeUpdate J_authcode_change" href="javascript:;">看不清?</a>',
            '<div class="zh_authcode_help">',
            '点击框内文字输入上图中',
            '<span class="c_c00">汉字</span>',
            '对应汉字',
            '</div>',
            '<div class="zh_authcode_buttons clearfix">',
            '{@each images as it,k}',
            '<a href="javascript:;" data-id="{{it}}" data-classname="zh_authcode_btn_{{k}}" class="J_pick">',
            '<div class="zh_authcode_btn_{{k}}" style="background-image: url(http://i.yinyuetai.com{{imgUrl}})"></div>',
            '</a>',
            '{@/each}',
            '</div>',
            '</div>'
        ].join('');

        ajax.getJSON('http://i.yinyuetai.com/writing/vote-code-image-list?callback=?', {_t : new Date()}, function(data) {
            if (!data.error) {
                var imgUrl = data.imgUrl;
                options.$el.html(juicer(tpl, data));

                self.params = [];

                options.$el.on('click', '.J_pick', function(e) {
                    var that = $(e.currentTarget);

                    if (pickNum == 4) {
                        return;
                    }

                    $('.zh_authcode_grid_input li div').eq(pickNum).css('background-image',
                        'url(http://i.yinyuetai.com' + imgUrl + ')').addClass(that.data('classname'));

                    pickNum++;
                    self.params.push(that.data('id'));
                });

                options.$el.on('click', '.J_captcha_backspace', function(e) {
                    $('.zh_authcode_grid_input li div').attr('style', '');
                    pickNum = 0;
                    self.params = [];
                });

                options.$el.on('click', '.J_authcode_change', function(e) {

                    ajax.getJSON('http://i.yinyuetai.com/writing/vote-code-image-list?callback=?', {_t : new Date()}, function(result) {
                        if (!result.error) {
                            imgUrl = result.imgUrl;
                            pickNum = 0;
                            self.params = [];
                            options.$el.html(juicer(tpl, result));
                        } else {
                            alertify.error(result.message);
                        }
                    });
                });

            } else {
                alertify.error(data.message);
            }
        });

    }

    authCode.prototype = {
        //清空输入的验证码，并且重新获取验证码
        inputAgain: function(){
            $(".J_authcode_change").trigger("click");
        }
    };

    module.exports = authCode;
})
