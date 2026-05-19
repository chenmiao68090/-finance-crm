import type { App, Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * v-hasPermi directive for button-level permission control
 * Usage: v-hasPermi="['system:user:add']"
 */
const hasPermi: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string[]>) {
    const { value } = binding
    const userStore = useUserStore()
    const permissions = userStore.permissions
    const allPermission = '*:*:*'

    if (value && value.length > 0) {
      const hasPermission = permissions.some((perm: string) => {
        return allPermission === perm || value.includes(perm)
      })
      if (!hasPermission) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error('v-hasPermi requires permission value, e.g. v-hasPermi="[\'system:user:add\']"')
    }
  }
}

/**
 * v-hasRole directive for role-level permission control
 * Usage: v-hasRole="['admin']"
 */
const hasRole: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string[]>) {
    const { value } = binding
    const userStore = useUserStore()
    const roles = userStore.roles
    const superAdmin = 'admin'

    if (value && value.length > 0) {
      const hasRoleFlag = roles.some((role: string) => {
        return superAdmin === role || value.includes(role)
      })
      if (!hasRoleFlag) {
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error('v-hasRole requires role value, e.g. v-hasRole="[\'admin\']"')
    }
  }
}

export function setupPermissionDirective(app: App) {
  app.directive('hasPermi', hasPermi)
  app.directive('hasRole', hasRole)
}

export default { hasPermi, hasRole }
