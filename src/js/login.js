document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const voterId = document.getElementById('voter-id').value;
    const password = document.getElementById('password').value;

    if (!voterId || !password) {
      window.dispatchEvent(new Event('login-error'));
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/login?voter_id=${voterId}&password=${password}`, {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${voterId}`,
        }
      });

      if (!response.ok) {
        window.dispatchEvent(new Event('login-error'));
        return;
      }

      const data = await response.json();
      const token = data.token;

      localStorage.setItem('token', token);

      if (data.role === 'admin') {
        window.location.href = '/admin.html?Authorization=Bearer ' + token;
      } else {
        window.location.href = '/index.html?Authorization=Bearer ' + token;
      }
    } catch (error) {
      console.error('Login error:', error);
      window.dispatchEvent(new Event('login-error'));
    }
  });
});
