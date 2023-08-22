import 'dotenv/config';
import './db';
import app from './server';

const PORT = process.env.SERVER_PORT || 4000;

const handleListening = () => console.log(`Server listening (:${PORT})✅`);

app.listen(PORT, handleListening);
