import { env } from "./config/env.js";
import { app } from "./app.js";

app.listen(env.apiPort, () => {
  console.log(`SportSync API listening on port ${env.apiPort}`);
});
