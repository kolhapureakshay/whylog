import { config } from '../core/config';
import { InsightCard } from '../core/heuristics';
import { makeRequest } from '../core/fetch';

export async function explainWithAI(error: Error, insight: InsightCard, codeSnippet?: string): Promise<InsightCard> {
    const aiConfig = config.get().ai;
    if (!aiConfig?.enabled) {
        return insight; // AI disabled
    }

    try {
        // Lightweight generic fetch implementation (No OpenAI SDK bloat)
        const prompt = `You are an expert JS/TS debugger. You are given an unknown error trace.
        
Error: ${error.name} - ${error.message}
Stack: ${error.stack}
${codeSnippet ? `Source Snippet:\n${codeSnippet}` : ''}

Explain the root cause in simple plain English (1-2 sentences max), then provide 1-3 actionable bullet points to fix it. Return ONLY a JSON object: {"why": "explanation...", "fix": ["step 1", "step 2"]}`;

        let endpoint = aiConfig.endpoint;
        let model = aiConfig.model;
        let headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        let body: any = {};
        
        const provider = aiConfig.provider || 'openai';

        if (provider === 'openai' || provider === 'grok' || provider === 'custom') {
            endpoint = endpoint || (provider === 'grok' ? 'https://api.x.ai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions');
            model = model || (provider === 'grok' ? 'grok-beta' : 'gpt-3.5-turbo');
            if (aiConfig.apiKey) headers['Authorization'] = `Bearer ${aiConfig.apiKey}`;
            Object.assign(headers, aiConfig.headers || {});
            
            body = {
                model,
                messages: [{ role: 'system', content: prompt }],
                temperature: 0.1
            };
        } else if (provider === 'gemini') {
            // Gemini Native API (Google AI Studio)
            endpoint = endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${aiConfig.apiKey}`;
            Object.assign(headers, aiConfig.headers || {});
            body = {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 }
            };
        } else if (provider === 'anthropic') {
            // Anthropic Native API (Claude)
            endpoint = endpoint || 'https://api.anthropic.com/v1/messages';
            model = model || 'claude-3-haiku-20240307';
            if (aiConfig.apiKey) headers['x-api-key'] = aiConfig.apiKey;
            headers['anthropic-version'] = '2023-06-01';
            headers['anthropic-dangerously-allow-browser'] = 'true';
            Object.assign(headers, aiConfig.headers || {});
            body = {
                model,
                max_tokens: 1024,
                temperature: 0.1,
                system: 'You are an expert JS/TS debugger. Return ONLY a JSON object.',
                messages: [{ role: 'user', content: prompt }]
            };
        }

        const response: any = await makeRequest(endpoint as string, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error("AI Explainer API Error:", response.status, await response.text());
            return insight;
        }

        const data: any = await response.json();
        let content = '';

        if (provider === 'gemini') {
            content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        } else if (provider === 'anthropic') {
            content = data.content?.[0]?.text;
        } else {
            content = data.choices?.[0]?.message?.content;
        }
        
        if (content) {
            // Strip markdown block formatting if the AI enclosed JSON in tags
            content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(content);
            if (parsed.why) insight.why = parsed.why + ` ✨ (${provider.toUpperCase()} AI)`;
            if (parsed.fix && Array.isArray(parsed.fix)) insight.fix = parsed.fix;
        }

    } catch (e) {
        // Safely fail back to standard insight if AI errors out (rate limit, etc)
        console.error("AI Explainer Error:", e);
    }

    return insight;
}
