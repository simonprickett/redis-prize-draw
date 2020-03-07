window.onload = function () {
  const submitBtn = document.getElementById('enter-draw');

  if (submitBtn) {
    submitBtn.onsubmit = async function (e) {
      e.preventDefault();

      const githubId = document.getElementById('github-id').value;
      const githubResponse = await fetch(`/profile/${githubId}`);
      
      if (githubResponse && githubResponse.status === 200) {
        const githubProfile = await githubResponse.json();
        console.log(githubProfile.login);
        console.log(githubProfile.name);
        console.log(githubProfile.avatar_url);
      } else {
        console.log('User does not exist!');
      }
    }
  }
};