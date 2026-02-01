import { NextResponse } from "next/server";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUPABASE_URL = "https://ldewwmfkymjmokopulys.supabase.co/functions/v1/submit-support";

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

        // Forward Directly to Supabase Edge Function
        // Using the secret from environment variables
        const formSecret = process.env.NEXT_PUBLIC_ANON_KEY;

        console.log(`🚀 Forwarding support ticket directly to Supabase...`);

        const res = await fetch(SUPABASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-form-secret": formSecret || ""
            },
            body: JSON.stringify(body),
        });

        if (res.status === 429) {
            return NextResponse.json(
                { error: "Too many submissions. Try again later." },
                { status: 429 }
            );
        }

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });

    } catch (error: any) {
        console.error("🚨 Support Direct Proxy Exception:", error);
        return NextResponse.json(
            { error: "Internal Proxy Error", detail: error?.message || "Unknown error" },
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
