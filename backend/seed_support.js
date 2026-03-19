const sql = require('mssql/msnodesqlv8');
const config = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WebBanDienThoai;Trusted_Connection=yes;'
};

async function seed() {
    try {
        const pool = await sql.connect(config);
        
        // Check columns
        const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SupportTickets'");
        console.log('COLUMNS:', cols.recordset.map(r => r.COLUMN_NAME).join(','));

        // Insert sample tickets
        await pool.request().query("INSERT INTO SupportTickets (customerName, subject, message, status, date) VALUES ('Nguyễn Văn A', 'Lỗi thanh toán', 'Tôi không thể thanh toán bằng thẻ Visa', 'Pending', '19/03/2026'), ('Trần Thị B', 'Tư vấn sản phẩm', 'iPhone 15 Pro Max còn hàng màu Titan tự nhiên không?', 'Pending', '19/03/2026')");
        console.log('SUCCESS: Tickets inserted');
    } catch (e) {
        console.error('FAILED:', e);
    } finally {
        process.exit(0);
    }
}
seed();
