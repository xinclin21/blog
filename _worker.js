import { marked } from 'marked';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API 路由
    if (path === '/api/posts' && request.method === 'GET') {
      return getPosts(env);
    }
    if (path === '/api/post' && request.method === 'POST') {
      return createPost(request, env);
    }
    if (path.startsWith('/api/post/') && request.method === 'GET') {
      const id = path.split('/').pop();
      return getPostById(id, env);
    }

    // 前端页面
    if (path === '/' || path === '/index.html') {
      const html = await env.ASSETS.fetch(request);
      return html;
    }

    // 静态资源
    return env.ASSETS.fetch(request);
  },
};

// 获取所有文章（只返回标题、摘要、元数据）
async function getPosts(env) {
  const { keys } = await env.BLOG_KV.list();
  const posts = await Promise.all(
    keys.map(async (key) => {
      const data = await env.BLOG_KV.get(key.name);
      const post = JSON.parse(data);
      return {
        id: key.name,
        title: post.title,
        createdAt: post.createdAt,
        excerpt: post.content.substring(0, 100) + '...' // 简介
      };
    })
  );
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return new Response(JSON.stringify(posts), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 获取单篇文章（Markdown 转 HTML）
async function getPostById(id, env) {
  const data = await env.BLOG_KV.get(id);
  if (!data) return new Response('Not Found', { status: 404 });

  const post = JSON.parse(data);
  const htmlContent = marked.parse(post.content); // Markdown → HTML

  return new Response(JSON.stringify({
    ...post,
    content: htmlContent
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 创建文章（保存原始 Markdown）
async function createPost(request, env) {
  const body = await request.json();
  const { title, content } = body;

  if (!title || !content) {
    return new Response('Title and content required', { status: 400 });
  }

  const id = Date.now().toString();
  const post = {
    title,
    content, // 保存原始 Markdown
    createdAt: new Date().toISOString()
  };

  await env.BLOG_KV.put(id, JSON.stringify(post));
  return new Response(JSON.stringify({ id, ...post }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
