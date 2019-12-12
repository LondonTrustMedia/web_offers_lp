$(document).ready(function () {
    var headerH = $("header").height();
    window.addEventListener('scroll', function (e) {
    
        if (($(this).scrollTop()) > headerH) {
            $("#navbar-main").addClass("navbar-move");
            // $("#coupon").addClass("coupon-move");
        } else {
            $("#navbar-main").removeClass("navbar-move");
            // $("#coupon").removeClass("coupon-move");
        }
    });
})