import { proxy, type Env } from '../_lib/proxy'

export const onRequest = ({ request, env }: { request: Request; env: Env }) => proxy(request, env)
