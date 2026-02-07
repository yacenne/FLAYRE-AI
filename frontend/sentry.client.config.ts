// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Define how likely traces are sampled. Adjust this value in production.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,

    // Enable debugging in development
    debug: process.env.NODE_ENV !== "production",

    // Enable replays in production (record user sessions for debugging)
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

    // Integrations for better error tracking
    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
        Sentry.feedbackIntegration({
            colorScheme: "dark",
        }),
    ],
});
