import 'dotenv/config';
import { makeApp } from './app.js';
const PORT = Number(process.env.PORT) || 4000;
makeApp().then((app) => {
    app.listen(PORT, () => console.log(`[API] http://localhost:${PORT}`));
});
