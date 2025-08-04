const https = require('https');

const BOT_TOKEN = '8270513237:AAFDQKccnayiW8CiWyHLtBXjriZ8e7k4QBQ';

// Function to set webhook
function setWebhook(webhookUrl) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ url: webhookUrl });
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/setWebhook`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Function to get webhook info
function getWebhookInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getWebhookInfo`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Function to delete webhook
function deleteWebhook() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/deleteWebhook`,
      method: 'POST'
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Main function
async function main() {
  console.log('🤖 Telegram Webhook Setup Script');
  console.log('================================');
  
  try {
    // Get current webhook info
    console.log('\n📋 Current webhook status:');
    const webhookInfo = await getWebhookInfo();
    console.log(JSON.stringify(webhookInfo, null, 2));
    
    // Check if webhook URL is provided as argument
    const webhookUrl = process.argv[2];
    
    if (!webhookUrl) {
      console.log('\n❌ No webhook URL provided!');
      console.log('\n📝 Usage:');
      console.log('  node setup-telegram-webhook.js <webhook-url>');
      console.log('\n🔧 Examples:');
      console.log('  # For local development with ngrok:');
      console.log('  node setup-telegram-webhook.js https://abc123.ngrok.io/api/telegram-webhook');
      console.log('\n  # For production:');
      console.log('  node setup-telegram-webhook.js https://yourdomain.com/api/telegram-webhook');
      console.log('\n  # To delete webhook:');
      console.log('  node setup-telegram-webhook.js delete');
      return;
    }
    
    if (webhookUrl === 'delete') {
      console.log('\n🗑️  Deleting webhook...');
      const result = await deleteWebhook();
      console.log('✅ Webhook deleted:', JSON.stringify(result, null, 2));
      return;
    }
    
    // Set webhook
    console.log(`\n🔗 Setting webhook to: ${webhookUrl}`);
    const result = await setWebhook(webhookUrl);
    console.log('✅ Webhook set:', JSON.stringify(result, null, 2));
    
    // Verify webhook
    console.log('\n🔍 Verifying webhook...');
    const verifyInfo = await getWebhookInfo();
    console.log('✅ Webhook info:', JSON.stringify(verifyInfo, null, 2));
    
    console.log('\n🎉 Webhook setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Make sure your server is running');
    console.log('2. Test by sending /start to your bot');
    console.log('3. Check the logs for webhook updates');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main(); 