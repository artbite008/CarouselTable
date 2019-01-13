/*
 * Run morris chart on this page
 */
var activeLabel = '1_day_label';
var donutChart = undefined;
var lineChart = undefined;
var table = undefined;
var selectedType = undefined;
var selectedStartDate = undefined;
var selectedEndDate= undefined;
var defaultContent = '<div style="text-align:center">'+'No data available'+'</div>';

$(document).ready(function() {
    $('#'+activeLabel).addClass("btn-primary");
    loadTypes($('#type_url').val());
});

$(function() {
    $("#env_div").remove();

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

    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);
    $("#fromDate").datepicker('setDate', currentDate);

    $( "#toDate").datepicker({
        changeMonth: true,
        changeYear: true,
        dateFormat: 'yy-mm-dd',
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>'
    });

    currentDate = new Date();
    $("#toDate").datepicker('setDate', currentDate);

});

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
            var url = '/views/monitoring/data/'+type+'/getLagTime?startDate='+$('#fromDate').val()+'&endDate='+$('#toDate').val();
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
    var currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + offset/24);
    $("#fromDate").datepicker('setDate', currentDate);
    currentDate = new Date();
    $("#toDate").datepicker('setDate', currentDate);

    var url = '/views/monitoring/data/'+type+'/getLagTime?startDate='+$('#fromDate').val()+'&endDate='+$('#toDate').val();
    $('#types').val(type);
    selectedType = type;
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
    var url = '/views/monitoring/data/'+type+'/getLagTime?startDate='+$('#fromDate').val()+'&endDate='+$('#toDate').val();
    $('#types').val(type);
    selectedType = type;
    display(url);
}

function refreshTableData(reportType,columnValue){
    //set default value, in case this value is undefined
	if(reportType == null || reportType == "undefined"){
		reportType = "Lag_Time_Capture";
	}
    var url = '/views/monitoring/data/'+reportType+'/getLagTimeDetail?startDate='+selectedStartDate+'&endDate='+selectedEndDate+'&queryField='+columnValue;
    $.ajax({
        url: url,
        type: "GET",
        success: function (data, textStatus, jqXHR) {
            //prepare table data
            var tableData = [[defaultContent]];
            var columns = _.cloneDeep([
                {"title":"Recon Id"},
                {"title":"Creation Date"},
                {"title":"Lag Time (ms)"},
            ]);
            if(data && data.length>0){
                tableData = _(data).map(function(item,index){
                    //_.compact will remove 0, using rejcet instead
                    return _.reject(_.map(item, function(value, key) {
                        if(key === 'reconId') {
                            return value;
                        } else if(key === 'creationDate'){
                            return moment(value).format();
                        } else if(key === 'reconMetricsMap'){
                            if(reportType.toUpperCase() == 'LAG_TIME_PAYOUT') {
                                return value.PAYOUT_Metric_LagTime_V0.metrics[reportType.toUpperCase()]
                            } else if(reportType.toUpperCase() == "LAG_TIME_REFUND"){
                                return value.RMM_Metric_LagTime_V0.metrics[reportType.toUpperCase()]
                            } else {
                                return value.FMM_Metric_LagTime_V0.metrics[reportType.toUpperCase()];
                            }
                        } else {
                            return undefined;
                        }
                    }), _.isUndefined);
                }).value();
            }
            var options = {};
            table = renderDataTable('table_detail',tableData,columns,table,options);
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
        success: function (data, textStatus, jqXHR) {
            $( "#fromDate").val(data.startDate);
            $( "#toDate").val(data.endDate);
            selectedStartDate = $('#fromDate').val();
            selectedEndDate = $('#toDate').val();
            //prepare to calculate percentage, calculate the sum first
            var total = [];
            for(var i=0; i<data.columnNames.length; i++){
                var colName = data.columnNames[i];
                total[i] = 0;
                for(var j=0; j< data.details.length; j++){
                	//check if the data can parse to number first
                	var float = parseFloat(data.details[j].detail[colName]);
                	if(!isNaN(float)){
                		total[i] = total[i] + float;
                	}else{
                		//negative case
                		data.details[j].detail[colName] = 0;
                	}
                    
                }
            }

            var sumOfCount = 0;
            for(var i=0; i< total.length; i++){
                sumOfCount = sumOfCount + total[i]
            }
            //prepare donut chart data
            var groupedData =_(data.details)
                .groupBy('lagTimeBucket');
            var pieData =_(groupedData)
                .map( function(item, name){
                    return {
                        label: name,
                        value: sumOfCount==0 ? 0: parseFloat(_.sumBy(_.values( item[0].detail))) *100 /sumOfCount
                    }
                })
                .value();
            //prepare table data
            var tableData = [[defaultContent]];
            var columns = _.cloneDeep([{"title":""}]);
            if(data.details && data.details.length>0){
                tableData = _.flatten(_(data.details).map(function(item,index){
                    return _.each(_.toPairsIn(item.detail),function(i){
                        i[0] = _.replace(_.cloneDeep(i[0]),'&',' ');
                        return i.unshift(item.lagTimeBucket);
                    });
                }).value());
                columns = [
                    {"title":"Lag Time Bucket"},
                    {"title":"Date"},
                    {"title":"Count"}
                ];
            }
            
            //calculate percentage line data
            for(var i=0; i<data.columnNames.length; i++){
            	var colName = data.columnNames[i];
            	for(var j=0; j< data.details.length; j++){
            		//calculate the percencate of lagtime bucket on each time point
            		if(total[i] != 0){
            			data.details[j].detail[colName] = parseFloat(data.details[j].detail[colName]) * 100 / total[i];
            		}
            	}
            }  
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
            var trendData = _(data.columnNames).map(function (column, index) {
                return  _.assignIn(_.cloneDeep(obj),{date: moment(_.replace(column,'&',' ')).format()});
            }).value();
            _.each(data.details,function(item, index){
                if(item.detail && !_.isEmpty(item.detail)){
                    _.each(_.keys(item.detail),function(key, i){
                        var found = _.find(trendData,{date: moment(_.replace(key,'&',' ')).format()});
                        found[item.lagTimeBucket] =parseInt(item.detail[key]);
                    });
                }
            });
            
            //display donut chart
            if(pieData.length==0){
                $('.chart-tooltip').css('background-color','white');
                $('.chart-tooltip').css('border-color','white');
            } else{
                $('.chart-tooltip').css('background-color','');
                $('.chart-tooltip').css('border-color','');
            }
            donutChart = renderCustomizedColorDonutChart("total_count_pie",pieData,selectedType);
            displaySeries("total_count_pie",selectedType);

            //display line chart
            lineChart = renderCustomizedColorLineChart("count_legend_trend",xSeries, ySeries,labels,trendData);
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
                        .column( 2 )
                        .data()
                        .reduce( function (a, b) {
                            return parseInt(a) + parseInt(b);
                        }, 0 );

                    // Total over this page
                    pageTotal = api
                        .column( 2, { page: 'current'} )
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