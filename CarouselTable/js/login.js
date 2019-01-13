var doLogin = function(){
    $('#loginbutton').attr('disabled','disalbed');

    var cookieNameVal = $('#cookieNameValue').val();
    var forwardVal = $('#forwardValue').val();
    var environment = $('#environmentValue').val();

    $.ajax({
        type: 'POST',
        url: "/views/login?username="+$("#username").val()+"&"+$('#password').attr('name')+"="+$('#password').val(),
        success: function(data){
            if(data.indexOf("errormessage_")==0){
                $('#loginbutton').removeAttr('disabled')
                return;
            }
            var date=new Date();
            date.setTime(date.getTime() + (1 * 24 * 60 * 60 * 1000));//1 day
            if(environment==='production'){
                $.cookie(cookieNameVal,data,{expires:date, domain:'vip.ebay.com', path:'/'});
            }else if(environment==='staging'){
                if(window.location.href.indexOf('stratus') != -1){//feature
                    $.cookie(cookieNameVal,data,{expires:date, domain:'stratus.qa.ebay.com', path:'/'});
                }else{//real staging
                    $.cookie(cookieNameVal,data,{expires:date, domain:'vip.qa.ebay.com', path:'/'});
                }
            }else{
                $.cookie(cookieNameVal,data,{expires:date,path:'/'});
            }
            if(document.referrer && (document.referrer.indexOf('dataintegrity') || document.referrer.indexOf('monitoring'))){
                window.location=document.referrer;
            }else{
                window.location= 'dataintegrity/fmm_v2';//default page
            }
        },
        error: function(data){
            $("#message").text(data);
        }
    });
    return false;
};

var init = function(){
    var actionVal = $('#actionValue').val();
    var cookieNameVal = $('#cookieNameValue').val();
    var environment = $('#environmentValue').val();
    if(actionVal==='logout'){
        if(environment==='production'){
            $.cookie(cookieNameVal, '', { expires: -1, domain:'vip.ebay.com', path: '/'});
        }else if(environment==='staging'){
            if(window.location.href.indexOf('stratus') != -1){//feature
                $.cookie(cookieNameVal, '', { expires: -1, domain:'stratus.qa.ebay.com', path: '/'});
            }else{//real staging
                $.cookie(cookieNameVal, '', { expires: -1, domain:'vip.qa.ebay.com', path: '/'});
            }
        }else{
            $.cookie(cookieNameVal, '', { expires: -1, path: '/'});
        }
    }
}