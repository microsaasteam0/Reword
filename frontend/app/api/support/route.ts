import { NextResponse } from "next/server";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUPABASE_URL = "https://ldewwmfkymjmokopulys.supabase.co/functions/v1/submit-support";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validation
        const { product, category, message, user_email } = body;
        // 2. Forward to Python backend
        const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "https://reword-api.vercel.app";

        const backendUrl = rawBackendUrl.replace(/\/+$/, '');
        const targetUrl = `${backendUrl}/support`;

        console.log(`📡 Forwarding support ticket to Python Backend: ${targetUrl}`);

        const res = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(`❌ Python Backend Error (${res.status}):`, data);
        }

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
