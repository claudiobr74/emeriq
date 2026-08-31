import { Suspense } from "react";
import { RecoverConfirmScreen } from "@/components/auth/RecoverConfirmScreen";

export default function RecoverPage() {
  return (
    <Suspense>
      <RecoverConfirmScreen />
    </Suspense>
  );
}
