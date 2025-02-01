import { DateTime } from 'luxon'
import { apiCall, AuthParam } from 'rlz-engine/dist/client/api/api'
import { z } from 'zod'

import { apiAuthResponseSchemaV0, ApiAuthResponseV0, apiComparisonObjectSchemaV0, ApiGetObjectsRequestV0, ApiItemsRequestV0, apiItemsResponseSchemaV0, ApiItemsResponseV0, ApiSigninRequestV0, ApiSignupRequestV0 } from '../common/api_v0'
import { apiAccountSchemaV0, ApiAccountV0, apiCategorySchemaV0, ApiCategoryV0, apiOperationSchemaV0, ApiOperationV0, apiWatchSchemaV0, ApiWatchV0 } from '../common/data_v0'

export async function apiSignup(name: string, email: string, password: string): Promise<ApiAuthResponseV0> {
    const req: ApiSignupRequestV0 = {
        name,
        email,
        password
    }

    return apiCall('POST', 'v0', 'signup', null, null, req, apiAuthResponseSchemaV0)
}

export async function apiSignin(name: string, password: string): Promise<ApiAuthResponseV0> {
    const req: ApiSigninRequestV0 = {
        name,
        password
    }

    return apiCall('POST', 'v0', 'signin', null, null, req, apiAuthResponseSchemaV0)
}

export async function apiOps(auth: AuthParam, syncAfter: DateTime<true> | null): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    const queryString = syncAfter === null ? null : { syncAfter: syncAfter.toISO() }
    return apiCall('GET', 'v0', 'operations', auth, queryString, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiOpsByIds(ids: readonly string[], auth: AuthParam): Promise<ApiItemsResponseV0<typeof apiOperationSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('POST', 'v0', 'operations/by-ids', auth, null, req, apiItemsResponseSchemaV0(apiOperationSchemaV0))
}

export async function apiPushOps(items: readonly ApiOperationV0[], auth: AuthParam): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiOperationSchemaV0> = {
        items
    }

    await apiCall('POST', 'v0', 'operations/push', auth, null, req, z.undefined())
}

export async function apiAccounts(auth: AuthParam, syncAfter: DateTime<true> | null): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    const queryString = syncAfter === null ? null : { syncAfter: syncAfter.toISO() }
    return apiCall('GET', 'v0', 'accounts', auth, queryString, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiAccountsByIds(ids: readonly string[], auth: AuthParam): Promise<ApiItemsResponseV0<typeof apiAccountSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('POST', 'v0', 'accounts/by-ids', auth, null, req, apiItemsResponseSchemaV0(apiAccountSchemaV0))
}

export async function apiPushAccounts(items: readonly ApiAccountV0[], auth: AuthParam): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiAccountSchemaV0> = {
        items
    }

    await apiCall('POST', 'v0', 'accounts/push', auth, null, req, z.undefined())
}

export async function apiCategories(auth: AuthParam, syncAfter: DateTime<true> | null): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    const queryString = syncAfter === null ? null : { syncAfter: syncAfter.toISO() }
    return apiCall('GET', 'v0', 'categories', auth, queryString, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiCategoriesByIds(ids: readonly string[], auth: AuthParam): Promise<ApiItemsResponseV0<typeof apiCategorySchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('POST', 'v0', 'categories/by-ids', auth, null, req, apiItemsResponseSchemaV0(apiCategorySchemaV0))
}

export async function apiPushCategories(items: readonly ApiCategoryV0[], auth: AuthParam): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiCategorySchemaV0> = {
        items
    }

    await apiCall('POST', 'v0', 'categories/push', auth, null, req, z.undefined())
}

export async function apiWatches(auth: AuthParam, syncAfter: DateTime<true> | null): Promise<ApiItemsResponseV0<typeof apiComparisonObjectSchemaV0>> {
    const queryString = syncAfter === null ? null : { syncAfter: syncAfter.toISO() }
    return apiCall('GET', 'v0', 'watches', auth, queryString, null, apiItemsResponseSchemaV0(apiComparisonObjectSchemaV0))
}

export async function apiWatchesByIds(ids: readonly string[], auth: AuthParam): Promise<ApiItemsResponseV0<typeof apiWatchSchemaV0>> {
    const req: ApiGetObjectsRequestV0 = { ids }

    return apiCall('POST', 'v0', 'watches/by-ids', auth, null, req, apiItemsResponseSchemaV0(apiWatchSchemaV0))
}

export async function apiPushWatches(items: readonly ApiWatchV0[], auth: AuthParam): Promise<void> {
    const req: ApiItemsRequestV0<typeof apiWatchSchemaV0> = {
        items
    }

    await apiCall('POST', 'v0', 'watches/push', auth, null, req, z.undefined())
}

export async function apiClearAll(auth: AuthParam): Promise<void> {
    await apiCall('POST', 'v0', 'clearAll', auth, null, null, z.undefined())
}
