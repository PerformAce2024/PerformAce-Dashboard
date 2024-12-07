// Backend/src/tests/testAuthOptions.js

import fetch from 'node-fetch';

async function testAuth(username, password) {
    const authString = `${username}:${password}`;
    const base64Auth = Buffer.from(authString).toString('base64');
    
    console.log('\nTesting with:');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Base64:', base64Auth);

    try {
        const response = await fetch('https://api.outbrain.com/amplify/v0.1/login', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${base64Auth}`
            }
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
        
        return response.ok;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('Testing different username formats...');
    
    const testCases = [
        {
            username: 'Api@performacemedia.com',
            password: 'API@$#@!'
        },
        {
            username: 'api@performacemedia.com',
            password: 'API@$#@!'
        },
        {
            username: 'API@performacemedia.com',
            password: 'API@$#@!'
        }
    ];

    for (const testCase of testCases) {
        const success = await testAuth(testCase.username, testCase.password);
        console.log('Success:', success ? '✓' : '✗');
        console.log('-----------------');
    }
}

runTests().catch(console.error);