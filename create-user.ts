import "dotenv/config";
import { hashPassword } from "./password";
import { supabase } from "./supabase";

const USER_ID_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const user_id = arg("user_id");
  const display_name = arg("display_name");
  const password = arg("password");
  const user_role_raw = arg("user_role") ?? "3";
  const user_role = Number(user_role_raw);

  if (!user_id || !display_name || !password) {
    console.error(
      "사용법: npm run create-user -- --user_id=아이디 --display_name=이름 --password=비밀번호 --user_role=1|2|3",
    );
    process.exit(1);
  }

  if (![1, 2, 3].includes(user_role)) {
    console.error("user_role은 1, 2, 3 중 하나여야 합니다.");
    process.exit(1);
  }

  if (!USER_ID_PATTERN.test(user_id)) {
    console.error(
      "user_id는 3~30자의 영문, 숫자, . _ - 만 사용할 수 있습니다.",
    );
    process.exit(1);
  }

  if (display_name.trim() === "" || display_name.trim().length > 30) {
    console.error("display_name은 1~30자여야 합니다.");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("password는 8자 이상이어야 합니다.");
    process.exit(1);
  }

  const password_hash = await hashPassword(password);

  const { data, error } = await supabase
    .from("users")
    .insert({
      user_id,
      display_name: display_name.trim(),
      password_hash,
      user_role,
    })
    .select("id, user_id, display_name, user_role, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      console.error("이미 사용 중인 아이디입니다.");
      process.exit(1);
    }

    console.error(error.message);
    process.exit(1);
  }

  console.log("유저가 생성되었습니다.", data);
}

main();
