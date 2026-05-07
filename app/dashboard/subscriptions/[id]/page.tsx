import { getProviderCapabilities } from "@/app/actions/providers";
import { ApiError } from "@/lib/api-client";
import { getSim } from "@/lib/api/sims";
import { getProfile } from "@/lib/auth/current-user";
import { notFound } from "next/navigation";
import { SubscriptionPage } from "../subscription-page";

export const metadata = {
  title: "Detalle de suscripción · Bismark",
};

export default async function SubscriptionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const subscriptionPromise = getSim(decodeURIComponent(id));
  const profilePromise = getProfile();
  let data: Awaited<ReturnType<typeof loadDetailData>>;

  try {
    data = await loadDetailData(subscriptionPromise, profilePromise);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <SubscriptionPage
      subscription={data.subscription}
      capabilities={data.capabilities}
      currentUserRole={data.profile?.role}
      initialTab={isDetailTab(tab) ? tab : "detail"}
    />
  );
}

function isDetailTab(tab: string | undefined): tab is "detail" | "history" | "usage" | "presence" | "limits" | "actions" {
  return tab === "detail" || tab === "history" || tab === "usage" || tab === "presence" || tab === "limits" || tab === "actions";
}

async function loadDetailData(
  subscriptionPromise: ReturnType<typeof getSim>,
  profilePromise: ReturnType<typeof getProfile>
) {
  const capabilitiesPromise = subscriptionPromise.then((subscription) =>
    getProviderCapabilities(subscription.provider)
  );
  const [subscription, capabilities, profile] = await Promise.all([
    subscriptionPromise,
    capabilitiesPromise,
    profilePromise,
  ]);

  return { subscription, capabilities, profile };
}
