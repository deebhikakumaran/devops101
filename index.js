import express from 'express';

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'server is healthy', status: 'caddy added', update: 'SSL certificate added' });
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});