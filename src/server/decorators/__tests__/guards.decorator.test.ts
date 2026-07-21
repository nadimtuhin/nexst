import 'reflect-metadata'
import { UseGuards, getGuards } from '../guards.decorator'

class AuthGuard {
  canActivate() {
    return true
  }
}
class RoleGuard {
  canActivate() {
    return true
  }
}

describe('@UseGuards / getGuards', () => {
  it('attaches guards to a method in declared order', () => {
    class Ctrl {
      @UseGuards(AuthGuard, RoleGuard)
      handler() {}
    }
    expect(getGuards(Ctrl.prototype, 'handler')).toEqual([AuthGuard, RoleGuard])
  })

  it('attaches guards at the class level', () => {
    @UseGuards(AuthGuard)
    class Ctrl {
      handler() {}
    }
    expect(getGuards(Ctrl)).toEqual([AuthGuard])
  })

  it('returns an empty array when no guards are applied', () => {
    class Ctrl {
      handler() {}
    }
    expect(getGuards(Ctrl.prototype, 'handler')).toEqual([])
    expect(getGuards(Ctrl)).toEqual([])
  })

  it('keeps class-guard and method-guard metadata independent', () => {
    @UseGuards(AuthGuard)
    class Ctrl {
      @UseGuards(RoleGuard)
      handler() {}
    }
    // route-handler concatenates [...classGuards, ...methodGuards]
    expect(getGuards(Ctrl)).toEqual([AuthGuard])
    expect(getGuards(Ctrl.prototype, 'handler')).toEqual([RoleGuard])
  })
})
