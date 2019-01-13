// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DataIntegrity Common Viwer Library                                 │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ #1, DetailFacet componment created by Danny She on 2018-08-18      │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
(function() {
    var $, DIViewer,
        __slice = [].slice,
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
        __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };


    goToBottom = function () {
        $('html, body').animate({
            scrollTop: $("#bottom_div").offset().top
        }, 1000);
    },navigateToTable = function () {
        $('html, body').animate({
            scrollTop: $("#search_section").offset().top
        }, 1000);
    },initTooltip = function() {
        //tooltip for div cell in tables
        $(function() {
            $('div[title]').tipsy({fade: true, gravity: 'n'});
            $('td[title]').tipsy({fade: true, gravity: 'n'});
            $('li[title]').tipsy({fade: true, gravity: 'n'});
        });
    },redrawRowSpanCells = function() {
        $("td[class^='rowspan_']").each(function( index ) {
            var className = $( this ).attr('class');
            var rowspan = className.split('_')[1];
            if(rowspan==0){
                $(this).remove();
            }
            if(rowspan>1){
                $(this).attr("rowspan",rowspan);
            }
        });
    };

    DIViewer = window.DIViewer = {};

    $ = jQuery;

    //option List of DetailFacet
    //param #1 - targetElement
    //param #2 - columnDefs
    //param #3 - queryURL
    //param #4 - queryByIdURL
    //param #5 - exportURL
    DIViewer.DetailFacet = (function() {

        var _dataTable;
        //pagination info
        var _pagination = {
            startIndex: 1,
            endIndex: -1,
            pageSize: 100, //fixed value
            totalCount: -1,
            hasMore: false,
            pageNumber:0,
            tableData:[],
            cursor: ''
        };
        // datatable parameters
        var _datatable_param = {
            flow: '',
            selectPeriod: '',
            isProcessingSelected: '0',
            isVerifiedSelected: '0',
            isDatabreakSelected: '0',
        };
        var _queryURL;
        var _queryByIdURL;
        var _exportURL;

        var datatableConfig;

        var _queryParam;
        var _responsiveHelper= undefined;
        var _breakpointDefinition = {
            tablet : 1024,
            phone : 480
        };

        var _isLoading = false;

        var _scrollableHeaders = [];
        var _visibleHeaderIndexStart = 0;
        var _visibleHeaderIndexEnd = 2;
        var _redrawTableBeforeScroll = false;

        function DetailFacet(option) {
            if (!(this instanceof DIViewer.DetailFacet)) {
                return new DIViewer.DetailFacet(option);
            }

            //set more variable to table
            if(option.exportURL && !!option.exportURL){
                window.dataTableOptions = {
                    showExportButton:true
                };
            }else{
                window.dataTableOptions = {
                    showExportButton:false
                };
            }

            if(option.ordering == undefined){
                option.ordering = true;//default
            }

            var defaults = {
                sDom: "<'dt-toolbar'<'col-sm-12 col-xs-12 hidden-xs'C>r>"+ "t"+ "<'dt-toolbar-footer'>",
                autoWidth : true,
                preDrawCallback : function() {
                    //Initialize the responsive datatables helper once.
                    if (!_responsiveHelper) {
                        _responsiveHelper = new ResponsiveDatatablesHelper(option.targetElement, _breakpointDefinition);
                    }
                },
                rowCallback : function(nRow) {
                    _responsiveHelper.createExpandIcon(nRow);
                },
                drawCallback : function(oSettings) {
                    _responsiveHelper.respond();
                },
                paging: false,
                columnDefs: option.columnDefs,
                ordering: option.ordering,
                fixedHeader: {
                    header: true
                },
                language: {
                    emptyTable: 'No data available'
                }
            };

            // if(!_.isNil(option.extraConfig)) {
            //     datatableConfig  = jQuery.extend({}, defaults, option.extraConfig);
            // } else {
                datatableConfig  = jQuery.extend({}, defaults);
            // }

            _dataTable = option.targetElement.dataTable(datatableConfig);

            _queryURL = option.queryURL;
            _exportURL = option.exportURL;
            _queryByIdURL = option.queryByIdURL;
            _scrollableHeaders = option.scrollableHeaders;
            _visibleHeaderIndexStart = option.visibleHeaderIndexStart;
            _visibleHeaderIndexEnd = option.visibleHeaderIndexEnd;
            _redrawTableBeforeScroll = option.redrawTableBeforeScroll;

            // if(!_.isNil(option.pageSize)) {
            //     _pagination.pageSize = option.pageSize;
            // }


            this.initHeader();
        }

        DetailFacet.prototype.search = function(totalCount, queryParam) {
            _queryParam = queryParam;

            _pagination.totalCount = totalCount;
            _pagination.pageNumber = 0;
            _pagination.hasMore = _pagination.totalCount > _pagination.pageSize;//init
            _pagination.endIndex = _pagination.hasMore ? _pagination.pageSize : _pagination.totalCount;
            _pagination.tableData = [];
            _pagination.cursor = '';//clear cursor as it's a new search


            return this.loadDataWithPaging(false);//not append, clear and replace
        };

        DetailFacet.prototype.loadDataWithPaging = function(isAppendMode) {
            var url = _queryURL + _queryParam + '&pageSize=' + _pagination.pageSize;
            if(typeof _pagination.cursor === "undefined"){
                _pagination.cursor = '';
            }
            var postbody = '{"cursor":"' + _pagination.cursor + '"}';
            var that = this;

            if(!_isLoading){//avoid double click
                _isLoading = true;
                return $.ajax({
                    url: url,
                    type: "POST",
                    data: postbody,
                    timeout:120*000,
                    contentType: "application/json; charset=utf-8",
                    success: function (result, textStatus, jqXHR) {
                        _isLoading = false;
                        if(isAppendMode){
                            that.appendDataTable(result);
                        }else{
                            that.renderDataTable(result);
                        }
                        redrawRowSpanCells();
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        _isLoading = false;
                        $.SmartMessageBox({
                            title : "Connection Failed",
                            content : "</br>URL:" + url + "</br>Status:"+textStatus + "</br>Root Cause:" + errorThrown+"</br></br>Please contact DL-eBay-PPX-Galaxy@ebay.com if you always get this erorr.",
                            buttons : '[OK]'
                        });
                    },
                    complete: function (jqXHR, textStatus, errorThrown) {
                        console.log('complete executed');
                        $('#more_button_div').attr("disabled", false);
                    }
                });
            }else{
                console.log('Previous request is still loading...');
            }
        };

        DetailFacet.prototype.renderDataTable = function(dataResult) {
            var data = dataResult;
            $('#result_desc').html('(Records: ' + 0 + '/' + data.length + ')');

            Array.prototype.push.apply(_pagination.tableData, data); // add all entries in data

            this.redrawDataTable();
        };

        DetailFacet.prototype.appendDataTable = function(dataResult) {
            var appendData = dataResult.recondata;
            _pagination.cursor = dataResult.cursor;

            $('#result_desc').html('(Records: ' + _pagination.endIndex + '/' + _pagination.totalCount + ')');

            if(_dataTable){
                if(appendData.length > 0){
                    appendData.forEach(function (item){
                        _dataTable.api().row.add(item);
                    });
                    _dataTable.api().draw(false);

                    //pagination information
                    $('#count_start').html(_pagination.startIndex);
                    $('#count_end').html(_pagination.endIndex);
                    $('#count_total').html(_pagination.totalCount);
                    var pagination_info = $('#pagination_info_div').html();
                    if(_pagination.hasMore) {
                        var more_button = $('#more_button_div').html();
                        $("div.dt-toolbar-footer").html(pagination_info + more_button);
                    }else if(_pagination.totalCount>1){
                        var back_to_top = $('#back_to_top_div').html();
                        $("div.dt-toolbar-footer").html(pagination_info + back_to_top);
                    }else{
                        $("div.dt-toolbar-footer").html(pagination_info);
                    }
                }
                initTooltip();

                // if(_pagination.pageNumber>0){
                //     goToBottom();
                // }else{
                //     navigateToTable();
                // }
            }
        };

        DetailFacet.prototype.redrawDataTable = function() {
            if(_dataTable){
                _dataTable._fnClearTable();
                if(_pagination.tableData.length > 0){
                    _dataTable.fnAddData(_pagination.tableData);

                    //pagination information
                    $('#count_start').html(_pagination.startIndex);
                    $('#count_end').html(_pagination.endIndex);
                    $('#count_total').html(_pagination.totalCount);
                    var pagination_info = $('#pagination_info_div').html();
                    if(_pagination.hasMore) {
                        var more_button = $('#more_button_div').html();
                        $("div.dt-toolbar-footer").html(pagination_info + more_button);
                    }else if(_pagination.totalCount>1){
                        var back_to_top = $('#back_to_top_div').html();
                        $("div.dt-toolbar-footer").html(pagination_info + back_to_top);
                    }else{
                        $("div.dt-toolbar-footer").html(pagination_info);
                    }
                }
                _dataTable._fnReDraw();
                initTooltip();

                // if(_pagination.pageNumber>0){
                //     goToBottom();
                // }else{
                //     navigateToTable();
                // }
            }
        };

        DetailFacet.prototype.redrawDataTableForResetHeader = function() {
            if(_dataTable){
                _dataTable._fnClearTable();
                if(_pagination.tableData.length > 0){
                    _dataTable.fnAddData(_pagination.tableData);

                    //pagination information
                    $('#count_start').html(_pagination.startIndex);
                    $('#count_end').html(_pagination.endIndex);
                    $('#count_total').html(_pagination.totalCount);
                    var pagination_info = $('#pagination_info_div').html();
                    if(_pagination.hasMore) {
                        var more_button = $('#more_button_div').html();
                        $("div.dt-toolbar-footer").html(pagination_info + more_button);
                    }else if(_pagination.totalCount>1){
                        var back_to_top = $('#back_to_top_div').html();
                        $("div.dt-toolbar-footer").html(pagination_info + back_to_top);
                    }else{
                        $("div.dt-toolbar-footer").html(pagination_info);
                    }
                }
                _dataTable._fnReDraw();
                initTooltip();
            }
        };

        DetailFacet.prototype.getNextPage = function getNextPage() {
            if($("#more_button_div").is('[disabled]')) {
                console.log("Previous query not completed, return");
            } else {
                $('#more_button_div').attr("disabled", true);
                _pagination.pageNumber++;
                _pagination.hasMore = _pagination.totalCount > _pagination.pageSize * (_pagination.pageNumber+1);
                _pagination.endIndex = _pagination.hasMore ? _pagination.pageSize * (_pagination.pageNumber+1) : _pagination.totalCount;
                this.loadDataWithPaging(true);
            }
        }

        DetailFacet.prototype.searchById = function(id) {
            //reset pageination
            _pagination.totalCount = 0;
            _pagination.pageNumber = 0;
            _pagination.hasMore = false;//init
            _pagination.endIndex = 0;
            _pagination.tableData = [];
            _pagination.cursor = '';
            var that = this;

            if(!_isLoading) {//avoid double click
                _isLoading = true;
                if (id) {
                    var url = _queryByIdURL + id;
                    $.ajax({
                        url: url,
                        type: "GET",
                        timeout:120*000,
                        contentType: "application/json; charset=utf-8",
                        success: function (data, textStatus, jqXHR) {
                            _isLoading = false;
                            _pagination.endIndex = data.recondata.length;
                            _pagination.totalCount = data.recondata.length;
                            that.renderDataTable(data);
                            redrawRowSpanCells();
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            _isLoading = false;
                            $.SmartMessageBox({
                                title : "Connection Failed",
                                content : "</br>URL:" + url + "</br>Status:"+textStatus + "</br>Root Cause:" + errorThrown+"</br></br>Please contact DL-eBay-PPX-Galaxy@ebay.com if you always get this erorr.",
                                buttons : '[OK]'
                            });
                        },
                        complete: function (jqXHR, textStatus, errorThrown) {
                            console.log('complete executed');
                            $('#more_button_div').attr("disabled", false);
                        }
                    });
                }
            }else{
                console.log('Previous request is still loading...');
            }
        };

        DetailFacet.prototype.export = function(){
            if(_queryParam){
                var url = _exportURL + _queryParam;
                //open in in new page
                window.open(url, '_blank');
            }
        };

        DetailFacet.prototype.drawMoveLeftButton = function(thid){
            var text =$('#'+thid).html();
            text = '<table width="100%">\n' +
                '    <tr>\n' +
                '        <td width="5%"><span class="glyphicon glyphicon-chevron-left cursor-pointer" onclick="_detailFacet.scrollToLeft();"></span></td>\n' +
                '        <td width="95%">'+text+'</td>\n' +
                '    </tr>\n' +
                '</table>';
            $('#'+thid).html(text);
        }

        DetailFacet.prototype.drawMoveRightButton = function(thid){
            var text =$('#'+thid).html();
            text = '<table width="100%">\n' +
                '    <tr>\n' +
                '        <td width="95%">'+text+'</td>\n' +
                '        <td width="5%"><span class="glyphicon glyphicon-chevron-right cursor-pointer" onclick="_detailFacet.scrollToRight();"></span></td>\n' +
                '    </tr>\n' +
                '</table>';
            $('#'+thid).html(text);
        }

        DetailFacet.prototype.scrollToLeft = function(){
            if(_visibleHeaderIndexStart>0){
                _visibleHeaderIndexStart--;
                _visibleHeaderIndexEnd--;
                this.resetHeader();
            }
        };

        DetailFacet.prototype.scrollToRight = function(){
            if(_visibleHeaderIndexEnd<_scrollableHeaders.length-1){
                _visibleHeaderIndexStart++;
                _visibleHeaderIndexEnd++;
                this.resetHeader();
            }
        };

        DetailFacet.prototype.scrollToHere = function(specifiedIndex){
            var visibleScope = _visibleHeaderIndexEnd - _visibleHeaderIndexStart;
            if(specifiedIndex>(_scrollableHeaders.length/2)){
                _visibleHeaderIndexEnd = specifiedIndex;
                _visibleHeaderIndexStart = _visibleHeaderIndexEnd - visibleScope;
            }else{
                _visibleHeaderIndexStart = specifiedIndex;
                _visibleHeaderIndexEnd = visibleScope + _visibleHeaderIndexStart;
            }

            if(_visibleHeaderIndexEnd<_scrollableHeaders.length && _visibleHeaderIndexStart>=0){
                this.resetHeader();
            }
        };

        DetailFacet.prototype.clearTable = function(){
            //reset pageination
            _pagination.tableData = [];
            _pagination.cursor = '';

            //clear table content
            _dataTable._fnClearTable();

            //pagination information
            $('#count_start').html(0);
            $('#count_end').html(0);
            $('#count_total').html(0);
            var pagination_info = $('#pagination_info_div').html();
            $("div.dt-toolbar-footer").html(pagination_info);
            $('#result_desc').html('(Records: 0/0)');

            _dataTable._fnReDraw();
        }

        DetailFacet.prototype.initHeader = function(){
            if(_scrollableHeaders){
                _scrollableHeaders.forEach(function (sHeader){
                    sHeader.text = $('#'+sHeader.id).html();
                });
                this.resetHeader();
            }
        }

        DetailFacet.prototype.resetHeader = function () {
            if(_scrollableHeaders){
                if(_redrawTableBeforeScroll){
                    this.redrawDataTableForResetHeader();
                }

                var that = this;
                _scrollableHeaders.forEach(function (sHeader){
                    if(sHeader.index<_visibleHeaderIndexStart || sHeader.index>_visibleHeaderIndexEnd){
                        sHeader.columns.forEach(function (i) {
                            _dataTable.api().column(i).visible(false);
                        });
                        $('#'+sHeader.indicator).removeClass();
                        $('#'+sHeader.indicator).bind('click', function () {
                            that.scrollToHere(sHeader.index);
                        });
                    }else{
                        sHeader.columns.forEach(function (i) {
                            _dataTable.api().column(i).visible(true);
                        });
                        $('#'+sHeader.indicator).removeClass();
                        $('#'+sHeader.indicator).addClass('active');
                        $('#'+sHeader.indicator).unbind('click');
                    }
                    //clear buton
                    $('#'+sHeader.id).html(sHeader.text);
                    //draw button
                    if(sHeader.index===_visibleHeaderIndexStart && _visibleHeaderIndexStart!=0){
                        that.drawMoveLeftButton(sHeader.id);
                    }
                    if(sHeader.index===_visibleHeaderIndexEnd && _visibleHeaderIndexEnd!=_scrollableHeaders.length-1){
                        that.drawMoveRightButton(sHeader.id);
                    }

                });

                redrawRowSpanCells();
            }
        };

        return DetailFacet;

    })();

}).call(this);
