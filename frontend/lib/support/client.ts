import { createSupportClient } from "@entrext/support-client";
import { API_URL } from "../api-config";

export const supportClient = createSupportClient({
    endpoint: `${API_URL}/support`,
    anonKey: process.env.NEXT_PUBLIC_ANON_KEY || "backend-handles-auth"
});
