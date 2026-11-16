export async function business<T = any>(action: string, body?: unknown): Promise<T> { const r = await fetch('/api/business-v31/' + action, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }); const value = await r.json(); if (!r.ok)
    throw Error(value.error || '操作失败，请重试。'); return value; }
