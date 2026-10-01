import { getGitHubResourceTree, corsHeaders } from './_github.js';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const branch = env.GITHUB_TARGET_BRANCH || 'abhi';
  try {
    const tree = await getGitHubResourceTree(env, branch);
    return new Response(JSON.stringify(tree), {
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
