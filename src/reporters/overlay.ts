import { InsightCard } from '../core/heuristics';

export function showOverlay(error: Error, insight: InsightCard, payload: any) {
    if (typeof document === 'undefined') return;

    let overlay = document.getElementById('whylog-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'whylog-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0', left: '0', right: '0', bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#fff',
            fontFamily: 'monospace, sans-serif',
            zIndex: '999999',
            padding: '40px',
            overflowY: 'auto'
        });
        document.body.appendChild(overlay);
    }

    const breadcrumbsHtml = payload.breadcrumbs && payload.breadcrumbs.length > 0 
        ? `<div style="margin-bottom: 20px;">
            <h3 style="color: #aaa; margin-bottom: 5px;">🍞 Trail:</h3>
            <ul style="padding-left: 20px;">${payload.breadcrumbs.map((b: any) => `<li><span style="color:#888">${b.timestamp}</span> <b>${b.category}</b>: ${b.message}</li>`).join('')}</ul>
           </div>`
        : '';

    overlay.innerHTML = `
        <div style="background: #222; padding: 30px; border-radius: 8px; border-left: 5px solid #e00; box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-width: 800px; margin: 0 auto;">
            <h2 style="color: #f66; margin-top: 0; font-family: sans-serif;">❌ ${insight.type.toUpperCase()}: ${error.message}</h2>
            
            <div style="margin-bottom: 20px; background: #111; padding: 15px; border-radius: 6px;">
                <h3 style="color: #aaa; margin-top: 0; margin-bottom: 5px;">🧠 Why:</h3>
                <p style="font-size: 16px; margin: 0; font-family: sans-serif;">${insight.why}</p>
            </div>
            
            ${insight.fix.length > 0 ? `
            <div style="margin-bottom: 20px; background: #111; padding: 15px; border-radius: 6px;">
                <h3 style="color: #aaa; margin-top: 0; margin-bottom: 5px;">💡 How to Fix:</h3>
                <ul style="padding-left: 20px; margin: 0; font-family: sans-serif;">${insight.fix.map(f => `<li>${f}</li>`).join('')}</ul>
            </div>
            ` : ''}
            
            ${breadcrumbsHtml}

            <div style="margin-bottom: 20px;">
                <h3 style="color: #aaa; margin-bottom: 5px;">📍 Location:</h3>
                <p style="margin: 0; color: #ffeb3b;">${payload.location || 'Unknown'}</p>
            </div>
            
            <button onclick="document.getElementById('whylog-overlay').remove()" style="background: #444; color: white; border: none; padding: 8px 16px; cursor: pointer; border-radius: 4px; font-weight: bold;">Dismiss</button>
        </div>
    `;
}
