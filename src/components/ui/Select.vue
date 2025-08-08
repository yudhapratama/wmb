<template>
  <Listbox v-model="selectedValue" @update:modelValue="handleChange">
    <div class="relative" ref="containerRef">
      <ListboxButton
        ref="buttonRef"
        class="relative w-full cursor-default rounded-md bg-white py-3 pl-3 pr-10 text-left border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
        @click="toggleDropdown"
      >
        <span class="block truncate">{{ displayValue || placeholder }}</span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>

      <Teleport to="body">
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <ListboxOptions
            v-if="isDropdownOpen"
            :style="dropdownStyle"
            class="fixed z-[9999] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            @click="closeDropdown"
          >
            <div v-if="filteredOptions.length === 0" class="px-4 py-2 text-gray-500 text-center">
              Tidak ada data ditemukan
            </div>
            <ListboxOption
              v-else
              v-slot="{ active, selected }"
              v-for="option in filteredOptions"
              :key="option.value"
              :value="option.value"
              as="template"
            >
              <li
                :class="[
                  active ? 'bg-blue-100 text-blue-900' : 'text-gray-900',
                  'relative cursor-default select-none py-2 pl-10 pr-4 hover:bg-gray-50',
                ]"
              >
                <span
                  :class="[
                    selected ? 'font-medium' : 'font-normal',
                    'block truncate',
                  ]"
                >
                  {{ option.label }}
                </span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </Teleport>
    </div>
  </Listbox>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Pilih opsi...'
  },
  searchable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const containerRef = ref(null)
const buttonRef = ref(null)
const isDropdownOpen = ref(false)
const dropdownStyle = ref({})
const searchQuery = ref('')

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    closeDropdown()
  }
})

const displayValue = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label || ''
})

const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options
  }
  return props.options.filter(option => 
    option.label.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Calculate optimal dropdown position
function calculateDropdownPosition() {
  if (!buttonRef.value?.$el) return
  
  const buttonRect = buttonRef.value.$el.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const dropdownMaxHeight = 240 // max-h-60
  const optionHeight = 40 // approximate height per option
  const actualDropdownHeight = Math.min(dropdownMaxHeight, filteredOptions.value.length * optionHeight + 16)
  
  const spaceBelow = viewportHeight - buttonRect.bottom - 8
  const spaceAbove = buttonRect.top - 8
  
  let top, maxHeight, transformOrigin
  
  // Determine if dropdown should open upward or downward
  if (spaceBelow >= actualDropdownHeight || spaceBelow >= spaceAbove) {
    // Open downward
    top = buttonRect.bottom + window.scrollY + 4
    maxHeight = Math.min(actualDropdownHeight, spaceBelow)
    transformOrigin = 'top'
  } else {
    // Open upward
    maxHeight = Math.min(actualDropdownHeight, spaceAbove)
    top = buttonRect.top + window.scrollY - maxHeight - 4
    transformOrigin = 'bottom'
  }
  
  // Ensure dropdown doesn't overflow horizontally
  let left = buttonRect.left + window.scrollX
  const dropdownWidth = buttonRect.width
  
  if (left + dropdownWidth > viewportWidth - 16) {
    left = viewportWidth - dropdownWidth - 16
  }
  
  dropdownStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${buttonRect.width}px`,
    maxHeight: `${maxHeight}px`,
    transformOrigin
  }
}

function toggleDropdown() {
  if (isDropdownOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

function openDropdown() {
  isDropdownOpen.value = true
  nextTick(() => {
    calculateDropdownPosition()
  })
}

function closeDropdown() {
  isDropdownOpen.value = false
  searchQuery.value = ''
}

function handleChange(value) {
  emit('update:modelValue', value)
  closeDropdown()
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    closeDropdown()
  }
}

// Recalculate position on scroll/resize
function handlePositionUpdate() {
  if (isDropdownOpen.value) {
    calculateDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handlePositionUpdate, true)
  window.addEventListener('resize', handlePositionUpdate)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handlePositionUpdate, true)
  window.removeEventListener('resize', handlePositionUpdate)
})

// Watch for options changes to recalculate position
watch(() => props.options.length, () => {
  if (isDropdownOpen.value) {
    nextTick(() => {
      calculateDropdownPosition()
    })
  }
})
</script>