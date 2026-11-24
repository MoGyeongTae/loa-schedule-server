import "dotenv/config";
import cors from "cors";
import express from "express";
import { authRouter } from "./api/auth";
import { scheduleRouter } from "./api/schedule";
import { requireAuth } from "./util/auth/requireAuth";
import { supabase } from "./supabase";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requireAuth);
app.use("/api/auth", authRouter);
app.use("/api/schedule", scheduleRouter);

app.get("/health", async (_req, res) => {
  const { error } = await supabase
    .from("schedule_events")
    .select("id")
    .limit(1);

  if (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }

  res.json({ ok: true, project: "loa-schedule" });
});

app.listen(port, () => {
  console.log(`loa-schedule-server listening on http://localhost:${port}`);
});
