const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const read = (entry) => fs.readFileSync(path.join(rootDir, entry), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const pixel = read('src/scripts/meta-pixel-consent.js');
const frontend = read('src/scripts/script.js');
const index = read('index.html');
const privacy = read('politica-de-privacidade.html');
const vercel = read('vercel.json');

assert(pixel.includes("const PIXEL_ID = '653689209335433'"), 'Pixel ID incorreto ou ausente.');
assert(pixel.includes("readConsent()?.status !== 'accepted'"), 'Pixel nao esta bloqueado por consentimento explicito.');
assert(pixel.includes("window.fbq('track', 'PageView')"), 'PageView ausente.');
assert(pixel.includes('initializedPixels.has(PIXEL_ID)'), 'Protecao contra inicializacao duplicada do Pixel ausente.');
assert((pixel.match(/window\.fbq\('init', PIXEL_ID\)/g) || []).length === 1, 'A inicializacao do Pixel deve existir em um unico ponto protegido.');
assert(pixel.includes('pageViewTracked = false;'), 'Novo ciclo de aceite nao libera um novo PageView.');
assert(!pixel.includes('document.getElementById(META_SCRIPT_ID)?.remove()'), 'Revogacao remove o loader e permite reinicializacao duplicada na mesma pagina.');
assert(pixel.includes("window.fbq('track', 'Lead')"), 'Lead ausente.');
assert(pixel.includes('if (leadTracked || !pixelEnabled'), 'Protecao contra Lead duplicado ausente.');
assert((frontend.match(/REROUTE_MARKETING\?\.trackLead\(\)/g) || []).length === 1, 'O fluxo do formulario possui mais de um disparo de Lead.');
assert(!/emai|whatsapp|phone|name|health|sa[uú]de/i.test(pixel.match(/const trackLead[\s\S]*?\n  };/)?.[0] || ''), 'Lead usa dado pessoal ou sensivel.');
assert(frontend.indexOf("responseData?.success !== true") < frontend.indexOf('window.REROUTE_MARKETING?.trackLead()'), 'Lead ocorre antes da confirmacao do backend.');
assert(!index.includes('connect.facebook.net'), 'Meta Pixel foi embutido estaticamente no HTML.');
assert(index.includes('data-cookie-preferences'), 'Preferencias de cookies ausentes do rodape.');
assert(privacy.includes('Meta Pixel') && privacy.includes('revogar'), 'Politica de Privacidade nao explica o Meta Pixel e a revogacao.');
assert(vercel.includes('https://connect.facebook.net') && vercel.includes('https://www.facebook.com'), 'CSP nao permite os endpoints necessarios da Meta.');

console.log('Meta Pixel consent test: PASS');
