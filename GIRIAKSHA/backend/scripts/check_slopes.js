const { getSlopes } = require('../src/controllers/auth.controller');
const { getAllSlopes } = require('../src/models/queries');

async function testGetSlopes() {
    try {
        console.log('Testing getAllSlopes query...');
        const result = await getAllSlopes();
        console.log('Query Result:', result.rows);

        if (result.rows.length === 0) {
            console.log('No slopes found. This might be why the frontend is empty, but it should not error.');
        } else {
            console.log(`Found ${result.rows.length} slopes.`);
        }

    } catch (error) {
        console.error('Error testing slopes:', error);
    }
}

testGetSlopes();
