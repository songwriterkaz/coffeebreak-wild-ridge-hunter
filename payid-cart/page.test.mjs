import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const game = require('./game-cart.js');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('this standalone page reuses the shared PayID cart', () => {
  const block = html.match(/<!--cb-game-cart-start-->([\s\S]*?)<!--cb-game-cart-end-->/);
  assert.ok(block);
  assert.equal(block[1].includes('!'), false);
  assert.doesNotMatch(block[1], /headspace|paypal|gumroad|payhip|ko-fi/i);
  assert.match(block[1], /payid-cart\/cart\.js/);
  assert.match(block[1], /payid-cart\/game-cart\.js/);
  assert.match(block[1], /payid-cart\/game-mount\.js/);
  const data = JSON.parse(block[1].match(/<script type="application\/json" id="cb-game-cart-data">([\s\S]*?)<\/script>/)[1]);
  assert.equal(data.currency === 'AUD' || data.currency === 'USD' || data.currency == null, true);
  const session = game.createSession(data);
  if (!data.currency) {
    assert.equal(game.add(session, data.items[0].id).ok, false);
    assert.match(game.view(session).gap, /Price coming soon\. No payment is requested\./);
    return;
  }
  assert.equal(game.add(session, data.items[0].id).ok, true);
  assert.equal(game.setQty(session, data.items[0].id, 2).ok, true);
  const view = game.view(session);
  const unit = Number(data.items[0].amount);
  assert.equal(view.totalLabel, (unit * 2).toFixed(2));
  assert.equal(view.currency, data.currency);
  assert.equal(view.paid, false);
  assert.equal(view.confirmed, false);
  assert.equal(view.bankVerified, false);
  assert.equal(view.paymentLabel, 'Pay by PayID (Teachers Mutual Bank): darkokaz@gmx.com');
  if (data.currency !== 'AUD') assert.equal(view.audAmountMinor, null);
  assert.equal(game.remove(session, data.items[0].id).length, 0);
  assert.match(html, /logo\.png/);
  assert.match(html, /https:\/\/www\.tesla\.com/);
  assert.match(html, /https:\/\/www\.starlink\.com/);
  assert.match(html, /cbreport\.js/);
  assert.match(html, /third-party|keeps all rights/i);
  assert.match(html, /id="(?:best|hud|ofs)"/);
});
