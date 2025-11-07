import 'reflect-metadata'
import { RbacController } from '@/server/controllers/rbac.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { CreatePermissionDto } from '@/server/dto/role.dto'

export const GET = createRouteHandler(RbacController, 'getAllPermissions')
export const POST = createRouteHandler(RbacController, 'createPermission', CreatePermissionDto)
