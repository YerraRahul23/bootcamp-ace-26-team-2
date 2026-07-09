export async function sendMessage(question, documentId = null) {
  const body = { query: question };
  if (documentId) {
    body.document_id = documentId;
  }
  const response = await fetch('/chat/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error('Failed to get response from the server');
  }
  return response.json();
}
