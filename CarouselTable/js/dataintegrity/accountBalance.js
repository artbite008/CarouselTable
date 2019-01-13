//get them from ajax call
var _capture_data;

var _dataTable;
var _captureChart;

//day or hour
//default to be day
//both the same for 2 charts
var _xlabels = 'day';
var _xkey = 'period';

// #a90329 is red - stand for danger
var _dangerColor = '#e43137';
// #c79121 is yellow - stand for warning
var _warningColor = '#f4ae01';
// #3276b1 is stand for info
var _infoColor = '#3276b1';
// #739e73 stand for success
var _successColor = '#85b716';

var _verifiedWarningColor = '#0F790A';

var _verifiedDangerColor = '#D25729';

var _ebay_color_red = '#e43137';
var _ebay_color_blue = '#0063d1';
var _ebay_color_yellow = '#f4ae01';
var _ebay_color_green = '#85b716';

//total color, processing color, verified color, break color
var _button_color_all = [_warningColor,  _dangerColor, _successColor, _verifiedDangerColor, _verifiedWarningColor];
var _ykeys_all = ['processing','break','verified', 'verifiedDanger', 'verifiedWarning'];
var _labels_all = ['Processing','Data Break','Adyen&#61;eBay', 'Adyen&lt;eBay', 'Adyen&gt;eBay'];

//will be different for the 2 chars
//captuer
var _ykeys_capture = ['break', 'verifiedDanger'];
//var _ykeys = ['total','verified','missed'];
var _labels_capture = ['Data Break', 'Adyen&lt;eBay'];
//var _labels = ['Total','Verified','Data Break'];
//var _lineColors = ['blue', 'green', 'red'];
var _lineColors_capture = [_dangerColor, _verifiedDangerColor];

//menu toolbar
var _capture_processing_selected = false;
var _capture_verified_selected = false;
var _capture_databreak_selected = true;
var _capture_verified_danger_selected = true;
var _capture_verified_warning_selected = false;

var _url_2weeks = '/views/dataintegrity/data/acctbalance/fixed_range_2_weeks?';
var _url_dynamic_range = '/views/dataintegrity/data/acctbalance/dynamic_range?';

var responsiveHelper_datatable_reconmatrix = undefined;
var breakpointDefinition = {
    tablet : 1024,
    phone : 480
};

var currentDate = undefined;

/*
 * Run morris chart on this page
 */
$(document).ready(function() {
    // DO NOT REMOVE : GLOBAL FUNCTIONS!
    pageSetUp();

    $('#fromDate').val($('#defaultStartDate').val());
    $('#toDate').val($('#defaultEndDate').val());

    $('[data-toggle="tooltip"]').tooltip();

    _detailFacet = DIViewer.DetailFacet({
        targetElement: $('#datatable_reconmatrix'),
        pageSize: 10,
        queryURL: '/views/dataintegrity/data/acctbalance/reconmatrix?',
        queryByIdURL: '/views/dataintegrity/data/acctbalance/reconmatrix/',
        //exportURL: '/views/dataintegrity/data/acctbalance/reconmatrix/export?',
        exportURL:'',
        columnDefs: [
            {
                targets: 0,
                createdCell: function (td, cellData, rowData, row, col) {
                    var rowspan = rowData[11];
                    if (rowspan == 0) {
                        $(td).remove();
                    }
                    if (rowspan > 1) {
                        $(td).attr('rowspan', rowspan);
                    }
                    var type = rowData[10];
                    if (type) {
                        switch (type) {
                            case "eq":
                                $(td).addClass('verified_td_flag');
                                $(td).attr('title', 'Adyen=eBay');
                                break;
                            case "not_ok":
                                $(td).addClass('databreak_td_flag');
                                $(td).attr('title', 'Data Break');
                                break;
                            case "processing":
                                $(td).addClass('processing_td_flag');
                                $(td).attr('title', 'Processing');
                                break;
                            case "lt":
                                $(td).addClass('verified_danger_td_flag');
                                $(td).attr('title', 'Adyen<eBay');
                                break;
                            case "gt":
                                $(td).addClass('verified_warning_td_flag');
                                $(td).attr('title', 'Adyen>eBay');
                                break;
                            default:
                                break;
                        }
                    }
                    if(currentDate === undefined) {
                        currentDate = rowData[12];
                    }
                    var ownerId = rowData[0];
                    var detailLink = '/views/dataintegrity/detail?reconId=';
                    detailLink += 'datachain-' + ownerId + '_' + rowData[12] + '&reconType=AccountBalanceReconMatrix';
                    $(td).html('<a target="_blank" href="' + detailLink + '">' + ownerId + '</a>');
                }
            }
        ]
    });

    // Date Range Picker
    $("#fromDate").datepicker({
        defaultDate: "0",
        changeMonth: true,
        numberOfMonths: 1,
        maxDate: "+0D",
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>',
        onClose: function (selectedDate) {
            var actualDate = new Date(selectedDate);
            $("#toDate").datepicker("option", "minDate", actualDate);

            var newDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()+13);

            var currentDate = new Date();
            if(newDate > currentDate){
                $("#toDate").datepicker("option", "maxDate", currentDate);
            }else{
                $("#toDate").datepicker("option", "maxDate", newDate);
            }
        }

    });
    $("#toDate").datepicker({
        defaultDate: "0",
        changeMonth: true,
        numberOfMonths: 1,
        maxDate: "+0D",
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>',
        onClose: function (selectedDate) {
            $("#fromDate").datepicker("option", "maxDate", selectedDate);

            var actualDate = new Date(selectedDate);
            var newDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()-13);

            $("#fromDate").datepicker("option", "minDate", newDate);
        }
    });

    $("#queryDate").datepicker({
        defaultDate: "0",
        changeMonth: true,
        numberOfMonths: 1,
        maxDate: "+0D",
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>',
        onClose: function (selectedDate) {

            var actualDate = new Date(selectedDate);
            var fromDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()-6);
            var toDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate()+7);

            $("#queryDate").datepicker("option", "minDate", fromDate);
            $("#queryDate").datepicker("option", "maxDate", toDate);

        }
    });

    getDataAndRenderCharts(_url_2weeks+'type=count');
});

