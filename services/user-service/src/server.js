// importss
import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { waitForDb } from "./db.js";

// abertura server
const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) =>
  res.json({ service: "user-service", status: "ok" }),
);

// config da api
app.use("/api", routes);

app.use((req, res) => res.status(404).json({ error: "rota nao encontrada" }));
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "erro interno" });
});

// Só sobe o servidor se NÃO estiver em modo de teste
// Em testes, o app é importado e o supertest cuida do listen
if (process.env.NODE_ENV !== "test") {
  (async () => {
    await waitForDb();
    app.listen(PORT, () => {
      console.log(`[user-service] escutando em :${PORT}`);
    });
  })();
}

// Export para testes de integração
export default app;
