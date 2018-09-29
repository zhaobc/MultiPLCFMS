var url = window.location.href;
var urlArr = url.split("/");
var heapid = urlArr[urlArr.length - 1];
var carguid = urlArr[urlArr.length - 2];
var deviceArr = new Array(42);
var userName = $("#userName").html();
//userName = userName.replace(/\ +/g, "");//去除空格
//userName = userName.replace(/[\r\n]/g, "");//去除换行符
var errorCode = ["无错误", "燃烧尾气超温故障", "重整前端低温故障", "重整前端超温故障", "出口温度超温故障", "气化温度超温故障", "燃烧壁面超温故障", "储液罐进液故障", "三乙二醇超压故障", "三乙二醇低压故障", "输出电压异常故障", "重整前端低温保护", "重整前端高温保护", "重整后端低温保护", "出口温度高温保护"];
var warningCode = ["无报警", "重整前端高温", "重整前端低温", "导热油压力异常", "电堆性能衰减", "导热油温度偏低"];
var statusCode = ["当前状态值为0", "等待，系统自检", "电堆预热", "预运行", "正常运行", "关机", "待机", "紧急关机", "手动调试"];
var address = "ws://fccp.palcan.com.cn:60003/webctl";//test address:10.0.12.77,ws://47.96.27.232:60003/webctl
var ws;

//选择模式
function selectModel() {
    var index = $("#selectModel").val();
    if (index == "定功率模式") {
        $("#unit").html("W");
    } else {
        $("#unit").html("A");
    }
}

//选择电流or功率模式
function selectVorp(){
    var selectModel = $("#selectModel").html();
    $("#selectVorpBtn").addClass("active");
    if (selectModel == "W") {
        $("#selectModel").html("A");
    } else {
        $("#selectModel").html("W");
        $("#curorpowerStatus").html("定功率模式");
    }
}

//发送手动调试指令
function manualDebug() {
    ws = new WebSocket(address);
    ws.onopen = function (evt) {
        ws.send('{"carguid":"' + carguid + '","who":"' + userName + '","heapid":"' + heapid + '","key":1,"val":5,"result":""}');
    }
    ws.onmessage = function (evt) {
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("手动控制指令发送失败");
        } else {
            $("#redirect").attr("href", "/manual/" + guid);
        }
        ws.close();
    }
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

//开机
function start() {
    ws = new WebSocket(address);
    ws.onopen = function (evt) {
        ws.send('{"carguid":"' + carguid + '","who":"' + userName + '","heapid":"'+heapid+'","key":1,"val":1,"result":""}');
    }
    ws.onmessage = function (evt) {
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("启动控制失败");
        } else if (strJson.ack == "ok") {
            $("#startBtn").addClass("active");
            $("#stopBtn").removeClass("active");
            $("#standByBtn").removeClass("active");
            alert("启动控制成功");
        } else {
            alert("启动控制未知错误");
        }
        ws.close();
    };
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

//关机
function stop() {
    ws = new WebSocket(address);
    ws.onopen = function (evt) {
        ws.send('{"carguid":"' + carguid + '","who":"' + userName + '","heapid":"' + heapid + '","key":1,"val":0,"result":""}');
    }
    $("#wsStatus").html("关机控制指令已发送");
    ws.onmessage = function (evt) {
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("关闭控制失败");
        } else {
            // $("#start").removeAttr("disabled");
            // $("#start").addClass("active");
            // $("#standBy").attr("disabled", "disabled");
            // $("#powerOff").attr("disabled", "disabled");
            $("#stopBtn").addClass("active");
            $("#standByBtn").removeClass("active");
            $("#startBtn").removeClass("active");
            alert("关闭控制成功");
        }
        ws.close();
    };
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

//待机
function standBy() {
    ws = new WebSocket(address);
    ws.onopen = function (evt) {
        ws.send('{"carguid":"' + carguid + '","who":"' + userName + '","heapid":"' + heapid + '","key":1,"val":2,"result":""}');
    }
    //$("#wsStatus").html("待机控制指令已发送");
    ws.onmessage = function (evt) {
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("待机控制失败");
        } else {
            $("#standByBtn").addClass("active");
            $("#stopBtn").removeClass("active");
            $("#startBtn").removeClass("active");
            alert("待机控制成功");
        }
        ws.close();
    };
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

