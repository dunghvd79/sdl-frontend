# 🚀 SDL Development Phase - Chi tiết Kế hoạch

**Approach:** Option A+ (Hybrid)  
**Main Service:** Node.js E-commerce Backend  
**Learning Method:** Chi tiết từng line  
**Total Timeline:** 9 weeks (~2 months)  
**Status:** Ready to code

---

## 📊 Overview: 9 Phases

```
PHASE 1: Project Setup & Database
PHASE 2: Auth & User Management
PHASE 3: Book & Category Management
PHASE 4: Cart & Checkout (Inventory Hold)
PHASE 5: Order Management
PHASE 6: Payment Integration
PHASE 7: FastAPI AI Service (Standalone)
PHASE 8: Integration & Testing
PHASE 9: Docker Setup & Deployment

Timeline:
├─ Phases 1-3: Weeks 1-2 (Foundation)
├─ Phases 4-6: Weeks 3-4 (E-commerce Core)
├─ Phase 7: Weeks 5-6 (AI Service)
├─ Phase 8: Weeks 7-8 (Integration)
└─ Phase 9: Week 9 (DevOps)
```

---

## 🏗️ PHASE 1: Project Setup & Database (Week 1)

**Goal:** Cấu trúc project hoàn chỉnh + PostgreSQL sẵn sàng

### Deliverables:
- [ ] GitHub repository initialized
- [ ] Node.js project structure created
- [ ] PostgreSQL database configured
- [ ] Environment variables setup
- [ ] Database migrations working
- [ ] Project running locally

### Tasks:

#### **Task 1.1: Initialize Node.js Project**

**Time:** 1-2 hours

**Steps:**
```bash
# 1. Create folder
mkdir sdl-backend-nodejs
cd sdl-backend-nodejs

# 2. Initialize npm
npm init -y

# 3. Install core dependencies
npm install express dotenv cors body-parser
npm install --save-dev nodemon

# 4. Create folder structure
mkdir -p src/{controllers,services,models,routes,middleware,config,utils}
mkdir -p tests
```

**Learn:** 
- npm package.json structure
- Semantic versioning
- Dev dependencies vs production

**Reference:** https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

---

#### **Task 1.2: Setup Express Server**

**Time:** 2 hours

**File:** `src/config/app.js`

```javascript
// Basic Express app setup
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes (will add later)
app.use('/api/auth', require('../routes/auth'));
app.use('/api/books', require('../routes/books'));
// ... more routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal error' 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

**Learn:**
- Express middleware
- CORS setup
- Error handling patterns
- Environment variables

**Reference:** https://expressjs.com/

---

#### **Task 1.3: Setup PostgreSQL Connection**

**Time:** 2 hours

**File:** `src/config/database.js`

```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows[0]);
  }
});

module.exports = pool;
```

**File:** `.env.example`

```
NODE_ENV=development
PORT=3000

DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sdl_db

JWT_SECRET=your_secret_key
JWT_EXPIRY=24h
```

**Learn:**
- PostgreSQL connection pooling
- Environment variable patterns
- Error handling in DB connections

**Reference:** 
- https://node-postgres.com/
- https://www.postgresql.org/docs/

---

#### **Task 1.4: Setup Database Migrations**

**Time:** 3 hours

**Tool:** Sequelize or Raw SQL migrations

**Option 1: Using Sequelize ORM** (Easier)

```bash
npm install sequelize sequelize-cli pg pg-hstore
npx sequelize-cli init
```

**Option 2: Raw SQL Migrations** (More control)

```bash
mkdir migrations

# Create migration file: migrations/001_create_users_table.sql
```

**Recommendation:** Start with raw SQL for learning, switch to ORM later.

**File:** `migrations/001_create_users_table.sql`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'CUSTOMER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**File:** `src/utils/migrate.js` (Run migrations manually)

```javascript
const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await pool.query(sql);
      console.log(`✅ Executed ${file}`);
    } catch (err) {
      console.error(`❌ Error in ${file}:`, err.message);
    }
  }
}

