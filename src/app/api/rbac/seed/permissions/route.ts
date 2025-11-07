import 'reflect-metadata'
import { RbacController } from '@/server/controllers/rbac.controller'
import { createRouteHandler } from '@/server/core/route-handler'

export const POST = createRouteHandler(RbacController, 'seedPermissions')
