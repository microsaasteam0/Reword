import { NextResponse } from "next/server";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Minimal frontend validation
        const { product, category, message, user_email } = body;

        if (!product || !category || !message || !user_email) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!emailRegex.test(user_email)) {
            return NextResponse.json(
                { error: "Invalid email address." },
                { status: 400 }
            );
        }

        // Forward to Python backend
        // Use NEXT_PUBLIC_BACKEND_URL or fallback to known production URL
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "https://reword-api.vercel.app";

        console.log(`Forwarding support ticket to: ${backendUrl}/support`);

        const res = await fetch(`${backendUrl.replace(/\/+$/, '')}/support`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });

    } catch (error: any) {
        console.error("Support Proxy Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", detail: error?.message || "Unknown error" },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
