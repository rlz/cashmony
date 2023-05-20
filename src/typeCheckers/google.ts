import typia from 'typia'
import { type GoogleOpsDeletedRow, type GoogleOpsExtRow, type GoogleOpsInitRow } from '../google/googleDataSchema'
import { type RowsType } from '../google/loadOperations'
import { type PutReplyBody, type ClearReplyBody } from '../google/storeOperations'

export const isGoogleOpsInitRow = typia.createIs<GoogleOpsInitRow>()
export const assertGoogleOpsInitRow = typia.createAssert<GoogleOpsInitRow>()
export const isGoogleOpsDeletedRow = typia.createIs<GoogleOpsDeletedRow>()
export const assertGoogleOpsExtRow = typia.createAssert<GoogleOpsExtRow>()

export const assertRowsType = typia.createAssert<RowsType>()
export const assertClearReplyBody = typia.createAssert<ClearReplyBody>()
export const assertPutReplyBody = typia.createAssert<PutReplyBody>()
