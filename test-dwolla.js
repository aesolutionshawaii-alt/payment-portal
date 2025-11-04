require('dotenv').config();
const dwolla = require('dwolla-v2');

(async () => {
  try {
    const client = new dwolla.Client({
      key: process.env.DWOLLA_KEY,
      secret: process.env.DWOLLA_SECRET,
      environment: 'sandbox',
    });

    const token = await client.auth.client();
    console.log('✅ Got token:', !!token.access_token);

    const res = await token.get('customers', { limit: 1 });
    console.log('✅ customers _links:', Object.keys(res.body?._links || {}));
  } catch (err) {
    console.error('❌ Error:', err.response?.body || err.message || err);
  }
})();
