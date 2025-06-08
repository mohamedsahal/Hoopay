const axios = require('axios');

// Test the mobile Firebase login endpoint
async function testMobileFirebaseLogin() {
  try {
    // This is a sample Firebase ID token payload (for testing only)
    // In real implementation, this comes from Google Sign-In
    const sampleIdToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InNhbXBsZSJ9.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaG9vcGF5LWVmNmFlIiwiYXVkIjoiaG9vcGF5LWVmNmFlIiwiYXV0aF90aW1lIjoxNzMzNDA2NjA1LCJ1c2VyX2lkIjoidGVzdC11aWQiLCJzdWIiOiJ0ZXN0LXVpZCIsImlhdCI6MTczMzQwNjYwNSwiZXhwIjoxNzMzNDEwMjA1LCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbInRlc3QtdWlkIl0sImVtYWlsIjpbInRlc3RAZXhhbXBsZS5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn0sIm5hbWUiOiJUZXN0IFVzZXIifQ.sample-signature';
    
    console.log('Testing mobile Firebase login endpoint...');
    
    const response = await axios.post('http://localhost:8000/api/mobile/firebase-login', {
      idToken: sampleIdToken
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Mobile Firebase login test successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Mobile Firebase login test failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

// Run the test
console.log('🚀 Starting Google Auth Implementation Tests...\n');
testMobileFirebaseLogin(); 