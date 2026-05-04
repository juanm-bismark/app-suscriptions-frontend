import { notFound } from "next/navigation";
import { findRecord } from "../data";
import { SubscriptionPage } from "../subscription-page";

export const metadata = {
  title: "Detalle de suscripción · Bismark",
};

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = findRecord(decodeURIComponent(id));
  if (!record) {
    notFound();
  }
  return <SubscriptionPage record={record} />;
}
