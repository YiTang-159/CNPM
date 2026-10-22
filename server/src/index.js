import { createApp } from './app.js';
import { openRepo } from './db.js';

const port = Number(process.env.PORT || 3000);
const repo = await openRepo();
createApp(repo, { corsOrigin: process.env.CORS_ORIGIN || '*' }).listen(port, () => {
  console.log(`API thanh toán chạy ở http://localhost:${port}`);
});
