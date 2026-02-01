import { createSupportClient } from "@entrext/support-client";

export const supportClient = createSupportClient({
    endpoint: "/api/support",
    anonKey: "client-side-placeholder" // Secret is handled by the Next.js API route
});
