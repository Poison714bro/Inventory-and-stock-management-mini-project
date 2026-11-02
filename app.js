/**
 * Inventory & Stock Management System - Application Controller & UI Wire
 * ------------------------------------------------------------------------
 * Manages DOM events, state synchronization, dynamic rendering for:
 * - Hash Table O(1) Search & Bucket Visualizer (Separate Chaining)
 * - Binary Search Tree O(n) In-Order Sorted Table & Interactive SVG Tree
 * - Real-time Execution Diagnostics & Operation Terminal
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize DSA Core Engine (Fixed Capacity 13)
  const manager = new InventoryManager(13);

  // 2. DOM Elements Cache
  const stockForm = document.getElementById('stockForm');
  const productIdInput = document.getElementById('productId');
  const productNameInput = document.getElementById('productName');
  const productCategoryInput = document.getElementById('productCategory');
  const productQtyInput = document.getElementById('productQty');
  const productPriceInput = document.getElementById('productPrice');
  const btnSubmitStockText = document.getElementById('btnSubmitStockText');
  const btnResetForm = document.getElementById('btnResetForm');

  const searchForm = document.getElementById('searchForm');
  const searchIdInput = document.getElementById('searchIdInput');
  const searchEmptyState = document.getElementById('searchEmptyState');
  const searchResultCard = document.getElementById('searchResultCard');
  const searchStatusBadge = document.getElementById('searchStatusBadge');
  const searchTimestamp = document.getElementById('searchTimestamp');
  const searchHashCalc = document.getElementById('searchHashCalc');
  const searchBucketIndex = document.getElementById('searchBucketIndex');
  const searchChainSteps = document.getElementById('searchChainSteps');
  const searchProductDetails = document.getElementById('searchProductDetails');

  const inventoryTableBody = document.getElementById('inventoryTableBody');
  const emptyInventoryMsg = document.getElementById('emptyInventoryMsg');
  const tableItemCount = document.getElementById('tableItemCount');

  const bucketsContainer = document.getElementById('bucketsContainer');
  const hashLoadFactor = document.getElementById('hashLoadFactor');
  const bstTraversalPath = document.getElementById('bstTraversalPath');
  const bstSvgCanvas = document.getElementById('bstSvgCanvas');
  const bstEmptyNote = document.getElementById('bstEmptyNote');

  const statTotalItems = document.getElementById('statTotalItems');
  const statTotalUnits = document.getElementById('statTotalUnits');
  const statTotalValuation = document.getElementById('statTotalValuation');
  const statCollisions = document.getElementById('statCollisions');
  const statBstDepth = document.getElementById('statBstDepth');

  const terminalLogBody = document.getElementById('terminalLogBody');
  const btnClearLog = document.getElementById('btnClearLog');

  const btnLoadSeed = document.getElementById('btnLoadSeed');
  const btnClearAll = document.getElementById('btnClearAll');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const toastContainer = document.getElementById('toastContainer');

  // Tab switching
  const tabBtnHash = document.getElementById('tabBtnHash');
  const tabBtnBst = document.getElementById('tabBtnBst');
  const tabHash = document.getElementById('tabHash');
  const tabBst = document.getElementById('tabBst');
  const hashLegend = document.getElementById('hashLegend');

  // ==========================================================================
  // Theme Management
  // ==========================================================================
  const savedTheme = localStorage.getItem('dsa_inventory_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dsa_inventory_theme', newTheme);
    showToast(`Switched to ${newTheme} theme`, 'success');
    renderBstVisualizer(); // Re-render SVG colors for current theme
  });

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  // ==========================================================================
  // UI Re-render Coordinators
  // ==========================================================================
  function updateAllUI() {
    renderStats();
    renderSortedTable();
    renderHashBuckets();
    renderBstVisualizer();
    renderTerminalLogs();
  }

  // 1. Stats Bar
  function renderStats() {
    const stats = manager.getStats();
    statTotalItems.textContent = stats.totalCount;
    statTotalUnits.textContent = stats.totalQuantity;
    statTotalValuation.textContent = `$${stats.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    statCollisions.textContent = `${stats.hashStats.collidedBuckets} (${stats.hashStats.overflowItems} overflow)`;
    statBstDepth.textContent = stats.treeHeight;
    hashLoadFactor.textContent = stats.hashStats.loadFactor;
    tableItemCount.textContent = `${stats.totalCount} Products`;
  }

  // 2. Main Inventory Table (BST In-Order Traversal)
  function renderSortedTable() {
    const items = manager.getSortedInventory();
    inventoryTableBody.innerHTML = '';

    if (items.length === 0) {
      emptyInventoryMsg.style.display = 'flex';
      return;
    }

    emptyInventoryMsg.style.display = 'none';

    items.forEach((product) => {
      const tr = document.createElement('tr');
      tr.id = `row-product-${product.id}`;

      const isLowStock = product.quantity < 10;
      const qtyClass = isLowStock ? 'qty-pill low-stock' : 'qty-pill';
      const qtyTitle = isLowStock ? 'Low Stock Warning (&lt; 10 units)' : 'Stock Level Normal';

      tr.innerHTML = `
        <td><span class="id-badge">#${product.id}</span></td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(product.name)}</div>
        </td>
        <td><span class="category-chip">${escapeHtml(product.category)}</span></td>
        <td style="text-align: right;">
          <span class="${qtyClass}" title="${qtyTitle}">
            ${product.quantity} ${isLowStock ? '⚠️' : ''}
          </span>
        </td>
        <td style="text-align: right;" class="price-text">$${product.price.toFixed(2)}</td>
        <td style="text-align: right;" class="total-text">$${product.totalValue.toFixed(2)}</td>
        <td style="text-align: center;">
          <div class="table-actions">
            <button class="btn-table-action" title="Load into Form to Edit" onclick="window.handleEditProduct(${product.id})">
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-table-action delete-action" title="Delete from Hash Table &amp; BST" onclick="window.handleDeleteProduct(${product.id})">
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;
      inventoryTableBody.appendChild(tr);
    });
  }

  // 3. Hash Table Buckets & Separate Chaining Visualizer
  function renderHashBuckets(highlightIndex = null) {
    const buckets = manager.hashTable.getBuckets();
    bucketsContainer.innerHTML = '';

    buckets.forEach((bucket) => {
      const row = document.createElement('div');
      row.className = 'bucket-row';
      row.id = `bucket-row-${bucket.index}`;

      if (bucket.count > 0) row.classList.add('has-items');
      if (bucket.hasCollision) row.classList.add('has-collision');
      if (highlightIndex === bucket.index) {
        row.classList.add('highlight-pulse');
      }

      // Left Pill: Bucket Index
      const indexPill = document.createElement('div');
      indexPill.className = 'bucket-index-pill';
      indexPill.innerHTML = `Bucket [${bucket.index}] ${bucket.hasCollision ? `<small>(${bucket.count})</small>` : ''}`;
      row.appendChild(indexPill);

      // Right: Linked List Chain
      const chainWrapper = document.createElement('div');
      chainWrapper.className = 'bucket-chain';

      if (bucket.count === 0) {
        chainWrapper.innerHTML = `
          <span class="chain-arrow">&rarr;</span>
          <span class="chain-null">NULL (Empty)</span>
        `;
      } else {
        bucket.items.forEach((item) => {
          const nodeChip = document.createElement('div');
          nodeChip.className = 'chain-node';
          nodeChip.title = `Click to lookup ID #${item.key}`;
          nodeChip.style.cursor = 'pointer';
          nodeChip.onclick = () => quickLookupId(item.key);
          nodeChip.innerHTML = `
            <span class="chain-arrow">&rarr;</span>
            <span class="chain-node-id">#${item.key}</span>
            <span class="chain-node-name">${escapeHtml(item.product.name)}</span>
          `;
          chainWrapper.appendChild(nodeChip);
        });

        const nullChip = document.createElement('span');
        nullChip.className = 'chain-arrow';
        nullChip.innerHTML = `&rarr; <span class="chain-null">NULL</span>`;
        chainWrapper.appendChild(nullChip);
      }

      row.appendChild(chainWrapper);
      bucketsContainer.appendChild(row);
    });

    // Auto-scroll to highlighted bucket if requested
    if (highlightIndex !== null) {
      const targetRow = document.getElementById(`bucket-row-${highlightIndex}`);
      if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => targetRow.classList.remove('highlight-pulse'), 2500);
      }
    }
  }

  // 4. BST Visualizer & SVG Tree Rendering
  function renderBstVisualizer() {
    const sortedItems = manager.getSortedInventory();

    // Render In-Order Traversal sequence bar
    bstTraversalPath.innerHTML = '';
    if (sortedItems.length === 0) {
      bstTraversalPath.innerHTML = '<span class="chain-null">Tree is empty</span>';
      bstEmptyNote.style.display = 'block';
      bstSvgCanvas.innerHTML = '';
      return;
    }

    bstEmptyNote.style.display = 'none';

    sortedItems.forEach((product, idx) => {
      const nodePill = document.createElement('span');
      nodePill.className = 'path-node';
      nodePill.title = `Product: ${product.name} | Category: ${product.category}`;
      nodePill.textContent = `#${product.id}`;
      bstTraversalPath.appendChild(nodePill);

      if (idx < sortedItems.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'path-arrow';
        arrow.textContent = '→';
        bstTraversalPath.appendChild(arrow);
      }
    });

    // Render Dynamic SVG Tree
    drawBstSvgTree();
  }

  function drawBstSvgTree() {
    const root = manager.bst.root;
    bstSvgCanvas.innerHTML = '';

    if (!root) return;

    const svgWidth = 800;
    const svgHeight = 280;
    bstSvgCanvas.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    // Compute node coordinates recursively
    const nodes = [];
    const links = [];

    function layoutTree(node, depth = 0, xMin = 20, xMax = svgWidth - 20) {
      if (!node) return null;

      const x = (xMin + xMax) / 2;
      const y = 45 + depth * 65;

      const nodeInfo = {
        node,
        x,
        y,
        id: node.product.id,
        name: node.product.name,
        isRoot: node === manager.bst.root,
        isLeaf: !node.left && !node.right,
      };
      nodes.push(nodeInfo);

      if (node.left) {
        const leftChild = layoutTree(node.left, depth + 1, xMin, x);
        if (leftChild) {
          links.push({ x1: x, y1: y, x2: leftChild.x, y2: leftChild.y });
        }
      }

      if (node.right) {
        const rightChild = layoutTree(node.right, depth + 1, x, xMax);
        if (rightChild) {
          links.push({ x1: x, y1: y, x2: rightChild.x, y2: rightChild.y });
        }
      }

      return nodeInfo;
    }

    layoutTree(root);

    // 1. Draw connecting branches (lines)
    links.forEach((link) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', link.x1);
      line.setAttribute('y1', link.y1);
      line.setAttribute('x2', link.x2);
      line.setAttribute('y2', link.y2);
      line.setAttribute('class', 'bst-line');
      bstSvgCanvas.appendChild(line);
    });

    // 2. Draw circles & text
    nodes.forEach((n) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'bst-node-group');
      g.onclick = () => quickLookupId(n.id);

      // Tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `ID #${n.id}: ${n.name} (Click to inspect)`;
      g.appendChild(title);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', n.x);
      circle.setAttribute('cy', n.y);
      circle.setAttribute('r', '22');

      let circleClass = 'bst-circle';
      if (n.isRoot) circleClass += ' is-root';
      else if (n.isLeaf) circleClass += ' is-leaf';
      circle.setAttribute('class', circleClass);
      g.appendChild(circle);

      // Node ID
      const textId = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textId.setAttribute('x', n.x);
      textId.setAttribute('y', n.y);
      textId.setAttribute('class', 'bst-text-id');
      textId.textContent = n.id;
      g.appendChild(textId);

      // Sub-label (Root or Leaf)
      const textLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textLabel.setAttribute('x', n.x);
      textLabel.setAttribute('y', n.y + 32);
      textLabel.setAttribute('class', 'bst-text-label');
      textLabel.textContent = n.isRoot ? 'ROOT' : n.isLeaf ? 'LEAF' : '';
      g.appendChild(textLabel);

      bstSvgCanvas.appendChild(g);
    });
  }

  // 5. Operation Log Terminal
  function renderTerminalLogs() {
    const logs = manager.getRecentLogs(10);
    terminalLogBody.innerHTML = '';

    if (logs.length === 0) {
      terminalLogBody.innerHTML = '<span class="log-time">// Ready. Awaiting user operations...</span>';
      return;
    }

    logs.forEach((log) => {
      const div = document.createElement('div');
      div.className = 'log-entry';

      const timeStr = log.timestamp.toTimeString().split(' ')[0];

      div.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-tag ${log.component}">${log.component}</span>
        <span class="log-msg">${escapeHtml(log.summary)} — <small style="color:var(--text-muted);">${escapeHtml(log.details)}</small></span>
        <span class="log-complexity">${log.complexity}</span>
      `;
      terminalLogBody.appendChild(div);
    });
  }

  btnClearLog.addEventListener('click', () => {
    manager.operationHistory = [];
    renderTerminalLogs();
    showToast('Terminal log cleared', 'warning');
  });

  // ==========================================================================
  // Form Submission (Add or Update Stock Item)
  // ==========================================================================
  stockForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = Number(productIdInput.value);
    const name = productNameInput.value.trim();
    const category = productCategoryInput.value;
    const qty = Number(productQtyInput.value);
    const price = Number(productPriceInput.value);

    if (!id || !name || !category || isNaN(qty) || isNaN(price)) {
      showToast('Please fill all required fields properly', 'warning');
      return;
    }

    const result = manager.addOrUpdate(id, name, category, qty, price);

    if (result.action === 'UPDATE') {
      showToast(`Updated ID #${id} in O(1) time via Hash Table`, 'success');
    } else {
      showToast(`Inserted ID #${id} into Hash Table & BST`, 'success');
    }

    // Switch to Hash Table tab to show where it landed
    switchTab('tabHash');
    renderHashBuckets(result.bucketIndex);

    updateAllUI();

    // Reset Form
    stockForm.reset();
    btnSubmitStockText.textContent = 'Save / Update Item';
    productIdInput.readOnly = false;
  });

  btnResetForm.addEventListener('click', () => {
    stockForm.reset();
    btnSubmitStockText.textContent = 'Save / Update Item';
    productIdInput.readOnly = false;
  });

  // ==========================================================================
  // Instant Search (Hash Table O(1) Lookup)
  // ==========================================================================
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = Number(searchIdInput.value);
    if (!id) return;
    executeSearch(id);
  });

  function quickLookupId(id) {
    searchIdInput.value = id;
    executeSearch(id);
  }

  function executeSearch(id) {
    const result = manager.searchById(id);

    searchEmptyState.style.display = 'none';
    searchResultCard.classList.remove('hidden');

    const bucketIdx = result.bucketIndex;
    const chainSteps = result.chainSteps;

    searchHashCalc.textContent = `h(${id}) = ${id} % 13 = ${bucketIdx}`;
    searchBucketIndex.textContent = `Bucket [${bucketIdx}]`;
    searchChainSteps.textContent = `${chainSteps} Step${chainSteps === 1 ? '' : 's'}`;
    searchTimestamp.textContent = new Date().toLocaleTimeString();

    if (result.found) {
      searchStatusBadge.textContent = 'ITEM FOUND';
      searchStatusBadge.className = 'badge badge-success';

      const p = result.product;
      searchProductDetails.innerHTML = `
        <div class="product-detail-hero">
          <div>
            <div class="product-detail-name">${escapeHtml(p.name)}</div>
            <div class="product-detail-category">${escapeHtml(p.category)} &bull; ID #${p.id}</div>
          </div>
          <span class="id-badge">Bucket #${bucketIdx}</span>
        </div>

        <div class="product-detail-stats">
          <div>Stock: <strong>${p.quantity} units</strong></div>
          <div>Unit Price: <strong>$${p.price.toFixed(2)}</strong></div>
          <div>Value: <strong>$${p.totalValue.toFixed(2)}</strong></div>
        </div>

        <div class="product-detail-actions">
          <button class="btn btn-secondary btn-xs flex-1" onclick="window.handleEditProduct(${p.id})">
            Edit in Form
          </button>
          <button class="btn btn-outline btn-xs" onclick="window.handleDeleteProduct(${p.id})">
            Delete
          </button>
        </div>
      `;

      showToast(`Found Product #${id} in Bucket [${bucketIdx}] (${chainSteps} step)`, 'success');
    } else {
      searchStatusBadge.textContent = 'NOT FOUND';
      searchStatusBadge.className = 'badge badge-danger';

      searchProductDetails.innerHTML = `
        <div style="color: var(--text-muted); font-size: 0.8rem; padding: 0.25rem 0;">
          Target Bucket [${bucketIdx}] was checked, but ID #${id} does not exist in the linked chain.
        </div>
      `;

      showToast(`Product ID #${id} not found in inventory`, 'warning');
    }

    // Highlight bucket in visualizer
    switchTab('tabHash');
    renderHashBuckets(bucketIdx);
    renderTerminalLogs();
  }

  // ==========================================================================
  // Row Actions: Edit & Delete Handlers
  // ==========================================================================
  window.handleEditProduct = function (id) {
    const res = manager.searchById(id);
    if (!res.found) return;

    const p = res.product;
    productIdInput.value = p.id;
    productIdInput.readOnly = true; // Lock ID during update
    productNameInput.value = p.name;
    productCategoryInput.value = p.category;
    productQtyInput.value = p.quantity;
    productPriceInput.value = p.price;

    btnSubmitStockText.textContent = `Update Stock (#${p.id})`;

    stockForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    productQtyInput.focus();
    showToast(`Loaded ID #${p.id} for O(1) in-place update`, 'success');
  };

  window.handleDeleteProduct = function (id) {
    const confirmDelete = confirm(`Are you sure you want to delete Product #${id} from both Hash Table and BST?`);
    if (!confirmDelete) return;

    const res = manager.deleteById(id);
    if (res.success) {
      showToast(`Deleted Product #${id} from Hash Table & BST`, 'danger');
      // If deleted product was currently displayed in search card, reset search card
      if (Number(searchIdInput.value) === id) {
        searchEmptyState.style.display = 'flex';
        searchResultCard.classList.add('hidden');
        searchIdInput.value = '';
      }
      updateAllUI();
    } else {
      showToast(`Failed to delete ID #${id}: Not found`, 'warning');
    }
  };

  // ==========================================================================
  // Tab Switching
  // ==========================================================================
  function switchTab(targetTabId) {
    if (targetTabId === 'tabHash') {
      tabBtnHash.classList.add('active');
      tabBtnBst.classList.remove('active');
      tabHash.classList.add('active');
      tabBst.classList.remove('active');
      hashLegend.style.display = 'flex';
    } else {
      tabBtnBst.classList.add('active');
      tabBtnHash.classList.remove('active');
      tabBst.classList.add('active');
      tabHash.classList.remove('active');
      hashLegend.style.display = 'none';
      renderBstVisualizer();
    }
  }

  tabBtnHash.addEventListener('click', () => switchTab('tabHash'));
  tabBtnBst.addEventListener('click', () => switchTab('tabBst'));

  // ==========================================================================
  // Header Buttons: Seed Demo Data & Reset
  // ==========================================================================
  btnLoadSeed.addEventListener('click', () => {
    manager.loadSampleSeedData();
    updateAllUI();
    showToast('Loaded 6 demo tech items with pre-configured collisions!', 'success');
  });

  btnClearAll.addEventListener('click', () => {
    const confirmClear = confirm('Are you sure you want to clear all products and reset data structures?');
    if (!confirmClear) return;

    manager.clear();
    stockForm.reset();
    btnSubmitStockText.textContent = 'Save / Update Item';
    productIdInput.readOnly = false;
    searchEmptyState.style.display = 'flex';
    searchResultCard.classList.add('hidden');
    searchIdInput.value = '';

    updateAllUI();
    showToast('All data structures reset to empty state', 'warning');
  });

  // Utility to prevent XSS in text injection
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // Initial Boot: Seed Sample Tech Data
  // ==========================================================================
  manager.loadSampleSeedData();
  updateAllUI();
});
