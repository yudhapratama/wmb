import Dexie from 'dexie'

// Enable Dexie debugging
Dexie.debug = true;

// Define the database
class WarungDatabase extends Dexie {
  constructor() {
    super('warung_db')
    
    // Define version 1 schema (original)
    this.version(1).stores({
      suppliers: '++id, nama_pt_toko, status',  // Menggunakan nama field Directus
      item_categories: 'id, name, status',
      expense_categories: 'id, name, status',
      raw_materials: 'id, nama_item, kategori, total_stock, status',
      products: 'id, nama_produk, harga_jual, tipe_produk, status',
      recipe_items: 'id, recipe_id, cooked_items_id, quantity',
      purchase_orders: 'id, supplier, status, date, sync_status',
      po_items: 'id, purchase_order_id, item, jumlah_pesan, harga_satuan',
      stock_opname: 'id, raw_material_id, date, sync_status',
      kitchen_preparations: 'id, raw_material_id, date, sync_status',
      waste_records: 'id, raw_material_id, date, sync_status',
      sales_sessions: 'id, date, status, sync_status',
      sales: 'id, sales_session_id, status, sync_status',
      sales_items: 'id, sales_id, product_id',
      expenses: 'id, category_id, date, sync_status',
      sync_queue: '++id, entity, entity_id, action, data, timestamp'
    })
    
    // Define version 2 schema with unit field added
    this.version(2).stores({
      raw_materials: '++id, name, category_id, stock_quantity, status, unit'
    })
    
    // Define version 3 schema with suppliers using auto-increment
    this.version(3).stores({
      suppliers: '++id, name, status'
    })

    // Define version 4 to add cache timestamp
    this.version(4).stores({
      suppliers: '++id, nama_pt_toko, status, cached_at',
      item_categories: 'id, name, status, cached_at',
      expense_categories: 'id, name, status, cached_at',
      raw_materials: 'id, nama_item, kategori, total_stock, status, cached_at',
      products: 'id, nama_produk, harga_jual, tipe_produk, status, cached_at',
      recipe_items: 'id, recipe_id, cooked_items_id, quantity, cached_at',
      purchase_orders: 'id, supplier, status, date, sync_status, cached_at',
      po_items: 'id, purchase_order_id, item, jumlah_pesan, harga_satuan, cached_at',
      stock_opname: 'id, raw_material_id, date, sync_status, cached_at',
      kitchen_preparations: 'id, raw_material_id, date, sync_status, cached_at',
      waste_records: 'id, raw_material_id, date, sync_status, cached_at',
      sales_sessions: 'id, date, status, sync_status, cached_at',
      sales: 'id, sales_session_id, status, sync_status, cached_at',
      sales_items: 'id, sales_id, product_id, cached_at',
      expenses: 'id, category_id, date, sync_status, cached_at',
    })
    
    // Define version 5 to add units table
    this.version(5).stores({
      units: 'id, name, value, cached_at'
    })
    
    // Define tables
    this.suppliers = this.table('suppliers')
    this.item_categories = this.table('item_categories')
    this.expense_categories = this.table('expense_categories')
    this.raw_materials = this.table('raw_materials')
    this.products = this.table('products')
    this.recipe_items = this.table('recipe_items')
    this.purchase_orders = this.table('purchase_orders')
    this.po_items = this.table('po_items')
    this.stock_opname = this.table('stock_opname')
    this.kitchen_preparations = this.table('kitchen_preparations')
    this.waste_records = this.table('waste_records')
    this.sales_sessions = this.table('sales_sessions')
    this.sales = this.table('sales')
    this.sales_items = this.table('sales_items')
    this.expenses = this.table('expenses')
    this.sync_queue = this.table('sync_queue')
    this.units = this.table('units')
  }

  async purgeOldCache() {
    const oneDayAgo = new Date().getTime() - (1 * 24 * 60 * 60 * 1000);

    const tablesToPurge = [
      'suppliers',
      'item_categories',
      'expense_categories',
      'raw_materials',
      'products',
      'recipe_items',
      'purchase_orders',
      'po_items',
      'stock_opname',
      'kitchen_preparations',
      'waste_records',
      'sales_sessions',
      'sales',
      'sales_items',
      'expenses',
      'units',
    ];

    for (const tableName of tablesToPurge) {
        try {
            await this[tableName].where('cached_at').below(oneDayAgo).delete();
            console.log(`Purged old cache from ${tableName}`);
        } catch (error) {
            console.error(`Failed to purge cache for ${tableName}:`, error);
        }
    }
  }
  
  // Tambahkan metode addToSyncQueue
  async addToSyncQueue(entity, entity_id, action, data) {
    // Validasi parameter
    if (!entity || !entity_id || !action) {
      throw new Error('Missing required parameters for sync queue')
    }
    
    // Validasi action
    if (!['create', 'update', 'delete'].includes(action)) {
      throw new Error(`Invalid action: ${action}. Must be 'create', 'update', or 'delete'`)
    }
    
    // Tambahkan ke sync_queue
    return await this.sync_queue.add({
      entity,
      entity_id,
      action,
      data,
      timestamp: new Date().toISOString()
    })
  }
}

// Create and export a singleton instance
const db = new WarungDatabase()

export default db