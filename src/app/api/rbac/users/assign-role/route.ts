import 'reflect-metadata'
import { RbacController } from '@/server/controllers/rbac.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { AssignRoleDto } from '@/server/dto/role.dto'

export const POST = createRouteHandler(RbacController, 'assignRole', AssignRoleDto)
