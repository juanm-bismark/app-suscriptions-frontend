import { Suspense } from "react";
import { SubscriptionsClient } from "./subscriptions-client";

export const metadata = {
  title: "Suscripciones · Bismark",
};

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionsClient />
    </Suspense>
  );
}
