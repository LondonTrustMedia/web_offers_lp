
// counter

function counterTo() {
    $('.show_in_position [data-count]').each(function() {
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
 
  function activate() {
    $(".countries_flag img").addClass("active");
  }

    var inView = false
    $(window).scroll(function() {
      var counterTop = $('.show_in_position').offset().top,
          counterBottom = $('.show_in_position').offset().top + $('.show_in_position').outerHeight(),
          scrollTop = $(this).scrollTop();
          scrollBottom = $(this).scrollTop() + window.innerHeight * 0.7;
  
      if (scrollBottom < counterTop || scrollTop > counterBottom) {
        inView = false
      } else if (!inView){
        inView = true
        counterTo()
        activate()
      }
   });
    // -------------------------------------------------------------------------------------------
    