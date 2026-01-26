import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST'
        }
      }
    );
  }

  try {
    const { email, phone, message } = await request.json();

    if (!email || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Email och meddelande krävs' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Kontakt <onboarding@resend.dev>',
        to: [env.TO_EMAIL],
        subject: 'Nytt meddelande från kontaktformuläret',
        html: `
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefon:</strong> ${phone || '-'}</p>
          <p><strong>Meddelande:</strong></p>
          <p>${message}</p>
        `
      })
    });

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Misslyckades att skicka mail' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Serverfel' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
