function onSendMsg() {
    if (!selToID) {
        alert("您还没有好友，暂不能聊天");
        $("#send_msg_text").val('');
        return;
    }
    //获取消息内容
    var msgtosend = document.getElementsByClassName("msgedit")[0].value;
    var msgLen = webim.Tool.getStrBytes(msgtosend);

    if (msgtosend.length < 1) {
        alert("发送的消息不能为空!");
        $("#send_msg_text").val('');
        return;
    }
    var maxLen, errInfo;
    if (selType == SessionType.C2C) {
        maxLen = MaxMsgLen.C2C;
        errInfo = "消息长度超出限制(最多" + Math.round(maxLen / 3) + "汉字)";
    } else {
        maxLen = MaxMsgLen.GROUP;
        errInfo = "消息长度超出限制(最多" + Math.round(maxLen / 3) + "汉字)";
    }
    if (msgLen > maxLen) {
        alert(errInfo);
        return;
    }
    if (!selSess) {
        selSess = new webim.Session(selType, selToID, selToID, friendHeadUrl, Math.round(new Date().getTime() / 1000));
    }
    var msg = new webim.Msg(selSess, true);

    //解析文本和表情
    var expr = /\[[^[\]]{1,3}\]/mg;
    var emotions = msgtosend.match(expr);
    if (!emotions || emotions.length < 1) {
        var text_obj = new webim.Msg.Elem.Text(msgtosend);
        msg.addText(text_obj);
    } else {

        for (var i = 0; i < emotions.length; i++) {
            var tmsg = msgtosend.substring(0, msgtosend.indexOf(emotions[i]));
            if (tmsg) {
                var text_obj = new webim.Msg.Elem.Text(tmsg);
                msg.addText(text_obj);
            }
            var emotion = webim.EmotionPicData[emotions[i]];
            if (emotion) {

                var face_obj = new webim.Msg.Elem.Face(
                webim.EmotionPicDataIndex[emotions[i]], emotions[i]);
                msg.addFace(face_obj);

            } else {
                var text_obj = new webim.Msg.Elem.Text(emotions[i]);
                msg.addText(text_obj);
            }
            var restMsgIndex = msgtosend.indexOf(emotions[i]) + emotions[i].length;
            msgtosend = msgtosend.substring(restMsgIndex);
        }
        if (msgtosend) {
            var text_obj = new webim.Msg.Elem.Text(msgtosend);
            msg.addText(text_obj);
        }
    }
    webim.sendMsg(msg, function (resp) {
        addMsg(msg);
        curMsgCount++;
        $("#send_msg_text").val('');
        turnoffFaces_box();
    }, function (err) {
        alert(err.ErrorInfo);
        $("#send_msg_text").val('');
    });
}