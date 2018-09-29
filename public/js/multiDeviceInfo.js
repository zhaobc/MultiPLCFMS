var cellChartFirst = echarts.init(document.getElementById('cellChartFirst'));

var firstCellOption = {
    //title : {text:"表1图"},
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
        name: '时间',
        type:'category',
        boundaryGap: false,
        splitLine: {
            show: false
        },
        data:[
            '2018-06-07','2018-06-08','2018-06-09','2018-06-10','2018-06-11','2018-06-12','2018-06-13','2018-06-14'
        ]
    },
    yAxis: {
        type: 'value',
        name: 'V'
    },
    series: [
        {
            name: 'V',
            type: 'line',
            itemStyle : {
                normal : {
                    color:'#6edbe9',
                    lineStyle:{
                        color:'#6edbe9'
                    }
                }
            },
            data: [2,2.3,4,23,22,22,32,2]
        }
    ]
};
cellChartFirst.setOption(firstCellOption);