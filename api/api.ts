import { z, ZodType } from 'zod'

import { apiAuthResponseSchemaV0, ApiAuthResponseV0, apiComparisonObjectSchemaV0, ApiGetObjectsRequestV0, ApiItemsRequestV0, apiItemsResponseSchemaV0, ApiItemsResponseV0, ApiSigninRequestV0, ApiSignupRequestV0 } from '../common/api_v0'
import { apiAccountSchemaV0, ApiAccountV0, apiCategorySchemaV0, ApiCategoryV0, apiOperationSchemaV0, ApiOperationV0, apiWatchSchemaV0, ApiWatchV0 } from '../common/data_v0'

const apiDomain = process.env.NODE_ENV === 'production' ? 'https://app2.cashmony.ru' : 'http://localhost:3001'

function url(path: string): string {
    return `${apiDomain}/api/v0/${path}`
}

const GZIP_THRESHOLD = 16 * 1024

async function prepareBody(request: object): Promise<Blob | string> {
    const textBody = JSON.stringify(request)
    if (textBody.length <= GZIP_THRESHOLD) {
        return textBody
    }

    const bodyStream = new Blob([textBody]).stream()

    const bodyStreamCompressed = bodyStream.pipeThrough(new CompressionStream('gzip'))
    return new Response(bodyStreamCompressed).blob()
}

async function apiCall<T extends ZodType>(
    method: string, path: string, auth: ApiAuthResponseV0 | null,
    request: object | null, validator: T
): Promise<z.infer<T>> {
    const headers: Record<string, string> = {}

    const body = request === null ? undefined : await prepareBody(request)

    if (body !== undefined) {
        headers['content-type'] = 'application/json'
        if (typeof body !== 'string') {
            headers['content-encoding'] = 'gzip'
        }
    }

    if (auth !== null) {
        headers['authorization'] = `${auth.id}:${auth.tempPassword}`
    }

    const resp = await fetch(url(path), {
        method,
        headers,
        body
    })

    if (!resp.ok) {
        throw Error(`Not ok resp (${resp.status} ${resp.statusText}): ${method} ${url(path)}`)
    }

    if (resp.status === 204) {
        return validator.parse(undefined)
    }

    const json = await resp.json()

    return validator.parse(json)
}

export async function apiSignup(name: string, email: string, password: string): Promise<ApiAuthResponseV0> {
    const req: ApiSignupRequestV0 = {
        name,
        email,
        password
    }

    return apiCall('post', 'signup', null, req, apiAuthResponseSchemaV0)
}

export async function apiSignin(name: string, password: string): Promise<ApiAuthResponseV0> {
    const req: ApiSigninRequestV0 = {
        name,
        password
    }

    return apiCall('post', 'signin', null, req, apiAuthResponseSchemaV0)
}

export async function apiOps(auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    return apiCall('get', 'operations', auth, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiOpsByIds(ids: readonly string[], auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiOperationSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('post', 'operations/by-ids', auth, req, apiItemsResponseSchemaV0(apiOperationSchemaV0))
}

export async function apiPushOps(items: readonly ApiOperationV0[], auth: ApiAuthResponseV0): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiOperationSchemaV0> = {
        items
    }

    await apiCall('post', 'operations/push', auth, req, z.undefined())
}

export async function apiAccounts(auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    return apiCall('get', 'accounts', auth, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiAccountsByIds(ids: readonly string[], auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiAccountSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('post', 'accounts/by-ids', auth, req, apiItemsResponseSchemaV0(apiAccountSchemaV0))
}

export async function apiPushAccounts(items: readonly ApiAccountV0[], auth: ApiAuthResponseV0): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiAccountSchemaV0> = {
        items
    }

    await apiCall('post', 'accounts/push', auth, req, z.undefined())
}

export async function apiCategories(auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    return apiCall('get', 'categories', auth, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiCategoriesByIds(ids: readonly string[], auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiCategorySchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('post', 'categories/by-ids', auth, req, apiItemsResponseSchemaV0(apiCategorySchemaV0))
}

export async function apiPushCategories(items: readonly ApiCategoryV0[], auth: ApiAuthResponseV0): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiCategorySchemaV0> = {
        items
    }

    await apiCall('post', 'categories/push', auth, req, z.undefined())
}

export async function apiWatches(auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    return apiCall('get', 'watches', auth, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiWatchesByIds(ids: readonly string[], auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiWatchSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('post', 'watches/by-ids', auth, req, apiItemsResponseSchemaV0(apiWatchSchemaV0))
}

export async function apiPushWatches(items: readonly ApiWatchV0[], auth: ApiAuthResponseV0): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiWatchSchemaV0> = {
        items
    }

    await apiCall('post', 'watches/push', auth, req, z.undefined())
}
