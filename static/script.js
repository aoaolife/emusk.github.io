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
    const API_URL = "https://aoao-api.focusj.workers.dev";
    
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
            fetch(`${API_URL}/api/like?post_id=${encodeURIComponent(articleId)}`)
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
        fetch(`${API_URL}/api/like`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: articleId })
        })
            .then(res => res.json())
            .then(data => {
                // new worker logic returns { success: true }, so don't update count here if it doesn't return count
                // or just rely on optimistic update
                if (data.count !== undefined && countSpan) {
                    countSpan.innerText = data.count;
                }
            })
            .catch(err => {
                console.error('点赞请求失败:', err);
                // 发生错误时，回退乐观更新
                if (countSpan) countSpan.innerText = currentCount;
                btn.classList.remove('liked');
                if (icon) icon.innerText = "🤍";
                if (text) text.innerText = "点赞";
                localStorage.removeItem(storageKey);
            });
    };

    // ====== Comments Functionality ======
    let POST_ID = "";

    window.showToast = function(msg) {
        const toast = document.getElementById('toast-container');
        if (!toast) return;
        toast.innerText = msg; 
        toast.classList.add('toast-show');
        setTimeout(() => { toast.classList.remove('toast-show'); }, 2500);
    };

    function timeAgo(dateString) {
        if (!dateString) return "刚刚";
        const date = new Date(dateString.replace(" ", "T") + "Z"); 
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " 年前";
        interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " 个月前";
        interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + " 天前";
        interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + " 小时前";
        interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " 分钟前";
        return "刚刚";
    }

    async function loadComments() {
        const postEl = document.getElementById('interaction-section');
        if (postEl) { 
            POST_ID = postEl.getAttribute('data-post-id'); 
        }
        if (!POST_ID) return;
        
        try {
            const res = await fetch(`${API_URL}/api/comment?post_id=${encodeURIComponent(POST_ID)}`);
            if (!res.ok) return;
            const data = await res.json();
            const ul = document.getElementById('comments-ul'); 
            if (!ul) return;
            ul.innerHTML = "";
            if (!data.comments || data.comments.length === 0) {
                ul.innerHTML = "<li style='color: #999; text-align: center; padding: 20px 0;'>暂无留言，抢个沙发吧！</li>";
                return;
            }
            
            // 组装评论树
            const commentMap = {};
            const rootComments = [];
            
            data.comments.forEach(c => {
                c.children = [];
                commentMap[c.id] = c;
            });
            
            data.comments.forEach(c => {
                if (c.parent_id && commentMap[c.parent_id]) {
                    commentMap[c.parent_id].children.push(c);
                } else {
                    rootComments.push(c);
                }
            });

            function renderComment(c, isChild = false) {
                const li = document.createElement('li');
                li.className = 'comment-item';
                li.style.cssText = `display: flex; gap: 15px; margin-bottom: 20px; ${isChild ? 'margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;' : 'border-bottom: 1px dashed #eee; padding-bottom: 15px;'}`;
                
                let childrenHtml = '';
                if (c.children && c.children.length > 0) {
                    const childrenItems = c.children.map(child => renderComment(child, true).outerHTML).join('');
                    childrenHtml = `<ul style="list-style: none; padding-left: 0; margin-top: 15px;">${childrenItems}</ul>`;
                }

                li.innerHTML = `
                    <img src="${c.avatar}" style="width: ${isChild ? '32px' : '48px'}; height: ${isChild ? '32px' : '48px'}; border-radius: 50%; background: #eee;">
                    <div style="flex: 1;">
                        <div style="margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: #333; font-size: ${isChild ? '13px' : '15px'};">${c.author}</strong> 
                                <span style="color: #999; font-size: 12px; margin-left: 10px;">${timeAgo(c.created_at)}</span>
                            </div>
                            <span style="color: #1d9bf0; font-size: 13px; cursor: pointer;" onclick="replyTo(${c.id}, '${c.author}')">回复</span>
                        </div>
                        <div style="color: #444; line-height: 1.6; word-break: break-all; font-size: ${isChild ? '14px' : '15px'};">${c.content.replace(/\n/g, '<br>')}</div>
                        ${childrenHtml}
                    </div>`;
                return li;
            }

            rootComments.forEach(c => {
                ul.appendChild(renderComment(c));
            });

        } catch (e) {
            console.error('Failed to load comments:', e);
        }
    }
    
    // 存储当前正在回复的评论ID
    let currentParentId = null;

    function replyTo(commentId, author) {
        currentParentId = commentId;
        const contentInput = document.getElementById('comment-content');
        if (contentInput) {
            contentInput.placeholder = `回复 @${author} :`;
            contentInput.focus();
            
            // 添加取消回复提示
            let cancelBtn = document.getElementById('cancel-reply-btn');
            if (!cancelBtn) {
                const btnContainer = document.getElementById('submit-comment-btn').parentElement;
                cancelBtn = document.createElement('span');
                cancelBtn.id = 'cancel-reply-btn';
                cancelBtn.style.cssText = "margin-left: 15px; color: #999; font-size: 13px; cursor: pointer; text-decoration: underline;";
                cancelBtn.innerText = "取消回复";
                cancelBtn.onclick = function() {
                    currentParentId = null;
                    contentInput.placeholder = "写下你的想法... *";
                    this.remove();
                };
                // 插入到提交按钮后面
                btnContainer.appendChild(cancelBtn);
            }
        }
    }
    window.replyTo = replyTo;
    window.loadComments = loadComments;

    async function submitComment() {
        const authorInput = document.getElementById('comment-author'), emailInput = document.getElementById('comment-email');
        const contentInput = document.getElementById('comment-content'), btn = document.getElementById('submit-comment-btn');
        if (!authorInput || !emailInput || !contentInput || !btn) return;
        
        const author = authorInput.value.trim(), email = emailInput.value.trim(), content = contentInput.value.trim();

        // 确保 POST_ID 最新
        const postEl = document.getElementById('interaction-section');
        if (postEl) POST_ID = postEl.getAttribute('data-post-id');

        // 增强校验：高亮未填写的必填项
        let hasError = false;
        if (!author) { authorInput.style.borderColor = "#ff4d4f"; hasError = true; }
        if (!email) { emailInput.style.borderColor = "#ff4d4f"; hasError = true; }
        if (!content) { contentInput.style.borderColor = "#ff4d4f"; hasError = true; }

        if (hasError) {
            showToast("请填写星号标记的必填项哦！");
            setTimeout(() => {
                authorInput.style.borderColor = "#ddd";
                emailInput.style.borderColor = "#ddd";
                contentInput.style.borderColor = "#ddd";
            }, 3000);
            return;
        }

        btn.disabled = true;
        const originalText = btn.innerText;
        btn.innerText = "正在思考中..."; 

        try {
            const payload = { post_id: POST_ID, author, email, content };
            if (currentParentId) {
                payload.parent_id = currentParentId;
            }

            const res = await fetch(`${API_URL}/api/comment`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const resData = await res.json();
            if (res.ok && resData.success) {
                localStorage.setItem('aoao_author', author); 
                localStorage.setItem('aoao_email', email);
                contentInput.value = ""; 
                contentInput.placeholder = "写下你的想法... *";
                currentParentId = null;
                const cancelBtn = document.getElementById('cancel-reply-btn');
                if (cancelBtn) cancelBtn.remove();

                showToast("留言发表成功！"); 
                // 延迟 800ms 刷新，确保 D1 数据库写入扩散完成
                setTimeout(loadComments, 800); 
            } else { 
                showToast(resData.error || "留言失败，请检查输入"); 
            }
        } catch (e) { 
            showToast("网络连接超时"); 
            console.error(e);
        } finally { 
            btn.disabled = false; 
            btn.innerText = originalText; 
        }
    }
    window.submitComment = submitComment;

    function initInteraction() {
        const authorInput = document.getElementById('comment-author');
        const emailInput = document.getElementById('comment-email');
        if (authorInput) authorInput.value = localStorage.getItem('aoao_author') || '';
        if (emailInput) emailInput.value = localStorage.getItem('aoao_email') || '';
        loadComments();
    }

    const postEl = document.getElementById('interaction-section');
    if (postEl) { 
        POST_ID = postEl.getAttribute('data-post-id'); 
        initInteraction(); 
    }
});