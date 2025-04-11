// 搜索状态管理
let searchState = {
  isActive: false,
  currentIndex: 0,
  matches: [],
  searchTerm: ''
};

// 创建搜索UI容器
const createSearchUI = () => {
  const container = document.createElement('div');
  container.id = 'better-search-container';
  container.innerHTML = `
    <div class="better-search-box">
      <div class="search-input-wrapper">
        <input type="text" id="better-search-input" placeholder="Find" />
        <div class="search-options">
          <button id="match-case" title="Match case">Aa</button>
          <button id="use-regex" title="Use Regular Expression">.*</button>
        </div>
      </div>
      <div class="search-controls">
        <span id="better-search-count">0/0</span>
        <button id="better-search-prev" title="Previous">↑</button>
        <button id="better-search-next" title="Next">↓</button>
        <button id="better-search-close" title="Close">×</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  return container;
};

// 初始化搜索UI
const initSearchUI = () => {
  const container = createSearchUI();
  const input = container.querySelector('#better-search-input');
  const prevBtn = container.querySelector('#better-search-prev');
  const nextBtn = container.querySelector('#better-search-next');
  const closeBtn = container.querySelector('#better-search-close');
  const countSpan = container.querySelector('#better-search-count');
  const matchCaseBtn = container.querySelector('#match-case');
  const useRegexBtn = container.querySelector('#use-regex');

  // 搜索选项状态
  const searchOptions = {
    matchCase: false,
    useRegex: false
  };

  // 更新搜索选项按钮状态
  const updateOptionButtons = () => {
    matchCaseBtn.classList.toggle('active', searchOptions.matchCase);
    useRegexBtn.classList.toggle('active', searchOptions.useRegex);
  };

  // 切换大小写匹配
  matchCaseBtn.addEventListener('click', () => {
    searchOptions.matchCase = !searchOptions.matchCase;
    updateOptionButtons();
    if (searchState.searchTerm) {
      performSearch(searchState.searchTerm);
    }
  });

  // 切换正则表达式
  useRegexBtn.addEventListener('click', () => {
    searchOptions.useRegex = !searchOptions.useRegex;
    updateOptionButtons();
    if (searchState.searchTerm) {
      performSearch(searchState.searchTerm);
    }
  });

  // 显示搜索框
  const showSearch = () => {
    container.style.display = 'block';
    input.focus();
    searchState.isActive = true;
    // 初始化时更新导航按钮状态
    updateNavigationButtons();
  };

  // 隐藏搜索框
  const hideSearch = () => {
    container.style.display = 'none';
    clearHighlights();
    searchState.isActive = false;
    searchState.matches = [];
    searchState.currentIndex = 0;
  };

  // 清除高亮
  const clearHighlights = () => {
    document.querySelectorAll('.better-search-highlight').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
    });
    // 清空匹配结果数组
    searchState.matches = [];
    searchState.currentIndex = 0;
    // 更新按钮状态
    updateNavigationButtons();
  };

  // 添加按钮状态更新函数
  const updateNavigationButtons = () => {
    const hasMatches = searchState.matches.length > 0;
    prevBtn.disabled = !hasMatches;
    nextBtn.disabled = !hasMatches;
    // 可选：添加视觉反馈的样式
    prevBtn.classList.toggle('disabled', !hasMatches);
    nextBtn.classList.toggle('disabled', !hasMatches);
  };

  // 执行搜索
  const performSearch = (term) => {
    clearHighlights();
    if (!term) {
      countSpan.textContent = '0/0';
      return;
    }

    try {
      const flags = searchOptions.matchCase ? 'g' : 'gi';
      const regex = searchOptions.useRegex 
        ? new RegExp(term, flags)
        : new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      
      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
          textNodes.push(node);
        }
      }

      searchState.matches = [];
      
      // 为每个文本节点收集匹配信息
      const allMatches = [];
      textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const nodeMatches = [];
        let match;
        
        regex.lastIndex = 0;
        while ((match = regex.exec(text)) !== null) {
          nodeMatches.push({
            node: textNode,
            index: match.index,
            length: match[0].length,
            text: match[0]
          });
        }
        
        if (nodeMatches.length > 0) {
          allMatches.push(...nodeMatches);
        }
      });

      // 从后向前处理匹配项
      for (let i = allMatches.length - 1; i >= 0; i--) {
        const match = allMatches[i];
        try {
          const span = document.createElement('span');
          span.className = 'better-search-highlight';
          span.textContent = match.text;
          
          const range = document.createRange();
          range.setStart(match.node, match.index);
          range.setEnd(match.node, match.index + match.length);
          range.surroundContents(span);
          
          // 将新创建的span添加到匹配数组的开头
          // 这样保持匹配项的原始顺序
          searchState.matches.unshift(span);
        } catch (e) {
          console.warn('无法高亮文本:', e);
          continue;
        }
      }

      searchState.currentIndex = searchState.matches.length > 0 ? 0 : -1;
      updateCount();
      updateNavigationButtons();
      highlightCurrent();
    } catch (e) {
      console.error('搜索错误:', e);
      countSpan.textContent = '无效的正则表达式';
    }
  };

  // 更新计数显示
  const updateCount = () => {
    const countText = `${searchState.matches.length ? searchState.currentIndex + 1 : 0}/${searchState.matches.length}`;
    countSpan.textContent = countText;
  };

  // 高亮当前匹配项
  const highlightCurrent = () => {
    document.querySelectorAll('.better-search-highlight').forEach(el => {
      el.classList.remove('current');
    });
    if (searchState.matches[searchState.currentIndex]) {
      searchState.matches[searchState.currentIndex].classList.add('current');
      searchState.matches[searchState.currentIndex].scrollIntoView({
        block: 'center'
      });
    }
  };

  // 事件监听
  let isComposing = false; // 添加输入法编辑状态标记

  // 处理输入法编辑开始
  input.addEventListener('compositionstart', () => {
    isComposing = true;
  });

  // 处理输入法编辑结束
  input.addEventListener('compositionend', (e) => {
    isComposing = false;
    // 在输入法编辑结束时执行搜索
    searchState.searchTerm = e.target.value;
    performSearch(e.target.value);
  });

  // 修改输入事件处理
  input.addEventListener('input', (e) => {
    // 只在非输入法编辑状态下触发搜索
    if (!isComposing) {
      searchState.searchTerm = e.target.value;
      performSearch(e.target.value);
    }
  });

  prevBtn.addEventListener('click', () => {
    if (searchState.matches.length) {
      searchState.currentIndex = (searchState.currentIndex - 1 + searchState.matches.length) % searchState.matches.length;
      updateCount();
      highlightCurrent();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (searchState.matches.length) {
      searchState.currentIndex = (searchState.currentIndex + 1) % searchState.matches.length;
      updateCount();
      highlightCurrent();
    }
  });

  closeBtn.addEventListener('click', hideSearch);

  // 快捷键处理
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      showSearch();
    } else if (e.key === 'Escape' && searchState.isActive) {
      e.preventDefault();
      hideSearch();
    } else if (searchState.isActive) {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        prevBtn.click();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        nextBtn.click();
      }
    }
  });

  return {
    showSearch,
    hideSearch
  };
};

// 初始化
const searchUI = initSearchUI(); 