import "dotenv/config";
import cors from "cors";
import express from "express";
import { supabase } from "./supabase";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  }),
);
app.use(express.json());

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

function emptyToNull<T>(value: T | "" | null | undefined): T | null {
  if (value === "" || value === undefined || value === null) {
    return null;
  }
  return value;
}

/**
 * Schedule Events
 *
 * GET /schedule-events
 * POST /schedule-events
 *
 * GET /schedule-events/:id
 * PUT /schedule-events/:id
 * DELETE /schedule-events/:id
 *
 */

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

// GET /schedule-events

app.get("/schedule-events", async (req, res) => {
  const event_date_start = queryString(req.query.event_date_start);
  const event_date_end = queryString(req.query.event_date_end);

  if (!event_date_start || !event_date_end) {
    res.status(400).json({
      error: "event_date_start and event_date_end are required",
    });
    return;
  }

  if (!isValidDate(event_date_start) || !isValidDate(event_date_end)) {
    res.status(400).json({
      error: "event_date_start and event_date_end must be valid dates",
    });
    return;
  }

  if (new Date(event_date_start) > new Date(event_date_end)) {
    res.status(400).json({
      error: "event_date_start must be before or equal to event_date_end",
    });
    return;
  }

  const { data, error } = await supabase
    .from("schedule_events")
    .select("*")
    .gte("event_date", event_date_start)
    .lte("event_date", event_date_end)
    .order("id", { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

// POST /schedule-events

app.post("/schedule-events", async (req, res) => {
  const {
    name,
    start_time,
    end_time,
    week_days,
    event_options,
    event_date,
    user_name,
  } = req.body ?? {};

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "name is required" });
    return;
  }

  if (typeof user_name !== "string" || user_name.trim() === "") {
    res.status(400).json({ error: "user_name is required" });
    return;
  }

  if (user_name.length > 30) {
    res.status(400).json({ error: "user_name must be 30 characters or less" });
    return;
  }

  const { data, error } = await supabase
    .from("schedule_events")
    .insert({
      name,
      user_name,
      start_time: emptyToNull(start_time),
      end_time: emptyToNull(end_time),
      week_days: emptyToNull(week_days),
      event_options: emptyToNull(event_options),
      event_date: emptyToNull(event_date),
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

app.listen(port, () => {
  console.log(`loa-schedule-server listening on http://localhost:${port}`);
});
