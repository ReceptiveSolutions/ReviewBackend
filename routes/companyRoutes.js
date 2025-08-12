import express from 'express';
const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ message: "Company route working!" });
});

export default router;
