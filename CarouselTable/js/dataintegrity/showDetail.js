var defaultContent = '<div style="text-align:center">'+'No data available'+'</div>';
var table = undefined;

$(document).ready(function() {
   showDetail();
});

function showDetail(){
    var url = '/views/dataintegrity/data/showDetail?reconId='+$('#reconId').val()+'&reconType='+$('#reconType').val();
    $.ajax({
        url: url,
        type: "GET",
        success: function (data, textStatus, jqXHR) {
            //prepare table data
            var tableData = [[defaultContent]];
            var columns = _.cloneDeep([{"title":""}]);
            if(data && data.length>0){
                columns =_.map(data[0],function (key,index) {
                    return {"title":key}
                });
                var rowData = _.cloneDeep(data);
                rowData.shift();
                tableData = _(rowData).map(function(item,index){
                    return _.map(item, function(value, i){
                        if (i == 2){
                            return '<div class="json-viewer">'+JSON.stringify(value)+'</div>';
                        } else {
                            return value;
                        }
                    });
                }).value();
            }
            var options = {
                "columnDefs": [
                    { "width": "20%", "targets": 0 },
                    { "width": "30%", "targets": 1 },
                    { "width": "50%", "targets": 2 }
                ],
                "paging":false,
                "sDom": "<'dt-toolbar'<'col-xs-12 col-sm-6'><'col-sm-6 col-xs-6 hidden-xs'>r>" +
                "t" +
                "<'dt-toolbar-footer'<'footer'><'col-sm-6 col-xs-12 hidden-xs'><'col-sm-6 col-xs-12'>>"
            };
            table = renderDataTable('table_detail',tableData,columns,table,options);
            $('.json-viewer').each(function(){
                if(this.innerHTML != null) {
                    var tmp = this.innerHTML;
                    this.innerHTML = "";
                    var options = {
                        collapsed: true,
                        withQuotes: true
                    };
                    try {
                        var jsonData = JSON.parse(tmp);
                        $(this).jsonViewer(jsonData, options);
                    } catch (e) {}

                }
            });
            table.fnAdjustColumnSizing();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert("Error: " + url + " "+ jqXHR + "/" + textStatus + "/" + errorThrown);
        }
    });
}
