// api/upload-handler.js - client upload token/callback (bypasses 4.5MB body limit)
const { handleUpload } = require('@vercel/blob/client');

async function getJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : null;
    if (!body) body = await getJsonBody(req);
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/*'],
        tokenPayload: JSON.stringify({ pathname })
      }),
      onUploadCompleted: async ({ blob }) => {
        // Optional: e.g. save to DB; runs when Blob calls back
      }
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
