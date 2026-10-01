import { commitGitHubFile, corsHeaders } from './_github.js';

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
    const { path: dirPath } = await request.json();
    if (!dirPath) {
      return new Response(JSON.stringify({ error: 'Missing path parameter' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    const keepPath = `public/generated_resources/${dirPath}/.gitkeep`;
    await commitGitHubFile(env, keepPath, '', branch, `content(expert): create directory ${dirPath}`);
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
