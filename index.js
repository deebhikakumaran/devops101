import express from 'express';

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'server is healthy', status: 'verifying pm2 deployment and github actions sync.', update: 'updated public key in remote machine'});
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});