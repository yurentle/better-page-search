// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener(() => {
  console.log('Better Search 扩展已安装/更新');
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'SEARCH_STATUS') {
    // 不再需要处理搜索状态
  }
  sendResponse({ received: true });
}); 