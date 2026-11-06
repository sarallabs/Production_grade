import { 
  commitGitHubFile, 
  createGitHubBranch, 
  createGitHubPR, 
  corsHeaders 
} from './_github.js';

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const targetBranch = env.GITHUB_TARGET_BRANCH || 'abhi';
  const autoPR = env.GITHUB_AUTO_PR === 'true';

  try {
    const { path: filePath, content } = await request.json();
    if (!filePath || content === undefined) {
      return new Response(JSON.stringify({ error: 'Missing path or content' }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    const fullPath = `public/generated_resources/${filePath}`;

    if (autoPR) {
      const timestamp = Date.now();
      const filename = filePath.split('/').pop().replace(/[^a-zA-Z0-9.-]/g, '_');
      const newBranch = `expert/update-${filename}-${timestamp}`;
      
      await createGitHubBranch(env, newBranch, targetBranch);
      await commitGitHubFile(env, fullPath, content, newBranch);
      
      const prTitle = `content(expert): update ${filePath.split('/').pop()}`;
      const prBody = `This PR contains updates to the resource file:\n\`${filePath}\`\n\nSubmitted via the Expert Panel.`;
      const pr = await createGitHubPR(env, prTitle, newBranch, targetBranch, prBody);
      
      return new Response(JSON.stringify({ 
        success: true, 
        branch: newBranch, 
        prNumber: pr.number, 
        prUrl: pr.html_url,
        prCreated: true
      }), {
        status: 200,
        headers: corsHeaders()
      });
    } else {
      await commitGitHubFile(env, fullPath, content, targetBranch);
      return new Response(JSON.stringify({ 
        success: true, 
        branch: targetBranch, 
        prCreated: false 
      }), {
        status: 200,
        headers: corsHeaders()
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
