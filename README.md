# 📦 Inventory and Stock Management System

> **Advanced Data Structures & Algorithms (ADS) Mini Project**  
> A high-performance, lightweight inventory tracking engine powered by custom **Hash Table** and **Binary Search Tree (BST)** implementations from scratch.

[![Language: C++17](https://img.shields.io/badge/Language-C%2B%2B17-blue.svg)](backend/)
[![Frontend: HTML5/CSS3/ES6](https://img.shields.io/badge/Frontend-Vanilla_JS-yellow.svg)](index.html)
[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://miniproject-code-blooded23.vercel.app)
[![Data Structures](https://img.shields.io/badge/DSA-Hash_Table_+_BST-emerald.svg)](backend/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 📌 Table of Contents
1. [Project Overview & Core Objective](#-project-overview--core-objective)
2. [Dual-Engine System Architecture](#-dual-engine-system-architecture)
3. [Data Structures Implementation Details](#-data-structures-implementation-details)
4. [Time & Space Complexity Analysis](#-time--space-complexity-analysis)
5. [Pre-Configured Seed Data & Mathematical Collision Proof](#-pre-configured-seed-data--mathematical-collision-proof)
6. [Supported Execution Modes](#-supported-execution-modes)
7. [How to Run Locally & Build](#-how-to-run-locally--build)
8. [Vercel Cloud Deployment](#-vercel-cloud-deployment)
9. [Project File Structure](#-project-file-structure)
10. [License](#-license)

---

## 🎯 Project Overview & Core Objective

In real-world warehouse and supply chain management, systems face two competing operational demands:
1. **Instant Product Lookup & In-Place Updates ($O(1)$)**: Warehouse scanners and point-of-sale terminals require immediate item access by ID without scanning entire tables.
2. **Ordered Stock Cataloging & Reporting ($O(n)$)**: Auditing, cataloging, and stocktaking require products sorted numerically by Product ID without invoking expensive $O(n \log n)$ sorting algorithms repeatedly.

### The Solution: Dual-Engine Architecture
Rather than forcing a single data structure to handle conflicting access patterns, this project synchronizes two specialized data structures:
- **Custom Hash Table with Separate Chaining**: Provides average **$O(1)$** lookup, insertion, and in-place stock mutation.
- **Custom Binary Search Tree (BST)**: Provides **$O(n)$** natural ascending sorted order via **In-Order Traversal (Left $\rightarrow$ Root $\rightarrow$ Right)** without using built-in sorting functions.
- **Shared Memory Reference Model**: Both data structures hold pointers (`Product*`) to the exact same heap memory instance. Any change made through the Hash Table is instantly reflected when traversing the BST.

---

## 🏗️ Dual-Engine System Architecture

```
                          [ Client Interface ]
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
 [ Web Dashboard (HTTP/REST) ]                   [ Interactive Terminal (CLI) ]
 (index.html, style.css, app.js)                        (inventory.exe)
        │                                                       │
        └───────────────────────────┬───────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       InventoryManager (Controller)                         │
│   Manages shared heap allocations & synchronizes both data structures       │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
             Shared Memory Reference (`Product*`)
             ┌────────────────┴────────────────┐
             ▼                                 ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│       CustomHashTable       │   │         ProductBST          │
│ - Capacity: 13 (Prime)      │   │ - Key: product->id          │
│ - Separate Chaining         │   │ - 3-Case Deletion           │
│ - Hash: h(k) = |k| % 13     │   │ - In-Order Traversal (O(n)) │
│ - O(1) Search & Updates     │   │ - O(log n) Tree Insertion   │
└─────────────────────────────┘   └─────────────────────────────┘
             │                                 │
             ▼                                 ▼
   [ Fast Point Lookups ]             [ Live Sorted Tables ]
   [ Bucket Chain Diagnostics ]       [ Ascending Catalogs ]
```

---

## 🔬 Data Structures Implementation Details

### 1. `Product` Class / Struct ([`Product.hpp`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/backend/Product.hpp))
Represents the individual inventory item:
```cpp
class Product {
public:
    int id;               // Unique primary key
    std::string name;     // Product name
    std::string category; // Hardware category (GPU, CPU, RAM, etc.)
    int quantity;         // Units currently in stock
    double price;         // Unit price in USD
    
    double getTotalValue() const { return quantity * price; }
    std::string toJson() const;
};
```

### 2. `CustomHashTable` ([`CustomHashTable.hpp`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/backend/CustomHashTable.hpp))
- **Fixed Capacity**: 13 buckets (prime number). Prime table capacity minimizes clustering when IDs share common divisors.
- **Hash Function**:
  $$\text{hash}(\text{key}) = |\text{key}| \pmod{13}$$
- **Collision Resolution (Separate Chaining)**:
  - Each bucket contains a pointer to the head of a singly-linked list of `HashNode` objects.
  - New collisions are prepended to the bucket's linked list head in **$O(1)$** time.
- **Core Methods**:
  - `put(key, product, outBucket, outSteps)`: Inserts new node or updates existing node in-place.
  - `get(key, outBucket, outSteps)`: Traverses bucket chain, returns item pointer and diagnostic step count.
  - `remove(key, outBucket, outSteps)`: Unlinks node from chain, decrements table size.
  - `getCollisionStats(occupied, collided, overflow)`: Computes active collisions and load factor.

### 3. `ProductBST` ([`ProductBST.hpp`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/backend/ProductBST.hpp))
- **Structure**: Binary Search Tree where each `BSTNode` contains a pointer to a `Product` instance, a `left` child pointer, and a `right` child pointer.
- **Ordering Invariant**:
  $$\forall \text{ node } N, \quad \text{ID}(\text{LeftSubtree}(N)) < \text{ID}(N) < \text{ID}(\text{RightSubtree}(N))$$
- **Core Methods**:
  - `insert(product)`: Places product in tree according to ID ordering in $O(\log n)$ average time.
  - `remove(id)`: Comprehensive **3-case deletion**:
    - **Case 1 (Leaf Node)**: Directly delete node and set parent pointer to `nullptr`.
    - **Case 2 (Single Child)**: Bypass node and link parent directly to child.
    - **Case 3 (Two Children)**: Locate the **In-Order Successor** (smallest node in right subtree), copy successor's data into current node, and recursively delete the successor.
  - `inOrderTraversal()`: Traverses **Left $\rightarrow$ Root $\rightarrow$ Right** recursively, producing an ascending sorted array in $O(n)$ time.

### 4. `InventoryManager` ([`InventoryManager.hpp`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/backend/InventoryManager.hpp))
- Synchronizes both structures.
- On `addOrUpdate`:
  1. Searches Hash Table first in $O(1)$.
  2. If found $\rightarrow$ Mutates product properties in-place. Because the BST points to the exact same pointer, the BST is automatically updated with zero overhead.
  3. If not found $\rightarrow$ Allocates `new Product(...)` and inserts into both Hash Table and BST.
- On `deleteById`: Removes from both Hash Table chain and BST, then frees heap memory safely.

---

## 📊 Time & Space Complexity Analysis

| Operation | Primary Structure | Average Case | Worst Case (Degenerate) | Space Complexity | Description & Rationale |
|---|---|:---:|:---:|:---:|---|
| **Search by ID** | Hash Table | $\mathbf{O(1)}$ | $O(k)$ | $O(1)$ | Direct bucket index computation followed by short chain walk |
| **In-Place Update** | Hash Table | $\mathbf{O(1)}$ | $O(k)$ | $O(1)$ | Mutates existing `Product*` pointer in memory directly |
| **Insert New Item** | Hash Table + BST | $\mathbf{O(1) + O(\log n)}$ | $O(n)$ | $O(1)$ | Prepends to bucket head ($O(1)$) + binary tree placement ($O(\log n)$) |
| **Sorted Listing** | BST In-Order Walk | $\mathbf{O(n)}$ | $O(n)$ | $O(h)$ auxiliary | Visits each node once (Left $\rightarrow$ Root $\rightarrow$ Right); no sorting pass needed |
| **Delete Item** | Hash Table + BST | $\mathbf{O(1) + O(\log n)}$ | $O(n)$ | $O(h)$ auxiliary | Unlinks from linked list chain + BST in-order successor replacement |

*Where $n$ is total products, $k$ is bucket chain length ($k \ll n$), and $h$ is BST height ($h = O(\log n)$ for balanced trees).*

---

## 🧪 Pre-Configured Seed Data & Mathematical Collision Proof

The demo data seeds 6 hardware items in **unsorted ID order**:
`105, 101, 118, 103, 114, 109`

### Modulo 13 Bucket Distribution Proof:

$$\text{Bucket Index} = \text{ID} \pmod{13}$$

1. **ID 105**: $105 = 13 \times 8 + 1 \implies \mathbf{Bucket\ [1]}$
2. **ID 101**: $101 = 13 \times 7 + 10 \implies \mathbf{Bucket\ [10]}$
3. **ID 118**: $118 = 13 \times 9 + 1 \implies \mathbf{Bucket\ [1]} \quad \mathbf{[COLLISION\ with\ 105]}$
4. **ID 103**: $103 = 13 \times 7 + 12 \implies \mathbf{Bucket\ [12]}$
5. **ID 114**: $114 = 13 \times 8 + 10 \implies \mathbf{Bucket\ [10]} \quad \mathbf{[COLLISION\ with\ 101]}$
6. **ID 109**: $109 = 13 \times 8 + 5 \implies \mathbf{Bucket\ [5]}$

```
=== Hash Table Bucket Chaining Visualization ===
Bucket [0]  : NULL (Empty)
Bucket [1]  : [#118: Corsair DDR5] -> [#105: Ryzen 7] -> NULL  <-- [COLLISION: 2 Items]
Bucket [2]  : NULL (Empty)
Bucket [3]  : NULL (Empty)
Bucket [4]  : NULL (Empty)
Bucket [5]  : [#109: ASUS OLED] -> NULL
Bucket [6]  : NULL (Empty)
Bucket [7]  : NULL (Empty)
Bucket [8]  : NULL (Empty)
Bucket [9]  : NULL (Empty)
Bucket [10] : [#114: Logitech Mouse] -> [#101: RTX 4070] -> NULL <-- [COLLISION: 2 Items]
Bucket [11] : NULL (Empty)
Bucket [12] : [#103: Samsung 990 Pro] -> NULL
```

### Binary Search Tree Structure:
```
                     [105] (Root)
                    /     \
               [101]       [118]
                   \       /
                  [103]  [114]
                         /
                       [109]

In-Order Walk Output: 101 -> 103 -> 105 -> 109 -> 114 -> 118 (Strictly Ascending)
```

---

## 🚀 Supported Execution Modes

### Mode 1: Cloud Deployment (Vercel)
The web application is deployed online on Vercel:
👉 **[https://miniproject-code-blooded23.vercel.app](https://miniproject-code-blooded23.vercel.app)**
- Runs full client-side DSA simulation in the browser via [`dsa.js`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/dsa.js).
- Interactive GUI for adding items, searching with diagnostic step counts, and inspecting collision chains.

### Mode 2: Local Native C++ Web Server
Runs the standalone C++ backend using Windows Sockets:
```powershell
.\inventory.exe --server 8080
# or
npm run dev
```
Visit **[http://localhost:8080](http://localhost:8080)**. Frontend communicates with the native C++ REST API (`/api/inventory`, `/api/search`, `/api/products`, `/api/buckets`, `/api/stats`).

### Mode 3: Interactive Academic Console CLI
For viva examination, terminal grading, or code walkthroughs:
```powershell
.\inventory.exe
# or
npm run cli
```
Interactive terminal menu:
```
------------------- DSA INVENTORY MENU -------------------
1. Add or Update Stock Item (O(1) Hash / O(log n) BST)
2. Search Product by ID (O(1) Hash Table Lookup)
3. Display Sorted Inventory (O(n) BST In-Order Traversal)
4. Delete Product by ID (O(1) Chain + O(log n) BST Successor)
5. Inspect Hash Table Buckets & Collision Chaining
6. Display System Statistics & Time Complexities
7. Re-Seed Demo Data (IDs: 105, 101, 118, 103, 114, 109)
8. Start Native C++ Web Server on Port 8080
9. Exit
```

### Mode 4: Standalone Static File
Double-click [`index.html`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/index.html) to open directly in any web browser without needing any server or internet connection.

---

## 🛠️ How to Run Locally & Build

### Prerequisites
- Any modern C++ compiler (`g++`, `clang++`, or MSVC) supporting **C++17**.
- Node.js (Optional, for npm runner scripts).

### 1. Compile C++ Backend from Source
Using `g++` (MinGW / GCC / LLVM):
```powershell
g++ -std=c++17 -O2 -static backend/main.cpp -o inventory.exe -lws2_32
```
*The `-static` flag bundles all runtime dependencies, making `inventory.exe` portable to any Windows machine without requiring external DLLs.*

### 2. NPM Convenience Commands
If Node.js is installed, you can use:
```bash
npm run dev       # Starts native C++ server on port 8080
npm run cli       # Starts interactive C++ console CLI
npm run compile   # Recompiles C++ backend into inventory.exe
npm run build     # Generates Vercel static build output
```

---

## 🌐 Vercel Cloud Deployment

The repository is configured for automated Vercel CI/CD:
- **[`build.js`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/build.js)**: Automatically packages `index.html`, `style.css`, `app.js`, and `dsa.js` into `.vercel/output/static` (Vercel Build Output API v3) and `public/`.
- **[`vercel.json`](file:///c:/Users/Pushkar/OneDrive/Desktop/ADS%20mini%20project/vercel.json)**: Declares clean URLs and static routing.
- Continuous deployment automatically triggers upon pushing to the `main` branch.

---

## 📂 Project File Structure

```
├── backend/
│   ├── Product.hpp            # Product entity class (id, name, category, quantity, price)
│   ├── CustomHashTable.hpp    # 13-bucket Hash Table with separate chaining
│   ├── ProductBST.hpp         # BST with 3-case deletion & in-order traversal
│   ├── InventoryManager.hpp   # Controller synchronizing both structures via Product*
│   └── main.cpp               # Interactive CLI + Native C++ HTTP Web Server
├── public/                    # Vercel static distribution directory
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── dsa.js
├── build.js                   # Cross-platform build script for Vercel
├── inventory.exe              # Statically compiled standalone C++ executable (Windows)
├── index.html                 # Minimal, clean responsive dashboard UI
├── style.css                  # Modern dark-slate CSS design system
├── app.js                     # Unified frontend controller (C++ REST API + fallback)
├── dsa.js                     # Pure JavaScript client-side DSA implementation
├── package.json               # NPM scripts (dev, cli, compile, build)
├── vercel.json                # Vercel deployment configuration
├── .gitignore                 # Excludes build artifacts and IDE folders
└── README.md                  # Comprehensive project documentation
```


## 📄 License
This project is open-source and distributed under the [MIT License](LICENSE).