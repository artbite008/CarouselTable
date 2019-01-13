var _LineData;
var _LineDataCount;
var _LineDataPercent;
var _PieData;

var _dataTable;
var _LineGraph;
var _PieChart;
var _LineGraphCount;
var _LineGraphPercent;

var _xkey = 'PERIOD';
var _ykeys = ['OPEN','CLOSE',"TOTAL"];
    // var ykeys = ['total'];
var labels = ['Open','Closed',"Total"];

var line_colors = ["#f4ae01","#85b716","#0063d1"];
//#e43137 red
//#f4ae01 yellow


//day or hour
//default to be day
//both the same for 2 charts
var _xlabels = 'day';

// #a90329 is red - stand for danger
var _dangerColor = '#a90329';
// #c79121 is yellow - stand for warning
var _warningColor = '#c79121';
// #3276b1 is stand for info
var _infoColor = '#3276b1';
// #739e73 stand for success
var _successColor = '#739e73';

//total color, processing color, verified color, break color
var _button_color_all = [_infoColor, _warningColor,  _dangerColor, _successColor];
var _ykeys_all = ['TOTAL','OPEN','CLOSE'];
var _labels_all = ['Total','Open','Closed'];

var _ykeys_line = ['OPEN'];
var _labels_line = ['Open'];
var _lineColors= ["#f4ae01"];

//menu toolbar
var _line_total_selected = false;
var _line_open_selected = true;
var _line_close_selected = false;
var _line_type_toggle = 'count';

var last_7days_url = '/views/dataintegrity/data/fasbatch/last_14days?';
var dynamic_range_url = '/views/dataintegrity/data/fasbatch/dynamic_range?';
var datatable_url = '/views/dataintegrity/data/fasbatch/datatable?';
var _url_reconmatrix_by_id = "/views/dataintegrity/data/fasbatch/searchByBatchId?";
var searchByOpenDurationDaysUrl = "/views/dataintegrity/data/fasbatch/searchByOpenDurationDays?";

var responsiveHelper_datatable_reconmatrix = undefined;
var breakpointDefinition = {
    tablet : 1024,
    phone : 480
};

/*
 * Run morris chart on this page
 */
$(document).ready(function() {
    // DO NOT REMOVE : GLOBAL FUNCTIONS!
    pageSetUp();
    
    $('#fromDate').val($('#defaultStartDate').val());
    $('#toDate').val($('#defaultEndDate').val());
    

    _dataTable = $('#datatable_reconmatrix').dataTable({
        "sDom": "<'dt-toolbar'<'col-sm-12 col-xs-12 hidden-xs'C>r>"+
        "t"+
        "<'dt-toolbar-footer'p i>",
        "autoWidth" : true,
        "preDrawCallback" : function() {
            // Initialize the responsive datatables helper once.
            if (!responsiveHelper_datatable_reconmatrix) {
                responsiveHelper_datatable_reconmatrix = new ResponsiveDatatablesHelper($('#datatable_reconmatrix'), breakpointDefinition);
            }
        },
        "rowCallback" : function(nRow) {
            responsiveHelper_datatable_reconmatrix.createExpandIcon(nRow);
        },
        "drawCallback" : function(oSettings) {
            responsiveHelper_datatable_reconmatrix.respond();
        },
        "iDisplayLength": 100,
        columnDefs: [{
            targets: [0,1,2],
            createdCell: function (td, cellData, rowData, row, col) {
                var rowspan = rowData[11];
                if (rowspan == 0) {
                    $(td).remove();
                }
                if (rowspan > 1) {
                    $(td).attr('rowspan', rowspan);
                }
            }
        }]
    });

    // Date Range Picker
    $("#fromDate").datepicker({
        defaultDate: "-1w",
        changeMonth: true,
        numberOfMonths: 1,
        maxDate: "+0D",
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>',
        onClose: function (selectedDate) {
            var actualDate = new Date(selectedDate);
            $("#toDate").datepicker("option", "minDate", actualDate);

            var newDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()+6);

            var currentDate = new Date();
            if(newDate > currentDate){
                $("#toDate").datepicker("option", "maxDate", currentDate);
            }else{
                $("#toDate").datepicker("option", "maxDate", newDate);
            }
        }

    });
    $("#toDate").datepicker({
        defaultDate: "-1w",
        changeMonth: true,
        numberOfMonths: 1,
        maxDate: "+0D",
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>',
        onClose: function (selectedDate) {
            $("#fromDate").datepicker("option", "maxDate", selectedDate);

            var actualDate = new Date(selectedDate);
            var newDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()-6);

            $("#fromDate").datepicker("option", "minDate", newDate);
        }
    });
    var fasAccountTypeStr = $("#fasAccountTypeSelect").val();
    getDataAndRenderCharts(last_7days_url+"fasAccountTypeStr="+fasAccountTypeStr);
});