function resizeChartsContainer() {
    $(".charts").each(function () {
        if(document.body.clientWidth>768){
            // $(this).css("height", (window.innerHeight - $(".page-header").height() - $(".title").height()) / 2 + "px");
            $(this).css("height", (window.innerHeight - 140) / 2 + "px");
            $(this).css("width", (document.body.clientWidth - ($(".div3").width()+40) * 2) / 2 + "px");
            //$(this).css("width", (document.body.clientWidth - 600) / 2 + "px");
        }else{
            $(this).css("height", (window.innerHeight - 100) + "px");
            $(this).css("width", (document.body.clientWidth-30) + "px");
        }
        
    });
}

//随着窗口高度变化
window.onresize = function () {
    //重置容器高宽
    resizeChartsContainer();
    TempAndTime.resize();
    ParamsAndTime.resize();
    VAndI.resize();
    PumpParamsAndTime.resize();
};

var deviceData = function () {
    jQuery.ajax({
        url: "/deviceInfo/"+heapid,
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
        error: function (err) {
            console.log("dynamicParamsAndTime数据加载失败！请检查数据链接是否正确");
        }
    });
}

setInterval(deviceData, 1000);

//setOption
function setOption() {
    ws = new WebSocket(address);
    var index = $("#selectModel").val();
    if (index == "定功率模式") {
        var powerValue = parseInt($("#setOption").val());
        if (powerValue >= 2000 && powerValue <= 5500) {
            ws.onopen = function (evt) {
                ws.send('{"carguid":"' + carguid + '","who":"' + userName + '","heapid":"' + heapid + '","key":1,"val":'+powerValue+',"result":""}');
            }
            $("#wsStatus").html("功率控制指令已发送");
        } else {
            alert("请输入2000～5500W的功率值");
        }
    } else if (index == "定电流模式") {
        var currentValue = parseInt($("#setOption").val());
        if (currentValue >= 20 && currentValue <= 90) {
            ws.onopen = function (evt) {
                ws.send('{"carguid":"' + carguid + '","who":"' + userName + '","heapid":"' + heapid + '","key":1,"val":'+currentValue*100+',"result":""}');
            }
            $("#wsStatus").html("电流控制指令已发送");
        } else {
            alert("请输入20～90之间的电流值");
        }
    } else {
        index = $("#selectModel").html();
        console.log(index);
        if (index == "W") {
            var powerValue = parseInt($("#setOption").val());
            if (powerValue >= 2000 && powerValue <= 5500) {
                ws.onopen = function (evt) {
                    ws.send('{"carguid":"' + carguid + '","who":"' + userName + '","heapid":"' + heapid + '","key":1,"val":'+powerValue+',"result":""}');
                }
            } else {
                alert("请输入2000～5500W的功率值");
            }
        } else {
            var currentValue = parseInt($("#setOption").val());
            userName = userName.replace(/\ +/g, "");//去除空格
            userName = userName.replace(/[\r\n]/g, "");//去除换行符
            if (currentValue >= 20 && currentValue <= 90) {
                ws.onopen = function (evt) {
                    ws.send('{"carguid":"' + carguid + '","who":"' + userName + '","heapid":"' + heapid + '","key":1,"val":'+currentValue*100+',"result":""}');
                }
            } else {
                alert("请输入20～90之间的电流值");
            }
        }
    }
    ws.onmessage = function (evt) {
        console.log("Received Message: " + evt.data);
        var strJson = JSON.parse(evt.data);
        if (strJson.ack == "ng") {
            alert("控制失败");
        } else {
            alert("控制成功");
        }
        ws.close();
    };
    ws.onclose = function (evt) {
        console.log("Connection closed.");
    };
}

var TempAndTime = echarts.init(document.getElementById('TempAndTime'));//温度与时间关系图初始化echarts实例对象
var ParamsAndTime = echarts.init(document.getElementById('ParamsAndTime'));//电气参数与时间关系图
var VAndI = echarts.init(document.getElementById('VAndI'));//V与I关系图
var PumpParamsAndTime = echarts.init(document.getElementById('PumpParamsAndTime'));//进液系统与时间关系图
//var Mask=echarts.init(document.getElementById('mask-body'));
var showHistoryData;

