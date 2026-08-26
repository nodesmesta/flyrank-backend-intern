'use client';

import React, { FormEvent, useState } from 'react';
import { submitContact } from '../lib/contactForm';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [state, setState] = useState<SubmitState>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('submitting');

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await submitContact({
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        message: String(data.get('message') ?? ''),
      });
      form.reset();
      setState('success');
    } catch {
      setState('error');
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label htmlFor="contact-name">Name</label>
      <input id="contact-name" name="name" type="text" autoComplete="name" required />

      <label htmlFor="contact-email">Email</label>
      <input id="contact-email" name="email" type="email" autoComplete="email" required />

      <label htmlFor="contact-message">Message</label>
      <textarea id="contact-message" name="message" rows={6} required />

      <button className="btn" type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending…' : 'Send message'}
      </button>

      <p className={`form-status ${state}`} aria-live="polite">
        {state === 'success' && 'Thanks — your message has been sent.'}
        {state === 'error' && 'Your message could not be sent. Please try again.'}
      </p>
    </form>
  );
}
