import { Router, type Response } from "express";
import type { AuthUser } from "../util/auth/jwt";
import { supabase } from "../supabase";

export const scheduleRouter = Router();

function emptyToNull<T>(value: T | "" | null | undefined): T | null {
  if (value === "" || value === undefined || value === null) {
    return null;
  }
  return value;
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function parseEventId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function canManageEvent(user: AuthUser, uid: number): boolean {
  return user.user_role === 1 || user.user_role === 2 || user.id === uid;
}

function findScheduleEvent(id: number) {
  return supabase
    .from("schedule_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
}

function requireManagePermission(
  user: AuthUser | undefined,
  uid: number,
  res: Response,
): boolean {
  if (!user) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return false;
  }

  if (!canManageEvent(user, uid)) {
    res.status(403).json({ error: "일정을 변경할 권한이 없습니다." });
    return false;
  }

  return true;
}

scheduleRouter.get("/events", async (req, res) => {
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

scheduleRouter.post("/events", async (req, res) => {
  const { name, start_time, end_time, week_days, event_options, event_date } =
    req.body ?? {};

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "name is required" });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  const user_name = req.user.display_name;

  const { data, error } = await supabase
    .from("schedule_events")
    .insert({
      name,
      user_name,
      uid: req.user.id,
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

scheduleRouter.get("/events/:id", async (req, res) => {
  const id = parseEventId(req.params.id);

  if (id == null) {
    res.status(400).json({ error: "invalid id" });
    return;
  }

  const { data, error } = await findScheduleEvent(id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: "일정을 찾을 수 없습니다." });
    return;
  }

  res.json(data);
});

scheduleRouter.put("/events/:id", async (req, res) => {
  const id = parseEventId(req.params.id);

  if (id == null) {
    res.status(400).json({ error: "invalid id" });
    return;
  }

  const { data: event, error: findError } = await findScheduleEvent(id);

  if (findError) {
    res.status(500).json({ error: findError.message });
    return;
  }

  if (!event) {
    res.status(404).json({ error: "일정을 찾을 수 없습니다." });
    return;
  }

  if (!requireManagePermission(req.user, event.uid, res)) {
    return;
  }

  const { name, start_time, end_time, week_days, event_options, event_date } =
    req.body ?? {};

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const { data, error } = await supabase
    .from("schedule_events")
    .update({
      ...(name !== undefined ? { name } : {}),
      ...(start_time !== undefined
        ? { start_time: emptyToNull(start_time) }
        : {}),
      ...(end_time !== undefined ? { end_time: emptyToNull(end_time) } : {}),
      ...(week_days !== undefined ? { week_days: emptyToNull(week_days) } : {}),
      ...(event_options !== undefined
        ? { event_options: emptyToNull(event_options) }
        : {}),
      ...(event_date !== undefined
        ? { event_date: emptyToNull(event_date) }
        : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

scheduleRouter.delete("/events/:id", async (req, res) => {
  const id = parseEventId(req.params.id);

  if (id == null) {
    res.status(400).json({ error: "invalid id" });
    return;
  }

  const { data: event, error: findError } = await findScheduleEvent(id);

  if (findError) {
    res.status(500).json({ error: findError.message });
    return;
  }

  if (!event) {
    res.status(404).json({ error: "일정을 찾을 수 없습니다." });
    return;
  }

  if (!requireManagePermission(req.user, event.uid, res)) {
    return;
  }

  const { error } = await supabase
    .from("schedule_events")
    .delete()
    .eq("id", id);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(204).send();
});
