'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Array of documents with IDs, or null.
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

// Internal type guard to check if a query has a path property.
type InternalQuery = { _query: { path: { canonicalString: () => string } } };
function isInternalQuery(q: any): q is InternalQuery {
  return q && q._query && typeof q._query.path.canonicalString === 'function';
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references.
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence. Also make sure that it's dependencies are stable
 * references
 * 
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference | Query | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: CollectionReference | Query | null | undefined,
): UseCollectionResult<T> {
  type StateDataType = WithId<T>[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    // Optional: setData(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map(doc => ({ ...(doc.data() as T), id: doc.id }));
        setData(docs);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // Attempt to get the canonical path for the error context.
        const path =
          memoizedTargetRefOrQuery instanceof CollectionReference
            ? memoizedTargetRefOrQuery.path
            : isInternalQuery(memoizedTargetRefOrQuery)
            ? (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()
            : 'unknown_path';

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })
        
        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}
