const axios = require('axios');

async function testSlopes() {
    try {
        const response = await axios.get('http://localhost:4000/api/auth/slopes');
        console.log('Slopes Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error fetching slopes:', error.message);
    }
}

testSlopes();
