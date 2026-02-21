export async function makeRequest(url: string, options: any = {}): Promise<any> {
    // 1. If native fetch exists (Browser, or Node 18+), prefer using it natively
    if (typeof fetch !== 'undefined') {
        const res = await fetch(url, options);
        let text = '';
        try {
            text = await res.text();
            return {
                ok: res.ok,
                status: res.status,
                json: () => JSON.parse(text),
                text: () => text
            };
        } catch(e) {
            return { ok: res.ok, status: res.status, json: () => ({}), text: () => text };
        }
    }

    // 2. Fallback to node http/https for Node 14 and 16
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        return new Promise((resolve, reject) => {
            const isHttps = url.startsWith('https');
            const lib = isHttps ? require('https') : require('http');

            const reqOptions = {
                method: options.method || 'GET',
                headers: options.headers || {}
            };

            const req = lib.request(url, reqOptions, (res: any) => {
                let data = '';
                res.on('data', (chunk: any) => data += chunk);
                res.on('end', () => {
                    const ok = res.statusCode >= 200 && res.statusCode < 300;
                    resolve({
                        ok,
                        status: res.statusCode,
                        json: () => JSON.parse(data),
                        text: () => data
                    });
                });
            });

            req.on('error', (e: any) => reject(e));

            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    throw new Error('No HTTP transport available (fetch or node http).');
}