window.onload = function () {
    $("#cellname").html(heapid);

    //重置容器高宽
    resizeChartsContainer();

    //查看一个小时数据
    showHistoryData=function(){
        var timestamp1=$("#timestamp").val();
        $("#mask").css("display","block");
        var dataOption = {
            tooltip: { trigger: 'axis' },
            title: { text: "一小时"+titleName+"数据" },
            legend: { data: [titleName] },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                name: '时间',
                data: []
            },
            yAxis: {
                type: 'value'
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    restore: {},
                    saveAsImage: {}
                }
            },
            series: [
                {
                    name: titleName,
                    type: 'line',
                    data: []
                }
            ]
        };
        $.ajax({
            url: "/getOneHourData/" + guid,
            type: 'post',
            dataType: 'json',
            data:{series:titleName,timestamp:timestamp1},
            success: function (result) {
                if (!(result)) {
                    return;
                } else {
                    $("#mask").css("display","block");
                    dataOption.xAxis.data=result.date;
                    dataOption.series[0].data=result.data;
                    Mask.setOption(dataOption);
                }
            },
            error: function () {
                console.log("dynamicParamsAndTime数据加载失败！请检查数据链接是否正确");
            }
        })
    }

    //点击进入十五分钟数据查看
    // var paintDataChart=function(params,result){
    //     $("#mask").css("display","block");
    //     titleName=params.seriesName;
    //     var dataOption = {
    //         tooltip: { trigger: 'axis' },
    //         title: { text: "15分钟"+params.seriesName+"数据" },
    //         legend: { data: [params.seriesName] },
    //         xAxis: {
    //             type: 'category',
    //             boundaryGap: false,
    //             name: '时间',
    //             data: result.date
    //         },
    //         yAxis: {
    //             type: 'value'
    //         },
    //         toolbox: {
    //             feature: {
    //                 dataZoom: {
    //                     yAxisIndex: 'none'
    //                 },
    //                 restore: {},
    //                 saveAsImage: {}
    //             }
    //         },
    //         series: [
    //             {
    //                 name: params.seriesName,
    //                 type: 'line',
    //                 data: result.data
    //             }
    //         ]
    //     };
    //     Mask.setOption(dataOption);
    // }
    
    var option = {
        //title : {text:"时间与温度关系曲线"},
        tooltip: { trigger: 'axis' },
        legend: { data: ['BG', 'FR', 'BR', 'BW', 'GT'] },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            name: '时间',
            data: []
        },
        yAxis: {
            type: 'value',
            name: '温度'
        },
        toolbox: {
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                restore: {},
                saveAsImage: {}
            }
        },
        series: [
            {
                name: 'BG',//燃烧尾气
                type: 'line',
                data: []
            },
            {
                name: 'FR',//重整前端
                type: 'line',
                data: []
            },
            {
                name: 'BR',//重整后端
                type: 'line',
                data: []
            },
            {
                name: 'BW',//燃烧壁面
                type: 'line',
                data: []
            },
            {
                name: 'GT',//气化温度
                type: 'line',
                data: []
            }
        ]
    };

    // 初次加载图表(无数据)
    TempAndTime.setOption(option);
    TempAndTime.on("click", function (params) {
        if(params.seriesName!=null){
            $.ajax({
                url: "/getFifteenMinutesData/" + guid,
                type: 'post',
                dataType: 'json',
                data:{series:params.seriesName,timestamp:params.name},
                success: function (result) {
                    if (!(result)) {
                        return;
                    } else {
                        paintDataChart(params,result);
                    }
                },
                error: function () {
                    console.log("dynamicParamsAndTime数据加载失败！请检查数据链接是否正确");
                }
            })
        }
    })

    var electronicOption = {
        //title : {text:"时间与温度关系曲线"},
        tooltip: { trigger: 'axis' },
        legend: { data: ['I', 'V', 'P'] },
        xAxis: {
            type: 'category',
            name: '时间',
            boundaryGap: false,
            data: []
        },
        yAxis: {
            type: 'value',
            name: '电气参数'
        },
        toolbox: {
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                restore: {},
                saveAsImage: {}
            }
        },
        series: [
            {
                name: 'I',//电流
                type: 'line',
                data: []
            },
            {
                name: 'V',//电压
                type: 'line',
                data: []
            },
            {
                name: 'P',//power
                type: 'line',
                data: []
            }
        ]
    };
    //初始化图表
    ParamsAndTime.setOption(electronicOption);
    ParamsAndTime.on("click", function (params) {
        if(params.seriesName!=null){
            $.ajax({
                url: "/getFifteenMinutesData/" + guid,
                type: 'post',
                dataType: 'json',
                data:{series:params.seriesName,timestamp:params.name},
                success: function (result) {
                    if (!(result)) {
                        return;
                    } else {
                        paintDataChart(params,result);
                    }
                },
                error: function () {
                    console.log("dynamicParamsAndTime数据加载失败！请检查数据链接是否正确");
                }
            })
        }
    })
    
    var pumpParamsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                animation: false
            }
        },
        legend: { data: ['RP', 'TP', 'TI', 'TO'] },
        toolbox: {
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                restore: {},
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'category',
            name: '时间',
            boundaryGap: false,
            splitLine: {
                show: false
            },
            data: []
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%'],
            splitLine: {
                show: false
            },
            name: '进液系统参数'
        },
        series: [
            {
                name: 'RP',//储液泵
                type: 'line',
                data: []
            },
            {
                name: 'TP',//压力显示
                type: 'line',
                data: []
            },
            {
                name: 'TI',//三乙二醇进口温度
                type: 'line',
                data: []
            },
            {
                name: 'TO',//三乙二醇出口温度
                type: 'line',
                data: []
            }
        ]
    };
    PumpParamsAndTime.on("click", function (params) {
        if(params.seriesName!=null){
            $.ajax({
                url: "/getFifteenMinutesData/" + guid,
                type: 'post',
                dataType: 'json',
                data:{series:params.seriesName,timestamp:params.name},
                success: function (result) {
                    if (!(result)) {
                        return;
                    } else {
                        paintDataChart(params,result);
                    }
                },
                error: function () {
                    console.log("dynamicParamsAndTime数据加载失败！请检查数据链接是否正确");
                }
            })
        }
    });
    PumpParamsAndTime.setOption(pumpParamsOption);

    var vAndIOption = {
        //title : {text:"I-V图"},
        tooltip: { trigger: 'axis' },
        legend: { data: ['V'] },
        toolbox: {
            feature: {
                dataZoom: {
                    yAxisIndex: 'none'
                },
                restore: {},
                saveAsImage: {}
            }
        },
        xAxis: {
            name: 'I',
            boundaryGap: false,
            splitLine: {
                show: false
            },
            max: 100,
            min: 0
        },
        yAxis: {
            type: 'value',
            name: 'V'
        },
        series: [
            {
                name: 'V',
                type: 'line',
                data: []
            }
        ]
    };
    VAndI.setOption(vAndIOption);
    
    var dynamicData = function () {
        if (deviceArr[0]) {
            option.xAxis.data.push(deviceArr[0]);
            option.series[0].data.push(deviceArr[3]); // 设置尾气温度
            option.series[1].data.push(deviceArr[4]); // 设置重整前温度
            option.series[2].data.push(deviceArr[7]); // 设置重整后温度
            option.series[3].data.push(deviceArr[2]); // 设置燃烧壁面温度
            option.series[4].data.push(deviceArr[1]); // 设置气化温度温度
            var optionLength = option.xAxis.data.length;
            //加载数据
            if (optionLength > 3600) {
                option.xAxis.data = option.xAxis.data.slice(optionLength - 3600, optionLength - 1);
                option.series[0].data = option.series[0].data.slice(optionLength - 3600, optionLength - 1);
                option.series[1].data = option.series[1].data.slice(optionLength - 3600, optionLength - 1);
                option.series[2].data = option.series[2].data.slice(optionLength - 3600, optionLength - 1);
                option.series[3].data = option.series[3].data.slice(optionLength - 3600, optionLength - 1);
                option.series[4].data = option.series[4].data.slice(optionLength - 3600, optionLength - 1);
            }
            TempAndTime.setOption(option);// 重新加载图表
    
            //加载数据
            electronicOption.xAxis.data.push(deviceArr[0]);
            electronicOption.series[0].data.push(deviceArr[14]); // I
            electronicOption.series[1].data.push(deviceArr[15]); // V
            electronicOption.series[2].data.push(deviceArr[27]); // P
            var electronicLength = electronicOption.xAxis.data.length;
            if (electronicLength > 3600) {
                electronicOption.xAxis.data = electronicOption.xAxis.data.slice(electronicLength - 3600, electronicLength - 1);
                electronicOption.series[0].data = electronicOption.series[0].data.slice(electronicLength - 3600, electronicLength - 1);
                electronicOption.series[1].data = electronicOption.series[1].data.slice(electronicLength - 3600, electronicLength - 1);
                electronicOption.series[2].data = electronicOption.series[2].data.slice(electronicLength - 3600, electronicLength - 1);
            }
            ParamsAndTime.setOption(electronicOption);// 重新加载图表
    
            //加载数据。
            var vAndIArr = new Array();
            vAndIArr[0] = deviceArr[14];//I
            vAndIArr[1] = deviceArr[15];//V
            vAndIOption.series[0].data.push(vAndIArr);
            vAndIOption.xAxis.max=parseInt(deviceArr[14])+5;
            var vAndILength = vAndIOption.series[0].data.length;
            if (vAndILength > 3600) {
                vAndIOption.series[0].data = vAndIOption.series[0].data.slice(vAndILength - 3600, vAndILength - 1);
            }
            VAndI.setOption(vAndIOption);// 重新加载图表
    
            pumpParamsOption.xAxis.data.push(deviceArr[0]);//I
            pumpParamsOption.series[0].data.push(deviceArr[25]); // 储液泵
            pumpParamsOption.series[1].data.push(deviceArr[17]); // 压力显示
            pumpParamsOption.series[2].data.push(deviceArr[8]); // 三乙二醇进口温度
            pumpParamsOption.series[3].data.push(deviceArr[9]); // 三乙二醇出口温度
            var pumpArrLength = pumpParamsOption.xAxis.data.length;
            //加载数据
            if (pumpArrLength > 3600) {
                pumpParamsOption.xAxis.data = pumpParamsOption.xAxis.data.slice(pumpArrLength - 3600, pumpArrLength - 1);//I
                pumpParamsOption.series[0].data = pumpParamsOption.series[0].data.slice(pumpArrLength - 3600, pumpArrLength - 1); // 储液泵
                pumpParamsOption.series[1].data = pumpParamsOption.series[1].data.slice(pumpArrLength - 3600, pumpArrLength - 1); // 压力显示
                pumpParamsOption.series[2].data = pumpParamsOption.series[2].data.slice(pumpArrLength - 3600, pumpArrLength - 1); // 三乙二醇进口温度
                pumpParamsOption.series[3].data = pumpParamsOption.series[3].data.slice(pumpArrLength - 3600, pumpArrLength - 1); // 三乙二醇出口温度
            }
            PumpParamsAndTime.setOption(pumpParamsOption);
            $("#sendTime").html(deviceArr[41]);
            $("#electricCurrent").html(deviceArr[14]);
            $("#voltage").html(deviceArr[15]);
            $("#power").html(deviceArr[27]);
            $("#stackKwhConsumption").html(deviceArr[39]);
            $("#stackPowerConsumption").html(deviceArr[40]);
            $("#exhaustTemp").html(deviceArr[3]);
            $("#frontReformTemp").html(deviceArr[4]);
            $("#backReformTemp").html(deviceArr[7]);
            $("#burningWallTemp").html(deviceArr[2]);
            $("#gasifyTemp").html(deviceArr[1]);
            $("#triethyleneGlycolTemp").html(deviceArr[9]);
            $("#singleRunningHour").html(deviceArr[28]);
            $("#singleRunningMinute").html(deviceArr[29]);
            $("#totalRunningHour").html(deviceArr[30]);
            $("#totalRunningMinute").html(deviceArr[31]);
            $("#errorCode").html(errorCode[parseInt(deviceArr[32])]);
            $("#status").html(statusCode[parseInt(deviceArr[33])]);
            switch (parseInt(deviceArr[33])) {
                case 1:
                    $("#stackStatus").css("background", "#7cfc00");
                    $("#status").css("color", "#7cfc00");
                    break;
                case 2:
                    $("#stackStatus").css("background", "#EE9A00");
                    $("#status").css("color", "#EE9A00");
                    break;
                case 3:
                    $("#stackStatus").css("background", "#ADFF2F");
                    $("#status").css("color", "#ADFF2F");
                    break;
                case 4:
                    $("#stackStatus").css("background", "#66CD00");
                    $("#status").css("color", "#66CD00");
                    break;
                case 5:
                    $("#stackStatus").css("background", "#969696");
                    $("#status").css("color", "#969696");
                    break;
                case 6:
                    $("#stackStatus").css("background", "#ff8247");
                    $("#status").css("color", "#ff8247");
                    break;
                case 7:
                    $("#stackStatus").css("background", "#FF3030");
                    $("#status").css("color", "#FF3030");
                    break;
                case 8:
                    $("#stackStatus").css("background", "#EE9A00");
                    $("#status").css("color", "#EE9A00");
                    break;
                default:
                    $("#stackStatus").css("background", "peachpuff");
                    $("#status").css("color", "#peachpuff");
            };
            if (deviceArr[26] > 0) {
                $("#curorpowerStatus").html("定功率模式");
            } else if (deviceArr[35] > 0) {
                $("#curorpowerStatus").html("定电流模式");
            }
            $("#warningCode").html(warningCode[parseInt(deviceArr[36])]);
            $("#burningPump").html(deviceArr[22]);
            $("#reformPump").html(deviceArr[23]);
            $("#triethyleneGlycolInputTemp").html(deviceArr[8]);
            $("#pumpSpeed").html(deviceArr[20]);
            $("#oxidationFan").html(deviceArr[24]);
            $("#cathodeFan").html(deviceArr[18]);
            $("#radiatingFan").html(deviceArr[21]);
        }
    }
    setInterval(dynamicData, 1000);

    
    TempAndTime.resize();
    ParamsAndTime.resize();
    VAndI.resize();
    PumpParamsAndTime.resize();
}