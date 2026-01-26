import { createSupportClient } from "@entrext/support-client";

export const supportClient = createSupportClient({
    endpoint: "https://ldewwmfkymjmokopulys.supabase.co/functions/v1/submit-support",
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || "build-time-placeholder"
});
