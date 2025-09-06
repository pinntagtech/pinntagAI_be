import express from 'express';

const router = express.Router();

// Example route: Home
router.get('/', (req, res) => {
    res.send('Welcome to PinntagAI API');
});

// Example route: Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

export const adminRoutes = router.use('/admin', require('./admin').default);
export const businessRoutes = router.use('/business', require('./business').default);

export default router;