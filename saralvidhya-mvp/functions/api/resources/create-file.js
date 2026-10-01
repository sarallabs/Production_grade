import { commitGitHubFile, getFileSHA, corsHeaders } from './_github.js';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const branch = env.GITHUB_TARGET_BRANCH || 'abhi';
  try {
    const { path: filePath } = await request.json();
    if (!filePath) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    const allowedExtensions = ['.md', '.json', '.txt', '.html', '.pdf', '.csv'];
    const ext = '.' + filePath.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return new Response(JSON.stringify({
        error: 'Only .md, .json, .txt, .html, .pdf, and .csv files are allowed.'
      }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    const fullPath = `public/generated_resources/${filePath}`;
    const sha = await getFileSHA(env, fullPath, branch);
    if (sha) {
      return new Response(JSON.stringify({ error: 'File already exists' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    await commitGitHubFile(env, fullPath, '', branch, `content(expert): create file ${filePath}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders()
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
