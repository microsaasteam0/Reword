import { createSupportClient } from "@entrext/support-client";
import { API_URL } from "../api-config";

export const supportClient = createSupportClient({
    endpoint: `${API_URL}/api/v1/support/submit-ticket`,
    anonKey: "reword-not-needed-backend-handles-auth"
});
