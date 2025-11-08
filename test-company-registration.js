const axios = require('axios');

async function testRegistration() {
  try {
    console.log('Testing company registration...');
    const response = await axios.post('http://localhost:5000/api/auth/register-company', {
      company_name: 'Test Company XYZ',
      company_email: 'testxyz@company.com',
      admin_first_name: 'John',
      admin_last_name: 'Doe',
      admin_email: 'johnxyz@company.com',
      admin_password: 'test123'
    });
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.error('ERROR:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRegistration();
