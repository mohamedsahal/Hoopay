#!/usr/bin/env node

/**
 * API Diagnostic Script
 * This script helps diagnose API connectivity issues
 */

const https = require('https');
const http = require('http');

const API_URLS = [
  'https://hoopaywallet.com/api/v1',
  'https://hoopaywallet.com/api',
  'https://hoopaywallet.com',
  'https://api.hoopaywallet.com',
  'http://hoopaywallet.com/api/v1',
];

// Test a single URL
function testUrl(urlString) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${urlString}`);
    
    try {
      const url = new URL(urlString);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: {
          'User-Agent': 'Hoopay-API-Test/1.0',
          'Accept': 'application/json',
        },
        timeout: 10000,
      };

      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
          console.log(`   Headers: ${JSON.stringify(res.headers['content-type'])}`);
          
          // Try to parse first 200 chars of response
          const preview = data.substring(0, 200);
          console.log(`   Response preview: ${preview}${data.length > 200 ? '...' : ''}`);
          
          resolve({
            url: urlString,
            status: res.statusCode,
            headers: res.headers,
            data: data.substring(0, 500),
          });
        });
      });

      req.on('error', (error) => {
        console.log(`   ❌ Error: ${error.message}`);
        resolve({
          url: urlString,
          error: error.message,
        });
      });

      req.on('timeout', () => {
        console.log(`   ❌ Request timed out`);
        req.destroy();
        resolve({
          url: urlString,
          error: 'Request timed out',
        });
      });

      req.end();
    } catch (error) {
      console.log(`   ❌ Invalid URL: ${error.message}`);
      resolve({
        url: urlString,
        error: error.message,
      });
    }
  });
}

// Test specific endpoints
async function testEndpoints(baseUrl) {
  const endpoints = [
    '/login',
    '/user',
    '/master/system-status',
    '/app/config',
  ];

  console.log(`\n📍 Testing endpoints for: ${baseUrl}`);
  
  for (const endpoint of endpoints) {
    const fullUrl = baseUrl + endpoint;
    await testUrl(fullUrl);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🔧 Hoopay API Diagnostics');
  console.log('========================');
  console.log('Testing various API URLs to find the correct endpoint...\n');

  // Test base URLs
  for (const url of API_URLS) {
    await testUrl(url);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test if the main website is accessible
  console.log('\n🌐 Testing main website...');
  await testUrl('https://hoopaywallet.com');

  // Additional diagnostics
  console.log('\n📊 Summary');
  console.log('==========');
  console.log('If all URLs return 404 or connection errors, possible issues:');
  console.log('1. The API server might be down');
  console.log('2. The domain might have changed');
  console.log('3. The API might require specific authentication headers');
  console.log('4. There might be IP-based restrictions');
  console.log('5. The documentation might be outdated');
  
  console.log('\n💡 Recommendations:');
  console.log('1. Check if https://hoopaywallet.com is accessible in a browser');
  console.log('2. Contact the API provider for current endpoint information');
  console.log('3. Check for any API status page or developer portal');
  console.log('4. Verify if you need API keys or special headers');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 