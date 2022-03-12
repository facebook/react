// state is a primitive value, when its value is changed in showMoreImages, it is not retained outside the scope of showMoreImages

// Return the value instead

function showMoreImages(num, el, category, state){
    for (var i = 0; i < category.length; i++) {
      toggleClass('show-images', category[i]);
      toggleClass('hide-images', category[i]);
    }
      if(state) {
        updateState('shift-down', 'shift-up', image_one[num]);
        el.innerHTML='View Less';
        return false; //observe change in this line, value is returned instead of setting the same in state
      }else{
        updateState('shift-up', 'shift-down', image_one[num]);
        el.innerHTML='View More';
        return true; //observe change in this line, value is returned instead of setting the same in state
      }
  }

  // Now receive the returned value in the variable which was passed in the argument

  if (i==1) {
    var isPlacesClose=true;
    buttons[i].addEventListener('click', function(){
    //observe change in this line, isPlacesClose is updated with returned value 
      isPlacesClose = showMoreImages(0, this, places, isPlacesClose); 
    });
  }

  if (i==2) {
    var isPeopleClose=true;
    //observe change in this line, isPeopleClose is updated with returned value 
    buttons[i].addEventListener('click', function(){
      isPeopleClose = showMoreImages(1, this, people, isPeopleClose);
    });
  }

  if (i==3) {
    var isEventsClose=true;
    buttons[i].addEventListener('click', function(){
      isEventsClose = showMoreImages(2, this, events, isEventsClose);
    });
  }