import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';

const port = process.env.PORT || 5000;

async function start() {
  try {
    await connectDb();
    app.listen(port, () => {
      console.log(`Poultry Farm API listening on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
