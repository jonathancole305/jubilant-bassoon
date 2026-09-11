import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const app = await createApp();

app.listen(PORT, HOST, () => {
  console.log(`jubilant-bassoon listening on http://${HOST}:${PORT}`);
});
