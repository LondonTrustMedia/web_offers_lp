
// counter

function counterTo() {
    $('.show_in_position h1').each(function() {
      var $this = $(this),
          countTo =  $this.attr('data-count');
      $({ countNum: 0}).animate({
        countNum: countTo
      },
      {
        duration: 1500,
        easing:'linear',
        step: function() {
          $this.text(Math.floor(this.countNum));
        },
        complete: function() {
          $this.text(countTo);
        }
      });  
    });
  }
  
    var inView = false
    $(window).scroll(function() {
      var counterTop = $('.show_in_position').offset().top,
          counterBottom = $('.show_in_position').offset().top + $('.show_in_position').outerHeight(),
          scrollTop = $(this).scrollTop();
          scrollBottom = $(this).scrollTop() + window.innerHeight;
  
      if (scrollBottom < counterTop || scrollTop > counterBottom) {
        inView = false
      } else if (!inView){
        inView = true
        counterTo()
      }
   });
    // -------------------------------------------------------------------------------------------
    