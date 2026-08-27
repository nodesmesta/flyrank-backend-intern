import assert from 'node:assert/strict';
import test from 'node:test';
import { FORM_ENDPOINT, submitContact } from '../src/lib/contactForm';

test('submitContact posts every contact field to Formspree', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  const fakeFetch = async (url: string, init: RequestInit) => {
    requestUrl = url;
    requestInit = init;
    return new Response(null, { status: 200 });
  };

  await submitContact(
    { name: 'Test User', email: 'test@example.com', message: 'Hello from the test.' },
    fakeFetch,
  );

  assert.equal(requestUrl, FORM_ENDPOINT);
  assert.equal(requestInit?.method, 'POST');
  assert.deepEqual(requestInit?.headers, { Accept: 'application/json' });
  assert.ok(requestInit?.body instanceof FormData);
  assert.equal(requestInit.body.get('name'), 'Test User');
  assert.equal(requestInit.body.get('email'), 'test@example.com');
  assert.equal(requestInit.body.get('message'), 'Hello from the test.');
});

test('submitContact rejects an unsuccessful Formspree response', async () => {
  const fakeFetch = async () => new Response(null, { status: 422 });

  await assert.rejects(
    submitContact(
      { name: 'Test User', email: 'test@example.com', message: 'Invalid request.' },
      fakeFetch,
    ),
    /could not be sent/i,
  );
});
