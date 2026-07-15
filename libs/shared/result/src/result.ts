export abstract class Result<T, E> {
  abstract readonly isSuccess: boolean;
  abstract readonly isFailure: boolean;
  abstract match<U>(
    onSuccess: (value: T) => U,
    onFailure: (error: E) => U,
  ): U;
}

export class Success<T> extends Result<T, never> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(public readonly value: T) {
    super();
  }

  match<U>(onSuccess: (value: T) => U, _onFailure: (error: never) => U): U {
    return onSuccess(this.value);
  }
}

export class Failure<E> extends Result<never, E> {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(public readonly error: E) {
    super();
  }

  match<U>(_onSuccess: (value: never) => U, onFailure: (error: E) => U): U {
    return onFailure(this.error);
  }
}

/** Domain hatalarının ortak şekli: ayırt edici alan `code`. */
export type DomainError = { code: string };
