import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { waitForDb } from "./db.js";
import { connectRabbit } from "./events/publisher.js";

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) =>
  res.json({ service: "planning-service", status: "ok" }),
);

app.use("/api", routes);

app.use((req, res) => res.status(404).json({ error: "rota nao encontrada" }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "erro interno" });
});

// Só sobe servidor e conecta RabbitMQ fora dos testes
if (process.env.NODE_ENV !== "test") {
  (async () => {
    await waitForDb();
    try {
      await connectRabbit();
    } catch (e) {
      console.error("[planning-service] erro RabbitMQ:", e.message);
    }
    app.listen(PORT, () => {
      console.log(`[planning-service] escutando em :${PORT}`);
    });
  })();
}

export default app;
