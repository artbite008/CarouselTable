// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DataIntegrity Common Library                                       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ #1, backToTop added by Danny She on 2018-08-18                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var backToTop = function() {
    $('html, body').animate({
        scrollTop: $("#logo").offset().top
    }, 100);
}