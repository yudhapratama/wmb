import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import api from '../services/api'
import db from '../services/db'
import { useOfflineStatus } from './useOfflineStatus'

/**
 * Composable for fetching data from API with offline support
 * @param {string} entity - The entity name (e.g., 'suppliers')
 * @param {Object} options - Query options
 * @returns {Object} Data and related methods
 */
export function useApiData(entity, options = {}) {
  const { isOffline, justCameOnline } = useOfflineStatus()
  const isSyncing = ref(false)
  
  // Add default fields parameter for deep populate
  if (!options.params) options.params = {}
  if (!options.params.fields) {
    // Default fields untuk deep populate
    switch(entity) {
      case 'raw_materials':
        options.params.fields = '*,kategori.*,unit.*,supplier_utama.*'
        break
      case 'products':
        options.params.fields = '*,kategori.*,resep.cooked_items_id.*,supplier_konsinyasi.*'
        break
      case 'purchase_orders':
        options.params.fields = '*,supplier.*,items.*,items.item.*'
        break
      default:
        options.params.fields = '*'
    }
  }
  
  // Fetch data from API
  const fetchFromApi = async () => {
    const response = await api.get(`/items/${entity}`, { params: options.params })
    const items = response.data.data
    
    // Store in local database
    await db.transaction('rw', db[entity], async () => {
      if (options.clearExisting) {
        await db[entity].clear()
      }
      await db[entity].bulkPut(items)
    })
    
    return items
  }
  
  // Fetch data from local database
  const fetchFromLocal = async () => {
    return await db[entity].toArray()
  }
  
  // Use Vue Query for caching and refetching
  const query = useQuery({
    queryKey: [entity, options],
    queryFn: async () => {
      if (isOffline.value) {
        return fetchFromLocal()
      } else {
        isSyncing.value = true
        try {
          const data = await fetchFromApi()
          isSyncing.value = false
          return data
        } catch (error) {
          isSyncing.value = false
          console.error(`Error fetching ${entity}:`, error)
          // Fallback to local data if API fails
          return fetchFromLocal()
        }
      }
    },
    // Refetch when coming back online
    refetchOnWindowFocus: justCameOnline.value,
    ...options
  })
  
  return {
    ...query,
    isSyncing
  }
}