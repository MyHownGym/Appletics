import { corsHeaders } from '../_shared/cors.ts';
import { renderBillingReturnPage } from '../_shared/billingReturn.ts';
Deno.serve(req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  return new Response(renderBillingReturnPage(req.url), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
