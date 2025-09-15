// src/app/api/genkit/[...slug]/route.ts
// Minimal compatibility handler that dispatches registered Genkit flows by name.
// Avoids top-level evaluation issues and outdated APIs.
import { NextResponse } from 'next/server';
import { ai } from '@/app/genkit';
import '@/app/genkit-init';
export const dynamic = 'force-dynamic';
function listFlows() {
    try {
        const list = ai?.flows;
        return Array.isArray(list) ? list : [];
    }
    catch {
        return [];
    }
}
function findFlowBySlug(slug) {
    const name = (slug || []).join('/');
    const flows = listFlows();
    return flows.find((f) => f?.name === name || f?.config?.name === name || f?.ref?.name === name);
}
export async function GET(_req, { params }) {
    const f = findFlowBySlug(params?.slug || []);
    if (!f)
        return NextResponse.json({ error: 'FLOW_NOT_FOUND' }, { status: 404 });
    // No input on GET; run with empty input if allowed
    try {
        const result = await (f.run?.({}) ?? f({}));
        return NextResponse.json({ result });
    }
    catch (e) {
        return NextResponse.json({ error: e?.message || 'FLOW_ERROR' }, { status: 500 });
    }
}
export async function POST(req, { params }) {
    const f = findFlowBySlug(params?.slug || []);
    if (!f)
        return NextResponse.json({ error: 'FLOW_NOT_FOUND' }, { status: 404 });
    let body = {};
    try {
        body = await req.json();
    }
    catch { }
    const input = body?.data ?? body ?? {};
    try {
        if (typeof f.stream === 'function' && req.headers.get('accept') === 'text/event-stream') {
            const encoder = new TextEncoder();
            const { readable, writable } = new TransformStream();
            const writer = writable.getWriter();
            (async () => {
                try {
                    const { output, stream } = f.stream(input);
                    for await (const chunk of stream) {
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ message: chunk })}\n\n`));
                    }
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ result: await output })}\n\n`));
                }
                catch (err) {
                    await writer.write(encoder.encode(`error: ${JSON.stringify({ message: err?.message || 'FLOW_ERROR' })}\n\n`));
                }
                finally {
                    await writer.write(encoder.encode('END'));
                    await writer.close();
                }
            })();
            return new NextResponse(readable, {
                status: 200,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                    'Transfer-Encoding': 'chunked',
                },
            });
        }
        const result = await (f.run?.(input) ?? f(input));
        return NextResponse.json({ result });
    }
    catch (e) {
        return NextResponse.json({ error: e?.message || 'FLOW_ERROR' }, { status: 500 });
    }
}
