var a = 10;
var b = 20;
$("header").mousemove(function(event) {
    $(".popcorn_container .big").css("transform","translate(" + event.pageX/a + "px, " + event.pageY/a + "px)")
    $(".popcorn_container .medium").css("transform","translate(" + event.pageX/b + "px, " + event.pageY/b + "px)")
    console.log("x: " + event.pageX + " y:" + event.pageY)
  });