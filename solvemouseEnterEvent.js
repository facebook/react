// window.k was returning undefined (false) value when you were hovering the box for the first time, that's why it was unable to pass the condition - the list was not appearing.
// Check codepen, open the console and hover the box. The first log will be the undefined value.

// If you hover the box for the second time, the list will appear because window.k is already set inside the mouseleave() function - it won't return undefined (false) from now on.

$(document).ready(function() {
    $('#kDropdown, .hidden-dropdown').mouseleave(function(e) {
      window.k = setTimeout(function() {
        $('.hidden-dropdown').addClass("hide_k");
      }, 250);
    }).mouseenter(function(e) {
      console.log("test")
      clearTimeout(window.k)
      $(".hidden-dropdown").removeClass("hide_k");
    });
  })

  .hide_k {
    display: none;
  }

  <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
<div id='kDropdown' style="background-color: black; height: 100px; width: 100px;"></div>

<div class="hide_k hidden-dropdown">
  <ul>
    <li>LIST</li>
    <li>THAT</li>
    <li>IS</li>
    <li>HIDDEN</li>
  </ul>
</div>


// I Think this codes help you !