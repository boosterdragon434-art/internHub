const axios = require('axios');

const run = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/internships?status=active');
    console.log('Status Code:', res.status);
    console.log('Response Success:', res.data.success);
    console.log('Data count:', res.data.data.length);
    console.log('Data:', JSON.stringify(res.data.data, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('API Test Error:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    process.exit(1);
  }
};

run();
