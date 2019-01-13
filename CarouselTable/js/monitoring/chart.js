
function renderLineChart(divId, xSeries, ySeries,labels,chartData){
    if ($('#'+divId).length && chartData) {
        $('#'+divId).empty();
        return Morris.Line({
            element : divId,
            data : chartData,
            xkey : xSeries,
            ykeys : ySeries,
            labels : labels,
            pointSize : 2,
            hideHover : 'auto',
            behaveLikeLine : true,
            lineWidth : 2,
            resize:true
        });
    }
}

function renderCustomizedColorLineChart(divId, xSeries, ySeries,labels,chartData){
    if ($('#'+divId).length && chartData) {
        $('#'+divId).empty();
        return Morris.Line({
            element : divId,
            data : chartData,
            xkey : xSeries,
            ykeys : ySeries,
            labels : labels,
            pointSize : 2,
            hideHover : 'auto',
            postUnits: "%",
            smooth: false,
            behaveLikeLine : true,
            lineWidth : 2,
            resize:true,
            lineColors: ['#9BD124', '#C7C62B', '#F3BB32', '#EB924F', '#E3686C']
        });
    }
}

function renderBarChart(divId, xSeries, ySeries,labels,chartData){
    if ($('#'+divId).length && chartData) {
        $('#'+divId).empty();
        return Morris.Bar({
            element: divId,
            data: chartData,
            xkey : xSeries,
            ykeys : ySeries,
            labels : labels,
            resize: true
        });
    }
}

function renderStackedBarChart(divId, xSeries, ySeries,labels,chartData){
    if ($('#'+divId).length && chartData) {
        $('#'+divId).empty();
        return Morris.Bar({
            element: divId,
            data: chartData,
            xkey : xSeries,
            ykeys : ySeries,
            labels : labels,
            axes : false,
            grid : false,
            stacked:true,
            resize: true
        });
    }
}


function renderDonutChart(divId, chartData,selectedType) {
    // DO NOT REMOVE : GLOBAL FUNCTIONS!
    pageSetUp();

    $('#'+divId).empty();
    $("#"+divId+"_label").text('');

    if($("#"+divId).length && chartData) {
        $( "#"+divId ).mouseover(function() {
            displaySeries(divId,selectedType);
        });
        $( "#"+divId ).click(function() {
            displaySeries(divId,selectedType);
        });
        return Morris.Donut({
            element: divId,
            data: chartData,
            resize: true,
            formatter: function (x) {
                return "Count:"+x
            }
        });

    }

}

function renderCustomizedColorDonutChart(divId, chartData,selectedType) {
    pageSetUp();

    $('#'+divId).empty();
    $("#"+divId+"_label").text('');

    if($("#"+divId).length && chartData) {
        $( "#"+divId ).mouseover(function() {
            displaySeries(divId,selectedType);
        });
        $( "#"+divId ).click(function() {
            displaySeries(divId,selectedType);
        });
        return Morris.Donut({
            element: divId,
            data: chartData,
            resize: true,
            formatter: function (x) {
                return x.toFixed(2) + "%";
            },
        colors: ['#9BD124', '#C7C62B', '#F3BB32', '#EB924F', '#E3686C']
        });

    }

}

function displaySeries(divId,reportType) {
    $("#"+divId+" tspan:first").css("display","none");
    $("#"+divId+" tspan:nth-child(1)").css("font-size","15px");
    var tooltip = $("#"+divId+" tspan:first").html();
    if(tooltip!==undefined){
        var escaped = encodeURIComponent(tooltip);
        $("#"+divId+"_label").html('<a onclick=refreshTableData(\"'+reportType+'\",\"'+escaped+'\")>'+tooltip+'</a>');
    }
}
