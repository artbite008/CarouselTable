//get them from ajax call
var _capture_data;
var _settlement_data;

var _detailFacet;
var _caputerChart;
var _settlementChart;

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
var _infoColor = '#0063d1';
// #739e73 stand for success
var _successColor = '#85b716';

var _ebay_color_red = '#e43137';
var _ebay_color_blue = '#0063d1';
var _ebay_color_yellow = '#f4ae01';
var _ebbay_color_green = '#85b716';

//total color, processing color, verified color, break color
var _button_color_all = [_infoColor, _warningColor,  _dangerColor, _successColor];
var _ykeys_all = ['total','processing','missed','verified'];
var _labels_all = ['Total','Processing','Data Break','Verified'];

//will be different for the 2 chars
//captuer
var _ykeys_captuer = ['missed'];
//var _ykeys = ['total','verified','missed'];
var _labels_captuer = ['Data Break'];
//var _labels = ['Total','Verified','Data Break'];
//var _lineColors = ['blue', 'green', 'red'];
var _lineColors_captuer = [_dangerColor];

//settlement
var _ykeys_settlement = ['missed'];
//var _ykeys = ['total','verified','missed'];
var _labels_settlement = ['Data Break'];
//var _labels = ['Total','Verified','Data Break'];
//var _lineColors = ['blue', 'green', 'red'];
var _lineColors_settlement = [_dangerColor];

//menu toolbar
var _captuer_total_selected = false;
var _captuer_processing_selected = false;
var _captuer_verified_selected = false;
var _captuer_databreak_selected = true;
var _captuer_type_toggle = 'count';

var _settlement_total_selected = false;
var _settlement_processing_selected = false;
var _settlement_verified_selected = false;
var _settlement_databreak_selected = true;
var _settlement_type_toggle = 'count';

var _url_2weeks = '/views/dataintegrity/data/fmm/fixed_range_2_weeks?';
var _url_24hours = '/views/dataintegrity/data/fmm/fixed_range_24_hours?';
var _url_dynamic_range = '/views/dataintegrity/data/fmm/dynamic_range?';

