// Registration form handling
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('full-name').value;
    const aadharCard = document.getElementById('aadhar-card').value;
    const epicNumber = document.getElementById('epic-number').value;
    const password = document.getElementById('password').value;
    
    // Validate inputs
    if (!fullName || !aadharCard || !epicNumber || !password) {
      alert('Please fill in all fields');
      return;
    }
    
    if (aadharCard.length !== 12 || !/^\d+$/.test(aadharCard)) {
      alert('Aadhar Card must be 12 digits');
      return;
    }
    
    try {
      // Send registration data to API
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          aadhar_card: aadharCard,
          epic_number: epicNumber,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Registration successful! Your Voter ID is: ${data.voter_id}`);
        window.location.href = '/'; // Redirect to login page
      } else {
        alert(`Registration failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again later.');
    }
  });
}); 