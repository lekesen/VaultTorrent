const loginButton = document.getElementById('loginBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

loginButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    window.electronAPI.clickLoginDownload(email, password);
});