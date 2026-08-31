import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/appwrite/session";
import { LoginScreen } from "@/components/auth/LoginScreen";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <LoginScreen />;
}
