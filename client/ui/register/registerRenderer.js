const registerButton = document.getElementById('registerBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

registerButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    window.electronAPI.submitRegister(email, password);
});
