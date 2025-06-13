// 核心功能：将请求代理到 GitHub Raw 地址
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
    // 替换为您的 GitHub 用户名、仓库名和分支名
    const GITHUB_USER = "您的GitHub用户名";
    const GITHUB_REPO = "您的仓库名";
    const GITHUB_BRANCH = "分支名（如main）";
  
    // 获取用户请求路径（如 /index.html）
    const path = new URL(request.url).pathname;
    const filePath = path === '/' ? '/index.html' : path;
  
    // 构造 GitHub Raw 文件地址（加速版）
    const githubRawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}${filePath}`;
    
    // 拉取 GitHub 文件
    const response = await fetch(githubRawUrl);
    
    // 返回响应（自动识别内容类型）
    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        'Cache-Control': 'public, max-age=3600' // 缓存1小时
      }
    });
  }