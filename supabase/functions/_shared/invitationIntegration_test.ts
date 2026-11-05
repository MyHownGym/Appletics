// Invitation source-contract checks, not device messaging tests.
// Run: deno test --allow-read supabase/functions/_shared/invitationIntegration_test.ts
function assertInvitation(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const root = new URL('../../../', import.meta.url);
const readInvitationFile = (path: string) => Deno.readTextFile(new URL(path, root));

Deno.test('outgoing invitations share the official website, not an invented store or join URL', async () => {
  const [links, service, page, group] = await Promise.all([
    readInvitationFile('constants/links.ts'), readInvitationFile('services/invitationService.ts'),
    readInvitationFile('app/athlete-add.tsx'), readInvitationFile('app/shared-group.tsx'),
  ]);
  assertInvitation(links.includes("website: 'https://www.appletics.ch/'"), 'The official website must be the invitation source.');
  assertInvitation(service.includes('link: appleticsLinks.website') && service.includes('Invitation Appletics'), 'Email and SMS must use Appletics and the shared website constant.');
  assertInvitation(!service.includes('apps.apple.com') && !service.includes('/join?'), 'Do not fabricate unavailable download or web registration links.');
  assertInvitation(page.includes('invitation.sendEmail(inviteEmail') && page.includes('invitation.sendSms(invitePhone'), 'Athlete email and SMS must use the same invitation service.');
  assertInvitation(group.includes('invitation.sendEmail(item.email') && group.includes('role: item.role'), 'Coach and athlete group invitations must use the same branded message service.');
  assertInvitation(service.includes('Le lien App Store sera disponible après publication.'), 'Unavailable store link must be disclosed, not represented as working.');
});
Deno.test('invitation composer validates recipients, encodes message text, and handles native SMS separators', async () => {
  const service = await readInvitationFile('services/invitationService.ts');
  assertInvitation(service.includes('Appletics-Einladung') && service.includes('Invito Appletics'), 'German and Italian branded messages are required.');
  assertInvitation(service.includes('encodeURIComponent(text.subject)') && service.includes('encodeURIComponent(text.emailBody)'), 'Email text must be encoded without modifying the recipient.');
  assertInvitation(service.includes("platform === 'ios' ? '&' : '?'"), 'Native SMS separator must match the platform.');
  assertInvitation(service.includes('encodeURIComponent(text.smsBody)'), 'SMS body must be encoded.');
  assertInvitation(service.includes('return null;'), 'Invalid recipients cannot generate contact links.');
  assertInvitation(!service.includes('getSupabaseClient') && !service.includes('functions.invoke'), 'Message composition must not silently grant group access or auto-send mail.');
});