$(document).ready(function() {
    // DO NOT REMOVE : GLOBAL FUNCTIONS!
    pageSetUp();

    $('#fromDate').val($('#defaultStartDate').val());
    $('#toDate').val($('#defaultEndDate').val());

    $(window).resize(function() {
        if(_caputerChart){
            _caputerChart.redraw();
        }
        if(_settlementChart){
            _settlementChart.redraw();
        }
    });

    _detailFacet = DIViewer.DetailFacet({
        targetElement: $('#datatable_reconmatrix'),
        queryURL: '/views/dataintegrity/data/fmm/reconmatrix?',
        queryByIdURL: '/views/dataintegrity/data/fmm/reconmatrix/',
        exportURL: '/views/dataintegrity/data/fmm/reconmatrix/export?',
        fixedColumns:   {
            leftColumns: 3
        },
        columnDefs:[
            {
                targets: [0,1,2,3],
                createdCell: function (td, cellData, rowData, row, col) {
                    var rowSpanFlagIndex = 20;
                    var reconStatusFlagIndex = rowSpanFlagIndex+1;
                    var lagTypeFlagIndex = rowSpanFlagIndex+2;
                    var reconSubStatusFlagIndex = lagTypeFlagIndex+3;

                    //show the lag type
                    if(col===3) {
                        var lagType = rowData[lagTypeFlagIndex];
                        if(lagType){
                            $(td).addClass(lagType);
                            switch(lagType) {
                                case 'creditcard':
                                    $(td).attr('title', 'Creditcard');
                                    break;
                                case 'incentive':
                                    $(td).attr('title', 'Incentive');
                                    break;
                                case 'creditcard_void':
                                    $(td).attr('title', 'Creditcard Void');
                                    break;
                                case 'incentive_void':
                                    $(td).attr('title', 'Incentive Void');
                                    break;
                                case 'incentive_auth_failure':
                                    $(td).attr('title', 'Incentive Authorization Failure');
                                    break;
                                case 'incentive_cap_failure':
                                    $(td).attr('title', 'Incentive Capture Failure');
                                    break;
                                case 'cc_auth_failure':
                                    $(td).attr('title', 'Creditcard Authorization Failure');
                                    break;
                                default:
                                    $(td).attr('title', 'Unknown Leg Type');
                                    break;
                            }
                        }
                        return;
                    }

                    var rowspan = rowData[rowSpanFlagIndex];
                    if (rowspan == 0) {
                        $(td).remove();
                    }
                    if (rowspan > 1) {
                        $(td).attr('rowspan', rowspan);
                    }

                    //show the td left border with different color
                    if(col===0) {
                        var type = rowData[reconStatusFlagIndex];
                        if (type) {//processing or verified or databreak
                            $(td).addClass(type+'_td_flag');
                        }

                        switch(type){
                            case 'processing':
                                $(td).attr('title', 'Processing');
                                break;
                            case 'databreak':
                                $(td).attr('title', 'Break');
                                break;
                            case 'verified':
                                $(td).attr('title', 'Verified');
                                break;
                            default:
                                break;
                        }

                        //show the dismissed status
                        var subType = rowData[reconSubStatusFlagIndex];
                        if(subType==='dismissed'){
                            $(td).addClass('dismissed_td_flag');
                            $(td).attr('title', $(td).attr('title')+' & Dismissed');
                        }
                    }

                    //show recon matrix detail link
                    if(col===1){
                        var orderId = rowData[1];
                        var detailLink = '/views/dataintegrity/detail?reconId=';
                        if(orderId.includes("dummy")){
                            detailLink += orderId + '&reconType=ForwardMoneyMovementReconMatrix';
                        } else {
                            detailLink += 'datachain-' + orderId + '&reconType=ForwardMoneyMovementReconMatrix';
                        }
                        $(td).html('<a target="_blank" href="' + detailLink + '">' + orderId + '</a>');
                    }
                }
            },
            {
                targets: [19],//fee change
                createdCell: function (td, cellData, rowData, row, col) {
                	var rowSpanFlagIndex = 20;//fee change
                    var rowspan = rowData[rowSpanFlagIndex];//
                    if(rowspan!=1){
                        $(td).addClass('rowspan_'+rowspan);
                    }
                }
            },
            {
                targets: [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],//fee change
                orderable: false
            },
            { width: 75, targets: 0 },
            { width: 160, targets: 1 },
            { width: 80, targets: 2 }
        ],
        scrollableHeaders:[
            {index:0, id:'peCaptureCheckPoint',indicator:'peCaptureIndicator',columns:[3,4]},
            {index:1, id:'fasCaptureCheckPoint',indicator:'fasCaptureIndicator',columns:[5,6]},
            {index:2, id:'pbCaptureCheckPoint',indicator:'pbCaptureIndicator',columns:[7,8]},
            {index:3, id:'pbSettlementCheckPoint',indicator:'pbSettlementIndicator',columns:[9,10]},
            {index:4, id:'fasSettlementCheckPoint',indicator:'fasSettlementIndicator',columns:[11,12]},
            {index:5, id:'eBookSettlementCheckPoint',indicator:'eBookSettlementIndicator',columns:[13,14]},
            {index:6, id:'peSettlementCheckPoint',indicator:'peSettlementIndicator',columns:[15,16]},
            {index:7, id:'pbTransactionFeeCheckPoint',indicator:'pbTransactionFeeIndicator',columns:[17,18]},
            {index:8, id:'omsOrderFundsReleasedCheckPoint',indicator:'orderFundsReleasedIndicator',columns:[19]}//
        ],
        visibleHeaderIndexStart:0,
        visibleHeaderIndexEnd:4
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

    getDataAndRenderCharts(_url_2weeks+'type=count');

    initTooltip();
});

function onChangeCaptuerToggle() {
    if($("#captuer-toggle").prop('checked')){
        _captuer_type_toggle = 'count';
    }else{
        _captuer_type_toggle = 'sum';
    }
    //alert(_captuer_type_toggle)
}

function onClickCaptureDataBreak() {
    _captuer_databreak_selected = !_captuer_databreak_selected;
    if(_captuer_databreak_selected){
        $("#capture_databreak_link").addClass('btn-danger');
        $("#capture_databreak_link").removeClass('btn-default');
    }else{
        $("#capture_databreak_link").addClass('btn-default');
        $("#capture_databreak_link").removeClass('btn-danger');
    }
    //alert('_captuer_databreak_selected='+_captuer_databreak_selected)
    reRenderCaptuerChart();
}

function reRenderCaptuerChart() {

    //_captuer_total_selected - index 0
    //_captuer_processing_selected - index 1
    //_captuer_verified_selected - index 3
    //_captuer_databreak_selected - index 2

    //init
    _ykeys_captuer = [];
    _labels_captuer = [];
    _lineColors_captuer = [];

    if(_captuer_total_selected){
        _ykeys_captuer.push(_ykeys_all[0]);
        _labels_captuer.push(_labels_all[0]);
        _lineColors_captuer.push((_button_color_all[0]));
    }

    if(_captuer_processing_selected){
        _ykeys_captuer.push(_ykeys_all[1]);
        _labels_captuer.push(_labels_all[1]);
        _lineColors_captuer.push((_button_color_all[1]));
    }

    if(_captuer_databreak_selected){
        _ykeys_captuer.push(_ykeys_all[2]);
        _labels_captuer.push(_labels_all[2]);
        _lineColors_captuer.push((_button_color_all[2]));
    }

    if(_captuer_verified_selected){
        _ykeys_captuer.push(_ykeys_all[3]);
        _labels_captuer.push(_labels_all[3]);
        _lineColors_captuer.push((_button_color_all[3]));
    }

    renderCaptuerChart();
}

function onClickCaptureProcessing() {
    _captuer_processing_selected = !_captuer_processing_selected;
    if(_captuer_processing_selected){
        $("#capture_processing_link").addClass('btn-warning');
        $("#capture_processing_link").removeClass('btn-default');
    }else{
        $("#capture_processing_link").addClass('btn-default');
        $("#capture_processing_link").removeClass('btn-warning');
    }

    //alert('_settlement_processing_selected='+_settlement_processing_selected)
    reRenderCaptuerChart();
}


function onClickCaptureVerified() {
    _captuer_verified_selected = !_captuer_verified_selected;
    if(_captuer_verified_selected){
        $("#capture_verified_link").addClass('btn-success');
        $("#capture_verified_link").removeClass('btn-default');
    }else{
        $("#capture_verified_link").addClass('btn-default');
        $("#capture_verified_link").removeClass('btn-success');
    }
    //alert('_captuer_verified_selected='+_captuer_verified_selected)
    reRenderCaptuerChart();
}

function onClickCaptureTotal() {
    _captuer_total_selected = !_captuer_total_selected;
    if(_captuer_total_selected){
        $("#capture_total_link").addClass('btn-primary');
        $("#capture_total_link").removeClass('btn-default');
    }else{
        $("#capture_total_link").addClass('btn-default');
        $("#capture_total_link").removeClass('btn-primary');
    }
    //alert('_captuer_total_selected='+_captuer_total_selected)
    reRenderCaptuerChart();
}

function onChangeSettlementToggle() {
    if($("#settlement-toggle").prop('checked')){
        _settlement_type_toggle = 'count';
    }else{
        _settlement_type_toggle = 'sum';
    }
    //alert(_settlement_type_toggle)
}

function reRenderSettlementChart() {

    //_settlement_total_selected - index 0
    //_settlement_processing_selected - index 1
    //_settlement_verified_selected - index 3
    //_settlement_databreak_selected - index 2

    //init
    _ykeys_settlement = [];
    _labels_settlement = [];
    _lineColors_settlement = [];

    if(_settlement_total_selected){
        _ykeys_settlement.push(_ykeys_all[0]);
        _labels_settlement.push(_labels_all[0]);
        _lineColors_settlement.push((_button_color_all[0]));
    }

    if(_settlement_processing_selected){
        _ykeys_settlement.push(_ykeys_all[1]);
        _labels_settlement.push(_labels_all[1]);
        _lineColors_settlement.push((_button_color_all[1]));
    }

    if(_settlement_databreak_selected){
        _ykeys_settlement.push(_ykeys_all[2]);
        _labels_settlement.push(_labels_all[2]);
        _lineColors_settlement.push((_button_color_all[2]));
    }

    if(_settlement_verified_selected){
        _ykeys_settlement.push(_ykeys_all[3]);
        _labels_settlement.push(_labels_all[3]);
        _lineColors_settlement.push((_button_color_all[3]));
    }

    renderSettlementChart();
}

function onClickSettlementDataBreak() {
    _settlement_databreak_selected = !_settlement_databreak_selected;
    if(_settlement_databreak_selected){
        $("#settlement_databreak_link").addClass('btn-danger');
        $("#settlement_databreak_link").removeClass('btn-default');
    }else{
        $("#settlement_databreak_link").addClass('btn-default');
        $("#settlement_databreak_link").removeClass('btn-danger');
    }
    //alert('_settlement_databreak_selected='+_settlement_databreak_selected)
    reRenderSettlementChart();
}

function onClickSettlementProcessing() {
    _settlement_processing_selected = !_settlement_processing_selected;
    if(_settlement_processing_selected){
        $("#settlement_processing_link").addClass('btn-warning');
        $("#settlement_processing_link").removeClass('btn-default');
    }else{
        $("#settlement_processing_link").addClass('btn-default');
        $("#settlement_processing_link").removeClass('btn-warning');
    }

    //alert('_settlement_processing_selected='+_settlement_processing_selected)
    reRenderSettlementChart();
}

function onClickSettlementVerified() {
    _settlement_verified_selected = !_settlement_verified_selected;
    if(_settlement_verified_selected){
        $("#settlement_verified_link").addClass('btn-success');
        $("#settlement_verified_link").removeClass('btn-default');
    }else{
        $("#settlement_verified_link").addClass('btn-default');
        $("#settlement_verified_link").removeClass('btn-success');
    }
    //alert('_settlement_verified_selected='+_settlement_verified_selected)
    reRenderSettlementChart();
}

function onClickSettlementTotal() {
    _settlement_total_selected = !_settlement_total_selected;
    if(_settlement_total_selected){
        $("#settlement_total_link").addClass('btn-primary');
        $("#settlement_total_link").removeClass('btn-default');
    }else{
        $("#settlement_total_link").addClass('btn-default');
        $("#settlement_total_link").removeClass('btn-primary');
    }
    //alert('_settlement_total_selected='+_settlement_total_selected)
    reRenderSettlementChart();
}

function resetSettlementTagButtons() {
    _settlement_databreak_selected = true;
    $("#settlement_databreak_link").addClass('btn-danger');
    $("#settlement_databreak_link").removeClass('btn-default');

    _settlement_processing_selected = false;
    $("#settlement_processing_link").addClass('btn-default');
    $("#settlement_processing_link").removeClass('btn-warning');

    _settlement_verified_selected = false;
    $("#settlement_verified_link").addClass('btn-default');
    $("#settlement_verified_link").removeClass('btn-success');

    _ykeys_settlement = [];
    _labels_settlement = [];
    _lineColors_settlement = [];

    _ykeys_settlement.push(_ykeys_all[2]);
    _labels_settlement.push(_labels_all[2]);
    _lineColors_settlement.push((_button_color_all[2]));

}

function resetDataTableSection() {
    //clear search input
    $('#orderId').val('');

    //clear datatable
    if(_detailFacet){
        _detailFacet.clearTable();
    }

}

function onClickRefresh(){
    pageSetUp();

    resetDataTableSection();
    resetSettlementTagButtons();

    var last2Weeks = $("#last2weeks").prop('checked');
    var last24hours = $("#last24hours").prop('checked');
    var fromDate = $("#fromDate").val();
    var toDate = $("#toDate").val();

    if(last2Weeks){
        _xlabels = 'day';
        getDataAndRenderCharts(_url_2weeks+'type=count');
        return;
    }

    if(last24hours){
        _xlabels = 'hour';
        getDataAndRenderCharts(_url_24hours+'type=count');
        return;
    }

    if(fromDate && toDate){
        //caculate the gap days between 2 dates
        var s = 24*60*60*1000;
        var t1 = Date.parse(new Date( fromDate ));
        var t2 = Date.parse(new Date( toDate ));
        var t = t2-t1;
        if((t/s)<3){
            _xlabels = 'hour';
        }else{
            _xlabels = 'day';
        }

        var queryString = 'type=count&' + 'fromDate=' + fromDate + '&toDate=' + toDate;
        getDataAndRenderCharts(_url_dynamic_range + queryString);
    }
}

function getDataAndRenderCharts(url){
    $.ajax({
        url: url+'&flow=settlement',
        type: "GET",
        contentType: "application/json; charset=utf-8",
        timeout:120*000,
        success: function (data, textStatus, jqXHR) {
            _settlement_data = data;
            renderSettlementChart();
        },
        error: function (jqXHR, textStatus, errorThrown) {
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
        $("#last24hours").prop('checked', false);
        $("#last2weeks").prop('checked', false);
    }
}

function onCheckFilterBox1() {
    if($("#last2weeks").prop('checked')){
        $("#last24hours").prop('checked', false);
        $("#toDate").val($('#defaultEndDate').val());
        $("#fromDate").val($('#defaultStartDate').val());
    }
}

function onCheckFilterBox2() {
    if($("#last24hours").prop('checked')){
        $("#last2weeks").prop('checked', false);
        $("#toDate").val('');
        $("#fromDate").val('');
    }
}

function loadDataTable(flow, row, xlabels,processingSelected,verifiedSelected,databreakSelected) {
    var isProcessingSelected = processingSelected?'1':'0';
    var isVerifiedSelected = verifiedSelected?'1':'0';
    var isDatabreakSelected = databreakSelected?'1':'0';

    var queryParam = 'flow=' + flow
        + '&fromDate=' + row.period
        + '&unit=' + xlabels
        + '&showProcessing=' + isProcessingSelected
        + '&showVerified=' + isVerifiedSelected
        + '&showDataBreak=' + isDatabreakSelected;

    //pagination init
    var totalCount = 0;
    if(processingSelected){
        totalCount += row.processing;
    }
    if(verifiedSelected){
        totalCount += row.verified;
    }
    if(databreakSelected){
        totalCount += row.missed;
    }

    _detailFacet.search(totalCount, queryParam);
}

function renderSettlementChart() {
    $("#fmm_graph_s").empty();
    $("#fmm_graph_s").unbind('click');
    if(_settlementChart){
        _settlementChart.on('click', null);
    }

    if ($('#fmm_graph_s').length && _settlement_data) {
        _settlementChart = Morris.Area({
            element : 'fmm_graph_s',
            data : _settlement_data,
            xkey : _xkey,
            ykeys : _ykeys_settlement,
            labels : _labels_settlement,
            lineColors : _lineColors_settlement,
            pointSize : 2,
            hideHover : 'auto',
            behaveLikeLine : true,
            lineWidth : 2,
            xLabels : _xlabels,
            resize: true
        }).on('click', function(i, row){
            console.log(row.period);
            $('#orderId').val('');
            loadDataTable('settlement', row,_xlabels,_settlement_processing_selected,_settlement_verified_selected,_settlement_databreak_selected);
        });
    }
}

function renderCaptuerChart() {
    $("#fmm_graph_c").empty();
    $("#fmm_graph_c").unbind('click');
    if(_caputerChart){
        _caputerChart.on('click', null);
    }

    if ($('#fmm_graph_c').length && _capture_data) {
        _caputerChart = Morris.Area({
            element: 'fmm_graph_c',
            data: _capture_data,
            xkey: _xkey,
            ykeys: _ykeys_captuer,
            labels: _labels_captuer,
            lineColors: _lineColors_captuer,
            pointSize: 2,
            hideHover: 'auto',
            behaveLikeLine: true,
            lineWidth: 2,
            xLabels: _xlabels,
            resize: true
        }).on('click', function(i, row){
            console.log(row.period);
            $('#orderId').val('');
            loadDataTable('capture', row,_xlabels,_captuer_processing_selected,_captuer_verified_selected,_captuer_databreak_selected);
        });
    }
}
