//get them from ajax call
var _capture_data;

var _dataTable;
var _caputerChart;

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

//menu toolbar
var _captuer_total_selected = false;
var _captuer_processing_selected = false;
var _captuer_verified_selected = false;
var _captuer_databreak_selected = true;
var _captuer_type_toggle = 'count';

var _url_2weeks = '/views/dataintegrity/data/payout/fixed_range_2_weeks?';
var _url_7days = '/views/dataintegrity/data/payout/fixed_range_7_days?';
var _url_24hours = '/views/dataintegrity/data/payout/fixed_range_24_hours?';
var _url_dynamic_range = '/views/dataintegrity/data/payout/dynamic_range?';

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

    _detailFacet = DIViewer.DetailFacet({
        targetElement: $('#datatable_reconmatrix'),
        queryURL: '/views/dataintegrity/data/payout/reconmatrix?',
        queryByIdURL: '/views/dataintegrity/data/payout/reconmatrix/',
        exportURL: '/views/dataintegrity/data/payout/reconmatrix/export?',
        columnDefs: [{
            targets: [0,1,2],
            createdCell: function (td, cellData, rowData, row, col) {
                var rowspan = rowData[15];
                if (rowspan == 0) {
                    $(td).remove();
                }
                if (rowspan > 1) {
                    $(td).attr('rowspan', rowspan);
                }
                //show the td left border with different color
                if(col===0) {
                    var type = rowData[16];
                    if (type) {
                        switch (type) {
                            case "verified":
                                $(td).addClass('verified_td_flag');
                                break;
                            case "databreak":
                                $(td).addClass('databreak_td_flag');
                                break;
                            case "processing":
                                $(td).addClass('processing_td_flag');
                                break;
                            default:
                                break;
                        }
                    }
                }

                //show recon matrix detail link
                if(col===1){
                    var payoutId = rowData[1];
                    var detailLink = '/views/dataintegrity/detail?reconId=';
                    if(payoutId.includes("dummy")){
                        detailLink += payoutId + '&reconType=SellerPayoutReconMatrix';
                    } else {
                        detailLink += 'datachain-' + payoutId + '&reconType=SellerPayoutReconMatrix';
                    }
                    $(td).html('<a target="_blank" href="' + detailLink + '">' + payoutId + '</a>');
                }
            }
        }],
        scrollableHeaders:[
            {index:0, id:'fasPayoutCreationCheckPoint',indicator:'fasPayoutCreationIndicator',columns:[3,4]},
            {index:1, id:'payoutSystemCheckPoint',indicator:'payoutSystemIndicator',columns:[5,6]},
            {index:2, id:'pePayoutCheckPoint',indicator:'pePayoutIndicator',columns:[7,8]},
            {index:3, id:'pbPayoutCheckPoint',indicator:'pbPayoutIndicator',columns:[9,10]},
            {index:4, id:'fasPayoutUpdateCheckPoint',indicator:'fasPayoutUpdateIndicator',columns:[11,12]},
            {index:5, id:'ebookPayoutSucCheckPoint',indicator:'ebookPayoutSucIndicator',columns:[13,14]}
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
});

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

function resetDataTableSection() {
    //clear search input
    $('#payoutId').val('');

    //clear datatable
    if(_detailFacet){
        _detailFacet.clearTable();
    }

}

function resetSettlementTagButtons() {
    _captuer_databreak_selected = true;
    $("#capture_databreak_link").addClass('btn-danger');
    $("#capture_databreak_link").removeClass('btn-default');

    _captuer_processing_selected = false;
    $("#capture_processing_link").addClass('btn-default');
    $("#capture_processing_link").removeClass('btn-warning');

    _captuer_verified_selected = false;
    $("#capture_verified_link").addClass('btn-default');
    $("#capture_verified_link").removeClass('btn-success');

    _ykeys_captuer = [];
    _labels_captuer = [];
    _lineColors_captuer = [];

    _ykeys_captuer.push(_ykeys_all[2]);
    _labels_captuer.push(_labels_all[2]);
    _lineColors_captuer.push((_button_color_all[2]));

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
        if((t/s)<=3){
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
        url: url+'&flow=payout',
        type: "GET",
        contentType: "application/json; charset=utf-8",
        success: function (data, textStatus, jqXHR) {
            _capture_data = data;
            console.log(data);
            renderCaptuerChart();
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

function loadDataTable(row, flow,xlabels,processingSelected,verifiedSelected,databreakSelected) {
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

function renderCaptuerChart() {
    $("#payout_graph_c").empty();
    $("#payout_graph_c").unbind('click');
    if(_caputerChart){
        _caputerChart.on('click', null);
    }

    if ($('#payout_graph_c').length && _capture_data) {
        _caputerChart = Morris.Area({
            element: 'payout_graph_c',
            data: _capture_data,
            xkey: _xkey,
            ykeys: _ykeys_captuer,
            labels: _labels_captuer,
            lineColors: _lineColors_captuer,
            pointSize: 2,
            hideHover: 'auto',
            behaveLikeLine: true,
            lineWidth: 2,
            xLabels: _xlabels
        }).on('click', function(i, row){
            console.log(row.period);
            loadDataTable(row,'payout',_xlabels,_captuer_processing_selected,_captuer_verified_selected,_captuer_databreak_selected);
        });
    }
}
