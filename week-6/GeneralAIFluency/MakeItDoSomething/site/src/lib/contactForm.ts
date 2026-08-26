export const FORM_ENDPOINT = 'https://formspree.io/f/mzepnodv';

export type ContactFields = {
  name: string;
  email: string;
  message: string;
};

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export async function submitContact(
  fields: ContactFields,
  send: Fetcher = fetch,
): Promise<void> {
  const body = new FormData();
  body.set('name', fields.name);
  body.set('email', fields.email);
  body.set('message', fields.message);

  const response = await send(FORM_ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body,
  });

  if (!response.ok) {
    throw new Error('Your message could not be sent. Please try again.');
  }
}
