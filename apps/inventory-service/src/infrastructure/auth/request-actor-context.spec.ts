import { RequestActorContext } from "./request-actor-context";

describe("RequestActorContext", () => {
  const context = new RequestActorContext();

  it("allows every company outside of a scoped request", () => {
    expect(context.allowsCompany(crypto.randomUUID())).toBe(true);
    expect(context.userId()).toBeNull();
  });

  it("restricts access to the scoped company and exposes the user", () => {
    const companyId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    context.run({ companyId, userId }, () => {
      expect(context.allowsCompany(companyId)).toBe(true);
      expect(context.allowsCompany(crypto.randomUUID())).toBe(false);
      expect(context.userId()).toBe(userId);
    });
  });

  it("does not restrict when only the user is known", () => {
    context.run({ companyId: null, userId: crypto.randomUUID() }, () => {
      expect(context.allowsCompany(crypto.randomUUID())).toBe(true);
    });
  });
});
