export interface IUnitOfWorkPort {
  run<T>(work: () => Promise<T>): Promise<T>;
}
