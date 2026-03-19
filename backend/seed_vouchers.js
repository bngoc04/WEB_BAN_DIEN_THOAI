const sql = require('mssql/msnodesqlv8');
const config = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WebBanDienThoai;Trusted_Connection=yes;'
};

async function seed() {
    try {
        const pool = await sql.connect(config);
        await pool.request().query("INSERT INTO Vouchers (Code, Discount, Description) VALUES ('TECHNOVA50', 0.5, 'Giảm 50% cho khách hàng mới'), ('SAMSUNG20', 0.2, 'Giảm 20% cho dòng Samsung'), ('IPHONE10', 0.1, 'Giảm 10% cho dòng iPhone')");
        console.log('SUCCESS: Vouchers inserted');
    } catch (e) {
        if (e.message.includes('Violation of PRIMARY KEY')) {
            console.log('NOTICE: Vouchers already exist');
        } else {
            console.error('FAILED:', e);
        }
    } finally {
        process.exit(0);
    }
}
seed();
