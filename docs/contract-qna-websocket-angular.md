# Q&A WebSocket Integration Guide (Angular Client)

## Overview

The backend provides a WebSocket API for real-time Q&A on contracts. This allows Angular clients to ask questions about any uploaded contract and receive AI-generated answers instantly.

- **WebSocket Namespace:** `/contract-chat`
- **Q&A Event:** `askQuestion`
- **Response Event:** `qnaAnswer`
- **Error Event:** `error`

---

## 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

---

## 2. Connect to the WebSocket Server

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://<YOUR_BACKEND_HOST>:<PORT>/contract-chat', {
  transports: ['websocket'],
});
```
- Replace `<YOUR_BACKEND_HOST>:<PORT>` with your backend server address.

---

## 3. Ask a Question About a Contract

Send a question using the `askQuestion` event:

```typescript
socket.emit('askQuestion', {
  contractId: '<CONTRACT_ID>',
  question: 'What is the governing law of this contract?',
});
```
- Replace `<CONTRACT_ID>` with the actual contract ID.

---

## 4. Listen for the Answer

Listen for the `qnaAnswer` event to receive the AI's answer:

```typescript
socket.on('qnaAnswer', (data) => {
  // data: { answer: string, confidence: number }
  console.log('AI Answer:', data.answer);
  console.log('Confidence:', data.confidence);
});
```

---

## 5. Handle Errors

Listen for the `error` event for any issues:

```typescript
socket.on('error', (err) => {
  // err: { message: string }
  console.error('Q&A Error:', err.message);
});
```

---

## 6. Disconnect When Done

```typescript
socket.disconnect();
```

---

## 7. Angular Service Example

Here's a simple Angular service for Q&A:

```typescript
// qna.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QnAService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://<YOUR_BACKEND_HOST>:<PORT>/contract-chat', {
      transports: ['websocket'],
    });
  }

  askQuestion(contractId: string, question: string): Observable<{ answer: string, confidence: number }> {
    return new Observable(observer => {
      this.socket.emit('askQuestion', { contractId, question });
      this.socket.once('qnaAnswer', (data) => {
        observer.next(data);
        observer.complete();
      });
      this.socket.once('error', (err) => {
        observer.error(err);
      });
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
```

---

## 8. Usage in a Component

```typescript
// In your component
this.qnaService.askQuestion(contractId, userQuestion).subscribe({
  next: (data) => {
    this.answer = data.answer;
    this.confidence = data.confidence;
  },
  error: (err) => {
    this.errorMessage = err.message;
  }
});
```

---

## Notes

- The backend must be running and accessible from the client.
- The contract must have its `fullText` property set, or the backend will return an error.
- You can reuse the same socket connection for multiple Q&A or chat events.

---

**For further customization or advanced usage (e.g., streaming, session management), refer to the backend gateway and service code.** 