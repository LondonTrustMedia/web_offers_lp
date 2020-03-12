$(function() {
   
    const elem = $(".parallax_container");
    const pra = $(".parallax");
    elem.on("mousemove", parallax);
    function parallax(e) {
        let w = window.innerWidth/2;
        let h = window.innerHeight/2;
        let _mouseX = e.clientX;
        let _mouseY = e.clientY;
        let move = `translate( ${-(_mouseX - w) * 0.004}px, ${-(_mouseY - h) * 0.004}px)`;
        pra.css("transform",move)
    }
    if($(document).innerWidth < 1200) elem.off("mousemove", parallax);
});