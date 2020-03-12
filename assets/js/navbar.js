$(document).ready(function () {
    window.addEventListener('scroll', function (e) {
    
        if (($(this).scrollTop()) > 50) {
            $("#navbar-main").addClass("navbar-move");
            // $("#coupon").addClass("coupon-move");
        } else {
            $("#navbar-main").removeClass("navbar-move");
            // $("#coupon").removeClass("coupon-move");
        }
    });
})