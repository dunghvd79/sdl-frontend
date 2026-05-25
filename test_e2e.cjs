require('E:/sdl-project/node_modules/dotenv').config({ path: 'E:/sdl-project/.env' });
const axios = require('E:/sdl-project/node_modules/axios');
const pool = require('E:/sdl-project/src/config/database');
const bcrypt = require('E:/sdl-project/node_modules/bcryptjs');

const API_URL = 'http://localhost:3000/api';

async function main() {
  console.log('=== STARTING AUTOMATED E2E VERIFICATION TESTS ===');
  
  try {
    // 1. Prepare passwords in DB for testing
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Set password for dung@gmail.com (ADMIN) and dung@test.com (CUSTOMER)
    await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'dung@gmail.com'", [hashedPassword]);
    await pool.query("UPDATE users SET password_hash = $1 WHERE email = 'dung@test.com'", [hashedPassword]);
    
    // Ensure dung@test.com is active initially
    await pool.query("UPDATE users SET is_active = true WHERE email = 'dung@test.com'");
    
    console.log('✅ Prepared user password hashes in database.');

    // 2. Login as ADMIN
    console.log('⏳ Logging in as Admin...');
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'dung@gmail.com',
      password: 'password123'
    });
    const adminToken = adminLoginRes.data.token;
    const adminId = adminLoginRes.data.user.id;
    console.log('✅ Admin login successful. Token received.');

    // 3. Login as CUSTOMER
    console.log('⏳ Logging in as Customer (dung@test.com)...');
    const customerLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'dung@test.com',
      password: 'password123'
    });
    const customerToken = customerLoginRes.data.token;
    const customerId = customerLoginRes.data.user.id;
    console.log('✅ Customer login successful. Token received.');

    // 4. Access Admin Stats API
    console.log('⏳ Testing Admin Stats API...');
    const statsRes = await axios.get(`${API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Stats API returned status:', statsRes.status);
    console.log('📊 Stats summary:', {
      revenue: statsRes.data.revenue,
      discount: statsRes.data.discount,
      totalOrders: Object.values(statsRes.data.orderStats || {}).reduce((a, b) => a + b, 0),
      totalUsers: Object.values(statsRes.data.userStats || {}).reduce((a, b) => a + b, 0)
    });

    // 5. Lock the Customer account
    console.log(`⏳ Locking Customer account (ID: ${customerId}) via Admin API...`);
    const lockRes = await axios.put(`${API_URL}/admin/users/${customerId}/status`, {
      isActive: false
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Lock response status:', lockRes.status);
    console.log('🔒 Locked user info:', lockRes.data.data || lockRes.data);

    // 6. Verify Customer login fails now
    console.log('⏳ Verifying Customer login is blocked...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: 'dung@test.com',
        password: 'password123'
      });
      console.error('❌ Error: Locked user was able to log in!');
      process.exit(1);
    } catch (err) {
      console.log('✅ Customer login was correctly blocked.');
      console.log('   Message:', err.response?.data?.error || err.message);
      if (err.response?.data?.error !== 'Tài khoản của bạn đã bị khóa bởi quản trị viên!') {
        console.error('❌ Error: Unexpected login block message');
        process.exit(1);
      }
    }

    // 7. Verify Customer requests with existing token are rejected immediately (403 Forbidden)
    console.log('⏳ Verifying immediate request rejection for existing token...');
    try {
      await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      console.error('❌ Error: Request using locked token succeeded!');
      process.exit(1);
    } catch (err) {
      console.log('✅ Request using locked token was correctly rejected.');
      console.log('   Status:', err.response?.status);
      console.log('   Message:', err.response?.data?.error || err.message);
      if (err.response?.status !== 403) {
        console.error('❌ Error: Status code is not 403 Forbidden!');
        process.exit(1);
      }
    }

    // 8. Try locking current Admin account (Self-lock protection check)
    console.log('⏳ Testing self-lock protection...');
    try {
      await axios.put(`${API_URL}/admin/users/${adminId}/status`, {
        isActive: false
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.error('❌ Error: Admin was able to self-lock!');
      process.exit(1);
    } catch (err) {
      console.log('✅ Self-lock was correctly prevented.');
      console.log('   Status:', err.response?.status);
      console.log('   Message:', err.response?.data?.error || err.message);
    }

    // 9. Unlock Customer account
    console.log(`⏳ Unlocking Customer account (ID: ${customerId}) via Admin API...`);
    const unlockRes = await axios.put(`${API_URL}/admin/users/${customerId}/status`, {
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Unlock response status:', unlockRes.status);

    // 10. Verify Customer login works again
    console.log('⏳ Verifying Customer login works after unlocking...');
    const postUnlockLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'dung@test.com',
      password: 'password123'
    });
    console.log('✅ Customer login after unlock succeeded. Token received:', !!postUnlockLoginRes.data.token);

    console.log('\n🎉 ALL E2E VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
    pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E Verification failed:', err.response?.data || err.message);
    pool.end();
    process.exit(1);
  }
}

main();
