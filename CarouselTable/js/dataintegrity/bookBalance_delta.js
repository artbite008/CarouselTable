var currentDate = undefined;

/*
 * Run morris chart on this page
 */
$(document).ready(function() {
    // DO NOT REMOVE : GLOBAL FUNCTIONS!
    pageSetUp();

    $('#queryDate').val($('#defaultCutOffDate').val());

    $('[data-toggle="tooltip"]').tooltip();

    _detailFacet = DIViewer.DetailFacet({
        targetElement: $('#datatable_reconmatrix'),
        pageSize: 100,
        queryURL: '',
        queryByIdURL: '/views/dataintegrity/data/bookbalancedelta/reconmatrix/',
        exportURL: '',
        ordering: false,
        columnDefs: [
            {
                targets: [0,1,2,3],
                orderable: false
            }
        ]
    });


    $("#queryDate").datepicker({
        defaultDate: "0",
        changeMonth: true,
        numberOfMonths: 1,
        maxDate: "+0D",
        prevText: '<i class="fa fa-chevron-left"></i>',
        nextText: '<i class="fa fa-chevron-right"></i>',
        onClose: function (selectedDate) {
        }
    });

    searchByCutOffDate();
});

function searchByCutOffDate(){
    var queryDate = $('#queryDate').val();
    _detailFacet.searchById(moment(queryDate).format('YYYY-MM-DD'));

}
