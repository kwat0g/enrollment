import { sanitizeByType } from '@/utils/sanitize'

// Usage examples:
// <input v-sanitize> // defaults to 'string'
// <input v-sanitize:"name"> // built-in type 'name'
// <input v-sanitize="{ type: 'phone', max: 20 }"> // with options
// <input v-sanitize:[dynamicArg]="dynamicOptions"> // dynamic type

function apply(el, binding) {
  const argType = binding.arg || (binding.value && binding.value.type) || 'string'
  const opts = (binding.value && typeof binding.value === 'object') ? binding.value : {}
  const current = el.value ?? ''
  const sanitized = sanitizeByType(current, argType, opts)
  if (sanitized !== current) {
    el.value = sanitized
    el.dispatchEvent(new Event('input'))
  }
}

const SanitizeDirective = {
  mounted(el, binding) {
    // Initial sanitize
    apply(el, binding)
    // Sanitize on user input
    el.__sanitizeHandler__ = () => apply(el, binding)
    el.addEventListener('input', el.__sanitizeHandler__)
    el.addEventListener('change', el.__sanitizeHandler__)
  },
  updated(el, binding) {
    // Re-apply when bound value/type changes
    apply(el, binding)
  },
  unmounted(el) {
    if (el.__sanitizeHandler__) {
      el.removeEventListener('input', el.__sanitizeHandler__)
      el.removeEventListener('change', el.__sanitizeHandler__)
      delete el.__sanitizeHandler__
    }
  }
}

export default SanitizeDirective
