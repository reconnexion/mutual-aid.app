import { useCallback } from 'react';
import { fetchJson, resolveContainerUri } from '@activitypods/refine-providers/utils';

import { authProvider } from '../providers';
import { grantPublicRead } from '../utils/grantPublicRead';

/** Upload a raw file to the user's Pod, returning its URL — used for an ad's photos. Grants
 *  public read right after upload so the photos show up for whoever the ad gets shared with
 *  (see `grantPublicRead`'s doc comment for why that isn't automatic here). */
const useUploadImage = () => {
  return useCallback(async (file: File): Promise<string> => {
    const session = authProvider.getSession();
    if (!session) throw new Error('Not authenticated');

    const containerUri = await resolveContainerUri(
      'file',
      { types: ['http://semapps.org/ns/core#File'] },
      session.webId,
      session.token,
      ['https://www.w3.org/ns/activitystreams']
    );

    const { headers } = await fetchJson(
      containerUri,
      { method: 'POST', body: file, headers: { 'Content-Type': file.type } },
      session.token
    );

    const location = headers.get('Location');
    if (!location) throw new Error('The Pod did not return a Location header when uploading the file');
    await grantPublicRead(location, session.token);
    return location;
  }, []);
};

export default useUploadImage;
