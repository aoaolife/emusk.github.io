// static/search.js - 搜索功能优化版：异步加载索引

(function() {
    const searchBox = document.getElementById('searchBox');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;
    let searchIndex = null;
    let isFetching = false;

    if (!searchBox || !searchResults) return;

    // 异步获取索引文件
    async function fetchSearchIndex() {
        if (searchIndex || isFetching) return;
        isFetching = true;
        try {
            console.log("Fetching search index...");
            const response = await fetch('/search_index.json');
            searchIndex = await response.json();
            console.log("Search index loaded:", searchIndex.length, "articles");
        } catch (error) {
            console.error("Failed to load search index:", error);
        } finally {
            isFetching = false;
        }
    }

    // 搜索函数
    function performSearch(query) {
        if (!query || query.trim().length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }

        if (!searchIndex) {
            searchResults.innerHTML = '<div class="search-result-item" style="color: #999;">正在加载索引...</div>';
            searchResults.style.display = 'block';
            fetchSearchIndex().then(() => {
                if (searchBox.value.trim().length >= 2) performSearch(searchBox.value);
            });
            return;
        }

        query = query.trim().toLowerCase();
        const results = [];

        searchIndex.forEach(article => {
            const title = (article.title || '').toLowerCase();
            const truncated = (article.truncated_content || '').toLowerCase();
            
            const titleMatch = title.includes(query);
            const contentMatch = truncated.includes(query);
            
            if (titleMatch || contentMatch) {
                let score = 0;
                if (titleMatch) score += 10;
                if (contentMatch) score += 5;
                
                results.push({
                    title: article.title,
                    path: article.rel_path,
                    excerpt: getExcerpt(truncated, query, 150),
                    score: score
                });
            }
        });

        results.sort((a, b) => b.score - a.score);
        displayResults(results.slice(0, 10), query);
    }

    function getExcerpt(text, query, maxLength) {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text.substring(0, maxLength) + '...';
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 100);
        let excerpt = text.substring(start, end);
        if (start > 0) excerpt = '...' + excerpt;
        if (end < text.length) excerpt = excerpt + '...';
        return excerpt;
    }

    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    function displayResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item" style="color: #999; text-align: center;">未找到匹配的文章</div>';
            searchResults.style.display = 'block';
            return;
        }

        let html = '';
        results.forEach(result => {
            html += `
                <div class="search-result-item" onclick="window.location.href='/${result.path}'">
                    <div class="search-result-title">${highlightText(result.title, query)}</div>
                    <div class="search-result-excerpt">${highlightText(result.excerpt, query)}</div>
                </div>
            `;
        });
        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
    }

    searchBox.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(e.target.value), 300);
    });

    searchBox.addEventListener('focus', fetchSearchIndex);

    document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
})();
