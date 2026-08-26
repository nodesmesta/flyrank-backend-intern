import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ContactForm from '../src/components/ContactForm';

test('ContactForm renders the three required fields and submit button', () => {
  const html = renderToStaticMarkup(<ContactForm />);

  assert.match(html, /<input(?=[^>]*name="name")(?=[^>]*required)[^>]*>/);
  assert.match(html, /<input(?=[^>]*name="email")(?=[^>]*required)[^>]*>/);
  assert.match(html, /<textarea(?=[^>]*name="message")(?=[^>]*required)[^>]*>/);
  assert.match(html, />Send message</);
});
