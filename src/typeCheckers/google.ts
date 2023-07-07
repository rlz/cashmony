import typia from 'typia'

import { type GoogleAccountRow, type GoogleDeletedOperationRow, type GoogleNonDeletedOperationRow, type GoogleOperationCategoryRow } from '../google/googleDataSchema'
import { type RowsType } from '../google/load'
import { type ClearReplyBody, type PutReplyBody } from '../google/store'

export const isGoogleNonDeletedOperationRow = typia.createIs<GoogleNonDeletedOperationRow>()
export const assertGoogleNonDeletedOperationRow = typia.createAssert<GoogleNonDeletedOperationRow>()
export const isGoogleDeletedOperationRow = typia.createIs<GoogleDeletedOperationRow>()
export const isGoogleOperationCategoryRow = typia.createIs<GoogleOperationCategoryRow>()
export const isGoogleAccountRow = typia.createIs<GoogleAccountRow>()

export const assertRowsType = typia.createAssert<RowsType>()
export const assertClearReplyBody = typia.createAssert<ClearReplyBody>()
export const assertPutReplyBody = typia.createAssert<PutReplyBody>()
