import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  user_id: string;
  user_role: number;
  display_name: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET을 .env에 설정하세요.");
  }

  return secret;
}

export type AuthUser = {
  id: number;
  user_id: string;
  user_role: number;
  display_name: string;
};

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      user_role: user.user_role,
      display_name: user.display_name,
    } satisfies AuthTokenPayload,
    getJwtSecret(),
    {
      subject: String(user.id),
      expiresIn: "7d",
    },
  );
}

export function verifyAuthToken(token: string): AuthUser {
  const payload = jwt.verify(token, getJwtSecret());

  if (typeof payload === "string") {
    throw new Error("invalid token");
  }

  const id = Number(payload.sub);
  const user_id = payload.user_id;
  const user_role = payload.user_role;
  const display_name = payload.display_name;

  if (
    !Number.isFinite(id) ||
    typeof user_id !== "string" ||
    typeof user_role !== "number" ||
    typeof display_name !== "string" ||
    display_name.trim() === ""
  ) {
    throw new Error("invalid token");
  }

  return { id, user_id, user_role, display_name: display_name.trim() };
}