function reRenderLineGraph() {
    _ykeys_line = [];
    _labels_line = [];
    _lineColors = [];
    if(_line_open_selected){
        _ykeys_line.push(_ykeys[0]);
        _labels_line.push(labels[0]);
        _lineColors.push((line_colors[0]));
    }
    if(_line_close_selected){
        _ykeys_line.push(_ykeys[1]);
        _labels_line.push(labels[1]);
        _lineColors.push((line_colors[1]));
    }
    if(_line_total_selected){
        _ykeys_line.push(_ykeys[2]);
        _labels_line.push(labels[2]);
        _lineColors.push((line_colors[2]));
    }
    renderLineGraph();
}

function onClickClose() {
    _line_close_selected = !_line_close_selected;
    if(_line_close_selected){
        $("#line_close_link").addClass('btn-success');
        $("#line_close_link").removeClass('btn-default');
    }else{
        $("#line_close_link").addClass('btn-default');
        $("#line_close_link").removeClass('btn-success');
    }
    reRenderLineGraph();
}


function onClickOpen() {
    _line_open_selected = !_line_open_selected;
    if(_line_open_selected){
        $("#line_open_link").addClass('btn-warning');
        $("#line_open_link").removeClass('btn-default');
    }else{
        $("#line_open_link").addClass('btn-default');
        $("#line_open_link").removeClass('btn-warning');
    }
    reRenderLineGraph();
}

function onClickTotal() {
    _line_total_selected = !_line_total_selected;
    if(_line_total_selected){
        $("#line_total_link").addClass('btn-primary');
        $("#line_total_link").removeClass('btn-default');
    }else{
        $("#line_total_link").addClass('btn-default');
        $("#line_total_link").removeClass('btn-primary');
    }
    reRenderLineGraph();
}

function onClickRefresh(){
    pageSetUp();

    var last7days = $("#last7days").prop('checked');
    var fromDate = $("#fromDate").val();
    var toDate = $("#toDate").val();
    var fasAccountTypeStr = $("#fasAccountTypeSelect").val();

    if(last7days){
        _xlabels = 'day';
        console.log("onclick refresh last7days url : "+last_7days_url+"fasAccountTypeStr="+fasAccountTypeStr);
        getDataAndRenderCharts(last_7days_url+"fasAccountTypeStr="+fasAccountTypeStr);
        return;
    }

    if(fromDate && toDate){
        var s = 24*60*60*1000;
        var t1 = Date.parse(new Date( fromDate ));
        var t2 = Date.parse(new Date( toDate ));
        var t = t2-t1;      
        var queryString = 'fromDate=' + fromDate + '&toDate=' + toDate+'&fasAccountTypeStr='+fasAccountTypeStr;
        getDataAndRenderCharts(dynamic_range_url + queryString);
    }
}

function getDataAndRenderCharts(url){
	
    $.ajax({
        url: url,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        success: function (data, textStatus, jqXHR) {
            _LineDataCount = data;
            _LineDataPercent = data;
            var close = 0;
            var open = 0;
            if(_line_type_toggle=="count"){
            	_LineData = _LineDataCount;
            }else if(_line_type_toggle=="percent"){
            	_LineData = _LineDataPercent;
            }
            for(var i=0;i<data.length;i++){
                close = close + data[i]["CLOSE"];
                open = open + data[i]["OPEN"];
            }
            _PieData = {"Close":close,"Open":open};
            renderLineGraph();
            renderPieChart();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
            $.SmartMessageBox({
                title : "Connection Failed",
                content : "</br>URL:" + url + "</br>Status:"+textStatus + "</br>Root Cause:" + errorThrown+"</br></br>Please contact DL-eBay-PPX-Galaxy@ebay.com if you always get this erorr.",
                buttons : '[OK]'
            });
        }
    });
}

function clearCheckBoxes() {
    if($("#fromDate").val() && $("#toDate").val()){
        $("#last7days").prop('checked', false);
    }
}

function onCheckFilterBox1() {
    if($("#last7days").prop('checked')){
        $("#toDate").val('');
        $("#fromDate").val('');
    }
}

