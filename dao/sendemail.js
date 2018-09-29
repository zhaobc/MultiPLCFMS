var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
        user: '1227648893@qq.com',
        pass: 'vcseclyvimfcjgae' //授权码,通过QQ获取

    }
});
var mailOptions = {
    from: '1227648893@qq.com', // 发送者
    to: 'zhaobc2592@126.com', // 接受者,可以同时发送多个,以逗号隔开
    subject: 'nodemailer2.5.0邮件发送', // 标题
    //text: 'Hello world', // 文本
    html: `<h2>nodemailer基本使用:</h2>`
};

transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('发送成功');
});