import { ContactEntity } from "../../../../domain/entities/contact.entity";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import {
  actorFixture,
  eventPublisherFixture,
  partnerFixture,
  partnerRepositoryFixture,
  unitOfWorkFixture,
} from "../../../testing/partner.fixtures";
import { SetPrimaryContactCommand } from "./set-primary-contact.command";
import { SetPrimaryContactHandler } from "./set-primary-contact.handler";

describe("SetPrimaryContactHandler", () => {
  it("demotes the previous primary before promoting the new one", async () => {
    const partner = partnerFixture();
    const contact = new ContactEntity({
      id: "00000000-0000-4000-8000-00000000cc01",
      partnerId: partner.id,
      firstName: "Ada",
      lastName: "Yilmaz",
      title: null,
      department: null,
      phone: null,
      email: null,
      isPrimary: false,
      createdAt: new Date(),
    });
    const contacts = {
      findById: jest.fn().mockResolvedValue(contact),
      listByPartner: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      clearPrimary: jest.fn(),
      search: jest.fn(),
      reassignPartner: jest.fn(),
      listEmailDuplicates: jest.fn(),
    } satisfies IContactRepository;
    const handler = new SetPrimaryContactHandler(
      partnerRepositoryFixture(new Map([[partner.id, partner]])),
      contacts, eventPublisherFixture(), unitOfWorkFixture(), actorFixture(),
    );

    const result = await handler.execute(new SetPrimaryContactCommand(contact.id));

    expect(result.isSuccess).toBe(true);
    expect(contacts.clearPrimary).toHaveBeenCalledWith(partner.id);
    expect(contacts.update).toHaveBeenCalledWith(
      expect.objectContaining({ isPrimary: true }),
    );
  });
});
