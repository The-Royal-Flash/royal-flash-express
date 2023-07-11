import "dotenv/config";
import app from "./server";

const PORT = process.env.SERVER_PORT || 4000;

const handleListening = () =>
  console.log(`Server listening on http://localhost:${PORT} ✅`);

app.listen(PORT, handleListening);
