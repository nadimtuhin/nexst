import 'reflect-metadata'
import { RbacController } from '@/server/controllers/rbac.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { UpdateRoleDto } from '@/server/dto/role.dto'

export const GET = createRouteHandler(RbacController, 'getRoleById')
export const PUT = createRouteHandler(RbacController, 'updateRole', UpdateRoleDto)
export const DELETE = createRouteHandler(RbacController, 'deleteRole')
