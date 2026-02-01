// api/upload-handler.js - client upload token/callback (bypasses 4.5MB body limit)
const { handleUpload } = require('@vercel/blob/client');

async function getJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return sendJson(res, 503, {
      error: 'Blob upload not configured. Add BLOB_READ_WRITE_TOKEN in Vercel project Environment Variables (Storage → your Blob store).'
    });
  }

  let body;
  try {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      body = req.body;
    } else if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else if (typeof req.json === 'function') {
      body = await req.json();
    } else {
      body = await getJsonBody(req);
    }
  } catch (e) {
    return sendJson(res, 400, { error: 'Invalid JSON body: ' + (e.message || 'parse error') });
  }

  if (!body || typeof body.type !== 'string') {
    return sendJson(res, 400, { error: 'Missing body.type (expected blob.generate-client-token)' });
  }

  try {
    const result = await handleUpload({
      token,
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/*'],
        tokenPayload: JSON.stringify({ pathname })
      }),
      onUploadCompleted: async () => {}
    });
    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 400, { error: error.message || 'Failed to generate client token' });
  }
};
