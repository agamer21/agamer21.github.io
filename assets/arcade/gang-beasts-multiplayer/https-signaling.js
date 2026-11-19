// PeerJS uses this WebSocket-shaped transport for room signaling.
// Video and controller input still travel over WebRTC.
class ArcadeSignalingSocket {
  readyState = 0;
  requests = new AbortController();
  outgoing = Promise.resolve();

  constructor(address) {
    const url = new URL(address);
    this.endpoint = 'https://' + url.host + '/rooms/';
    this.open(url.searchParams.get('id'));
  }

  async request(path, body) {
    const headers = {};
    if (this.key) headers.Authorization = 'Bearer ' + this.key;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const response = await fetch(this.endpoint + path, {
      method: 'POST',
      headers,
      body,
      signal: this.requests.signal
    });
    if (!response.ok) throw new Error('Room service returned HTTP ' + response.status);
    return response;
  }

  async open(id) {
    try {
      const response = await this.request('open', JSON.stringify({ id }));
      const { key } = await response.json();
      if (this.readyState !== 0) return;
      this.key = key;
      this.readyState = 1;
      this.onopen?.();
      while (this.readyState === 1) {
        const messages = await (await this.request('poll')).json();
        for (const data of messages) {
          if (this.readyState !== 1) break;
          this.onmessage?.({ data });
        }
      }
    } catch (error) {
      this.fail(error);
    }
  }

  send(message) {
    this.outgoing = this.outgoing.then(async () => {
      if (this.readyState === 1) await this.request('send', message);
    }).catch(error => this.fail(error));
  }

  fail(error) {
    if (this.readyState === 3) return;
    console.warn('Gang Beasts room signaling', error);
    this.close();
    this.onclose?.();
  }

  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.requests.abort();
    if (this.key) {
      fetch(this.endpoint + 'close', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + this.key },
        keepalive: true
      }).catch(() => {});
    }
  }
}

globalThis.ArcadeSignalingSocket = ArcadeSignalingSocket;
