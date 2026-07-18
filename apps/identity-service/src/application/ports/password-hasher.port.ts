export interface IPasswordHasherPort {
  hash(plain: string): Promise<string>;
  verify(plain: string, storedHash: string): Promise<boolean>;
}
