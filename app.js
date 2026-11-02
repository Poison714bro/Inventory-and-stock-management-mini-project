/**
 * Inventory & Stock Management - Simplified Frontend Controller
 * -------------------------------------------------------------
 * Interacts with the C++ backend REST API when running on the server,
 * and seamlessly falls back to client-side dsa.js when opened directly as a file.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Client-side fallback engine (from dsa.js)
  const localManager = (typeof InventoryManager !== 'undefined') ? new InventoryManager(13) : null;
  if (localManager) {
    localManager.loadSampleSeedData();
  }

  // Detection flag: Check if running on a live server (http/https) vs local file protocol
  const isServer = window.location.protocol.startsWith('http');

  // DOM Elements
  const statItems = document.getElementById('statItems');
  const statUnits = document.getElementById('statUnits');
  const statValuation = document.getElementById('statValuation');
  const statCollisions = document.getElementById('statCollisions');

  const productForm = document.getElementById('productForm');
  const productId = document.getElementById('productId');
  const productName = document.getElementById('productName');
  const productCategory = document.getElementById('productCategory');
  const productQty = document.getElementById('productQty');
  const productPrice = document.getElementById('productPrice');
  const btnSave = document.getElementById('btnSave');
  const btnClearForm = document.getElementById('btnClearForm');

  const searchForm = document.getElementById('searchForm');
  const searchId = document.getElementById('searchId');
  const searchResult = document.getElementById('searchResult');

  const inventoryBody = document.getElementById('inventoryBody');
  const tableEmpty = document.getElementById('tableEmpty');
  const tableCount = document.getElementById('tableCount');
  const bucketsList = document.getElementById('bucketsList');

  const btnSeed = document.getElementById('btnSeed');
  const btnReset = document.getElementById('btnReset');
  const toast = document.getElementById('toast');

  // ==========================================================================
  // Toast Helper
  // ==========================================================================
  function showToast(message) {
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2800);
  }

  // ==========================================================================
  // API Layer (C++ Backend with Fallback)
  // ==========================================================================

  async function fetchInventory() {
    if (isServer) {
      try {
        const res = await fetch('/api/inventory');
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('API unavailable, falling back to local DSA engine.');
      }
    }
    return localManager ? localManager.getSortedInventory() : [];
  }

  async function fetchStats() {
    if (isServer) {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) return await res.json();
      } catch (err) {}
    }
    if (localManager) {
      const stats = localManager.getStats();
      return {
        totalCount: stats.totalCount,
        totalQuantity: stats.totalQuantity,
        totalValuation: stats.totalValuation,
        collidedBuckets: stats.hashStats.collidedBuckets,
      };
    }
    return { totalCount: 0, totalQuantity: 0, totalValuation: 0, collidedBuckets: 0 };
  }

  async function fetchBuckets() {
    if (isServer) {
      try {
        const res = await fetch('/api/buckets');
        if (res.ok) return await res.json();
      } catch (err) {}
    }
    if (localManager) {
      return localManager.hashTable.getBuckets();
    }
    return [];
  }

  async function apiSearch(id) {
    if (isServer) {
      try {
        const res = await fetch(`/api/search?id=${id}`);
        if (res.ok) return await res.json();
      } catch (err) {}
    }
    if (localManager) {
      const res = localManager.searchById(id);
      return {
        found: res.found,
        id: id,
        bucketIndex: res.bucketIndex,
        chainSteps: res.chainSteps,
        product: res.product,
      };
    }
    return { found: false, id, bucketIndex: id % 13, chainSteps: 0, product: null };
  }

  async function apiSaveProduct(p) {
    if (isServer) {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
        });
        if (res.ok) return await res.json();
      } catch (err) {}
    }
    if (localManager) {
      const res = localManager.addOrUpdate(p.id, p.name, p.category, p.quantity, p.price);
      return { success: true, action: res.action, bucketIndex: res.bucketIndex };
    }
    return { success: true };
  }

  async function apiDeleteProduct(id) {
    if (isServer) {
      try {
        const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
        if (res.ok) return await res.json();
      } catch (err) {}
    }
    if (localManager) {
      const res = localManager.deleteById(id);
      return { success: res.success };
    }
    return { success: true };
  }

  async function apiSeed() {
    if (isServer) {
      try {
        await fetch('/api/seed', { method: 'POST' });
      } catch (err) {}
    }
    if (localManager) {
      localManager.loadSampleSeedData();
    }
  }

  async function apiClear() {
    if (isServer) {
      try {
        await fetch('/api/clear', { method: 'POST' });
      } catch (err) {}
    }
    if (localManager) {
      localManager.clear();
    }
  }

  // ==========================================================================
  // Render View Functions
  // ==========================================================================

  async function refreshUI(highlightBucket = null) {
    await renderStats();
    await renderTable();
    await renderBuckets(highlightBucket);
  }

  async function renderStats() {
    const stats = await fetchStats();
    statItems.textContent = stats.totalCount || 0;
    statUnits.textContent = stats.totalQuantity || 0;
    statValuation.textContent = `$${(stats.totalValuation || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    statCollisions.textContent = stats.collidedBuckets || 0;
    tableCount.textContent = `${stats.totalCount || 0} items`;
  }

  async function renderTable() {
    const items = await fetchInventory();
    inventoryBody.innerHTML = '';

    if (!items || items.length === 0) {
      tableEmpty.style.display = 'block';
      return;
    }

    tableEmpty.style.display = 'none';

    items.forEach((p) => {
      const tr = document.createElement('tr');
      const val = p.totalValue !== undefined ? p.totalValue : (p.quantity * p.price);

      tr.innerHTML = `
        <td><span class="badge-id">#${p.id}</span></td>
        <td style="font-weight: 600;">${escapeHtml(p.name)}</td>
        <td><span class="badge-cat">${escapeHtml(p.category)}</span></td>
        <td style="text-align: right;" class="mono">${p.quantity}</td>
        <td style="text-align: right;" class="mono">$${Number(p.price).toFixed(2)}</td>
        <td style="text-align: right;" class="mono" style="color:var(--accent-green);">$${Number(val).toFixed(2)}</td>
        <td style="text-align: center;">
          <button class="btn-delete-row" title="Delete from Hash Table &amp; BST" onclick="window.deleteProduct(${p.id})">
            Delete
          </button>
        </td>
      `;
      inventoryBody.appendChild(tr);
    });
  }

  async function renderBuckets(highlightIndex = null) {
    const buckets = await fetchBuckets();
    bucketsList.innerHTML = '';

    buckets.forEach((b) => {
      const div = document.createElement('div');
      div.className = 'bucket-item';
      div.id = `bucket-${b.index}`;

      if (b.hasCollision || (b.items && b.items.length > 1)) {
        div.classList.add('collision');
      }

      if (highlightIndex === b.index) {
        div.classList.add('highlight-pulse');
      }

      const count = b.count !== undefined ? b.count : (b.items ? b.items.length : 0);
      const collisionTag = count > 1 ? ` (${count})` : '';

      let chainHtml = '';
      if (!b.items || b.items.length === 0) {
        chainHtml = `<span class="chain-null">NULL (Empty)</span>`;
      } else {
        b.items.forEach((it) => {
          const key = it.key !== undefined ? it.key : it.id;
          const name = it.name || (it.product ? it.product.name : '');
          chainHtml += `[<span class="node-key">#${key}</span>: <span class="node-name">${escapeHtml(name)}</span>] <span class="chain-arrow">&rarr;</span> `;
        });
        chainHtml += `<span class="chain-null">NULL</span>`;
      }

      div.innerHTML = `
        <span class="bucket-badge">Bucket [${b.index}]${collisionTag}</span>
        <span class="bucket-chain-text">${chainHtml}</span>
      `;

      bucketsList.appendChild(div);
    });

    if (highlightIndex !== null) {
      const el = document.getElementById(`bucket-${highlightIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => el.classList.remove('highlight-pulse'), 2500);
      }
    }
  }

  // ==========================================================================
  // Form Events (Add / Update Product)
  // ==========================================================================
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = Number(productId.value);
    const name = productName.value.trim();
    const category = productCategory.value;
    const quantity = Number(productQty.value);
    const price = Number(productPrice.value);

    if (!id || !name || !category || isNaN(quantity) || isNaN(price)) {
      showToast('Please fill all fields properly.');
      return;
    }

    const res = await apiSaveProduct({ id, name, category, quantity, price });
    showToast(`Product #${id} saved in C++ backend!`);

    productForm.reset();
    productId.readOnly = false;
    btnSave.textContent = 'Save Product';

    await refreshUI(id % 13);
  });

  btnClearForm.addEventListener('click', () => {
    productForm.reset();
    productId.readOnly = false;
    btnSave.textContent = 'Save Product';
  });

  // ==========================================================================
  // Instant Search by ID
  // ==========================================================================
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(searchId.value);
    if (!id) return;

    const res = await apiSearch(id);

    if (res.found && res.product) {
      const p = res.product;
      searchResult.innerHTML = `
        <div class="search-hit">
          <div class="search-hit-header">
            <span class="search-hit-name">${escapeHtml(p.name)}</span>
            <div class="search-badges">
              <span class="pill pill-bucket">Bucket [${res.bucketIndex}]</span>
              <span class="pill pill-steps">${res.chainSteps} Step(s)</span>
            </div>
          </div>
          <div class="search-hit-details">
            <div>ID: <strong>#${p.id}</strong></div>
            <div>Category: <strong>${escapeHtml(p.category)}</strong></div>
            <div>Stock: <strong>${p.quantity}</strong></div>
            <div>Price: <strong>$${Number(p.price).toFixed(2)}</strong></div>
          </div>
          <div class="search-hit-actions">
            <button class="btn btn-secondary btn-xs" onclick="window.editProduct(${p.id}, '${escapeHtml(p.name)}', '${escapeHtml(p.category)}', ${p.quantity}, ${p.price})">
              Edit in Form
            </button>
            <button class="btn btn-danger-outline btn-xs" onclick="window.deleteProduct(${p.id})">
              Delete
            </button>
          </div>
        </div>
      `;
      showToast(`Found Product #${id} in Bucket [${res.bucketIndex}] (${res.chainSteps} step)`);
    } else {
      searchResult.innerHTML = `
        <div class="search-miss">
          Product ID #${id} not found in Hash Table (Checked Bucket [${res.bucketIndex}]).
        </div>
      `;
      showToast(`Product ID #${id} not found.`);
    }

    await renderBuckets(res.bucketIndex);
  });

  // ==========================================================================
  // Window Global Actions
  // ==========================================================================
  window.editProduct = function (id, name, cat, qty, price) {
    productId.value = id;
    productId.readOnly = true;
    productName.value = name;
    productCategory.value = cat;
    productQty.value = qty;
    productPrice.value = price;
    btnSave.textContent = `Update Stock (#${id})`;
    productQty.focus();
    showToast(`Loaded ID #${id} into form for in-place O(1) update.`);
  };

  window.deleteProduct = async function (id) {
    if (!confirm(`Delete Product #${id} from both Hash Table and BST?`)) return;
    await apiDeleteProduct(id);
    showToast(`Deleted Product #${id}`);

    if (Number(searchId.value) === id) {
      searchResult.innerHTML = `<p class="search-placeholder">Product #${id} was deleted.</p>`;
    }
    await refreshUI();
  };

  btnSeed.addEventListener('click', async () => {
    await apiSeed();
    showToast('Loaded 6 demo items in C++ backend with collisions!');
    await refreshUI();
  });

  btnReset.addEventListener('click', async () => {
    if (!confirm('Clear all products from both data structures?')) return;
    await apiClear();
    productForm.reset();
    productId.readOnly = false;
    btnSave.textContent = 'Save Product';
    searchResult.innerHTML = `<p class="search-placeholder">Enter any ID to inspect instant O(1) Hash Table bucket calculation.</p>`;
    showToast('All items cleared.');
    await refreshUI();
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Load
  refreshUI();
});
