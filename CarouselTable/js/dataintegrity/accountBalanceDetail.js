
var _detailFacet;

$(document).ready(function () {

    // DO NOT REMOVE : GLOBAL FUNCTIONS!
    pageSetUp();

    $('[data-toggle="tooltip"]').tooltip();

    var totalCount = $('#totalCount').val();
    var ownerId = $('#ownerId').val();
    var cutoffDate = $('#cutoffDate').val();
    var delta = $('#delta').val();

    var title = "&nbsp;For&nbsp;Seller&nbsp;"+ownerId+"&nbsp;On&nbsp;"+cutoffDate+"&nbsp;, Total amount: "+delta;

    var queryParam = 'ownerId='+ownerId+'&cutoffDate='+cutoffDate;

    _detailFacet = DIViewer.DetailFacet({
        targetElement: $('#table_detail'),
        queryURL: '/views/dataintegrity/data/acctbalance/showTxDeltaDetail?',
        //exportURL: '/views/dataintegrity/data/acctbalance/reconmatrix/export?',
        exportURL:'',
        columnDefs: [
            {
                targets: [0,1],
                createdCell: function (td, cellData, rowData, row, col) {
                    var rowspan = rowData[10];
                    if (rowspan == 0) {
                        $(td).remove();
                    }
                    if (rowspan > 1) {
                        $(td).attr('rowspan', rowspan);
                    }
                    if(col===1) {
                        var refId = rowData[1].split("datachain-")[1];
                        var detailLink = '/views/dataintegrity/detail?reconId=';
                        detailLink += rowData[1] + '&reconType='+ rowData[9];
                        $(td).html('<a target="_blank" href="' + detailLink + '">' + refId + '</a>');
                    }

                }
            }
        ]
    });

    $.when(_detailFacet.search(totalCount, queryParam)).then(function(){
       var currentTitle =  $('#result_desc').html();
       $('#result_desc').html(title+currentTitle);
    });

})