function reRenderCaptureChart() {
    //init
    _ykeys_capture = [];
    _labels_capture = [];
    _lineColors_capture = [];

    if(_capture_processing_selected){
        _ykeys_capture.push(_ykeys_all[0]);
        _labels_capture.push(_labels_all[0]);
        _lineColors_capture.push((_button_color_all[0]));
    }

    if(_capture_databreak_selected){
        _ykeys_capture.push(_ykeys_all[1]);
        _labels_capture.push(_labels_all[1]);
        _lineColors_capture.push((_button_color_all[1]));
    }

    if(_capture_verified_selected){
        _ykeys_capture.push(_ykeys_all[2]);
        _labels_capture.push(_labels_all[2]);
        _lineColors_capture.push((_button_color_all[2]));
    }

    if(_capture_verified_danger_selected){
        _ykeys_capture.push(_ykeys_all[3]);
        _labels_capture.push(_labels_all[3]);
        _lineColors_capture.push((_button_color_all[3]));
    }

    if(_capture_verified_warning_selected){
        _ykeys_capture.push(_ykeys_all[4]);
        _labels_capture.push(_labels_all[4]);
        _lineColors_capture.push((_button_color_all[4]));
    }

    renderCaptureChart();
}


function onClickCaptureProcessing() {
    _capture_processing_selected = !_capture_processing_selected;
    if(_capture_processing_selected){
        $("#capture_processing_link").addClass('btn-warning');
        $("#capture_processing_link").removeClass('btn-default');
    }else{
        $("#capture_processing_link").addClass('btn-default');
        $("#capture_processing_link").removeClass('btn-warning');
    }
    reRenderCaptureChart();
}

function onClickCaptureDataBreak() {
    _capture_databreak_selected = !_capture_databreak_selected;
    if(_capture_databreak_selected){
        $("#capture_databreak_link").addClass('btn-danger');
        $("#capture_databreak_link").removeClass('btn-default');
    }else{
        $("#capture_databreak_link").addClass('btn-default');
        $("#capture_databreak_link").removeClass('btn-danger');
    }
    reRenderCaptureChart();
}

function onClickCaptureVerified() {
    _capture_verified_selected = !_capture_verified_selected;
    if(_capture_verified_selected){
        $("#capture_verified_link").addClass('btn-success');
        $("#capture_verified_link").removeClass('btn-default');
    }else{
        $("#capture_verified_link").addClass('btn-default');
        $("#capture_verified_link").removeClass('btn-success');
    }
    reRenderCaptureChart();
}

function onClickCaptureVerifiedDanger() {
    _capture_verified_danger_selected = !_capture_verified_danger_selected;
    if(_capture_verified_danger_selected){
        $("#capture_verified_danger_link").addClass('btn-danger-verified');
        $("#capture_verified_danger_link").removeClass('btn-default');
    }else{
        $("#capture_verified_danger_link").addClass('btn-default');
        $("#capture_verified_danger_link").removeClass('btn-danger-verified');
    }

    reRenderCaptureChart();
}

function onClickCaptureVerifiedWarning() {
    _capture_verified_warning_selected = !_capture_verified_warning_selected;
    if(_capture_verified_warning_selected){
        $("#capture_verified_warning_link").addClass('btn-success-warning');
        $("#capture_verified_warning_link").removeClass('btn-default');
    }else{
        $("#capture_verified_warning_link").addClass('btn-default');
        $("#capture_verified_warning_link").removeClass('btn-success-warning');
    }

    reRenderCaptureChart();
}


function resetDataTableSection() {
    //clear search input
    $('#acctBalanceQueryId').val('');

    //clear datatable
    if(_detailFacet){
        _detailFacet.clearTable();
    }

}

