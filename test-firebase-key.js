// Test Firebase API Key Validity
const https = require('https');

const apiKey = 'AIzaSyCRPtDpV7gTzQN0gQKZqZTN4wjps-zgXnU';
const projectId = 'edusync-eaa2b';

console.log('🔍 Testing Firebase API Key Validity');
console.log('=====================================');
console.log(`API Key: ${apiKey.substring(0, 20)}...`);
console.log(`Project ID: ${projectId}`);
console.log();

// Test 1: Check if project exists via Firebase Hosting check
console.log('🧪 Test 1: Checking Firebase project existence...');
const hostingUrl = `https://${projectId}.web.app`;

https.get(hostingUrl, (res) => {
  console.log(`✅ Firebase Hosting accessible (${res.statusCode})`);
}).on('error', (err) => {
  console.log(`❌ Firebase Hosting not accessible: ${err.message}`);
});

// Test 2: Test API key with a simple Firebase Auth call
console.log('\n🧪 Test 2: Testing API key validity...');

const postData = JSON.stringify({
  returnSecureToken: false
});

const options = {
  hostname: 'identitytoolkit.googleapis.com',
  port: 443,
  path: `/v1/accounts:lookup?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.error) {
        console.log(`❌ API Key Error: ${response.error.message}`);
        console.log(`Error Code: ${response.error.status}`);
      } else {
        console.log('✅ API Key appears valid');
      }
    } catch (e) {
      console.log(`❌ Unexpected response: ${data}`);
    }
  });
});

req.on('error', (err) => {
  console.log(`❌ Network Error: ${err.message}`);
  console.log('This could mean:');
  console.log('- API key is invalid/revoked');
  console.log('- Firebase project is suspended');
  console.log('- Network connectivity issues');
});

req.write(postData);
req.end();

// Test 3: Check Firebase Console URL format
console.log('\n🧪 Test 3: Firebase Console URL check...');
const consoleUrl = `https://console.firebase.google.com/project/${projectId}`;
console.log(`Expected Console URL: ${consoleUrl}`);
console.log('⚠️  You should verify this URL works in your browser');

setTimeout(() => {
  console.log('\n📋 Next Steps:');
  console.log('1. Visit the Firebase Console URL above');
  console.log('2. If project doesn\'t exist, create a new one');
  console.log('3. If project exists, check Authentication settings');
  console.log('4. Regenerate API key if needed');
  console.log('5. Update .env.local with correct credentials');
}, 2000);
