// script.js
const API_BASE = '/api';

async function loadPosts() {
  const res = await fetch(`${API_BASE}/posts`);
  const posts = await res.json();
  const container = document.getElementById('posts');
  container.innerHTML = posts.map(post => `
    <article class="post">
      <h2>${post.title}</h2>
      <div class="meta">发布于 ${new Date(post.createdAt).toLocaleString()}</div>
      <div class="excerpt">${post.excerpt}</div>
      <a href="read.html?id=${post.id}">继续阅读</a>
    </article>
  `).join('');
}

async function publish() {
  const title = document.getElementById('title').value.trim();
  const content = document.getElementById('content').value.trim();
  if (!title || !content) return alert('标题和内容不能为空！');
  const res = await fetch(`${API_BASE}/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });
  if (res.ok) {
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    loadPosts();
  } else {
    alert('发布失败');
  }
}

loadPosts();
