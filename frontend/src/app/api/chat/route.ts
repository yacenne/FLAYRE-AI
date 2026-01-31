
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // TODO: Implement your chat logic here
        // Example: const result = await processChat(body);
        const result = { message: "Chat endpoint ready", received: body };

        return Response.json(result);

    } catch (error) {
        // Check if it's a JSON parse error (client error)
        if (error instanceof SyntaxError || (error as Error).name === "SyntaxError") {
            console.warn("Invalid JSON received:", error);
            return Response.json(
                { error: "Invalid JSON" },
                { status: 400 }
            );
        }

        // For all other errors, send to Sentry (server error)
        Sentry.captureException(error);

        console.error("API Error:", error);
        return Response.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
