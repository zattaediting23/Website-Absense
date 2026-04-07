const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);

    if (err.code === '23505') {
        return res.status(409).json({ error: 'Data sudah ada (duplikat)' });
    }

    if (err.code === '23503') {
        return res.status(400).json({ error: 'Referensi data tidak valid' });
    }

    if (err.code === '23502') {
        return res.status(400).json({ error: 'Data wajib tidak boleh kosong' });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Terjadi kesalahan pada server'
    });
};

module.exports = { errorHandler };
