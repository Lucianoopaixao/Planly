//importss

import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { waitForDb } from "./db.js";

//abertura server

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// /health

app.get("/health", (req, res) =>
  res.json({ service: "user-service", status: "ok" }),
);

// config da api e logs de acompanhamento da escuta
app.use("/api", routes);

app.use((req, res) => res.status(404).json({ error: "rota nao encontrada" }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "erro interno" });
});

// escuta do db
(async () => {
  await waitForDb();
  app.listen(PORT, () => {
    console.log(`[user-service] escutando em :${PORT}`);
  });
})();
