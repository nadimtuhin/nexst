import 'reflect-metadata'
import { RbacController } from '@/server/controllers/rbac.controller'
import { createRouteHandler } from '@/server/core/route-handler'
import { CreateRoleDto } from '@/server/dto/role.dto'

export const GET = createRouteHandler(RbacController, 'getRoles')
export const POST = createRouteHandler(RbacController, 'createRole', CreateRoleDto)
