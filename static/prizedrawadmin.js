window.onload = function () { 
    const prizeTextFields = document.getElementsByClassName('prize-description');

    const keyPressed = function (e) {
      if (e.keyCode === 13) {
        // Add the prize!
        const btnNumber = this.id.split('-')[1];
        document.getElementById(`prize-${btnNumber}-btn-add`).click();
      }
    };

    const addBtnClicked = function (e) {
      const btnNumber = this.id.split('-')[1];

      // There must be a value in the prize description field.
      const prizeDescription = document.getElementById(`prize-${btnNumber}-description`);

      if (prizeDescription.value === '') {
        prizeDescription.focus();
        return;
      }

      prizeDescription.setAttribute('readonly', '');

      // Swap the add button for a remove button.
      this.classList.add('is-hidden');
      document.getElementById(`prize-${btnNumber}-btn-remove`).classList.remove('is-hidden');

      const nextNumber = 1 + parseInt(btnNumber, 10);

      // Add another prize field.
      const newPrizeTemplate = `
        <div class="field-label is-normal">
          <label class="label">Prize</label>
        </div>
        <div class="field-body">
          <div class="field">
            <p class="control has-icons-left">
            <input id="prize-${nextNumber}-description" class="input prize-description" type="text" placeholder="Prize description...">
            <span class="icon is-small is-left">
              <i class="fas fa-gift"></i>
            </span>
            </p>
          </div>
          <div class="field">
            <div class="control">
              <button id="prize-${nextNumber}-btn-add" class="button is-primary">
                <span class="icon">
                  <i class="fas fa-plus-circle"></i>
                </span>
              </button>
              <button id="prize-${nextNumber}-btn-remove" class="is-hidden button is-danger">
                <span class="icon">
                  <i class="fas fa-minus-circle"></i>
                </span>
              </button>
            </div>  
          </div>
        </div>`;

        const prizes = document.getElementById('prizes');
        const newPrize = document.createElement('div');

        newPrize.className = 'field is-horizontal';
        newPrize.innerHTML = newPrizeTemplate;

        prizes.appendChild(newPrize);

        document.getElementById(`prize-${nextNumber}-btn-add`).onclick = addBtnClicked;
        document.getElementById(`prize-${nextNumber}-btn-remove`).onclick = removeBtnClicked;

        const newPrizeDescription = document.getElementById(`prize-${nextNumber}-description`);
        newPrizeDescription.onkeypress = keyPressed;
        newPrizeDescription.focus();
    };

    const removeBtnClicked = function (e) {
      const btnNumber = this.id.split('-')[1];
      
      // Swap the remove button for the add button.
      this.classList.add('is-hidden');
      document.getElementById(`prize-${btnNumber}-btn-add`).classList.remove('is-hidden');

      const prizeDescription = document.getElementById(`prize-${btnNumber}-description`);
      prizeDescription.value = '';
      prizeDescription.removeAttribute('readonly');

      // TODO - handle case where this is the first button as they can't remove 
      //        the first text field!
    };

    if (prizeTextFields.length > 0) {
      prizeTextFields[0].focus();

      document.getElementById('prize-1-btn-add').onclick = addBtnClicked;
      document.getElementById('prize-1-btn-remove').onclick = removeBtnClicked;
      document.getElementById('prize-1-description').onkeypress = keyPressed;
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