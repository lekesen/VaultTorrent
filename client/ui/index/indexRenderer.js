const loginButton = document.getElementById('loginBtn');
const registerButton = document.getElementById('registerBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

loginButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    window.electronAPI.clickLogin(email, password);
});

registerButton.addEventListener('click', () => {
    window.electronAPI.clickRegister();
});