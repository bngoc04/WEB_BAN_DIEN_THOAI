const sql = require('mssql/msnodesqlv8');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'WebBanDienThoai';

// Master Connection for creation
const masterConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=master;Trusted_Connection=yes;',
    options: {
        useUTC: true
    }
};

const appConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=${DB_NAME};Trusted_Connection=yes;`,
    options: {
        useUTC: true
    }
};

async function migrate() {
    try {
        console.log("🚀 Starting migration...");
        
        // 1. Read JSON data
        const jsonPath = path.join(__dirname, 'db.json');
        const db = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // 2. Connect to Master & Create Database
        let pool = await sql.connect(masterConfig);
        console.log("✅ Connected to Master.");

        const checkDB = await pool.request().query(`IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${DB_NAME}') CREATE DATABASE ${DB_NAME}`);
        console.log(`✅ Database ${DB_NAME} checked/created.`);
        await pool.close();

        // 3. Connect to New Database & Create Tables
        pool = await sql.connect(appConfig);
        console.log(`✅ Connected to ${DB_NAME}.`);

        const tableSchema = `
            DROP TABLE IF EXISTS Reviews;
            DROP TABLE IF EXISTS SupportTickets;
            DROP TABLE IF EXISTS Vouchers;
            DROP TABLE IF EXISTS Orders;
            DROP TABLE IF EXISTS Users;
            DROP TABLE IF EXISTS Products;
            DROP TABLE IF EXISTS Categories;

            CREATE TABLE Categories (id INT PRIMARY KEY IDENTITY(1,1), name NVARCHAR(MAX));


            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
            CREATE TABLE Products (id INT PRIMARY KEY, name NVARCHAR(MAX), price NVARCHAR(MAX), image NVARCHAR(MAX), [desc] NVARCHAR(MAX), stock INT, category NVARCHAR(MAX), specs NVARCHAR(MAX));

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            CREATE TABLE Users (id INT PRIMARY KEY IDENTITY(1,1), name NVARCHAR(MAX), email NVARCHAR(300) UNIQUE, password NVARCHAR(MAX), role NVARCHAR(MAX));

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
            CREATE TABLE Orders (id NVARCHAR(100) PRIMARY KEY, name NVARCHAR(MAX), email NVARCHAR(MAX), phone NVARCHAR(MAX), address NVARCHAR(MAX), total NVARCHAR(MAX), status NVARCHAR(MAX), date NVARCHAR(MAX), items NVARCHAR(MAX));

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Vouchers' AND xtype='U')
            CREATE TABLE Vouchers (id INT PRIMARY KEY IDENTITY(1,1), code NVARCHAR(MAX), discount FLOAT, description NVARCHAR(MAX));

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SupportTickets' AND xtype='U')
            CREATE TABLE SupportTickets (id INT PRIMARY KEY IDENTITY(1,1), customerName NVARCHAR(MAX), subject NVARCHAR(MAX), message NVARCHAR(MAX), status NVARCHAR(MAX), date NVARCHAR(MAX));

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Reviews' AND xtype='U')
            CREATE TABLE Reviews (id INT PRIMARY KEY IDENTITY(1,1), productId INT, userName NVARCHAR(MAX), date NVARCHAR(MAX), rating INT, comment NVARCHAR(MAX));
        `;

        await pool.request().query(tableSchema);
        console.log("✅ Schema created.");

        // 清空旧数据
        await pool.request().query("IF OBJECT_ID('Products', 'U') IS NOT NULL DELETE FROM Products; IF OBJECT_ID('Users', 'U') IS NOT NULL DELETE FROM Users;");

        // 4. Insert Products
        console.log("📦 Migrating products...");
        for (const p of db.products) {
            await pool.request()
                .input('id', sql.Int, p.id)
                .input('name', sql.NVarChar, p.name)
                .input('price', sql.NVarChar, p.price)
                .input('image', sql.NVarChar, p.image)
                .input('desc', sql.NVarChar, p.desc)
                .input('stock', sql.Int, p.stock || 0)
                .input('category', sql.NVarChar, p.category)
                .input('specs', sql.NVarChar, JSON.stringify(p.specs))
                .query("INSERT INTO Products (id, name, price, image, [desc], stock, category, specs) VALUES (@id, @name, @price, @image, @desc, @stock, @category, @specs)");
        }


        // 5. Insert Categories
        console.log("📂 Migrating categories...");
        for (const c of db.categories) {
            await pool.request().input('name', sql.NVarChar, c.name).query("INSERT INTO Categories (Name) VALUES (@name)");
        }

        // 6. Insert Users
        console.log("👥 Migrating users...");
        for (const u of db.users) {
            await pool.request()
                .input('name', sql.NVarChar, u.name)
                .input('email', sql.NVarChar, u.email)
                .input('password', sql.NVarChar, u.password)
                .input('role', sql.NVarChar, u.role)
                .query("INSERT INTO Users (Name, Email, Password, Role) VALUES (@name, @email, @password, @role)");
        }

        // 7. Insert Orders
        console.log("🛒 Migrating orders...");
        for (const o of db.orders) {
            await pool.request()
                .input('id', sql.NVarChar, o.id)
                .input('name', sql.NVarChar, o.customerName || o.name)
                .input('email', sql.NVarChar, o.email)
                .input('phone', sql.NVarChar, o.phone || '')
                .input('address', sql.NVarChar, o.address || '')
                .input('total', sql.NVarChar, o.total)
                .input('status', sql.NVarChar, o.status)
                .input('date', sql.NVarChar, o.date)
                .input('items', sql.NVarChar, JSON.stringify(o.items))
                .query("INSERT INTO Orders (Id, Name, Email, Phone, Address, Total, Status, Date, Items) VALUES (@id, @name, @email, @phone, @address, @total, @status, @date, @items)");
        }

        console.log("⭐ Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    }
}

migrate();
