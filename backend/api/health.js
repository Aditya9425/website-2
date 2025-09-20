module.exports = (req, res) => {
    res.json({
        status: 'OK',
        message: 'Shagun Saree Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
};