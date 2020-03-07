window.onload = function () {
  const submitBtn = document.getElementById('enter-draw');

  if (submitBtn) {
    submitBtn.onsubmit = async function (e) {
      e.preventDefault();

      const githubId = document.getElementById('github-id').value;
      const enterResponse = await fetch(`/enter/${githubId}`);
      
      switch (enterResponse.status) {
        case 200: 
          // TODO display output...
          const githubProfile = await enterResponse.json();
          console.log(githubProfile.login);
          console.log(githubProfile.name);
          console.log(githubProfile.avatar_url);
          break;
        case 400:
          // TODO display error case...
          console.log('User has already entered the draw!');
          break;
        case 404:
          // TODO display error case...
          console.log('User does not exist!');
          break;
        default:
          console.error(`Unexpected response code from /enter: ${enterResponse.status}`);
      }
    }
  }

  const reloadBtn = document.getElementById('reload-btn');

  if (reloadBtn) {
    reloadBtn.onclick = function() {
      window.location.reload();
    }
  }
};