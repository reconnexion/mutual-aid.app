/** Uploaded files are plain LDP resources, not ActivityPub activities — so unlike comments/likes
 *  (see `AS_PUBLIC` in `hooks/useOutbox.ts`), there's no `to`/`cc` addressing that makes the Pod
 *  grant read access automatically. An ad's photos need to be readable by whoever the ad gets
 *  shared with, so we grant public read explicitly, right after upload, using the uploader's own
 *  Solid session (the standard WAC ACL PATCH protocol — same one `pod-permissions.add` uses
 *  server-side, but that only works signed as the Pod owner, which a browser session already is
 *  and a backend app service isn't). Best-effort: failures here shouldn't block the upload. */
export const grantPublicRead = async (resourceUri: string, token: string): Promise<void> => {
  try {
    const headResponse = await fetch(resourceUri, { method: 'HEAD', headers: { Authorization: `Bearer ${token}` } });
    const linkHeader = headResponse.headers.get('Link');
    const aclMatch = linkHeader
      ?.split(',')
      .map(part => part.trim())
      .find(part => /rel="?acl"?/.test(part))
      ?.match(/<([^>]+)>/);
    if (!aclMatch) return;
    const aclUri = new URL(aclMatch[1], resourceUri).toString();

    await fetch(aclUri, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/ld+json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        '@context': {
          '@base': aclUri,
          acl: 'http://www.w3.org/ns/auth/acl#',
          foaf: 'http://xmlns.com/foaf/0.1/',
          'acl:agentClass': { '@type': '@id' },
          'acl:mode': { '@type': '@id' },
          'acl:accessTo': { '@type': '@id' }
        },
        '@graph': [
          {
            '@id': '#Read',
            '@type': 'acl:Authorization',
            'acl:agentClass': 'foaf:Agent',
            'acl:accessTo': resourceUri,
            'acl:mode': 'acl:Read'
          }
        ]
      })
    });
  } catch {
    // Best-effort — the upload itself already succeeded either way.
  }
};
