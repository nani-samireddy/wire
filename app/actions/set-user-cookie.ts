"use server";
import { cookies } from "next/headers";

export async function setUserNameCookie(userName: string) {
  (await cookies()).set("userName", userName, {
    httpOnly: false, // set to true for server-only access
    sameSite: "lax",
    path: "/",
  });
}
