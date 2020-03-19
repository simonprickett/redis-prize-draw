window.onload = function () { 
    const prizeTextFields = document.getElementsByClassName('prize-description');

    if (prizeTextFields.length > 0) {
      prizeTextFields[0].focus();

      const prizeAddBtn = document.getElementById('prize-1-btn-add');
      const prizeRemoveBtn = document.getElementById('prize-1-btn-remove');

      prizeAddBtn.onclick = function() {
        // There must be a value in the prize description field.
        const prizeDescription = document.getElementById('prize-1-description');

        if (prizeDescription.value === '') {
          prizeDescription.focus();
          return;
        }

        prizeDescription.setAttribute('readonly', '');

        // Swap the add button for a remove button.
        prizeAddBtn.classList.add('is-hidden');
        prizeRemoveBtn.classList.remove('is-hidden');
      };

      prizeRemoveBtn.onclick = function() {
        // Swap the remove button for the add button.
        prizeRemoveBtn.classList.add('is-hidden');
        prizeAddBtn.classList.remove('is-hidden');

        const prizeDescription = document.getElementById('prize-1-description');
        prizeDescription.value = '';
        prizeDescription.removeAttribute('readonly');

        // TODO - handle case where this is the first button as they can't remove 
        //        the first text field!
      };
    }

    const openDrawBtn = document.getElementById('open-draw-btn');

    if (openDrawBtn) {
      openDrawBtn.onclick = function() {
        // TODO really open the draw!
        alert('Open Draw clicked!');
      };
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