runMigrations();
```

**Learn:**
- Database schema versioning
- Migration patterns
- SQL DDL execution
- Transaction handling

**Reference:** https://www.liquibase.org/ (concept)

---

#### **Task 1.5: Setup Project Structure & Package.json Scripts**

**Time:** 1 hour

**File:** `package.json`

```json
{
  "name": "sdl-backend-nodejs",
  "version": "1.0.0",
  "description": "Smart Digital Library - E-commerce Backend",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "migrate": "node src/utils/migrate.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.8.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "body-parser": "^1.20.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^2.8.0"
  }
}
```

**File:** `src/server.js`

```javascript
const app = require('./config/app');
require('./config/database');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
```

**File:** `.gitignore`

```
node_modules/
.env
.env.local
*.log
dist/
coverage/
.DS_Store
```

**Learn:**
- npm scripts
- Project folder organization
- Git version control setup

---

#### **Task 1.6: Database Connection Test & First Query**

**Time:** 1 hour

**File:** `src/utils/testDb.js`

```javascript
const pool = require('../config/database');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected at:', result.rows[0]);

    // Test users table
    const users = await pool.query('SELECT * FROM users LIMIT 1');
    console.log('✅ Users table exists:', users.rowCount, 'users');
  } catch (err) {
    console.error('❌ Database error:', err.message);
  }
}

