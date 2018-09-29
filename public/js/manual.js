var url = window.location.href;
var urlArr = url.split("/");
var guid = urlArr[urlArr.length - 1];
var deviceArr = new Array(42);
var userName = $("#userName").html();
var date;
var el=$("#operateContent");
var errorCode=["无错误","燃烧尾气超温故障","重整前端低温故障","重整前端超温故障","出口温度超温故障","气化温度超温故障","燃烧壁面超温故障","储液罐进液故障","三乙二醇超压故障","三乙二醇低压故障","输出电压异常故障","重整前端低温保护","重整前端高温保护","重整后端低温保护","出口温度高温保护"];
var warningCode=["无警告","重整前端高温","重整前端低温","导热油压力异常","电堆性能衰减","导热油温度偏低"];
var statusCode=["未知","等待，系统自检","电堆预热","预运行","正常运行","关机","待机","紧急关机","手动调试"];
//格式化时间
Date.prototype.pattern = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //12小时制
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    var week = {
        "0": "/u65e5",
        "1": "/u4e00",
        "2": "/u4e8c",
        "3": "/u4e09",
        "4": "/u56db",
        "5": "/u4e94",
        "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

//设置id
$(document).ready(function () {
    $('#guid-number').html(guid);
});
//选择模式
function selectModel() {
    var index = $("#selectModel").val();
    if (index == "定功率模式") {
        $("#unit").html("W");
    } else {
        $("#unit").html("A");
    }
}

var deviceData = function () {
    jQuery.ajax({
        url: "/deviceInfo/" + guid,
        type: 'post',
        dataType: 'json',
        success: function (result) {
            if (!(result.jsonArr.length)) {
                return;
            } else {
                for (var i = 0; i < deviceArr.length; i++) {
                    deviceArr[i] = result.jsonArr[i];
                }
            }
        },
        error: function () {
            console.log("dynamicParamsAndTime数据加载失败！请检查数据链接是否正确");
        }
    });
}

setInterval(deviceData, 1000);

var address = "ws://47.96.27.232:60003/webctl";//test address:10.0.12.77,true address:47.96.27.232
var ws;

//开机
function start() {
    ws=new WebSocket(address);
    ws.onopen=function(evt){
        date=new Date();
        ws.send('{"guid":"' + guid + '","key":1,"val":1,"ack":"","who":"' + userName + '"}');
        $("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;开机控制指令已发送</p>").appendTo(el);
    }
    ws.onmessage = function (evt) {
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("启动控制失败");
        } else if (strJson.ack == "ok") {
            alert("启动控制成功");
            $("#startBtn").addClass("active");
            $("#stopBtn").removeClass("active");
            $("#standBytBtn").removeClass("active");
        }else{
            alert("启动控制未知错误");
        }
        ws.close();
    };
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

function autoDebug(){
    ws=new WebSocket(address);
    ws.onopen=function(evt){
        ws.send('{"guid":"' + guid + '","key":1,"val":6,"ack":"","who":"' + userName + '"}');
        $("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;自动控制指令已发送</p>").appendTo(el);
    }
    ws.onmessage=function(evt){
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("自动控制指令发送失败");
        } else {
            $("#redirect").attr("href", "/devicesInfo/" + guid);
        }
        ws.close();
    }
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

//关机
function stop() {
    ws=new WebSocket(address);
    ws.onopen=function(evt){
        date=new Date();
        ws.send('{"guid":"' + guid + '","key":1,"val":0,"ack":"","who":"' + userName + '"}');
        $("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;关机控制指令已发送</p>").appendTo(el);
    }
    ws.onmessage = function (evt) {
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("关闭控制失败");
        } else {
            alert("关闭控制成功");
            $("#stopBtn").addClass("active");
            $("#standByBtn").removeClass("active");
            $("#startBtn").removeClass("active");
        }
        ws.close();
    };
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

//待机
function standBy() {
    ws=new WebSocket(address);
    ws.onopen=function(evt){
        date=new Date();    
        ws.send('{"guid":"' + guid + '","key":1,"val":2,"ack":"","who":"' + userName + '"}');
        $("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;待机控制指令已发送</p>").appendTo(el);
    }
    ws.onmessage = function (evt) {
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("待机控制失败");
        } else {
            alert("待机控制成功");
            $("#standByBtn").addClass("active");
            $("#stopBtn").removeClass("active");
            $("#startBtn").removeClass("active");
        }
        ws.close();
    };
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

//清除内容
function clearContent(){
    $("#operateContent").html("");
}

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1Mjg5ODE3NjgsImdycCI6MTAwLCJpYXQiOjE1Mjg5NTI5NjgsInVzciI6InRlc3QifQ.70cUoIjyizSgzmMvRNQsQ6wJK4QDwqotwnZ4kEMcsAE
function setValue(ele,min,max,key,multi){
    ws=new WebSocket(address);
    var setValue=parseInt($(ele).val());
    if(setValue>=min&&setValue<=max){
        if(multi){
            ws.onopen=function(evt){
                date=new Date();
                ws.send('{"guid":"' + guid + '","key":'+key+',"val":'+setValue*multi+',"ack":"","who":"' + userName + '"}');
                ("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;"+$(ele).prev().html()+"控制指令已发送</p>").appendTo(el);
            }
        }else{
            ws.onopen=function(evt){
                date=new Date();
                ws.send('{"guid":"' + guid + '","key":'+key+',"val":'+setValue+',"ack":"","who":"' + userName + '"}');
                ("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;"+$(ele).prev().html()+"控制指令已发送</p>").appendTo(el);
            }
        }
    }else{
        el.html("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;请输入"+min+"-"+max+"之间的值</p>");
    }
    ws.onmessage = function (evt) {
        date=new Date();
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            $("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;"+$(ele).prev().html()+"控制失败</p>").appendTo(el);
            el.scrollTop($(ele).height);
        } else {
            $("<p>"+date.pattern("yyyy-MM-dd HH:mm:ss")+":&nbsp;&nbsp;"+$(ele).prev().html()+"控制成功</p>").appendTo(el);
            el.scrollTop($(ele).height);
        }
        ws.close();
    };
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

var dynamicData = function () {
    if (deviceArr[0]) {
        $("#sendTime").html(deviceArr[41]);
        $("#electricCurrent").html(deviceArr[14]);
        $("#voltage").html(deviceArr[15]);
        $("#power").html(deviceArr[27]);
        $("#exhaustTemp").html(deviceArr[3]);
        $("#frontReformTemp").html(deviceArr[4]);
        $("#backReformTemp").html(deviceArr[7]);
        $("#burningWallTemp").html(deviceArr[2]);
        $("#FCIn").html(deviceArr[8]);
        $("#FCOut").html(deviceArr[9]);
        $("#triethyleneGlycolPressure").html(deviceArr[17]);
        $("#burningWallTemp").html(deviceArr[2]);
        $("#gasifyTemp").html(deviceArr[1]);
        $("#triethyleneGlycolTemp").html(deviceArr[9]);
        $("#errorCode").html(deviceArr[32]);
        $("#singleRunningHour").html(deviceArr[28]);
        $("#singleRunningMinute").html(deviceArr[29]);
        $("#totalRunningHour").html(deviceArr[30]);
        $("#totalRunningMinute").html(deviceArr[31]);
        $("#status").html(statusCode[parseInt(deviceArr[33])]);
        $("#burningPump").html(deviceArr[22]);
        $("#reformPump").html(deviceArr[23]);
        $("#pumpSpeed").html(deviceArr[20]);
        $("#oxidationFan").html(deviceArr[24]);
        $("#cathodeFan").html(deviceArr[18]);
        $("#radiatingFan").html(deviceArr[21]);
        $("#exhaustPumpDisplay").html(deviceArr[22]);
        $("#reformPumpDisplay").html(deviceArr[23]);
        $("#triethyleneGlycolPressureDisplay").html(deviceArr[17]);
        $("#FCTempDisplay").html(deviceArr[19]);
        $("#oxidationFanDisplay").html(deviceArr[24]);
        $("#cathodeFanDisplay").html(deviceArr[18]);
        $("#currentDisplay").html(deviceArr[13]);
    }
    //开机状态下不可以设定数值
    if(deviceArr[33]==0||deviceArr[33]==1||deviceArr[33]==5||deviceArr[33]==6||deviceArr[33]==7||deviceArr[33]==8){
        $("#fullCellTempSet").css("display","inline-block");
        $("#fullCellTempDisplay").css("display","none");
        $("#autoRunningParamsSet div:not(#standBy) div ul li input").removeAttr("disabled"); 
    }else{
        $("#fullCellTempSet").css("display","none");
        $("#fullCellTempDisplay").css("display","inline-block");
        $("#autoRunningParamsSet div div ul li input").attr("disabled","disabled");               
    }
}
setInterval(dynamicData, 1000);