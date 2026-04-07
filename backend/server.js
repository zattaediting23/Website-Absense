require('dotenv').config();
const app = require('./src/app');
const pool = require('./src/config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('Database connected:', result.rows[0].now);

        app.listen(PORT, () => {
            console.log(`Absense API running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();