testConnection();
```

**Run:**
```bash
npm run migrate  # Create tables
node src/utils/testDb.js  # Test connection
```

**Learn:**
- Async/await with database
- Error handling
- Query result handling

---

### Checklist Phase 1:

- [ ] GitHub repo created & cloned
- [ ] npm project initialized
- [ ] All dependencies installed
- [ ] Folder structure created
- [ ] Express server running
- [ ] .env configured
- [ ] PostgreSQL connection working
- [ ] Migrations created & executed
- [ ] First database test passed
- [ ] Can run `npm run dev` without errors

### Deliverable Files:
- ✅ `src/config/app.js` - Express setup
- ✅ `src/config/database.js` - DB connection
- ✅ `src/server.js` - Server entry point
- ✅ `.env.example` - Environment template
- ✅ `migrations/001_create_users_table.sql` - First migration
- ✅ `package.json` - Dependencies & scripts

---

## 🔐 PHASE 2: Auth & User Management (Week 1-2)

**Goal:** User registration, login, JWT tokens, authorization

### Deliverables:
- [ ] User registration endpoint
- [ ] User login endpoint
- [ ] JWT token generation & validation
- [ ] Middleware for protecting routes
- [ ] User profile retrieval
- [ ] Password hashing (bcrypt)
- [ ] Role-based access control (RBAC)
- [ ] Tests for auth flows

### Tasks:

#### **Task 2.1: Create User Model**

**Time:** 2 hours

**File:** `src/models/User.js`

```javascript
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create new user
  static async create({ email, password, fullName, role = 'CUSTOMER' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, full_name, role, created_at
    `;
    
    const result = await pool.query(query, [email, hashedPassword, fullName, role]);
    return result.rows[0];
  }

  // Find by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  // Find by ID
  static async findById(id) {
    const query = 'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user
  static async update(id, { fullName, role }) {
    const query = `
      UPDATE users 
      SET full_name = COALESCE($2, full_name),
          role = COALESCE($3, role),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, full_name, role
    `;
    
    const result = await pool.query(query, [id, fullName, role]);
    return result.rows[0];
  }
}

module.exports = User;
```

**Learn:**
- Bcrypt for password hashing
- SQL prepared statements (parameterized queries)
- Model class pattern
- Async/await with database

---

#### **Task 2.2: Create Auth Service**

**Time:** 2 hours

**File:** `src/services/authService.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Register user
  static async register({ email, password, fullName }) {
    // Validate input
    if (!email || !password || !fullName) {
      throw new Error('Missing required fields');
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create user
    const user = await User.create({ email, password, fullName });
    
    // Generate token
    const token = this.generateToken(user);
    
    return { user, token };
  }

  // Login user
  static async login({ email, password }) {
    const user = await User.findByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);
    
    return { 
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }, 
      token 
    };
  }

  // Generate JWT token
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  // Refresh token
  static async refreshToken(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    return this.generateToken(user);
  }
}

module.exports = AuthService;
```

**Learn:**
- JWT (JSON Web Tokens) concept
- Token generation & verification
- Service layer pattern
- Error handling

**Reference:** https://jwt.io/

---

#### **Task 2.3: Create Auth Middleware**

**Time:** 1.5 hours

**File:** `src/middleware/auth.js`

```javascript
const AuthService = require('../services/authService');

// Middleware: Verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = AuthService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Middleware: Check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
```

**Learn:**
- Middleware concept in Express
- Bearer token extraction
- Role-based authorization

---

#### **Task 2.4: Create Auth Controller & Routes**

**Time:** 2 hours

**File:** `src/controllers/authController.js`

```javascript
const AuthService = require('../services/authService');

class AuthController {
  // POST /api/auth/register
  static async register(req, res) {
    try {
      const { email, password, fullName } = req.body;
      
      // Validation
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await AuthService.register({ email, password, fullName });
      
      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // POST /api/auth/login
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await AuthService.login({ email, password });
      
      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }

  // POST /api/auth/refresh
  static async refreshToken(req, res) {
    try {
      const token = await AuthService.refreshToken(req.user.id);
      
      res.status(200).json({ token });
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }

  // GET /api/auth/profile
  static async getProfile(req, res) {
    try {
      // req.user populated by verifyToken middleware
      res.status(200).json({ user: req.user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = AuthController;
```

**File:** `src/routes/auth.js`

```javascript
const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.post('/refresh', verifyToken, authController.refreshToken);
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
```

**Learn:**
- Controller pattern (separation of concerns)
- Request validation
- HTTP status codes
- Route definition

---

#### **Task 2.5: Create Auth Tests**

**Time:** 2 hours

**File:** `tests/auth.test.js`

```javascript
// Example test structure (using Jest)

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Test: Register new user
      // Assert: User created, token returned
    });

    it('should reject duplicate email', async () => {
      // Test: Register with same email twice
      // Assert: Second request fails
    });

    it('should reject missing fields', async () => {
      // Test: Register without email
      // Assert: 400 error returned
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      // Test: Login with valid email/password
      // Assert: Token returned
    });

    it('should reject wrong password', async () => {
      // Test: Login with wrong password
      // Assert: 401 error
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      // Test: GET profile with token
      // Assert: User data returned
    });

    it('should reject without token', async () => {
      // Test: GET profile without token
      // Assert: 401 error
    });
  });
});
```

**Learn:**
- Unit testing concepts
- Test-driven development (TDD)
- Jest framework

---

### Checklist Phase 2:

- [ ] User model created with all CRUD methods
- [ ] Password hashing working (bcrypt)
- [ ] AuthService implemented
- [ ] JWT token generation & verification working
- [ ] Auth middleware created
- [ ] Register endpoint working
- [ ] Login endpoint working
- [ ] Profile endpoint protected
- [ ] Role-based access control working
- [ ] Tests passing
- [ ] Error handling complete

### Deliverable Files:
- ✅ `src/models/User.js`
- ✅ `src/services/authService.js`
- ✅ `src/middleware/auth.js`
- ✅ `src/controllers/authController.js`
- ✅ `src/routes/auth.js`
- ✅ `tests/auth.test.js`

### Test Commands:
```bash
npm run dev  # Start server
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","fullName":"John Doe"}'
```

---

## 📚 PHASE 3: Book & Category Management (Week 2)

**Goal:** CRUD operations for Books & Categories

### Tasks:

#### **Task 3.1: Create Book Model**

**File:** `src/models/Book.js`

```javascript
const pool = require('../config/database');

class Book {
  // Create book
  static async create(bookData) {
    const { title, author, isbn, description, price, pdfUrl, epubUrl, coverId } = bookData;
    
    const query = `
      INSERT INTO books (title, author, isbn, description, price, pdf_url, epub_url, cover_image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      title, author, isbn, description, price, pdfUrl, epubUrl, coverId
    ]);
    
    return result.rows[0];
  }

  // Get all books with pagination
  static async getAll({ page = 1, limit = 10, search = '', categoryId = null }) {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT b.*, array_agg(c.id) as category_ids
      FROM books b
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (b.title ILIKE $${params.length} OR b.author ILIKE $${params.length})`;
    }
    
    if (categoryId) {
      params.push(categoryId);
      query += ` AND bc.category_id = $${params.length}`;
    }
    
    query += ` GROUP BY b.id ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get book by ID
  static async findById(id) {
    const query = `
      SELECT b.*, array_agg(json_build_object('id', c.id, 'name', c.name)) as categories
      FROM books b
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.id
      WHERE b.id = $1
      GROUP BY b.id
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Update book
  static async update(id, bookData) {
    const { title, author, price, description } = bookData;
    
    const query = `
      UPDATE books
      SET title = COALESCE($2, title),
          author = COALESCE($3, author),
          price = COALESCE($4, price),
          description = COALESCE($5, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, title, author, price, description]);
    return result.rows[0];
  }

  // Delete book
  static async delete(id) {
    const query = 'DELETE FROM books WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Add category to book (N:M)
  static async addCategory(bookId, categoryId) {
    const query = `
      INSERT INTO book_categories (book_id, category_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    
    const result = await pool.query(query, [bookId, categoryId]);
    return result.rows[0];
  }

  // Remove category from book
  static async removeCategory(bookId, categoryId) {
    const query = 'DELETE FROM book_categories WHERE book_id = $1 AND category_id = $2';
    await pool.query(query, [bookId, categoryId]);
  }
}

module.exports = Book;
```

**Learn:**
- Complex SQL queries (JOINs)
- Pagination
- Aggregate functions (array_agg)
- N:M relationship handling

---

#### **Task 3.2: Create Category Model**

**File:** `src/models/Category.js`

```javascript
const pool = require('../config/database');

class Category {
  static async create({ name, slug, description }) {
    const query = `
      INSERT INTO categories (name, slug, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, slug, description]);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT * FROM categories ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async update(id, { name, description }) {
    const query = `
      UPDATE categories
      SET name = COALESCE($2, name),
          description = COALESCE($3, description)
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [id, name, description]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM categories WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Category;
```

---

#### **Task 3.3: Create Book Service**

**File:** `src/services/bookService.js`

```javascript
const Book = require('../models/Book');
const Category = require('../models/Category');

class BookService {
  static async createBook(bookData, categories = []) {
    // Create book
    const book = await Book.create(bookData);

    // Add categories
    for (const categoryId of categories) {
      await Book.addCategory(book.id, categoryId);
    }

    return book;
  }

  static async getBooks(filters) {
    return Book.getAll(filters);
  }

  static async getBookDetails(bookId) {
    return Book.findById(bookId);
  }

  static async updateBook(bookId, bookData) {
    return Book.update(bookId, bookData);
  }

  static async deleteBook(bookId) {
    return Book.delete(bookId);
  }

  static async updateBookCategories(bookId, categoryIds) {
    // Get current categories
    const book = await Book.findById(bookId);
    const currentCategories = book.categories.map(c => c.id);

    // Remove categories not in new list
    for (const catId of currentCategories) {
      if (!categoryIds.includes(catId)) {
        await Book.removeCategory(bookId, catId);
      }
    }

    // Add new categories
    for (const catId of categoryIds) {
      if (!currentCategories.includes(catId)) {
        await Book.addCategory(bookId, catId);
      }
    }

    return Book.findById(bookId);
  }
}

module.exports = BookService;
```

---

#### **Task 3.4: Create Book Controller & Routes**

**File:** `src/controllers/bookController.js`

```javascript
const BookService = require('../services/bookService');

class BookController {
  // GET /api/books
  static async getAllBooks(req, res) {
    try {
      const { page = 1, limit = 10, search = '', categoryId } = req.query;
      
      const books = await BookService.getBooks({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        categoryId: categoryId ? parseInt(categoryId) : null
      });

      res.status(200).json({
        data: books,
        pagination: { page, limit, total: books.length }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // GET /api/books/:id
  static async getBook(req, res) {
    try {
      const { id } = req.params;
      
      const book = await BookService.getBookDetails(id);
      
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      res.status(200).json({ data: book });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/books (Admin/Curator only)
  static async createBook(req, res) {
    try {
      const bookData = req.body;
      const { categories = [] } = req.body;

      const book = await BookService.createBook(bookData, categories);

      res.status(201).json({
        message: 'Book created successfully',
        data: book
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // PUT /api/books/:id (Admin/Curator only)
  static async updateBook(req, res) {
    try {
      const { id } = req.params;
      const bookData = req.body;

      const book = await BookService.updateBook(id, bookData);

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      res.status(200).json({
        message: 'Book updated successfully',
        data: book
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // DELETE /api/books/:id (Admin only)
  static async deleteBook(req, res) {
    try {
      const { id } = req.params;

      const result = await BookService.deleteBook(id);

      if (!result) {
        return res.status(404).json({ error: 'Book not found' });
      }

      res.status(200).json({ message: 'Book deleted successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = BookController;
```

**File:** `src/routes/books.js`

```javascript
const express = require('express');
const bookController = require('../controllers/bookController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBook);

// Protected routes
router.post('/', verifyToken, requireRole(['ADMIN', 'CURATOR']), bookController.createBook);
router.put('/:id', verifyToken, requireRole(['ADMIN', 'CURATOR']), bookController.updateBook);
router.delete('/:id', verifyToken, requireRole(['ADMIN']), bookController.deleteBook);

module.exports = router;
```

---

#### **Task 3.5: Category Routes**

**File:** `src/routes/categories.js`

```javascript
const express = require('express');
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategory);

// Protected
router.post('/', verifyToken, requireRole(['ADMIN']), categoryController.createCategory);
router.put('/:id', verifyToken, requireRole(['ADMIN']), categoryController.updateCategory);
router.delete('/:id', verifyToken, requireRole(['ADMIN']), categoryController.deleteCategory);

module.exports = router;
```

---

### Checklist Phase 3:

- [ ] Book model with all CRUD methods
- [ ] Category model with CRUD
- [ ] N:M relationship (book_categories) working
- [ ] BookService implemented
- [ ] Book controller with all endpoints
- [ ] Category controller
- [ ] Routes registered in main app
- [ ] Pagination working
- [ ] Search functionality working
- [ ] Role-based access control working
- [ ] Tests passing

---

## 🛒 PHASE 4: Cart & Checkout with Inventory Hold (Week 3)

**Goal:** Implement cart operations with inventory management & concurrency control

### Key Concepts:
- Cart CRUD
- Inventory Hold/Release mechanism
- Prevent over-selling
- Transaction handling

### Tasks:

#### **Task 4.1: Create Inventory Model**

**File:** `src/models/Inventory.js`

```javascript
const pool = require('../config/database');

class Inventory {
  // Get inventory status
  static async getStatus(bookId) {
    const query = `
      SELECT * FROM inventory
      WHERE book_id = $1
    `;
    
    const result = await pool.query(query, [bookId]);
    return result.rows[0] || null;
  }

  // Check availability
  static async checkAvailability(bookId, quantity) {
    const inventory = await this.getStatus(bookId);
    
    if (!inventory) {
      throw new Error('Book inventory not found');
    }

    const available = inventory.available_qty - inventory.reserved_qty;
    return available >= quantity;
  }

  // Hold inventory (Reserve qty)
  static async hold(bookId, quantity) {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // Get current inventory
      const queryGet = `
        SELECT * FROM inventory 
        WHERE book_id = $1 
        FOR UPDATE  -- Lock for update
      `;
      const resultGet = await client.query(queryGet, [bookId]);
      const inventory = resultGet.rows[0];

      if (!inventory) {
        throw new Error('Book inventory not found');
      }

      // Check availability
      const available = inventory.available_qty - inventory.reserved_qty;
      if (available < quantity) {
        throw new Error(`Only ${available} copies available`);
      }

      // Reserve inventory
      const queryUpdate = `
        UPDATE inventory
        SET reserved_qty = reserved_qty + $2
        WHERE book_id = $1
        RETURNING *
      `;
      const resultUpdate = await client.query(queryUpdate, [bookId, quantity]);

      await client.query('COMMIT');
      return resultUpdate.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Release inventory (Cancel hold)
  static async release(bookId, quantity) {
    const query = `
      UPDATE inventory
      SET reserved_qty = MAX(0, reserved_qty - $2)
      WHERE book_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [bookId, quantity]);
    return result.rows[0];
  }

  // Confirm sale (Move from reserved to sold)
  static async confirmSale(bookId, quantity) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE inventory
        SET available_qty = available_qty - $2,
            reserved_qty = reserved_qty - $2,
            sold_qty = sold_qty + $2
        WHERE book_id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [bookId, quantity]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = Inventory;
