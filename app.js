/**
 * ============================================================================
 * Inventory & Stock Management - Clean Lightweight UI Controller
 * ============================================================================
 * Interfaces cleanly with the C++ REST API:
 * - GET    /api/inventory  -> BST In-Order sorted product list
 * - GET    /api/search     -> O(1) Hash Table lookup & chain diagnostics
 * - GET    /api/buckets    -> 13-bucket distribution with collision chains
 * - GET    /api/stats      -> Global statistics
 * - POST   /api/products   -> Add / Update product
 * - DELETE /api/products   -> Delete from Hash Table & BST
 * - POST   /api/seed       -> Re-seed sample data with pre-configured collisions
 * - POST   /api/clear      -> Reset inventory
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Cache
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
  function showToast(msg) {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2800);
  }

  // ==========================================================================
  // Unified C++ REST API Client
  // ==========================================================================
  async function api(path, method = 'GET', data = null) {
    try {
      const options = { method, headers: {} };
      if (data) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
      const res = await fetch(path, options);
      return res.ok ? await res.json() : null;
    } catch (err) {
      console.warn(`[API] Failed to fetch ${path}:`, err);
      return null;
    }
  }

  // ==========================================================================
  // Render Views
  // ==========================================================================
  async function refreshUI(highlightBucket = null) {
    await Promise.all([renderStats(), renderTable(), renderBuckets(highlightBucket)]);
  }

  async function renderStats() {
    const stats = await api('/api/stats');
    if (!stats) return;

    statItems.textContent = stats.totalCount ?? 0;
    statUnits.textContent = stats.totalQuantity ?? 0;
    statValuation.textContent = `$${(stats.totalValuation ?? 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    statCollisions.textContent = stats.collidedBuckets ?? 0;
    tableCount.textContent = `${stats.totalCount ?? 0} items`;
  }

  async function renderTable() {
    const items = await api('/api/inventory');
    inventoryBody.innerHTML = '';

    if (!items || items.length === 0) {
      tableEmpty.style.display = 'block';
      return;
    }

    tableEmpty.style.display = 'none';

    items.forEach((p) => {
      const tr = document.createElement('tr');
      const total = p.totalValue ?? (p.quantity * p.price);

      tr.innerHTML = `
        <td><span class="badge-id">#${p.id}</span></td>
        <td style="font-weight: 600;">${escapeHtml(p.name)}</td>
        <td><span class="badge-cat">${escapeHtml(p.category)}</span></td>
        <td style="text-align: right;" class="mono">${p.quantity}</td>
        <td style="text-align: right;" class="mono">$${Number(p.price).toFixed(2)}</td>
        <td style="text-align: right;" class="mono" style="color:var(--accent-green);">$${Number(total).toFixed(2)}</td>
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
    const buckets = await api('/api/buckets');
    if (!buckets) return;

    bucketsList.innerHTML = '';

    buckets.forEach((b) => {
      const div = document.createElement('div');
      div.className = 'bucket-item';
      div.id = `bucket-${b.index}`;

      const count = b.count ?? (b.items ? b.items.length : 0);
      if (b.hasCollision || count > 1) {
        div.classList.add('collision');
      }

      if (highlightIndex === b.index) {
        div.classList.add('highlight-pulse');
      }

      let chainHtml = '';
      if (!b.items || b.items.length === 0) {
        chainHtml = `<span class="chain-null">NULL (Empty)</span>`;
      } else {
        b.items.forEach((it) => {
          chainHtml += `[<span class="node-key">#${it.key}</span>: <span class="node-name">${escapeHtml(it.name)}</span>] <span class="chain-arrow">&rarr;</span> `;
        });
        chainHtml += `<span class="chain-null">NULL</span>`;
      }

      div.innerHTML = `
        <span class="bucket-badge">Bucket [${b.index}]${count > 1 ? ` (${count})` : ''}</span>
        <span class="bucket-chain-text">${chainHtml}</span>
      `;

      bucketsList.appendChild(div);
    });

    if (highlightIndex !== null) {
      const target = document.getElementById(`bucket-${highlightIndex}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => target.classList.remove('highlight-pulse'), 2500);
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

    const res = await api('/api/products', 'POST', { id, name, category, quantity, price });
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

    const res = await api(`/api/search?id=${id}`);

    if (res && res.found && res.product) {
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
      showToast(`Found Product #${id} in Bucket [${res.bucketIndex}]`);
      renderBuckets(res.bucketIndex);
    } else {
      const bucket = res ? res.bucketIndex : (id % 13);
      searchResult.innerHTML = `
        <div class="search-miss">
          Product ID #${id} not found in Hash Table (Checked Bucket [${bucket}]).
        </div>
      `;
      showToast(`Product ID #${id} not found.`);
      renderBuckets(bucket);
    }
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
    showToast(`Loaded #${id} for in-place O(1) update.`);
  };

  window.deleteProduct = async function (id) {
    if (!confirm(`Delete Product #${id} from both Hash Table and BST?`)) return;
    await api(`/api/products?id=${id}`, 'DELETE');
    showToast(`Deleted Product #${id}`);

    if (Number(searchId.value) === id) {
      searchResult.innerHTML = `<p class="search-placeholder">Product #${id} was deleted.</p>`;
    }
    await refreshUI();
  };

  btnSeed.addEventListener('click', async () => {
    await api('/api/seed', 'POST');
    showToast('Loaded 6 demo items in C++ backend with collisions!');
    await refreshUI();
  });

  btnReset.addEventListener('click', async () => {
    if (!confirm('Clear all products from both data structures?')) return;
    await api('/api/clear', 'POST');
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

  // Initial Boot
  refreshUI();
});
