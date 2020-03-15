window.onload = function () {
  const submitForm = document.getElementById('enter-draw');

  if (submitForm) {
    submitForm.onsubmit = async function (e) {
      e.preventDefault();

      const githubIdField = document.getElementById('github-id');
      const githubId = githubIdField.value;
      const enterResponse = await fetch(`/enter/${githubId}`);

      const enterResult = document.getElementById('enter-result');
      const enterResultText = document.getElementById('enter-result-text');
      const enterDrawForm = document.getElementById('enter-draw');
      
      switch (enterResponse.status) {
        case 200: 
          const githubProfile = await enterResponse.json();
          enterResultText.innerHTML = `Thanks ${githubProfile.name ? githubProfile.name : githubId}, you're in the draw.  Check back soon to see if you're a winner!`;
          enterResult.classList.add('is-success');
          enterResult.classList.remove('is-danger');
          enterDrawForm.classList.add('is-hidden');
          break;
        case 400:
          enterResultText.innerHTML = 'Thanks, but you\'re already entered for this draw.  Check back soon to see if you\'re a winner!';
          enterResult.classList.add('is-success');
          enterResult.classList.remove('is-danger');
          enterDrawForm.classList.add('is-hidden');
          break;
        case 403:
          enterResultText.innerHTML = 'Sorry, but the draw has now closed.';
          enterResult.classList.add('is-danger');
          enterDrawForm.classList.add('is-hidden');
          break;
        case 404:
          enterResultText.innerHTML = `We couldn't find a GitHub user with ID: "${githubId}".  Check your spelling or try another ID?`;
          enterResult.classList.add('is-danger');
          enterResult.classList.remove('is-success');
          githubIdField.value = '';
          break;
        default:
          enterResultText.innerHTML = 'Sorry, something went wrong.  Please try again later.';
          enterResult.classList.add('is-danger');
          githubIdField.value = '';
      }

      // Show result.
      enterResult.classList.remove('is-hidden');
    }
  }

  const reloadBtn = document.getElementById('reload-btn');

  if (reloadBtn) {
    reloadBtn.onclick = function() {
      window.location.reload();
    }
  }
};