/*
 * Run morris chart on this page
 */
var activeLabel = '1_day_label';
var donutChart = undefined;
var lineChart = undefined;
var table = undefined;
var selectedType = undefined;
var selectedEnv = 'PROD';
var selectedStartDate = undefined;
var selectedEndDate= undefined;
var envMap = {
    // QA: "easyinsight.stratus.qa.ebay.com",
    PROD: "pb2events.easyinsight.vip.ebay.com"
};
var defaultContent = '<div style="text-align:center">'+'No data available'+'</div>';

$(document).ready(function() {
    $('#'+activeLabel).addClass("btn-primary");
    loadEnv();
    loadTypes($('#type_url').val());
});

$(function() {
    $( "#fromDate" ).datepicker({
        changeMonth: true,
        changeYear: true,
        dateFormat: 'yy-mm-dd',
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>',
        onClose: function (selectedDate) {
            var actualDate = new Date(selectedDate);
            $("#toDate").datepicker("option", "minDate", actualDate);
        }
    });

    $( "#toDate").datepicker({
        changeMonth: true,
        changeYear: true,
        dateFormat: 'yy-mm-dd',
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>'
    });

});

function loadEnv() {
    $("#envs").append('<option disabled>Select Env...</option>');
    _.keys(envMap).forEach(function (key, index) {
        if(index==0){
            $("#envs").append('<option value="'+key+'" selected>'+key+'</option>');
        } else {
            $("#envs").append('<option value="'+key+'">'+key+'</option>');
        }
    });
}

function loadTypes(url){
    $.ajax({
        url: url,
        type: "GET",
        success: function (data, textStatus, jqXHR) {
            $("#types").append('<option selected disabled>Select Report Type...</option>');
            _.each(data,function(d,index){
                $("#types").append('<option value="'+d+'">'+d+'</option>');
            });
            if($('#types').prop('selectedIndex') ==0){
                var type=$('#types option').eq(1).val();
                $('#types').val(type);
            }
            var url = "http://"+envMap[selectedEnv]+"/eInsight/template/report" +
                "/findbytimedetail/"+type+"/hour/-24/0/0/hour";
            display(url);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
        }
    });
}

function quickSearch(offset,label){
    $('#'+activeLabel).removeClass('btn-primary');
    $('#'+label).addClass("btn-primary");
    activeLabel = label;
    var type = '';
    if($('#types').prop('selectedIndex') ==0){
        type=$('#types option').eq(1).val();
    } else {
        type=$("#types option:selected").val();
    }
    var env = '';
    if($('#envs').prop('selectedIndex') ==0){
        env=$('#envs option').eq(1).val();
    } else {
        env=$("#envs option:selected").val();
    }
    var url = "http://"+envMap[env]+"/eInsight/template/report" +
        "/findbytimedetail/"+type+"/hour/"+offset+"/0/0/hour";
    $('#types').val(type);
    selectedType = type;
    selectedEnv = env;
    display(url);
}

function doSearch(){
    $('#'+activeLabel).removeClass('btn-primary');
    var type = '';
    if($('#types').prop('selectedIndex') ==0){
        type=$('#types option').eq(1).val();
    } else {
        type=$("#types option:selected").val();
    }
    var env = '';
    if($('#envs').prop('selectedIndex') ==0){
        env=$('#envs option').eq(1).val();
    } else {
        env=$("#envs option:selected").val();
    }
    var url = "http://"+envMap[env]+"/eInsight/template/report" +
        "/findbytimerange/"+type+"/"+$('#fromDate').val()+"T00:00/"+$('#toDate').val()+"T00:00/0/0";
    $('#types').val(type);
    selectedType = type;
    selectedEnv = env;
    display(url);
}

