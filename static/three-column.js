var AOAO_DOMAIN = 'WEB';
var AOAO_TOOL = 'ThreeColumnLayout';
var AOAO_SUMMARY = '三栏布局目录与文章导航交互';

document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('directory-sidebar');
    const directoryButton = document.querySelector('.mobile-directory-button');
    const stateKey = 'aoao_directory_expanded_v3';
    const scrollKey = 'aoao_directory_scroll';
    const defaultExpandedPaths = ['aoao随笔'];

    function readExpandedPaths(useDefault) {
        // List pages always start from the predictable desktop default:
        // only “aoao随笔” is open. Old saved states could otherwise reopen
        // all of its child directories after the CSS fix.
        if (useDefault) return defaultExpandedPaths.slice();
        const stored = localStorage.getItem(stateKey);
        if (stored === null) return [];
        try {
            const paths = JSON.parse(stored);
            return Array.isArray(paths) ? paths : [];
        } catch (_) {
            return [];
        }
    }

    if (sidebar) {
        let savedPaths = readExpandedPaths(true);
        if (document.body.classList.contains('article-page')) {
            savedPaths = [];
            sidebar.querySelectorAll('[data-tree-path].expanded').forEach(item => {
                item.classList.remove('expanded');
                const children = item.querySelector(':scope > .tree-children');
                const node = item.querySelector(':scope > .tree-node');
                const arrow = item.querySelector(':scope > .tree-node .tree-arrow');
                if (children) children.style.display = 'none';
                if (node) node.setAttribute('aria-expanded', 'false');
                if (arrow) arrow.style.transform = 'rotate(0deg)';
            });
        }
        savedPaths.forEach(path => {
            const item = Array.from(sidebar.querySelectorAll('[data-tree-path]')).find(node => node.dataset.treePath === path);
            if (!item) return;
            item.classList.add('expanded');
            const children = item.querySelector(':scope > .tree-children');
            const node = item.querySelector(':scope > .tree-node');
            const arrow = item.querySelector(':scope > .tree-node .tree-arrow');
            if (children) children.style.display = 'block';
            if (node) node.setAttribute('aria-expanded', 'true');
            if (arrow) arrow.style.transform = 'rotate(90deg)';
        });

        const tree = sidebar.querySelector('.directory-tree');
        if (tree) {
            tree.scrollTop = Number(sessionStorage.getItem(scrollKey) || 0);
            tree.addEventListener('scroll', () => sessionStorage.setItem(scrollKey, String(tree.scrollTop)), { passive: true });
        }

        sidebar.addEventListener('click', event => {
            if (!event.target.closest('.tree-node')) return;
            window.setTimeout(() => {
                const expanded = Array.from(sidebar.querySelectorAll('[data-tree-path].expanded')).map(item => item.dataset.treePath);
                localStorage.setItem(stateKey, JSON.stringify(expanded));
            }, 0);
        }, true);
    }

    if (directoryButton && sidebar) {
        const isArticleDrawer = document.body.classList.contains('article-page');
        let backdrop = null;
        let closeButton = null;
        let currentArticleLocated = false;

        let treeDataPromise = null;
        let treeRendered = !sidebar.dataset.treeSource;
        const treeContainer = sidebar.querySelector('.directory-tree');

        function loadTreeData() {
            if (!treeDataPromise) {
                treeDataPromise = fetch(sidebar.dataset.treeSource || '/tree.json')
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.json();
                    })
                    .catch(error => {
                        treeDataPromise = null;
                        throw error;
                    });
            }
            return treeDataPromise;
        }

        function renderTree(treeItems, parentPath) {
            const fragment = document.createDocumentFragment();
            Object.entries(treeItems).forEach(([name, item]) => {
                const wrapper = document.createElement('div');
                wrapper.className = item.type === 'directory' ? 'tree-item' : 'tree-item tree-file';

                if (item.type === 'directory') {
                    const nodePath = parentPath.concat(name);
                    wrapper.dataset.treePath = nodePath.join('/');

                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'tree-node';
                    button.setAttribute('aria-expanded', 'false');

                    const icon = document.createElement('span');
                    icon.className = 'tree-icon';
                    icon.textContent = '📁';
                    const label = document.createElement('span');
                    label.className = 'tree-toggle';
                    label.append(document.createTextNode(`${name} `));
                    const count = document.createElement('small');
                    count.textContent = `(${item.count || 0})`;
                    label.append(count);
                    const arrow = document.createElement('span');
                    arrow.className = 'tree-arrow';
                    arrow.textContent = '▶';
                    button.append(icon, label, arrow);

                    const children = document.createElement('div');
                    children.className = 'tree-children';
                    children.append(renderTree(item.children || {}, nodePath));
                    wrapper.append(button, children);
                } else if (item.type === 'file' && item.rel_path) {
                    const link = document.createElement('a');
                    link.className = 'tree-link';
                    link.href = `/${item.rel_path}`;
                    link.dataset.searchPath = item.rel_path;
                    link.textContent = `📄 ${item.title || name}`;
                    wrapper.append(link);
                } else {
                    return;
                }
                fragment.append(wrapper);
            });
            return fragment;
        }

        async function ensureTreeRendered() {
            if (treeRendered || !treeContainer) return;
            treeContainer.innerHTML = '<div class="directory-load-status">目录加载中…</div>';
            try {
                const treeData = await loadTreeData();
                treeContainer.replaceChildren(renderTree(treeData, []));
                treeRendered = true;
                currentArticleLocated = false;

                if (!isArticleDrawer) {
                    const savedPaths = readExpandedPaths(true);
                    const activePath = sidebar.dataset.activePath || '';
                    sidebar.querySelectorAll('[data-tree-path]').forEach(item => {
                        const nodePath = item.dataset.treePath;
                        const expanded = savedPaths.includes(nodePath)
                            || (activePath && (activePath === nodePath || activePath.startsWith(`${nodePath}/`)));
                        if (!expanded) return;
                        item.classList.add('expanded');
                        const children = item.querySelector(':scope > .tree-children');
                        const node = item.querySelector(':scope > .tree-node');
                        const arrow = item.querySelector(':scope > .tree-node .tree-arrow');
                        if (children) children.style.display = 'block';
                        if (node) node.setAttribute('aria-expanded', 'true');
                        if (arrow) arrow.style.transform = 'rotate(90deg)';
                    });
                    treeContainer.scrollTop = Number(sessionStorage.getItem(scrollKey) || 0);
                }
            } catch (error) {
                console.error('Directory tree failed:', error);
                treeContainer.innerHTML = '<div class="directory-load-status">目录加载失败，请关闭后重试。</div>';
                throw error;
            }
        }

        function normalizePath(path) {
            try { return decodeURIComponent(path).replace(/\/$/, ''); }
            catch (_) { return path.replace(/\/$/, ''); }
        }

        function locateCurrentArticle() {
            if (!isArticleDrawer || currentArticleLocated) return;
            const currentPath = normalizePath(sidebar.dataset.currentPath || window.location.pathname);
            const currentLink = Array.from(sidebar.querySelectorAll('.tree-link'))
                .find(link => normalizePath(link.pathname) === currentPath);
            if (!currentLink) return;
            currentLink.style.fontWeight = 'bold';
            currentLink.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
            currentLink.style.borderRadius = '4px';
            currentLink.style.padding = '2px 6px';
            let item = currentLink.closest('.tree-item');
            while (item && item.parentElement) {
                const children = item.parentElement.closest('.tree-children');
                if (!children) break;
                const parentItem = children.closest('.tree-item');
                if (!parentItem) break;
                parentItem.classList.add('expanded');
                children.style.display = 'block';
                const node = parentItem.querySelector(':scope > .tree-node');
                const arrow = parentItem.querySelector(':scope > .tree-node .tree-arrow');
                if (node) node.setAttribute('aria-expanded', 'true');
                if (arrow) arrow.style.transform = 'rotate(90deg)';
                item = parentItem;
            }
            window.setTimeout(() => currentLink.scrollIntoView({ block: 'center' }), 50);
            currentArticleLocated = true;
        }

        function setDirectoryOpen(open) {
            sidebar.classList.toggle('mobile-open', open);
            directoryButton.setAttribute('aria-expanded', String(open));
            if (isArticleDrawer) {
                document.body.classList.toggle('drawer-open', open);
            } else if (open) {
                sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        async function openArticleDirectory() {
            setDirectoryOpen(true);
            try {
                await ensureTreeRendered();
                locateCurrentArticle();
            } catch (_) {}
        }

        sidebar.addEventListener('click', event => {
            const node = event.target.closest('.tree-node');
            if (!node || !treeContainer.contains(node)) return;
            event.preventDefault();
            const item = node.closest('.tree-item');
            const children = item.querySelector(':scope > .tree-children');
            const arrow = node.querySelector('.tree-arrow');
            const expanded = !item.classList.contains('expanded');
            item.classList.toggle('expanded', expanded);
            node.setAttribute('aria-expanded', String(expanded));
            if (children) children.style.display = expanded ? 'block' : 'none';
            if (arrow) arrow.style.transform = expanded ? 'rotate(90deg)' : 'rotate(0deg)';
        });

        if (isArticleDrawer) {
            directoryButton.textContent = '☰ 目录';
            backdrop = document.createElement('div');
            backdrop.className = 'directory-backdrop';
            document.body.appendChild(backdrop);
            closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'directory-drawer-close';
            closeButton.setAttribute('aria-label', '关闭目录');
            closeButton.textContent = '×';
            sidebar.prepend(closeButton);
            backdrop.addEventListener('click', () => setDirectoryOpen(false));
            closeButton.addEventListener('click', () => setDirectoryOpen(false));
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape') setDirectoryOpen(false);
            });

            // Warm only the small JSON response on intent; DOM nodes are still
            // created solely when the visitor actually opens the directory.
            const prefetchTree = () => { loadTreeData().catch(() => {}); };
            directoryButton.addEventListener('pointerenter', prefetchTree, { once: true });
            directoryButton.addEventListener('focus', prefetchTree, { once: true });
        }

        directoryButton.addEventListener('click', () => {
            const shouldOpen = !sidebar.classList.contains('mobile-open');
            if (isArticleDrawer && shouldOpen) openArticleDirectory();
            else setDirectoryOpen(shouldOpen);
        });

        if (!isArticleDrawer) ensureTreeRendered().catch(() => {});
    }

    const randomButton = document.getElementById('random-article-button');
    const randomList = document.getElementById('random-article-list');
    let randomArticles = null;
    async function showRandomArticles() {
        if (!randomButton || !randomList) return;
        randomButton.disabled = true;
        try {
            if (!randomArticles) {
                const response = await fetch('/search_index.json');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                randomArticles = await response.json();
            }
            const pool = randomArticles.slice();
            for (let index = pool.length - 1; index > 0; index -= 1) {
                const swapIndex = Math.floor(Math.random() * (index + 1));
                [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
            }
            randomList.replaceChildren(...pool.slice(0, 5).map(article => {
                const link = document.createElement('a');
                link.href = `/${article.rel_path}`;
                link.textContent = article.title;
                return link;
            }));
            randomButton.textContent = '换一批';
        } catch (error) {
            console.error('Random articles failed:', error);
            randomList.textContent = '暂时无法加载，请稍后重试。';
            randomButton.textContent = '重新加载';
        } finally {
            randomButton.disabled = false;
        }
    }
    if (randomButton && randomList) {
        randomButton.addEventListener('click', showRandomArticles);
        showRandomArticles();
    }

    const tocCard = document.getElementById('article-toc-card');
    const toc = document.getElementById('article-toc');
    const headings = Array.from(document.querySelectorAll('.article-main .content h2, .article-main .content h3'));
    if (tocCard && toc && headings.length) {
        headings.forEach((heading, index) => {
            if (!heading.id) heading.id = `section-${index + 1}`;
            const link = document.createElement('a');
            link.href = `#${heading.id}`;
            link.textContent = heading.textContent.trim();
            link.className = heading.tagName === 'H3' ? 'toc-level-3' : 'toc-level-2';
            toc.appendChild(link);
        });
        tocCard.hidden = false;
        const links = Array.from(toc.querySelectorAll('a'));
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                links.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
            });
        }, { rootMargin: '-100px 0px -70% 0px' });
        headings.forEach(heading => observer.observe(heading));
    }
});
