import "dotenv/config";
import express from "express";
import { supabase } from "./supabase";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/health", async (_req, res) => {
  const { error } = await supabase.from("schedule_events").select("id").limit(1);

  if (error) {
    res.status(500).json({ ok: false, error: error.message });
    return;
  }

  res.json({ ok: true, project: "loa-schedule" });
});

app.get("/schedule-events", async (_req, res) => {
  const { data, error } = await supabase
    .from("schedule_events")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

app.listen(port, () => {
  console.log(`loa-schedule-server listening on http://localhost:${port}`);
});
