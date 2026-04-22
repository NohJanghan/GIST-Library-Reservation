import type { AuthResponse } from "../types";
import { request } from "./http";

export async function login(userId: string, userPwd: string) {
  return request<AuthResponse>({
    path: "/auth",
    method: "POST",
    body: { userId, userPwd },
  });
}
