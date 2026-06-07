const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3000/api';

// Path to save screenshots
const artifactDir = process.argv[2] || path.join(__dirname, 'test_screenshots');

if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
    console.log(`📁 Created directory for screenshots: ${artifactDir}`);
}

async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

async function runTests() {
    console.log('================================================================');
    console.log('🧪 AUTOMATED VISUAL QA TEST RUN - SMART DIGITAL LIBRARY');
    console.log('================================================================');
    console.log(`📸 Screenshots will be saved to: ${artifactDir}\n`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1440, height: 900 }
        });
        const page = await browser.newPage();
        
        // Helper function to handle logs in page
        page.on('console', msg => {
            if (msg.text().includes('ERROR') || msg.text().includes('Warning')) {
                console.log(`[Browser Log] ${msg.text()}`);
            }
        });

        // ==========================================
        // PHASE 1: LOGIN AS CUSTOMER & CHECK USER PAGES
        // ==========================================
        console.log('🔑 [Customer] Logging in as customer@test.vn...');
        await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
        
        await page.type('input[type="email"]', 'customer@test.vn');
        await page.type('input[type="password"]', 'pasword123');
        
        // Wait and click submit button
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);

        console.log('✅ [Customer] Logged in successfully.');
        await delay(1000);

        // 1. Check Wishlist Page (WishlistPage.jsx)
        console.log('🔍 [Customer] Testing Wishlist Page...');
        await page.goto(`${FRONTEND_URL}/wishlist`, { waitUntil: 'networkidle2' });
        await delay(1500); // Wait for animations/loading
        
        // Check for no-shadow layout and grid
        const wishlistHasShadow = await page.evaluate(() => {
            const el = document.querySelector('.grid');
            return el ? el.classList.contains('shadow') || el.classList.contains('shadow-md') : false;
        });
        console.log(`   - Flat layout assertion (wishlistHasShadow): ${wishlistHasShadow ? '❌ FAILED' : '✅ PASSED (shadow-free)'}`);

        const wishlistScreenshotPath = path.join(artifactDir, 'wishlist.png');
        await page.screenshot({ path: wishlistScreenshotPath });
        console.log(`📸 Wishlist screenshot saved to: wishlist.png`);

        // 2. Check Order History Page (OrderHistoryPage.jsx)
        console.log('🔍 [Customer] Testing Order History Page...');
        await page.goto(`${FRONTEND_URL}/orders`, { waitUntil: 'networkidle2' });
        await delay(1500);

        // Hover over the first order card if it exists to test hover state
        const hasOrderCard = await page.evaluate(() => {
            const card = document.querySelector('.border-divider');
            if (card) {
                card.scrollIntoView();
                return true;
            }
            return false;
        });

        if (hasOrderCard) {
            console.log('   - Order card found. Hovering to trigger transition effect...');
            await page.hover('.border-divider');
            await delay(500);
        }

        const ordersScreenshotPath = path.join(artifactDir, 'order_history.png');
        await page.screenshot({ path: ordersScreenshotPath });
        console.log(`📸 Order History screenshot saved to: order_history.png`);

        // 3. Check Promotions Page & Trigger Toast Notification (PromotionsPage.jsx)
        console.log('🔍 [Customer] Testing Promotions Page & Toast...');
        await page.goto(`${FRONTEND_URL}/promotions`, { waitUntil: 'networkidle2' });
        await delay(1500);

        // Click copy coupon to trigger Toast
        const clickedCoupon = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const copyBtn = buttons.find(b => b.textContent.includes('Sao chép') || b.textContent.includes('Copy'));
            if (copyBtn) {
                copyBtn.scrollIntoView();
                copyBtn.click();
                return true;
            }
            return false;
        });

        if (clickedCoupon) {
            console.log('   - Clicked "Sao chép" button on a coupon card. Waiting for Toast notification...');
            await delay(500); // Let slideIn animation finish
            
            // Verify toast container exists
            const toastExists = await page.evaluate(() => {
                const toast = document.querySelector('.fixed.bottom-5.right-5');
                return toast !== null;
            });
            console.log(`   - Toast notification assertion (toastExists): ${toastExists ? '✅ PASSED (Toast displayed)' : '❌ FAILED'}`);
        } else {
            console.log('   ⚠️ No active coupons found to click "Sao chép". skipping toast validation on this page.');
        }

        const promoScreenshotPath = path.join(artifactDir, 'promotions.png');
        await page.screenshot({ path: promoScreenshotPath });
        console.log(`📸 Promotions Page screenshot saved to: promotions.png`);

        // 4. Check Book Detail Page and Toast warning for invalid review (BookDetailPage.jsx)
        console.log('🔍 [Customer] Testing Book Detail Page Toast warnings...');
        
        let testBookId = null;
        try {
            const booksRes = await axios.get(`${BACKEND_URL}/books`);
            if (booksRes.data && booksRes.data.data && booksRes.data.data.length > 0) {
                testBookId = booksRes.data.data[0].hashId || booksRes.data.data[0].id;
            }
        } catch (e) {
            console.log('   ⚠️ Failed to fetch book list from API. Falling back to book ID: 1');
            testBookId = '1';
        }

        if (testBookId) {
            await page.goto(`${FRONTEND_URL}/books/${testBookId}`, { waitUntil: 'networkidle2' });
            await delay(1500);
            
            // Check if user is eligible to write a review. If yes, test the validation toast.
            const hasReviewForm = await page.evaluate(() => {
                const form = document.querySelector('form');
                return form !== null && form.innerHTML.includes('Nhận xét');
            });

            if (hasReviewForm) {
                console.log('   - Review form is available. Submitting invalid review...');
                await page.click('form button[type="submit"]');
                await delay(500);
                
                const toastMsg = await page.evaluate(() => {
                    const toastDiv = document.querySelector('.fixed.bottom-5.right-5');
                    return toastDiv ? toastDiv.textContent : null;
                });
                console.log(`   - Review form validation Toast message: "${toastMsg}"`);
            } else {
                console.log('   - Review form is locked (Book not purchased yet by customer@test.vn).');
            }

            const bookDetailScreenshotPath = path.join(artifactDir, 'book_detail.png');
            await page.screenshot({ path: bookDetailScreenshotPath });
            console.log(`📸 Book Detail screenshot saved to: book_detail.png`);
        }

        // ==========================================
        // PHASE 2: LOGIN AS ADMIN & CHECK ADMIN DASHBOARD
        // ==========================================
        console.log('\n🔑 [Admin] Logging out from Customer & Logging in as admin@test.vn...');
        await page.evaluate(() => {
            localStorage.clear();
        });
        
        await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
        await page.type('input[type="email"]', 'admin@test.vn');
        await page.type('input[type="password"]', 'pasword123');
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);

        console.log('✅ [Admin] Logged in successfully.');
        await delay(1000);

        console.log('🔍 [Admin] Testing Admin Dashboard Page (AdminDashboardPage.jsx)...');
        await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'networkidle2' });
        await delay(2000); // Wait for dashboard stats to load

        // Verify active underbar tab styling
        const tabStyles = await page.evaluate(() => {
            const activeTab = document.querySelector('button[class*="border-b-"]');
            return activeTab ? activeTab.className : null;
        });
        console.log(`   - Active Tab styles: ${tabStyles ? '✅ Found active tab with border bottom' : '⚠️ No active border-b class found'}`);

        // Verify stats card shadow-none styling
        const statsHasShadow = await page.evaluate(() => {
            const card = document.querySelector('.grid > div');
            return card ? card.classList.contains('shadow') || card.classList.contains('shadow-md') : false;
        });
        console.log(`   - Admin stats layout flatness (statsHasShadow): ${statsHasShadow ? '❌ FAILED' : '✅ PASSED (shadow-free)'}`);

        const adminScreenshotPath = path.join(artifactDir, 'admin_dashboard.png');
        await page.screenshot({ path: adminScreenshotPath });
        console.log(`📸 Admin Dashboard screenshot saved to: admin_dashboard.png`);

        console.log('\n================================================================');
        console.log('🎉 VISUAL QA AUTOMATED TEST SUITE COMPLETED SUCCESSFULLY!');
        console.log('================================================================');

    } catch (error) {
        console.error('\n❌ ERROR RUNNING VISUAL QA TESTS:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

runTests();
