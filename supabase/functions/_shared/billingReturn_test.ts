import { hostedBillingReturnScheme, renderBillingReturnPage, resolveBillingReturnUrl } from './billingReturn.ts';
function assert(value: boolean, message: string): asserts value { if (!value) throw new Error(message); }
const backend = 'https://example.backend.onspace.ai';
const bridge = `${backend}/functions/v1/appletics-billing-return`;
Deno.test('old and preview return pages do not launch an unregistered custom scheme', () => {
  for (const mode of ['', '?mode=preview', '?mode=web', '?mode=javascript:evil']) {
    const page = renderBillingReturnPage(`${bridge}${mode}`);
    assert(!page.includes(`href="${hostedBillingReturnScheme}`), 'Preview and legacy pages require manual close, not a native launch.');
    assert(!page.includes('onspaceapp://'), 'Legacy host scheme must not be launched from Safari.');
    assert(page.includes('href="#return-help"'), 'Manual return action must lead to visible instructions.');
    assert(page.includes('Vérifier le paiement'), 'Closing the page must still be followed by a real Stripe verification.');
  }
});
Deno.test('new native sessions have an isolated callback and never assert a paid subscription', () => {
  for (const mode of ['ios-session', 'android-app']) {
    const page = renderBillingReturnPage(`${bridge}?mode=${mode}&result=success`);
    assert(page.includes(`href="${hostedBillingReturnScheme}?source=hosted&amp;result=success"`), 'Native session must receive its own fixed callback.');
    assert(page.includes('Cette page ne confirme pas votre abonnement.'), 'A success query cannot grant an entitlement.');
    const cancelled = renderBillingReturnPage(`${bridge}?mode=${mode}&result=cancelled`);
    assert(cancelled.includes('result=cancelled') && cancelled.includes('Paiement test annulé'), 'Cancellation must retain an explicit result.');
  }
});
Deno.test('native redirects stay on the bridge; web redirects stay on the requesting HTTPS origin', () => {
  const native = new URL(resolveBillingReturnUrl(backend, 'https://evil.example', 'https://evil.example/billing-return', 'ios-session', 'de'));
  assert(native.origin === backend && native.searchParams.get('mode') === 'ios-session' && native.searchParams.get('lang') === 'de', 'Native callback cannot be replaced with a client-provided domain.');
  const web = resolveBillingReturnUrl(backend, 'https://app.example', 'https://app.example/billing-return?result=success#fake', 'web', 'fr');
  assert(web === 'https://app.example/billing-return', 'Web return query and fragment must be cleared before Stripe adds the result.');
  for (const candidate of ['javascript:alert(1)', 'http://app.example/billing-return', 'https://other.example/billing-return', 'https://name:pass@app.example/billing-return']) {
    assert(new URL(resolveBillingReturnUrl(backend, 'https://app.example', candidate, 'web', 'fr')).origin === backend, 'Untrusted web targets must fall back to the bridge.');
  }
});
Deno.test('return copy is translated and query strings cannot inject HTML', () => {
  assert(renderBillingReturnPage(`${bridge}?lang=de`).includes('So kehren Sie zu Appletics zurück'), 'German copy missing.');
  assert(renderBillingReturnPage(`${bridge}?lang=it`).includes('Come tornare ad Appletics'), 'Italian copy missing.');
  const page = renderBillingReturnPage(`${bridge}?lang=%3Cscript%3E&mode=%3Cscript%3E&returnUrl=javascript:alert(1)&session_id=secret`);
  assert(page.includes('lang="fr"') && !page.includes('<script') && !page.includes('javascript:') && !page.includes('session_id'), 'Page must only interpolate allowlisted navigation values, not untrusted parameters.');
});
const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFile(new URL(path, root));
Deno.test('iOS browser session result is consumed and verified with Stripe', async () => {
  const [browser, context, client, configText, server, callback] = await Promise.all([
    read('services/billingBrowserService.ts'), read('contexts/BillingContext.tsx'), read('services/billingService.ts'), read('app.json'), read('supabase/functions/appletics-billing/index.ts'), read('services/billingCallbackService.ts'),
  ]);
  assert(browser.includes('WebBrowser.openAuthSessionAsync(url, BILLING_HOSTED_RETURN_SCHEME)'), 'iOS must intercept the callback instead of asking ordinary Safari to launch it.');
  assert(browser.includes('Application.applicationId === packageName'), 'Android preview must not be assumed to own the app scheme.');
  assert(context.includes('const outcome = await openBillingBrowser(result.data.url)') && context.includes('await refresh(true);'), 'Promise return must trigger authenticated server verification even without Linking.');
  assert(client.includes('returnMode: getBillingBrowserReturnMode()'), 'Client must tell the bridge which return flow it opened.');
  const config = JSON.parse(configText);
  assert(config.expo.scheme.includes('appletics') && config.expo.scheme.includes('onspaceapp'), 'The new app scheme must be registered without removing existing callbacks.');
  assert(callback.includes('base === BILLING_HOSTED_RETURN_SCHEME || base === BILLING_RETURN_SCHEME'), 'Callback requires an exact route, not a vulnerable prefix.');
  assert(server.includes('session.success_url?.startsWith(`${baseReturn}${separator}`)'), 'Checkout cannot reuse a session with another environment’s return URL.');
  assert(server.includes('/^(sk|rk)_test_/'), 'Fixing navigation must not enable live charges.');
});
