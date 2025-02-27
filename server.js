import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js';
import videoServer from './routes/route.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Подстраховка на случай, если .env не загрузился

app.use(cors({ origin: '*' }));
app.use('/api', apiRoutes);
app.use('*', videoServer);

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
