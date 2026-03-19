const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sql = require('mssql/msnodesqlv8');

const app = express();
const PORT = 3000;
const DB_NAME = 'WebBanDienThoai';

const dbConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=${DB_NAME};Trusted_Connection=yes;`,

    options: {
        useUTC: true
    }
};

let pool;

async function getPool() {
    if (!pool) {
        pool = await sql.connect(dbConfig);
    }
    return pool;
}

// Utility to lowercase keys from SQL result
const lowerKeys = (obj) => {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(lowerKeys);
    if (typeof obj !== 'object') return obj;
    const newObj = {};
    for (let key in obj) {
        newObj[key.toLowerCase()] = obj[key];
    }
    return newObj;
};

app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader('X-Debug-Version', '2.0');
    next();
});




// --- AUTH API ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const p = await getPool();
        
        // Kiểm tra email tồn tại
        const check = await p.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');
            
        if (check.recordset.length > 0) {
            return res.status(400).json({ message: "Email đã được sử dụng!" });
        }

        const role = 'customer';
        await p.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .input('role', sql.NVarChar, role)
            .query('INSERT INTO Users (Name, Email, Password, Role) VALUES (@name, @email, @password, @role)');
            
        res.status(201).json({ message: "Đăng ký thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const p = await getPool();
        const result = await p.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query('SELECT * FROM Users WHERE Email = @email AND Password = @password');
        
        const row = result.recordset[0];
        if (row) {
            const user = lowerKeys(row);
            res.json({ 
                message: "Đăng nhập thành công", 
                user: { 
                    id: user.id || user.Id, 
                    name: user.name || user.Name, 
                    email: user.email || user.Email, 
                    role: user.role || user.Role 
                } 
            });
        } else {
            res.status(401).json({ message: "Email hoặc mật khẩu không chính xác" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// --- PRODUCT API ---
app.get('/api/products', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT id, name, price, image, [desc], stock, category, specs FROM Products');
        const products = result.recordset.map(row => {
            const r = lowerKeys(row);
            return {
                id: r.id || r.Id,
                name: r.name || r.Name,
                price: r.price || r.Price,
                image: r.image || r.Image,
                desc: r.desc || r.Description || r.Desc || r['desc'],
                stock: r.stock || r.Stock || 0,
                category: r.category || r.Category,
                specs: (r.specs || r.Specs) ? JSON.parse(r.specs || r.Specs) : {}
            };
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/products/:id', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT id, name, price, image, [desc], stock, category, specs FROM Products WHERE id = @id');
        
        const row = result.recordset[0];
        if (row) {
            const product = lowerKeys(row);
            product.specs = product.specs ? JSON.parse(product.specs) : {};
            res.json(product);
        } else {
            res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.post('/api/products', async (req, res) => {
    try {
        const p = await getPool();
        // Get max ID
        const maxIdRes = await p.request().query('SELECT MAX(Id) as maxId FROM Products');
        const nextId = (maxIdRes.recordset[0].maxId || 0) + 1;

        const { name, price, image, desc, stock, category, specs } = req.body;
        await p.request()
            .input('id', sql.Int, nextId)
            .input('name', sql.NVarChar, name)
            .input('price', sql.NVarChar, price)
            .input('image', sql.NVarChar, image)
            .input('desc', sql.NVarChar, desc)
            .input('stock', sql.Int, stock || 0)
            .input('category', sql.NVarChar, category)
            .input('specs', sql.NVarChar, JSON.stringify(specs))
            .query('INSERT INTO Products (Id, Name, Price, Image, Description, Stock, Category, Specs) VALUES (@id, @name, @price, @image, @desc, @stock, @category, @specs)');
        
        res.status(201).json({ id: nextId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const p = await getPool();
        const { name, price, image, desc, stock, category, specs } = req.body;
        await p.request()
            .input('id', sql.Int, req.params.id)
            .input('name', sql.NVarChar, name)
            .input('price', sql.NVarChar, price)
            .input('image', sql.NVarChar, image)
            .input('desc', sql.NVarChar, desc)
            .input('stock', sql.Int, stock)
            .input('category', sql.NVarChar, category)
            .input('specs', sql.NVarChar, JSON.stringify(specs))
            .query('UPDATE Products SET Name=@name, Price=@price, Image=@image, Description=@desc, Stock=@stock, Category=@category, Specs=@specs WHERE Id=@id');
        
        res.json({ id: req.params.id, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const p = await getPool();
        await p.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Products WHERE Id = @id');
        res.json({ message: "Xóa sản phẩm thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- CATEGORY API ---
app.get('/api/categories', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT * FROM Categories');
        res.json(lowerKeys(result.recordset));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- USER MANAGEMENT API ---
app.get('/api/users', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT * FROM Users');
        res.json(lowerKeys(result.recordset));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/users', async (req, res) => {
    try {
        const p = await getPool();
        const { name, email, password, role } = req.body;
        const result = await p.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .input('role', sql.NVarChar, role)
            .query('INSERT INTO Users (Name, Email, Password, Role) OUTPUT INSERTED.Id VALUES (@name, @email, @password, @role)');
        res.status(201).json({ id: result.recordset[0].Id, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const p = await getPool();
        await p.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Users WHERE Id = @id');
        res.json({ message: "Xóa người dùng thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- ORDER API ---
app.get('/api/orders', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT * FROM Orders');
        const orders = lowerKeys(result.recordset).map(o => ({
            ...o,
            items: o.items ? JSON.parse(o.items) : []
        }));
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/orders/user/:email', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request()
            .input('email', sql.NVarChar, req.params.email)
            .query('SELECT * FROM Orders WHERE Email = @email');
        const orders = lowerKeys(result.recordset).map(o => ({
            ...o,
            items: o.items ? JSON.parse(o.items) : []
        }));
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/orders', async (req, res) => {
    try {
        const p = await getPool();
        const { id, customerName, email, phone, address, total, items, status, date } = req.body;
        await p.request()
            .input('id', sql.NVarChar, id)
            .input('name', sql.NVarChar, customerName)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar, address)
            .input('total', sql.NVarChar, total)
            .input('status', sql.NVarChar, status)
            .input('date', sql.NVarChar, date)
            .input('items', sql.NVarChar, JSON.stringify(items))
            .query('INSERT INTO Orders (Id, Name, Email, Phone, Address, Total, Status, Date, Items) VALUES (@id, @name, @email, @phone, @address, @total, @status, @date, @items)');
        
        res.status(201).json(req.body);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/orders/:id', async (req, res) => {
    try {
        const p = await getPool();
        await p.request()
            .input('id', sql.NVarChar, req.params.id)
            .input('status', sql.NVarChar, req.body.status)
            .query('UPDATE Orders SET Status = @status WHERE Id = @id');
        res.json({ id: req.params.id, status: req.body.status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- VOUCHER API ---
app.get('/api/vouchers', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT * FROM Vouchers');
        res.json(lowerKeys(result.recordset));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/vouchers', async (req, res) => {
    try {
        const p = await getPool();
        const { code, discount, desc } = req.body;
        const result = await p.request()
            .input('code', sql.NVarChar, code)
            .input('discount', sql.Float, discount)
            .input('desc', sql.NVarChar, desc)
            .query('INSERT INTO Vouchers (Code, Discount, Description) OUTPUT INSERTED.Id VALUES (@code, @discount, @desc)');
        res.status(201).json({ id: result.recordset[0].Id, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/vouchers/:id', async (req, res) => {
    try {
        const p = await getPool();
        await p.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Vouchers WHERE Id = @id');
        res.json({ message: "Xóa voucher thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REVIEW API ---
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request()
            .input('productId', sql.Int, req.params.productId)
            .query('SELECT * FROM Reviews WHERE ProductId = @productId');
        res.json(lowerKeys(result.recordset));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/reviews', async (req, res) => {
    try {
        const p = await getPool();
        const { productId, userName, rating, comment } = req.body;
        const date = new Date().toLocaleDateString('vi-VN');
        const result = await p.request()
            .input('productId', sql.Int, productId)
            .input('userName', sql.NVarChar, userName)
            .input('date', sql.NVarChar, date)
            .input('rating', sql.Int, rating)
            .input('comment', sql.NVarChar, comment)
            .query('INSERT INTO Reviews (ProductId, UserName, Date, Rating, Comment) OUTPUT INSERTED.Id VALUES (@productId, @userName, @date, @rating, @comment)');
        res.status(201).json({ id: result.recordset[0].Id, date, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- STATS API ---
app.get('/api/stats', async (req, res) => {
    try {
        const p = await getPool();
        const ordersRes = await p.request().query('SELECT * FROM Orders');
        const orders = lowerKeys(ordersRes.recordset);
        
        const productsCount = (await p.request().query('SELECT COUNT(*) as count FROM Products')).recordset[0].count;
        const usersCount = (await p.request().query('SELECT COUNT(*) as count FROM Users')).recordset[0].count;
        
        const totalRevenueNum = orders
            .filter(o => o.status === 'Confirmed' || o.status === 'Shipped' || o.status === 'Hoàn tất')
            .reduce((sum, o) => {
                const totalStr = o.total || "0";
                const priceValue = parseInt(totalStr.replace(/[^0-9]/g, ''));
                return sum + (isNaN(priceValue) ? 0 : priceValue);
            }, 0);
        
        res.json({
            totalOrders: orders.length,
            totalProducts: productsCount,
            totalUsers: usersCount,
            totalRevenue: totalRevenueNum.toLocaleString('vi-VN') + ' ₫',
            pendingOrders: orders.filter(o => o.status === 'Pending').length
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- SUPPORT TICKETS API ---
app.get('/api/support_tickets', async (req, res) => {
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT * FROM SupportTickets');
        res.json(lowerKeys(result.recordset));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.listen(PORT, () => {
    console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
});