function loadDataTable(period,openSelected,closeSelected,totalSelected) {
	var state = "";
	if(totalSelected){
		state = "total";
	}else if(openSelected && closeSelected){
    	state = "total";
    }else if(openSelected){
    	state = "open";
    }else if(closeSelected){
    	state = "close";
    }
	var fasAccountTypeStr = $("#fasAccountTypeSelect").val();
    var url = datatable_url+"Date="+period+"&State="+state+"&fasAccountTypeStr="+fasAccountTypeStr;

    $.ajax({
        url: url,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        success: function (data, textStatus, jqXHR) {
            renderDataTable(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
            $.SmartMessageBox({
                title : "Connection Failed",
                content : "</br>URL:" + url + "</br>Status:"+textStatus + "</br>Root Cause:" + errorThrown+"</br></br>Please contact DL-eBay-PPX-Galaxy@ebay.com if you always get this erorr.",
                buttons : '[OK]'
            });
        }
    });
    
}

function renderDataTable(data) {
    if(_dataTable){
        _dataTable._fnClearTable();
        if(data.length > 0){
            _dataTable.fnAddData(data);
        }
        _dataTable._fnReDraw();
    }

}

function changeLineGraph(){
	/**
	percent_data = new Array(data.length);
	for(var i=0;i<data.length;i++){
		var item = {"OPEN":open_percent,"CLOSE":close_percent,"TOTAL":"100%","PERIOD":data[i]["PERIOD"]};
		percent_data[i] = item;
	}
	return percent_data;
	*/
	
}

function renderPieChart() {

    if ($('#fasbatch_pie_chart').length &&_PieData) {
        _PieChart = Morris.Donut({
            element : 'fasbatch_pie_chart',
            data: [
    		    {label: "Open", value: _PieData["Open"]},
    		    {label: "Closed", value: _PieData["Close"]}
    		    
    		  ],
    		  //colors:["#e43137","#85b716"],
    		  colors:["#f4ae01","#85b716"],
        });
    }
}

function renderLineGraph() {
    $("#fasbatch_line_graph").empty();
    $("#fasbatch_line_graph").unbind('click');
    if(_LineGraph){
        _LineGraph.on('click', null);
    }

    if ($('#fasbatch_line_graph').length && _LineData) {
        _LineGraph = Morris.Area({
            element: 'fasbatch_line_graph',
            data: _LineData,
            xkey: _xkey,
            ykeys: _ykeys_line,
            labels: _labels_line,
            lineColors: _lineColors,
            pointSize: 2,
            hideHover: 'auto',
            behaveLikeLine: true,
            lineWidth: 2,
            xLabels: _xlabels
        }).on('click', function(i, row){
            loadDataTable(row.PERIOD,_line_open_selected,_line_close_selected,_line_total_selected);
        });
    }
}
function searchByBatchId(){
	 var batchId = $('#inputvalue').val();
	    if(batchId){
	        var url= _url_reconmatrix_by_id + "batchId="+batchId;
	        $.ajax({
	            url: url,
	            type: "GET",
	            contentType: "application/json; charset=utf-8",
	            success: function (data, textStatus, jqXHR) {
	                renderDataTable(data);
	            },
	            error: function (jqXHR, textStatus, errorThrown) {
	                // alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
                    $.SmartMessageBox({
                        title : "Connection Failed",
                        content : "</br>URL:" + url + "</br>Status:"+textStatus + "</br>Root Cause:" + errorThrown+"</br></br>Please contact DL-eBay-PPX-Galaxy@ebay.com if you always get this erorr.",
                        buttons : '[OK]'
                    });
	            }
	        });
	    }

}

function searchByOpenDays(){
	 var openDurationDays = $('#inputvalue').val();
	 var fasAccountTypeStr = $("#fasAccountTypeSelect").val();
	 var fromDate = $("#fromDate").val();
	 var toDate = $("#toDate").val();
	    if(openDurationDays){
	        var url= searchByOpenDurationDaysUrl + "fromDate="+fromDate+"&toDate="+toDate+"&fasAccountTypeStr="+fasAccountTypeStr+"&openDurationDays="+openDurationDays;
	        $.ajax({
	            url: url,
	            type: "GET",
	            contentType: "application/json; charset=utf-8",
	            success: function (data, textStatus, jqXHR) {
	                renderDataTable(data);
	            },
	            error: function (jqXHR, textStatus, errorThrown) {
	                // alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
                    $.SmartMessageBox({
                        title : "Connection Failed",
                        content : "</br>URL:" + url + "</br>Status:"+textStatus + "</br>Root Cause:" + errorThrown+"</br></br>Please contact DL-eBay-PPX-Galaxy@ebay.com if you always get this erorr.",
                        buttons : '[OK]'
                    });
	            }

	        });
	    }
	
}

function searchByIdOrOpenDays(){
	var mode = $('#searchMode').val();
	if(mode=="batchId"){
		searchByBatchId();
	}
	if(mode=="openDays"){
		searchByOpenDays();
	}
	
}