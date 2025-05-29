import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js';
import videoServer from './routes/route.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Подстраховка на случай, если .env не загрузился

app.use(cors());
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/api', apiRoutes);
app.use('*', videoServer);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${PORT} port`);
});
