//get them from ajax call
var _capture_data;
var Line_Graph_Data;

var _dataTable;
var _caputerChart;
var _RefundChart;

var _xlabels = 'day';
var _xkey = 'Period';

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
var _ykeys_all = ['Total','Processing','DataBreak','Verified'];
var _labels_all = ['Total','Processing','Data Break','Verified'];

var _ykeys = ['DataBreak'];
var _ylabels = ['Data Break'];
var _lineColors = [_dangerColor];

var total_selected = false;
var processing_selected = false;
var verified_selected = false;
var databreak_selected = true;
var _settlement_type_toggle = 'count';

var last7days_url = '/views/dataintegrity/data/rmm/last_14days';
var last24hours_url = '/views/dataintegrity/data/rmm/last_24hours';
var dynamic_range_url = '/views/dataintegrity/data/rmm/dynamic_range?';

var rowSpanIndex = 25

/*
 * Run morris chart on this page
 */
$(document).ready(function() {
    // DO NOT REMOVE : GLOBAL FUNCTIONS!
    pageSetUp();

    $('#fromDate').val($('#defaultStartDate').val());
    $('#toDate').val($('#defaultEndDate').val());

    // $(window).resize(function() {
    //     if(_caputerChart){
    //         _caputerChart.redraw();
    //     }
    //     if(_RefundChart){
    //         _RefundChart.redraw();
    //     }
    // });

    _detailFacet = DIViewer.DetailFacet({
        targetElement: $('#datatable_reconmatrix'),
        queryURL: '/views/dataintegrity/data/rmm/datatable?',
        queryByIdURL: '/views/dataintegrity/data/rmm/searchById?id=',
        exportURL: '/views/dataintegrity/data/rmm/datatable/export?',
        columnDefs: [
            {
                targets: [0,1,2,3],
                createdCell: function (td, cellData, rowData, row, col) {

                    var rowspan = rowData[rowSpanIndex];//
                    if (rowspan == 0) {
                        $(td).remove();
                    }
                    if (rowspan > 1) {
                        $(td).attr('rowspan', rowspan);
                    }

                    //show the td left border with different color
                    if(col===0) {
                        var type = rowData[rowSpanIndex+1];//
                        if (type) {
                            $(td).addClass(type+'_td_flag');
                        }
                    }

                    if(col===7){
                        var failureType = rowData[rowSpanIndex+3];//
                        if(failureType){
                            $(td).addClass(failureType)
                        }
                    }

                    //show recon matrix detail link
                    if(col===2){
                        var adjustmentOrderId = rowData[2];
                        var detailLink = '/views/dataintegrity/detail?reconId=';
                        if(adjustmentOrderId.includes("dummy")){
                            detailLink += adjustmentOrderId + '&reconType=ReverseMoneyMovementReconMatrix';
                        } else {
                            detailLink += 'datachain-' + adjustmentOrderId + '&reconType=ReverseMoneyMovementReconMatrix';
                        }
                        $(td).html('<a target="_blank" href="' + detailLink + '">' + adjustmentOrderId + '</a>');
                    }
                }
            },
            {
                targets: [4,5,6,7,8,9,10,11,24],//
                createdCell: function (td, cellData, rowData, row, col) {
                    var rowspan = rowData[rowSpanIndex];//
                    if(rowspan != 1){
                        $(td).addClass('rowspan_'+rowspan);
                    }

                    if(col===7){
                        var failureType = rowData[rowSpanIndex+3];//
                        if(failureType){
                            $(td).addClass(failureType)
                        }
                    }
                }
            },
            {
                targets:[13],
                createdCell: function (td, cellData, rowData, row, col) {
                    //show the lag type
                    var lagType = rowData[rowSpanIndex+2];//
                    if(lagType){
                        $(td).addClass(lagType);
                    }
                    return;
                },
                orderable: false
            },
            { width: 70, targets: 0 },
            { width: 90, targets: 1 },
            { width: 100, targets: 2 },
            { width: 50, targets: 3 },
            { width: 110, targets: 4 }
        ],
        scrollableHeaders:[
            {index:0, id:'rrpCreateCheckPoint',indicator:'rrpCreateIndicator',columns:[4,5]},
            {index:1, id:'fasGrantCheckPoint',indicator:'fasGrantIndicator',columns:[6,7]},
            {index:2, id:'peFundTransferCheckPoint',indicator:'peFundTransferIndicator',columns:[8,9]},
            {index:3, id:'pbFundTransferCheckPoint',indicator:'pbFundTransferIndicator',columns:[10,11]},
            {index:4, id:'pbRefundCheckPoint',indicator:'pbRefundIndicator',columns:[12,13]},
            {index:5, id:'peRefundCheckPoint',indicator:'peRefundIndicator',columns:[14,15]},
            {index:6, id:'pbRefundSettledCheckPoint',indicator:'pbRefundSettledIndicator',columns:[16,17]},
            {index:7, id:'peRefundDisbursedCheckPoint',indicator:'peRefundDisbursedIndicator',columns:[18,19]},
            {index:8, id:'eBookRefundedCheckPoint',indicator:'eBookRefundedIndicator',columns:[20,21]},
            {index:9, id:'pbTransactionFeeCheckPoint',indicator:'pbTransactionFeeIndicator',columns:[22,23]},//
            {index:10, id:'rrpUpdateCheckPoint',indicator:'rrpUpdateIndicator',columns:[24]}
        ],
        visibleHeaderIndexStart:0,
        visibleHeaderIndexEnd:4,
        redrawTableBeforeScroll:true
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
        defaultDate: "0",
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

    getDataAndRenderCharts(last7days_url);
});

function reRenderChart() {
    _ykeys = [];
    _ylabels = [];
    _lineColors = [];

    if(total_selected){
        _ykeys.push(_ykeys_all[0]);
        _ylabels.push(_labels_all[0]);
        _lineColors.push((_button_color_all[0]));
    }

    if(processing_selected){
        _ykeys.push(_ykeys_all[1]);
        _ylabels.push(_labels_all[1]);
        _lineColors.push((_button_color_all[1]));
    }

    if(databreak_selected){
        _ykeys.push(_ykeys_all[2]);
        _ylabels.push(_labels_all[2]);
        _lineColors.push((_button_color_all[2]));
    }

    if(verified_selected){
        _ykeys.push(_ykeys_all[3]);
        _ylabels.push(_labels_all[3]);
        _lineColors.push((_button_color_all[3]));
    }

    renderChart();
}

function onClickDataBreak() {
    databreak_selected = !databreak_selected;
    if(databreak_selected){
        $("#databreak_link").addClass('btn-danger');
        $("#databreak_link").removeClass('btn-default');
    }else{
        $("#databreak_link").addClass('btn-default');
        $("#databreak_link").removeClass('btn-danger');
    }
    reRenderChart();
}

function onClickProcessing() {
    processing_selected = !processing_selected;
    if(processing_selected){
        $("#processing_link").addClass('btn-warning');
        $("#processing_link").removeClass('btn-default');
    }else{
        $("#processing_link").addClass('btn-default');
        $("#processing_link").removeClass('btn-warning');
    }

    reRenderChart();
}

function onClickVerified() {
    verified_selected = !verified_selected;
    if(verified_selected){
        $("#verified_link").addClass('btn-success');
        $("#verified_link").removeClass('btn-default');
    }else{
        $("#verified_link").addClass('btn-default');
        $("#verified_link").removeClass('btn-success');
    }
    reRenderChart();
}

function onClickTotal() {
    total_selected = !total_selected;
    if(total_selected){
        $("#total_link").addClass('btn-primary');
        $("#total_link").removeClass('btn-default');
    }else{
        $("#total_link").addClass('btn-default');
        $("#total_link").removeClass('btn-primary');
    }
    reRenderChart();
}

function resetTagButtons() {
    databreak_selected = true;
    $("#databreak_link").addClass('btn-danger');
    $("#databreak_link").removeClass('btn-default');

    processing_selected = false;
    $("#processing_link").addClass('btn-default');
    $("#processing_link").removeClass('btn-warning');

    verified_selected = false;
    $("#verified_link").addClass('btn-default');
    $("#verified_link").removeClass('btn-success');

    _ykeys = [];
    _ylabels = [];
    _lineColors = [];

    _ykeys.push(_ykeys_all[2]);
    _ylabels.push(_labels_all[2]);
    _lineColors.push((_button_color_all[2]));

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
    resetTagButtons();

    var last7days = $("#last7days").prop('checked');
    var last24hours = $("#last24hours").prop('checked');
    var fromDate = $("#fromDate").val();
    var toDate = $("#toDate").val();

    if(last7days){
        _xlabels = 'day';
        getDataAndRenderCharts(last7days_url);
        return;
    }

    if(last24hours){
        _xlabels = 'hour';
        getDataAndRenderCharts(last24hours_url);
        return;
    }

    if(fromDate && toDate){
        var s = 24*60*60*1000;
        var t1 = Date.parse(new Date( fromDate ));
        var t2 = Date.parse(new Date( toDate ));
        var t = t2-t1;
        if((t/s)<3){
            _xlabels = 'hour';
        }else{
            _xlabels = 'day';
        }
        var queryString = 'fromDate=' + fromDate + '&toDate=' + toDate+'&groupBy='+_xlabels;
        getDataAndRenderCharts(dynamic_range_url + queryString);
    }
}

function getDataAndRenderCharts(url){

    $.ajax({
    	url: url,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        success: function (data, textStatus, jqXHR) {
            Line_Graph_Data = data;
            renderChart();
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
        $("#last7days").prop('checked', false);
    }
}

function onCheckFilterBox1() {
    if($("#last7days").prop('checked')){
        $("#last24hours").prop('checked', false);
        $("#toDate").val($('#defaultEndDate').val());
        $("#fromDate").val($('#defaultStartDate').val());
    }
}

function onCheckFilterBox2() {
    if($("#last24hours").prop('checked')){
        $("#last7days").prop('checked', false);
        $("#toDate").val('');
        $("#fromDate").val('');
    }
}

// function loadDataTable(period,processingSelected,verifiedSelected,databreakSelected) {
//     var isProcessingSelected = processingSelected?'1':'0';
//     var isVerifiedSelected = verifiedSelected?'1':'0';
//     var isDatabreakSelected = databreakSelected?'1':'0';
//     var type = isDatabreakSelected+isProcessingSelected+isVerifiedSelected;
//     var url = load_dataTable_url+'date='+period+'&type='+type+'&groupBy='+_xlabels;
//
//     $.ajax({
//         url: url,
//         type: "GET",
//         contentType: "application/json; charset=utf-8",
//         success: function (data, textStatus, jqXHR) {
//             renderDataTable(data);
//         },
//         error: function (jqXHR, textStatus, errorThrown) {
//             alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
//         }
//     });
//
//     redrawRowSpanCells();
// }


function loadDataTable(row, xlabels,processingSelected,verifiedSelected,databreakSelected) {
    var isProcessingSelected = processingSelected?'1':'0';
    var isVerifiedSelected = verifiedSelected?'1':'0';
    var isDatabreakSelected = databreakSelected?'1':'0';
    var type = isDatabreakSelected+isProcessingSelected+isVerifiedSelected;

    var queryParam = 'date=' + row.Period + '&type=' + type  + '&groupBy='+_xlabels;

    //pagination init
    var totalCount = 0;
    if(processingSelected){
        totalCount += row.Processing;
    }
    if(verifiedSelected){
        totalCount += row.Verified;
    }
    if(databreakSelected){
        totalCount += row.DataBreak;
    }

    _detailFacet.search(totalCount, queryParam);


}

function renderChart() {
    $("#rmm_line_graph").empty();
    $("#rmm_line_graph").unbind('click');
    if(_RefundChart){
        _RefundChart.on('click', null);
    }

    if ($('#rmm_line_graph').length && Line_Graph_Data) {
        _RefundChart = Morris.Area({
            element : 'rmm_line_graph',
            data : Line_Graph_Data,
            xkey : _xkey,
            ykeys : _ykeys,
            labels : _ylabels,
            lineColors : _lineColors,
            pointSize : 2,
            hideHover : 'auto',
            behaveLikeLine : true,
            lineWidth : 2,
            xLabels : _xlabels,
            resize: true
        }).on('click', function(i, row){
            console.log(row);
            $('#orderId').val('');
            loadDataTable(row,_xlabels,processing_selected,verified_selected,databreak_selected);
        });
    }
}
