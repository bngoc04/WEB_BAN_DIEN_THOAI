const sql = require('mssql/msnodesqlv8');
const dbConfig = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=WebBanDienThoai;Trusted_Connection=yes;`,
};

async function check() {
    try {
        await sql.connect(dbConfig);
        const result = await sql.query("SELECT TOP 1 * FROM Products");
        console.log("Keys in result:", JSON.stringify(Object.keys(result.recordset[0])));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
