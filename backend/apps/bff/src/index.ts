import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import createError from "http-errors";
import searchRouter from "./routes/search.ts";
import airportsRouter from './routes/airports.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/v1", searchRouter);
app.use('/v1', airportsRouter);

app.use((_req, _res, next) => next(createError(404, "Not Found")));
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err.status || 500;
  const message = status === 500 ? "Internal Server Error" : err.message;
  res.status(status).json({ error: { message, status } });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`[BFF] listening on :${port}`));
