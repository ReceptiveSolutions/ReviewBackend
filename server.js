import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import companyRoutes from './routes/companyRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/companies', companyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
