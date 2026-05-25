import { getProviderCapabilities } from "@/app/actions/providers";
import { ApiError } from "@/lib/api-client";
import { getSim } from "@/lib/api/sims";
import { requireCompanyUser } from "@/lib/auth/current-user";
import { notFound } from "next/navigation";
import { SubscriptionPage } from "../subscription-page";

export const metadata = {
  title: "Suscripción · Bismark",
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
  const profile = await requireCompanyUser();
  const subscriptionPromise = getSim(decodeURIComponent(id));
  let data: Awaited<ReturnType<typeof loadDetailData>>;

  try {
    data = await loadDetailData(subscriptionPromise, profile);
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

function isDetailTab(tab: string | undefined): tab is "detail" | "usage" | "presence" | "limits" | "actions" {
  return tab === "detail" || tab === "usage" || tab === "presence" || tab === "limits" || tab === "actions";
}

async function loadDetailData(
  subscriptionPromise: ReturnType<typeof getSim>,
  profile: Awaited<ReturnType<typeof requireCompanyUser>>
) {
  const capabilitiesPromise = subscriptionPromise.then((subscription) =>
    getProviderCapabilities(subscription.provider)
  );
  const [subscription, capabilities] = await Promise.all([
    subscriptionPromise,
    capabilitiesPromise,
  ]);

  return { subscription, capabilities, profile };
}
