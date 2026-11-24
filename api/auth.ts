import { Router } from "express";
import { signAuthToken } from "../util/auth/jwt";
import { verifyPassword } from "../util/auth/password";
import { supabase } from "../supabase";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { user_id, password } = req.body ?? {};

  if (typeof user_id !== "string" || user_id.trim() === "") {
    res.status(400).json({ error: "user_id is required" });
    return;
  }

  if (typeof password !== "string" || password === "") {
    res.status(400).json({ error: "password is required" });
    return;
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, user_id, user_role, display_name, password_hash")
    .eq("user_id", user_id.trim())
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const passwordOk =
    user?.password_hash != null &&
    (await verifyPassword(password, user.password_hash));

  if (!user || !passwordOk) {
    res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
    return;
  }

  if (
    typeof user.display_name !== "string" ||
    user.display_name.trim() === ""
  ) {
    res.status(500).json({ error: "사용자 이름을 확인할 수 없습니다." });
    return;
  }

  const token = signAuthToken({
    id: user.id,
    user_id: user.user_id,
    user_role: user.user_role,
    display_name: user.display_name.trim(),
  });

  res.status(200).json({ message: "로그인 성공", token });
});
