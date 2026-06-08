import express from 'express';

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'server is healthy', status: 'public URL worked through pm2. checking code sync with pm2 manually.' });
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});