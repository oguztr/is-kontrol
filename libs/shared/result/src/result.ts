// libs/shared/result/src/result.ts

export type Result<TValue, TError> = Success<TValue> | Failure<TError>;

export class Success<TValue> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;
  constructor(readonly value: TValue) {}

  map<TNewValue>(fn: (value: TValue) => TNewValue): Result<TNewValue, never> {
    return Result.ok(fn(this.value));
  }

  andThen<TNewValue, TNewError>(
    fn: (value: TValue) => Result<TNewValue, TNewError>,
  ): Result<TNewValue, TNewError> {
    return fn(this.value);
  }
}

export class Failure<TError> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;
  constructor(readonly error: TError) {}

  map(): Failure<TError> {
    return this;
  }

  andThen(): Failure<TError> {
    return this;
  }
}

export const Result = {
  ok<TValue>(value: TValue): Success<TValue> {
    return new Success(value);
  },
  fail<TError>(error: TError): Failure<TError> {
    return new Failure(error);
  },
};

// Kullanışlı bir match helper - exhaustive handling zorunlu kılar
export function match<TValue, TError, TReturn>(
  result: Result<TValue, TError>,
  handlers: {
    onSuccess: (value: TValue) => TReturn;
    onFailure: (error: TError) => TReturn;
  },
): TReturn {
  return result.isSuccess
    ? handlers.onSuccess(result.value)
    : handlers.onFailure(result.error);
}
