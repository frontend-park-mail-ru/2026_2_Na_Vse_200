import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { FakeElement } from './helpers/fakeDom.js';

test('registration validates, blocks duplicates, recovers after errors and ignores stale responses', async () => {
    const server = await createServer({ server: { middlewareMode: true } });
    const originalFetch = globalThis.fetch;
    try {
        const { SignupPage } = await server.ssrLoadModule('/src/pages/SignupPage.jsx');
        const { createElement, render } = await server.ssrLoadModule('/index.js');
        const root = new FakeElement('root');
        let registered = 0;
        const page = () => render(createElement(SignupPage, { onRegistered: () => registered++ }), root);
        page();
        let form = root.find(node => node.tagName === 'FORM');
        let requests = 0;
        let respond;
        globalThis.fetch = () => { requests++; return new Promise(resolve => { respond = resolve; }); };
        const submit = () => form.listeners.get('submit')({ preventDefault() {}, currentTarget: form });
        await submit();
        assert.equal(requests, 0, 'invalid fields never reach API');
        assert.equal(form.elements.namedItem('email').attributes.get('aria-invalid'), 'true');
        const fill = () => {
            form.elements.namedItem('display_name').value = 'Анна';
            form.elements.namedItem('email').value = 'anna@example.com';
            form.elements.namedItem('password').value = 'password1';
        };
        fill();
        let pending = submit();
        await submit();
        assert.equal(requests, 1, 'pending submission cannot be repeated');
        assert.equal(root.find(node => node.tagName === 'BUTTON').disabled, true);
        respond(Response.json({ error: { code: 'email_taken' } }, { status: 409 }));
        await pending;
        assert.equal(root.find(node => node.tagName === 'BUTTON').disabled, false);
        assert.equal(form.elements.namedItem('email').value, 'anna@example.com');
        assert.equal(form.elements.namedItem('email').attributes.get('aria-invalid'), 'true');
        pending = submit();
        respond(new Response('{}', { status: 201 }));
        await pending;
        assert.equal(registered, 1);
        assert.equal(form.elements.namedItem('password').value, '');

        // Remount, start another request and navigate away before it finishes.
        render(createElement('div', null, 'Other page'), root);
        page();
        form = root.find(node => node.tagName === 'FORM');
        fill();
        pending = submit();
        render(createElement('div', null, 'Other page'), root);
        respond(new Response('{}', { status: 201 }));
        await pending;
        assert.equal(registered, 1, 'late response does not navigate away from current page');
    } finally {
        globalThis.fetch = originalFetch;
        await server.close();
    }
});