function resetSettlementTagButtons() {
    _capture_databreak_selected = true;
    $("#capture_databreak_link").addClass('btn-danger');
    $("#capture_databreak_link").removeClass('btn-default');

    _capture_processing_selected = false;
    $("#capture_processing_link").addClass('btn-default');
    $("#capture_processing_link").removeClass('btn-info');

    _capture_verified_selected = false;
    $("#capture_verified_link").addClass('btn-default');
    $("#capture_verified_link").removeClass('btn-success');

    _capture_verified_danger_selected = false;
    $("#capture_verified_danger_link").addClass('btn-default');
    $("#capture_verified_danger_link").removeClass('btn-success-danger');

    _capture_verified_warning_selected = false;
    $("#capture_verified_warning_link").addClass('btn-default');
    $("#capture_verified_warning_link").removeClass('btn-success-warning');

    _ykeys_capture = [];
    _labels_capture = [];
    _lineColors_capture = [];

    _ykeys_capture.push(_ykeys_all[1]);
    _labels_capture.push(_labels_all[1]);
    _lineColors_capture.push((_button_color_all[1]));
    _ykeys_capture.push(_ykeys_all[3]);
    _labels_capture.push(_labels_all[3]);
    _lineColors_capture.push((_button_color_all[3]));

}

function onClickRefresh(){
    pageSetUp();

    resetDataTableSection();
    resetSettlementTagButtons();
    var last2Weeks = $("#last2weeks").prop('checked');
    var fromDate = $("#fromDate").val();
    var toDate = $("#toDate").val();

    if(last2Weeks){
        _xlabels = 'day';
        getDataAndRenderCharts(_url_2weeks);
        return;
    }

    if(fromDate && toDate){
        //caculate the gap days between 2 dates
        var s = 24*60*60*1000;
        var t1 = Date.parse(new Date( fromDate ));
        var t2 = Date.parse(new Date( toDate ));
        var t = t2-t1;
        if((t/s)<=3){
            _xlabels = 'hour';
        }else{
            _xlabels = 'day';
        }

        var queryString = 'fromDate=' + fromDate + '&toDate=' + toDate;
        getDataAndRenderCharts(_url_dynamic_range + queryString);
    }
}

function getDataAndRenderCharts(url){
    $.ajax({
        url: url,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        success: function (data, textStatus, jqXHR) {
            _capture_data = data;
            console.log(data);
            renderCaptureChart();
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
        $("#last2weeks").prop('checked', false);
    }
}

function onCheckFilterBox1() {
    if($("#last2weeks").prop('checked')){
        $("#toDate").val($('#defaultEndDate').val());
        $("#fromDate").val($('#defaultStartDate').val());
    }
}

function loadDataTable(row, xlabels,processingSelected,verifiedSelected,databreakSelected,verifiedWarningSelected, verifiedDangerSelected) {
    var isProcessingSelected = processingSelected?'1':'0';
    var isDatabreakSelected = databreakSelected?'1':'0';
    var isVerifiedSelected = verifiedSelected?'1':'0';
    var isVerifiedWarningSelected = verifiedWarningSelected?'1':'0';
    var isVerifiedDangerSelected = verifiedDangerSelected?'1':'0';


    var queryParam = '&fromDate=' + row.period
        + '&caseType=' + isProcessingSelected + '%7C' + isVerifiedWarningSelected + '%7C'
        + isVerifiedSelected + '%7C' +isVerifiedDangerSelected +  '%7C' +isDatabreakSelected;

    //pagination init
    var totalCount = 0;
    if(processingSelected){
        totalCount += row.processing;
    }
    if(verifiedSelected){
        totalCount += row.verified;
    }
    if(databreakSelected){
        totalCount += row.break;
    }
    if(verifiedDangerSelected){
        totalCount += row.verifiedDanger;
    }
    if(verifiedWarningSelected){
        totalCount += row.verifiedWarning;
    }
    currentDate = undefined;
    $.when( _detailFacet.search(totalCount, queryParam)).then(function(){
        var currentTitle =  $('#result_desc').html();
        $('#result_desc').html("&nbsp;For&nbsp;"+currentDate+currentTitle);
        $('#queryDate').val(moment(currentDate).format('YYYY/MM/DD'));
    });
}

function renderCaptureChart() {
    $("#acctbalance_graph_c").empty();
    $("#acctbalance_graph_c").unbind('click');
    if(_captureChart){
        _captureChart.on('click', null);
    }

    if ($('#acctbalance_graph_c').length && _capture_data) {
        _captureChart = Morris.Area({
            element: 'acctbalance_graph_c',
            data: _capture_data,
            xkey: _xkey,
            ykeys: _ykeys_capture,
            labels: _labels_capture,
            lineColors: _lineColors_capture,
            pointSize: 2,
            hideHover: 'auto',
            behaveLikeLine: true,
            lineWidth: 2,
            xLabels: _xlabels
        }).on('click', function(i, row){
            console.log(row.period);
            loadDataTable(row,_xlabels,_capture_processing_selected,_capture_verified_selected,_capture_databreak_selected,
                _capture_verified_warning_selected, _capture_verified_danger_selected);
        });
    }
}

function searchById(){
    var queryId = $('#acctBalanceQueryId').val();
    var date = $('#queryDate').val();
    _detailFacet.searchById(queryId+"_"+moment(date).format('YYYY-MM-DD'));
}
