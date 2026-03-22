document.addEventListener('DOMContentLoaded', function() {
    // 获取导航链接信息
    const prevPageLink = document.querySelector('.nav-arrow-left');
    const nextPageLink = document.querySelector('.nav-arrow-right');

    let prevPageUrl = null;
    let nextPageUrl = null;

    if (prevPageLink) {
        prevPageUrl = prevPageLink.getAttribute('href');
    }
    if (nextPageLink) {
        nextPageUrl = nextPageLink.getAttribute('href');
    }

    // Touch swipe navigation - 修复模板变量问题
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function(event) {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', function(event) {
        touchEndX = event.changedTouches[0].screenX;
        touchEndY = event.changedTouches[0].screenY;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeDistanceX = touchEndX - touchStartX;
        const swipeDistanceY = touchEndY - touchStartY;

        // 只有在水平滑动距离大于垂直滑动距离时才触发页面切换
        // 这样可以避免在垂直滚动时误触发页面切换
        if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) && Math.abs(swipeDistanceX) > 80) {
            if (swipeDistanceX > 80 && prevPageUrl) {
                // 向右滑动，跳转到上一页
                window.location.href = prevPageUrl;
            } else if (swipeDistanceX < -80 && nextPageUrl) {
                // 向左滑动，跳转到下一页
                window.location.href = nextPageUrl;
            }
        }
    }

    // Tree view functionality
    const treeItems = document.querySelectorAll('.tree-item');

    treeItems.forEach(item => {
        const node = item.querySelector('.tree-node');
        const toggle = item.querySelector('.tree-toggle');
        const arrow = item.querySelector('.tree-arrow');
        const children = item.querySelector('.tree-children');

        if (toggle && arrow && children) {
            node.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Toggle expanded state
                item.classList.toggle('expanded');

                // Update arrow rotation
                if (item.classList.contains('expanded')) {
                    arrow.style.transform = 'rotate(90deg)';
                    children.style.display = 'block';
                } else {
                    arrow.style.transform = 'rotate(0deg)';
                    children.style.display = 'none';
                }
            });
        }
    });

    // Auto-expand tree items that contain the current page
    const currentPath = window.location.pathname;
    const currentLinks = document.querySelectorAll('.tree-link');

    currentLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            // Highlight current page
            link.style.fontWeight = 'bold';
            link.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
            link.style.borderRadius = '4px';
            link.style.padding = '2px 6px';

            // Expand parent directories
            let parent = link.closest('.tree-item');
            while (parent) {
                const parentContainer = parent.closest('.tree-children');
                if (parentContainer) {
                    const parentItem = parentContainer.previousElementSibling?.closest('.tree-item');
                    if (parentItem) {
                        parentItem.classList.add('expanded');
                        const arrow = parentItem.querySelector('.tree-arrow');
                        if (arrow) {
                            arrow.style.transform = 'rotate(90deg)';
                        }
                        parentContainer.style.display = 'block';
                        parent = parentItem;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
        }
    });

    // Initialize tree state - collapse all by default except expanded ones
    const allTreeItems = document.querySelectorAll('.tree-item');
    allTreeItems.forEach(item => {
        const children = item.querySelector('.tree-children');
        const arrow = item.querySelector('.tree-arrow');

        if (children && !item.classList.contains('expanded')) {
            children.style.display = 'none';
            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    });

    // 添加键盘导航支持
    document.addEventListener('keydown', function(event) {
        // 左箭头键 - 上一页
        if (event.key === 'ArrowLeft' && prevPageUrl) {
            window.location.href = prevPageUrl;
        }
        // 右箭头键 - 下一页
        else if (event.key === 'ArrowRight' && nextPageUrl) {
            window.location.href = nextPageUrl;
        }
    });

    // Detail Page Copy (Global for Top & Bottom)
    window.handleDetailCopy = function(btn) {
        const title = document.querySelector('.article-title').innerText;
        const content = document.querySelector('.content').innerText;
        const fullText = `${title}\n\n${content}`;

        const updateBtn = () => {
            const originalText = btn.innerText;
            btn.innerText = '已复制！';
            btn.classList.add('liked');
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('liked');
            }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullText).then(updateBtn).catch(() => {
                fallbackCopyText(fullText, updateBtn);
            });
        } else {
            fallbackCopyText(fullText, updateBtn);
        }
    };

    // Copy article functionality (Legacy support for ID-based call if any)
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            window.handleDetailCopy(copyBtn);
        });
    }

    // Index Page Copy
    window.handleIndexCopy = function(btn) {
        const title = btn.getAttribute('data-title');
        const url = btn.getAttribute('data-url');
        const textToCopy = `${title}\n原文链接：${url}`;
        
        const updateBtn = () => {
            const originalText = btn.innerText;
            btn.innerText = '已复制';
            btn.classList.add('liked');
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('liked');
            }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(updateBtn).catch(() => {
                fallbackCopyText(textToCopy, updateBtn);
            });
        } else {
            fallbackCopyText(textToCopy, updateBtn);
        }
    };

    function fallbackCopyText(text, callback) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            if (callback) callback();
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    }

    // --- Back to Top ---
    const backToTop = document.createElement('button');
    backToTop.id = 'back-to-top';
    backToTop.innerHTML = '↑';
    document.body.appendChild(backToTop);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Image Lightbox ---
    const articleImages = document.querySelectorAll('.content img');
    if (articleImages.length > 0) {
        // Create lightbox elements
        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        const bigImg = document.createElement('img');
        bigImg.className = 'lightbox-img';
        overlay.appendChild(bigImg);
        document.body.appendChild(overlay);

        articleImages.forEach(img => {
            img.addEventListener('click', () => {
                bigImg.src = img.src;
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden'; // Lock scroll
            });
        });

        overlay.addEventListener('click', () => {
            overlay.classList.remove('show');
            document.body.style.overflow = ''; // Unlock scroll
        });
    }

    // Share functionality
    window.handleShareClick = function(btn) {
        const title = btn.getAttribute('data-title');
        const url = btn.getAttribute('data-url');
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: `分享一篇好文章：${title}`,
                url: url
            }).catch(err => {
                console.log('分享取消或失败:', err);
            });
        } else {
            // Fallback: Copy to clipboard
            const textToCopy = `${title}\n${url}`;
            const updateBtn = () => {
                const originalContent = btn.innerHTML;
                btn.innerHTML = '<span>✅</span><span>链接已复制</span>';
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                }, 2000);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(updateBtn).catch(() => {
                    fallbackCopyText(textToCopy, updateBtn);
                });
            } else {
                fallbackCopyText(textToCopy, updateBtn);
            }
        }
    };

    // Like functionality
    const API_URL = "https://aoaolikes.focusj.workers.dev";
    
    function getArticleId(btn) {
        // 优先从 data-article-id 获取
        let id = btn.getAttribute('data-article-id');
        if (!id) {
            id = window.location.hostname + window.location.pathname;
        }
        // 统一化处理：去除末尾的 .html，确保 emusk.cn 和 aoao.life 逻辑一致
        return id.replace(/\.html$/, '');
    }

    function setLikedState(btn, articleId) {
        btn.classList.add('liked');
        const icon = btn.querySelector('.like-icon');
        const text = btn.querySelector('.like-text');
        if (icon) icon.innerText = "❤️";
        if (text) text.innerText = "已赞";
        localStorage.setItem('liked_' + articleId, 'true');
    }

    // 初始化所有点赞按钮
    const allLikeBtns = document.querySelectorAll('.like-btn');
    const idCountMap = {}; // 用于存储已获取的 ID，避免首页重复请求

    allLikeBtns.forEach(btn => {
        const articleId = getArticleId(btn);
        const storageKey = 'liked_' + articleId;
        const countSpan = btn.querySelector('.like-count');

        // 初始化状态
        if (localStorage.getItem(storageKey)) {
            setLikedState(btn, articleId);
        }

        // 如果该文章 ID 还没获取过，就去获取
        if (!idCountMap[articleId]) {
            idCountMap[articleId] = true;
            fetch(`${API_URL}?id=${encodeURIComponent(articleId)}`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    // 更新页面上所有属于该 ID 的按钮数量
                    document.querySelectorAll('.like-btn').forEach(b => {
                        if (getArticleId(b) === articleId) {
                            const span = b.querySelector('.like-count');
                            if (span) span.innerText = data.count || 0;
                        }
                    });
                })
                .catch(err => {
                    console.error(`获取文章 [${articleId}] 点赞数失败:`, err);
                    if (countSpan) countSpan.innerText = 0;
                });
        }
    });

    // 全局处理函数
    window.handleLikeClick = function(btn) {
        const articleId = getArticleId(btn);
        const storageKey = 'liked_' + articleId;
        const countSpan = btn.querySelector('.like-count');
        const icon = btn.querySelector('.like-icon');

        if (localStorage.getItem(storageKey)) {
            return;
        }

        // 乐观 UI 更新
        setLikedState(btn, articleId);
        if (icon) icon.classList.add('anim-heart');
        
        let currentCount = parseInt(countSpan.innerText) || 0;
        if (countSpan) countSpan.innerText = currentCount + 1;

        // 发送请求
        fetch(`${API_URL}?id=${encodeURIComponent(articleId)}`, { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (countSpan) countSpan.innerText = data.count;
            })
            .catch(err => {
                console.error('点赞请求失败:', err);
            });
    };
});