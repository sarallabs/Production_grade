import { getGitHubFileContent, corsHeaders } from './_github.js';

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

    const content = await getGitHubFileContent(env, `public/generated_resources/${filePath}`, branch);
    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
