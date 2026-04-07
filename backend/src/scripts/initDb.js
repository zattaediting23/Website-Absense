const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    try {
        console.log('Initializing database...');
        const schemaPath = path.join(__dirname, '..', '..', '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await pool.query(schema);
        console.log('Schema created successfully.');

        // Create default superadmin if not exists
        const existing = await pool.query("SELECT id FROM users WHERE email = 'admin@absense.com'");
        if (existing.rows.length === 0) {
            const passwordHash = await bcrypt.hash('admin123', 12);
            const orgResult = await pool.query(
                "INSERT INTO organizations (name, sector) VALUES ('Absense System', 'corporate') RETURNING id"
            );
            await pool.query(
                `INSERT INTO users (organization_id, email, password_hash, full_name, role)
                 VALUES ($1, 'admin@absense.com', $2, 'Super Admin', 'superadmin')`,
                [orgResult.rows[0].id, passwordHash]
            );
            console.log('Default superadmin created:');
            console.log('  Email: admin@absense.com');
            console.log('  Password: admin123');
        } else {
            console.log('Superadmin already exists, skipping.');
        }

        console.log('Database initialization complete!');
        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        process.exit(1);
    }
}

initDatabase();
