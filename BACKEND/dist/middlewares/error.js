export function errorHandler(err, _req, res, _next) {
    console.error('[BACKEND] Error:', err?.message || err);
    const status = err?.status || 500;
    return res.status(status).json({ success: false, message: 'server-error', error: err?.message || String(err) });
}