```

**Learn:**
- Database transactions
- Row-level locking (FOR UPDATE)
- Inventory management logic
- Concurrency control

---

#### **Task 4.2: Create Cart Model**

**File:** `src/models/Cart.js`

```javascript
const pool = require('../config/database');

class Cart {
  // Get user's cart
  static async getByUserId(userId) {
    const query = `
      SELECT c.*, array_agg(json_build_object(
        'id', ci.id,
        'bookId', ci.book_id,
        'quantity', ci.quantity,
        'priceAtAdd', ci.price_at_add,
        'addedAt', ci.added_at,
        'book', json_build_object(
          'id', b.id,
          'title', b.title,
          'price', b.price
        )
      )) as items
      FROM carts c
      LEFT JOIN cart_items ci ON c.id = ci.cart_id
      LEFT JOIN books b ON ci.book_id = b.id
      WHERE c.user_id = $1
      GROUP BY c.id
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  // Add item to cart
  static async addItem(cartId, bookId, quantity, price) {
    const query = `
      INSERT INTO cart_items (cart_id, book_id, quantity, price_at_add)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (cart_id, book_id) DO UPDATE
      SET quantity = cart_items.quantity + $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [cartId, bookId, quantity, price]);
    return result.rows[0];
  }

  // Remove item from cart
  static async removeItem(cartId, bookId) {
    const query = 'DELETE FROM cart_items WHERE cart_id = $1 AND book_id = $2';
    await pool.query(query, [cartId, bookId]);
  }

  // Clear cart
  static async clear(cartId) {
    const query = 'DELETE FROM cart_items WHERE cart_id = $1';
    await pool.query(query, [cartId]);
  }

  // Get cart total
  static async getTotal(cartId) {
    const query = `
      SELECT SUM(quantity * price_at_add) as total
      FROM cart_items
      WHERE cart_id = $1
    `;
    
    const result = await pool.query(query, [cartId]);
    return result.rows[0].total || 0;
  }
}

