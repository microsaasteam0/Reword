import { NextResponse } from "next/server";

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
        if (!user_email || !emailRegex.test(user_email)) {
            return NextResponse.json(
                { error: "Invalid email address." },
                { status: 400 }
            );
        }

        // Forward to Python backend
        // Use NEXT_PUBLIC_BACKEND_URL as per documentation
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "https://reword-api.vercel.app";
        const res = await fetch(
            `${backendUrl.replace(/\/+$/, '')}/support`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }
        );

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });

    } catch (error) {
        console.error("Support API Error:", error);
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }
}
