
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // TODO: Implement your chat logic here
        // Example: const result = await processChat(body);
        const result = { message: "Chat endpoint ready", received: body };

        return Response.json(result);

    } catch (error) {
        // This sends the error to Sentry automatically!
        Sentry.captureException(error);

        console.error("API Error:", error);
        return Response.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
