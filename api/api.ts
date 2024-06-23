import { DateTime } from 'luxon'
import { z, ZodType } from 'zod'

import { apiAuthResponseSchemaV0, ApiAuthResponseV0, apiComparisonObjectSchemaV0, ApiGetObjectsRequestV0, ApiItemsRequestV0, apiItemsResponseSchemaV0, ApiItemsResponseV0, ApiSigninRequestV0, ApiSignupRequestV0 } from '../common/api_v0'
import { apiAccountSchemaV0, ApiAccountV0, apiCategorySchemaV0, ApiCategoryV0, apiOperationSchemaV0, ApiOperationV0, apiWatchSchemaV0, ApiWatchV0 } from '../common/data_v0'

const apiDomain = process.env.NODE_ENV === 'production' ? 'https://app.cashmony.ru' : 'http://localhost:3001'

export class Forbidden extends Error {
    constructor(url: string) {
        super(`Forbidden: ${url}`)
    }
}

function url(path: string, queryString: Record<string, string> | null): string {
    const base = `${apiDomain}/api/v0/${path}`
    if (queryString === null) {
        return base
    }

    const query = Object.entries(queryString)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')

    return `${base}?${query}`
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
    queryString: Record<string, string> | null,
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

    const u = url(path, queryString)
    const resp = await fetch(u, {
        method,
        headers,
        body
    })

    if (!resp.ok) {
        if (resp.status === 403) {
            throw new Forbidden(u)
        }
        throw Error(`Not ok resp (${resp.status} ${resp.statusText}): ${method} ${u}`)
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

    return apiCall('post', 'signup', null, null, req, apiAuthResponseSchemaV0)
}

export async function apiSignin(name: string, password: string): Promise<ApiAuthResponseV0> {
    const req: ApiSigninRequestV0 = {
        name,
        password
    }

    return apiCall('post', 'signin', null, null, req, apiAuthResponseSchemaV0)
}

export async function apiOps(auth: ApiAuthResponseV0, syncAfter: DateTime<true> | null): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    const queryString = syncAfter === null ? null : { syncAfter: syncAfter.toISO() }
    return apiCall('get', 'operations', auth, queryString, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiOpsByIds(ids: readonly string[], auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiOperationSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('post', 'operations/by-ids', auth, null, req, apiItemsResponseSchemaV0(apiOperationSchemaV0))
}

export async function apiPushOps(items: readonly ApiOperationV0[], auth: ApiAuthResponseV0): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiOperationSchemaV0> = {
        items
    }

    await apiCall('post', 'operations/push', auth, null, req, z.undefined())
}

export async function apiAccounts(auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    return apiCall('get', 'accounts', auth, null, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiAccountsByIds(ids: readonly string[], auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiAccountSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('post', 'accounts/by-ids', auth, null, req, apiItemsResponseSchemaV0(apiAccountSchemaV0))
}

export async function apiPushAccounts(items: readonly ApiAccountV0[], auth: ApiAuthResponseV0): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiAccountSchemaV0> = {
        items
    }

    await apiCall('post', 'accounts/push', auth, null, req, z.undefined())
}

export async function apiCategories(auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    return apiCall('get', 'categories', auth, null, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiCategoriesByIds(ids: readonly string[], auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiCategorySchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('post', 'categories/by-ids', auth, null, req, apiItemsResponseSchemaV0(apiCategorySchemaV0))
}

export async function apiPushCategories(items: readonly ApiCategoryV0[], auth: ApiAuthResponseV0): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiCategorySchemaV0> = {
        items
    }

    await apiCall('post', 'categories/push', auth, null, req, z.undefined())
}

export async function apiWatches(auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    return apiCall('get', 'watches', auth, null, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiWatchesByIds(ids: readonly string[], auth: ApiAuthResponseV0): Promise<ApiItemsResponseV0<typeof apiWatchSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('post', 'watches/by-ids', auth, null, req, apiItemsResponseSchemaV0(apiWatchSchemaV0))
}

export async function apiPushWatches(items: readonly ApiWatchV0[], auth: ApiAuthResponseV0): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiWatchSchemaV0> = {
        items
    }

    await apiCall('post', 'watches/push', auth, null, req, z.undefined())
}

export async function apiClearAll(auth: ApiAuthResponseV0): Promise<void> {
    await apiCall('post', 'clearAll', auth, null, null, z.undefined())
}
