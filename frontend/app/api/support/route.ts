import { NextResponse } from "next/server";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUPABASE_URL = "https://ldewwmfkymjmokopulys.supabase.co/functions/v1/submit-support";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validation
        const { product, category, message, user_email } = body;
        if (!product || !category || !message || !user_email || !emailRegex.test(user_email)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // 2. Secret Retrieval
        // Note: You MUST set this in Vercel Project Settings -> Environment Variables
        const FORM_SECRET = process.env.NEXT_PUBLIC_ANON_KEY;

        if (!FORM_SECRET) {
            console.error("❌ CRITICAL: NEXT_PUBLIC_ANON_KEY is not defined in Vercel environment variables.");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        console.log(`📡 Forwarding to Supabase... (Key verify: ${FORM_SECRET.substring(0, 5)}...)`);

        // 3. Direct Call to Supabase (Matching your backend logic)
        const res = await fetch(SUPABASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-form-secret": FORM_SECRET
            },
            body: JSON.stringify(body),
        });

        if (res.status === 429) {
            return NextResponse.json({ error: "Too many submissions" }, { status: 429 });
        }

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });

    } catch (error: any) {
        console.error("🚨 Proxy Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
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
