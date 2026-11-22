import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  user_id: string;
  user_role: number;
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
};

export function signAuthToken(user: AuthUser): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      user_role: user.user_role,
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

  if (
    !Number.isFinite(id) ||
    typeof user_id !== "string" ||
    typeof user_role !== "number"
  ) {
    throw new Error("invalid token");
  }

  return { id, user_id, user_role };
}
