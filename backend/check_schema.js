const sql = require('mssql/msnodesqlv8');
const dbConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WebBanDienThoai;Trusted_Connection=yes;`,
};

async function check() {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products'");
        console.log("Columns:", JSON.stringify(result.recordset.map(r => r.COLUMN_NAME)));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