function refreshTableData(reportType,columnValue){
    var url = "http://"+envMap[selectedEnv]+"/eInsight/template/report/events/"+reportType+"/"+columnValue+"/"
        +selectedStartDate+"T00:00/"+selectedEndDate+"T00:00/100" ;
    $.ajax({
        url: url,
        type: "GET",
        dataType: 'jsonp',
        jsonpCallback: 'successCallback',
        success: function (data, textStatus, jqXHR) {
            //prepare table data
            var tableData = [[defaultContent]];
            var columns = _.cloneDeep([{"title":""}]);
            if(data.detail && data.detail.length>0){
                tableData = _(data.detail).map(function(item,index){
                    return _.map(item, function(value, key) {
                        if(key === 'DataSourceInfo' || key === 'DataSourcePayload') {
                            return '<div class="jsonview">'+JSON.stringify(value)+'</div>';
                        } else {
                            return value;
                        }
                    });
                }).value();
                columns =_.map(_.keys(data.detail[0]),function (key,index) {
                    return {"title":key}
                });
            }
            var options = {};
            table = renderDataTable('table_detail',tableData,columns,table,options);
            $('.jsonview').each(function(){
                if(this.innerHTML != null) {
                    var tmp = this.innerHTML;
                    this.innerHTML = "";
                    $(this).JSONView(tmp,{ collapsed: true, nl2br: true, recursive_collapser: true });
                }
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
        }
    });
}

function display(url){
    $.ajax({
        url: url,
        type: "GET",
        dataType: 'jsonp',
        jsonpCallback: 'successCallback',
        success: function (data, textStatus, jqXHR) {
            $( "#fromDate").val(data.start);
            $( "#toDate").val(data.end);
            selectedStartDate = $('#fromDate').val();
            selectedEndDate = $('#toDate').val();
            //prepare donut chart data
            var groupedData =_(data.detail)
                .groupBy('ColumnValue');
            var pieData = _(groupedData)
                .map( function(item, name){
                    return {
                        label: name,
                        value: _.sumBy(item, 'Count')
                    }
                })
                .value();
            //prepare line chart data
            var xSeries = 'date';
            var keys = _.keys(groupedData.value());
            var ySeries = _.cloneDeep(keys);
            var labels = _.cloneDeep(keys);
            var obj = {
                date:moment().format()
            };
            _.each(keys,function(key,index){
                obj[key]=0;
            });
            var trendData = _(data.detail).groupBy('CreationDate')
                .map( function(item, name){
                    var temp = _.cloneDeep(obj);
                    _.each(item,function(i, index){
                        temp[i.ColumnValue] = parseInt(i.Count);
                        temp.date= moment(i.CreationDate).format();
                    });
                    return temp;
                })
                .value();
            //prepare table data
            var tableData = [[defaultContent]];
            var columns = _.cloneDeep([{"title":""}]);
            if(data.detail && data.detail.length>0){
                tableData = _(data.detail).map(function(item,index){
                    return _.values(item);
                }).value();
                columns =_.map(_.keys(data.detail[0]),function (key,index) {
                    return {"title":key}
                });
            }

            //display donut chart
            if(pieData.length==0){
                $('.chart-tooltip').css('background-color','white');
                $('.chart-tooltip').css('border-color','white');
            } else{
                $('.chart-tooltip').css('background-color','');
                $('.chart-tooltip').css('border-color','');
            }
            donutChart = renderDonutChart("total_count_pie",pieData,selectedType);
            displaySeries("total_count_pie",selectedType);

            //display line chart
            lineChart = renderLineChart("count_legend_trend",xSeries, ySeries,labels,trendData);
            $("#total_count_pie_parent").resize(function () {
                donutChart.redraw();
                displaySeries("total_count_pie",selectedType);
            });
            $("#count_legend_trend_parent").resize(function () {
                lineChart.redraw();
            });

            //display table
            var options = {
                "footerCallback": function ( row, data, start, end, display ) {
                    if(data.length==1&&data[0]==defaultContent){
                        return;
                    }
                    var api = this.api(), data;

                    // Total over all pages
                    total = api
                        .column( 3 )
                        .data()
                        .reduce( function (a, b) {
                            return parseInt(a) + parseInt(b);
                        }, 0 );

                    // Total over this page
                    pageTotal = api
                        .column( 3, { page: 'current'} )
                        .data()
                        .reduce( function (a, b) {
                            return parseInt(a) + parseInt(b);
                        }, 0 );

                    // Update footer
                    $( '.footer' ).html(
                        'Page total:'+pageTotal +' | Total:'+ total
                    );
                }
            };
            table = renderDataTable('table_detail',tableData,columns,table,options);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
        }
    });
}
