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

export function signAuthToken(user: {
  id: number;
  user_id: string;
  user_role: number;
}): string {
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
