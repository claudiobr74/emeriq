import { redirect } from "next/navigation";
import { ConsultationApp } from "@/components/clinical/ConsultationApp";
import { getSessionUser } from "@/lib/appwrite/session";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <ConsultationApp user={user} />;
}