module.exports = Cart;
```

---

#### **Task 4.3: Create Cart Service with Concurrency Control**

**File:** `src/services/cartService.js`

```javascript
const Cart = require('../models/Cart');
const Inventory = require('../models/Inventory');
const Book = require('../models/Book');

class CartService {
  // Add item to cart (with inventory check)
  static async addToCart(userId, bookId, quantity) {
    // Get user's cart or create
    const cart = await this.getOrCreateCart(userId);

    // Check book exists
    const book = await Book.findById(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    // Check inventory availability
    const available = await Inventory.checkAvailability(bookId, quantity);
    if (!available) {
      throw new Error('Not enough stock available');
    }

    // Add to cart
    const item = await Cart.addItem(cart.id, bookId, quantity, book.price);

    return item;
  }

  // Remove item from cart
  static async removeFromCart(userId, bookId) {
    const cart = await Cart.getByUserId(userId);
    
    if (!cart) {
      throw new Error('Cart not found');
    }

    await Cart.removeItem(cart.id, bookId);
  }

  // Get cart
  static async getCart(userId) {
    return Cart.getByUserId(userId);
  }

  // Prepare checkout (Hold inventory)
  static async prepareCheckout(userId) {
    const cart = await Cart.getByUserId(userId);
    
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Hold all items
    const holdings = [];
    try {
      for (const item of cart.items) {
        const held = await Inventory.hold(item.bookId, item.quantity);
        holdings.push({ bookId: item.bookId, quantity: item.quantity });
      }

      return { cart, holdings };
    } catch (err) {
      // Release all if any fails
      for (const holding of holdings) {
        await Inventory.release(holding.bookId, holding.quantity);
      }
      throw err;
    }
  }

  // Helper: Get or create cart
  static async getOrCreateCart(userId) {
    const cart = await Cart.getByUserId(userId);
    
    if (cart) {
      return cart;
    }

    // Create new cart
    const query = `
      INSERT INTO carts (user_id)
      VALUES ($1)
      RETURNING *
    `;
    
    const pool = require('../config/database');
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = CartService;
```

**Learn:**
- Inventory hold/release pattern
- Transaction management
- Error handling with rollback
- Service orchestration

---

#### **Task 4.4: Cart Controller & Routes**

**File:** `src/controllers/cartController.js`

```javascript
const CartService = require('../services/cartService');

class CartController {
  // GET /api/cart
  static async getCart(req, res) {
    try {
      const cart = await CartService.getCart(req.user.id);

      res.status(200).json({
        data: cart || { items: [] }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // POST /api/cart/add
  static async addToCart(req, res) {
    try {
      const { bookId, quantity } = req.body;

      if (!bookId || !quantity) {
        return res.status(400).json({ error: 'Missing bookId or quantity' });
      }

      const item = await CartService.addToCart(req.user.id, bookId, quantity);

      res.status(200).json({
        message: 'Item added to cart',
        data: item
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // DELETE /api/cart/remove/:bookId
  static async removeFromCart(req, res) {
    try {
      const { bookId } = req.params;

      await CartService.removeFromCart(req.user.id, bookId);

      res.status(200).json({
        message: 'Item removed from cart'
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // POST /api/cart/prepare-checkout
  static async prepareCheckout(req, res) {
    try {
      const result = await CartService.prepareCheckout(req.user.id);

      res.status(200).json({
        message: 'Inventory held, ready for checkout',
        data: result
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = CartController;
```

**File:** `src/routes/cart.js`

```javascript
const express = require('express');
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken); // All cart routes protected

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.delete('/remove/:bookId', cartController.removeFromCart);
router.post('/prepare-checkout', cartController.prepareCheckout);

module.exports = router;
```

---

### Checklist Phase 4:

- [ ] Inventory model with lock/hold/release
- [ ] Cart model CRUD
- [ ] CartService with concurrency control
- [ ] Hold mechanism working
- [ ] Prevent over-selling working
- [ ] Transactions working
- [ ] Cart endpoints working
- [ ] Error handling for inventory conflicts
- [ ] Tests passing

---

## 💳 PHASE 5: Order Management (Week 4)

**Goal:** Order creation, status tracking, order history

### Tasks:
- Create Order model
- Order service
- Order controller & routes
- Release held inventory on failure
- Timeout handling (Cronjob)

(Chi tiết tương tự Phase 4 - follow same pattern)

---

## 💰 PHASE 6: Payment Integration (Week 4)

**Goal:** Payment gateway integration (VNPay/Momo)

### Tasks:
- Payment model
- Payment service
- Payment webhook handling
- Transaction confirmation
- Refund mechanism

---

## 🤖 PHASE 7: FastAPI AI Service (Weeks 5-6)

**Goal:** Standalone FastAPI service for RAG

### Tasks:
- FastAPI project setup
- PostgreSQL connection (async)
- Document processing (PDF parsing)
- Text chunking
- Embedding generation
- Vector DB integration (ChromaDB)
- Semantic search
- Chat endpoint
- Tests

(Detailed guide in separate section)

---

## 🔗 PHASE 8: Integration & API Testing (Weeks 7-8)

**Goal:** Connect Node.js ↔ FastAPI services

### Tasks:
- Node.js calls FastAPI endpoints
- Error handling across services
- Integration tests
- End-to-end testing
- Performance optimization

---

## 🐳 PHASE 9: Docker Setup & Deployment (Week 9)

**Goal:** Containerize both services + Docker Compose

### Tasks:
- Create Dockerfile for Node.js
- Create Dockerfile for FastAPI
- Setup docker-compose.yml
- Setup PostgreSQL in Docker
- Setup ChromaDB in Docker
- Test multi-container setup
- Prepare for cloud deployment

---

## 📋 COMPLETE DEVELOPMENT CHECKLIST

### Phase 1: Project Setup
- [ ] GitHub repo created
- [ ] npm project initialized
- [ ] Express server running
- [ ] PostgreSQL configured
- [ ] Database migrations working
- [ ] .env setup complete

### Phase 2: Authentication
- [ ] User model created
- [ ] Password hashing (bcrypt)
- [ ] JWT generation & validation
- [ ] Auth middleware
- [ ] Register endpoint
- [ ] Login endpoint
- [ ] Token refresh
- [ ] Profile endpoint
- [ ] Auth tests passing

### Phase 3: Books & Categories
- [ ] Book CRUD operations
- [ ] Category CRUD operations
- [ ] N:M relationships (book_categories)
- [ ] Pagination & search
- [ ] Book routes protected by role
- [ ] Category routes protected
- [ ] Tests passing

### Phase 4: Cart & Inventory
- [ ] Cart model & CRUD
- [ ] Inventory hold/release
- [ ] Concurrency control (FOR UPDATE)
- [ ] Prevent over-selling
- [ ] Cart endpoints
- [ ] Prepare checkout with holds
- [ ] Transaction handling
- [ ] Error rollback

### Phase 5: Orders
- [ ] Order model & CRUD
- [ ] Order items
- [ ] Order status tracking
- [ ] Order history
- [ ] Release held inventory after payment
- [ ] Timeout handling (Cronjob)
- [ ] Order notifications

### Phase 6: Payments
- [ ] Payment model
- [ ] Payment gateway integration
- [ ] Webhook handling
- [ ] Transaction confirmation
- [ ] Refund mechanism
- [ ] Payment tests

### Phase 7: FastAPI AI Service
- [ ] FastAPI project setup
- [ ] Document processing
- [ ] Text chunking
- [ ] Embedding generation
- [ ] Vector DB integration
- [ ] Semantic search
- [ ] Chat endpoint
- [ ] Async/await patterns
- [ ] Error handling
- [ ] Tests passing

### Phase 8: Integration
- [ ] Node.js → FastAPI API calls
- [ ] Error handling across services
- [ ] Chat endpoint working
- [ ] Integration tests passing
- [ ] Performance acceptable

### Phase 9: Docker
- [ ] Node.js Dockerfile
- [ ] FastAPI Dockerfile
- [ ] docker-compose.yml
- [ ] PostgreSQL container
- [ ] ChromaDB container
- [ ] Multi-container setup working
- [ ] Ready for deployment

---

## 📚 Learning Resources by Phase

### Phase 1-2: Node.js & Express
- Express.js Docs: https://expressjs.com/
- PostgreSQL Node Client: https://node-postgres.com/
- Bcryptjs: https://www.npmjs.com/package/bcryptjs
- JWT: https://jwt.io/

### Phase 3-4: Database & Services
- SQL Transactions: https://www.postgresql.org/docs/current/tutorial-transactions.html
- N+1 Query Problem: https://wiki.postgresql.org/wiki/Performance_Optimization
- Concurrency Control: https://en.wikipedia.org/wiki/Concurrency_control

### Phase 5-6: Advanced Patterns
- Distributed Transactions: https://en.wikipedia.org/wiki/Distributed_transaction
- Saga Pattern: https://microservices.io/patterns/data/saga.html
- Error Handling: https://nodejs.org/en/docs/guides/nodejs-error-handling/

### Phase 7: FastAPI
- FastAPI Docs: https://fastapi.tiangolo.com/
- Pydantic: https://docs.pydantic.dev/
- SQLAlchemy Async: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- ChromaDB: https://docs.trychroma.com/

### Phase 8-9: DevOps
- Docker: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- GitHub Actions: https://docs.github.com/en/actions

---

## 🎯 Success Metrics

By end of Phase 9, you should have:

✅ **Working E-commerce Backend**
- Register, login, browse books, add to cart, checkout
- Inventory management with concurrency control
- Order tracking & payment integration

✅ **Working AI Service**
- Upload PDF/EPUB, generate embeddings
- Chat with books using RAG
- Semantic search

✅ **Microservices Architecture**
- 2 independent services (Node.js + FastAPI)
- Communication via REST APIs
- Docker containerization

✅ **Production-Ready Code**
- Error handling
- Validation
- Testing
- Documentation

✅ **DevOps Knowledge**
- Docker & Docker Compose
- Multi-container orchestration
- Deployment concepts

---

## 🚀 Next Steps

1. **Start Phase 1 TODAY**
   - Setup project structure
   - Configure database
   - Get server running

2. **Code alongside this guide**
   - Read task description
   - Understand code examples
   - Type code yourself (don't copy-paste)
   - Test as you go

3. **When stuck**
   - Re-read the explanation
   - Check references
   - Ask questions
   - Debug step-by-step

4. **Celebrate milestones**
   - After Phase 2 → Can register & login
   - After Phase 3 → Can browse books
   - After Phase 4 → Can checkout with inventory control
   - After Phase 9 → Production-ready system

---

**You've got this! 💪 Let's build something amazing!**

*Generated: 2026-05-06*  
*Total Content: Detailed breakdown of 9 phases with code examples*  
*Estimated Time: 9 weeks of dedicated development*
