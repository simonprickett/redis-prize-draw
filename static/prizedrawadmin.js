window.onload = function () { 
    // TODO...
    //
    // * Focus the prize entry text field if present.
    // * Add handler for the + button next to prize entry text field if present.
    // * Add handler for Open Draw button next to prize entry text field if present.

    const prizeTextFields = document.getElementsByClassName('prize-description');

    if (prizeTextFields.length > 0) {
      prizeTextFields[0].focus();
    }
    
    const endDrawBtn = document.getElementById('end-draw-btn');
  
    if (endDrawBtn) {
      endDrawBtn.onclick = async function() {
        const response = await fetch('/enddraw', {
          method: 'POST'
        });  
  
        if (response.status === 200) {
          const pickWinnersBtn = document.getElementById('pick-winners-btn');
  
          if (pickWinnersBtn && pickWinnersBtn.classList.contains('is-danger')) {
            pickWinnersBtn.classList.remove('is-danger');
            pickWinnersBtn.classList.add('is-primary');
            document.getElementById('pick-winners-status').innerHTML = 'The prize draw has closed, it\'s time to pick the winners.';
            document.getElementById('end-draw-area').classList.add('is-hidden');
          } else {
            document.getElementById('draw-open-status').innerHTML = 'The prize draw has closed.';
            endDrawBtn.classList.add('is-hidden');
          }
        } else {
          document.getElementById('pick-winners-status').innerHTML = 'There was a problem closing the prize draw :('
        }
      }
    }
  
    const pickWinnersBtn = document.getElementById('pick-winners-btn');
  
    if (pickWinnersBtn) {
      pickWinnersBtn.onclick = async function() {
        const response = await fetch('/drawprizes', {
          method: 'POST'
        });
  
        if (response.status === 200) {
          pickWinnersBtn.classList.add('is-hidden');
  
          // Hide the end draw button if it exists.
          const endDrawArea = document.getElementById('end-draw-area')
          
          if (endDrawArea) {
            endDrawArea.classList.add('is-hidden');
          }
  
          document.getElementById('pick-winners-status').innerHTML = 'Winners have been drawn!'
        } else {
          document.getElementById('pick-winners-status').innerHTML = 'There was a problem drawing the winners :('
        }
      }
    }
  };