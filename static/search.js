var AOAO_DOMAIN = 'WEB';
var AOAO_TOOL = 'ArticleSearch';
var AOAO_SUMMARY = '站内文章全文搜索';

(function () {
    const searchBox = document.getElementById('searchBox');
    const searchResults = document.getElementById('searchResults');
    if (!searchBox || !searchResults) return;

    let searchIndex = null;
    let searchPromise = null;
    let searchTimeout = null;
    let activeIndex = -1;

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[char]);
    }

    async function fetchSearchIndex(forceRetry) {
        if (searchIndex && !forceRetry) return searchIndex;
        if (searchPromise && !forceRetry) return searchPromise;
        searchPromise = fetch('/search_index.json', { cache: 'no-cache' })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                searchIndex = Array.isArray(data) ? data : [];
                return searchIndex;
            })
            .finally(() => { searchPromise = null; });
        return searchPromise;
    }

    function getExcerpt(text, query) {
        const source = String(text || '');
        const index = source.toLowerCase().indexOf(query);
        const start = Math.max(0, index < 0 ? 0 : index - 45);
        const end = Math.min(source.length, start + 170);
        return `${start > 0 ? '…' : ''}${source.slice(start, end)}${end < source.length ? '…' : ''}`;
    }

    function highlight(text, query) {
        const safeText = escapeHtml(text);
        const safeQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return safeText.replace(new RegExp(`(${safeQuery})`, 'gi'), '<mark>$1</mark>');
    }

    function showMessage(message, retry) {
        searchResults.innerHTML = `<div class="search-result-item search-message">${escapeHtml(message)}${retry ? ' <button type="button" id="searchRetry">重试</button>' : ''}</div>`;
        searchResults.style.display = 'block';
        const retryButton = document.getElementById('searchRetry');
        if (retryButton) retryButton.addEventListener('click', () => runSearch(searchBox.value, true));
    }

    function renderResults(results, query) {
        activeIndex = -1;
        if (!results.length) {
            showMessage('没有找到匹配的文章');
            return;
        }
        searchResults.innerHTML = results.map(result => `
            <a class="search-result-item" role="option" href="/${encodeURI(result.rel_path)}">
                <strong>${highlight(result.title, query)}</strong>
                <small>${highlight(result.excerpt, query)}</small>
            </a>
        `).join('');
        searchResults.style.display = 'block';
    }

    async function runSearch(rawQuery, forceRetry) {
        const query = rawQuery.trim().toLowerCase();
        if (query.length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }
        showMessage('正在加载搜索索引…');
        try {
            const articles = await fetchSearchIndex(forceRetry);
            if (searchBox.value.trim().toLowerCase() !== query) return;
            const results = articles.map(article => {
                const title = String(article.title || '');
                const content = String(article.content || article.truncated_content || '');
                const titleIndex = title.toLowerCase().indexOf(query);
                const contentIndex = content.toLowerCase().indexOf(query);
                if (titleIndex < 0 && contentIndex < 0) return null;
                return {
                    title,
                    rel_path: article.rel_path,
                    excerpt: getExcerpt(content, query),
                    score: titleIndex === 0 ? 30 : titleIndex >= 0 ? 20 : 10
                };
            }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 10);
            renderResults(results, query);
        } catch (error) {
            console.error('Search index load failed:', error);
            showMessage('搜索加载失败，请检查网络后重试。', true);
        }
    }

    searchBox.addEventListener('focus', () => fetchSearchIndex(false).catch(() => {}));
    searchBox.addEventListener('input', event => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => runSearch(event.target.value, false), 250);
    });
    searchBox.addEventListener('keydown', event => {
        const options = Array.from(searchResults.querySelectorAll('a.search-result-item'));
        if (!options.length || !['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) return;
        if (event.key === 'Escape') {
            searchResults.style.display = 'none';
            return;
        }
        event.preventDefault();
        if (event.key === 'Enter' && activeIndex >= 0) {
            options[activeIndex].click();
            return;
        }
        activeIndex = event.key === 'ArrowDown'
            ? (activeIndex + 1) % options.length
            : (activeIndex - 1 + options.length) % options.length;
        options.forEach((option, index) => option.classList.toggle('active', index === activeIndex));
    });
    document.addEventListener('click', event => {
        if (!searchBox.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.style.display = 'none';
        }
    });
})();
