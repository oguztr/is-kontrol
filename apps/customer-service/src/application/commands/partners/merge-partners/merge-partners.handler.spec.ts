import type { ICompanyProfileRepository } from "../../../../domain/repositories/company-profile.repository.interface";
import type { IContactRepository } from "../../../../domain/repositories/contact.repository.interface";
import type { IAddressRepository } from "../../../../domain/repositories/address.repository.interface";
import type { INoteRepository } from "../../../../domain/repositories/note.repository.interface";
import {
  activityRepositoryFixture,
  actorFixture,
  eventPublisherFixture,
  partnerFixture,
  partnerRepositoryFixture,
  unitOfWorkFixture,
} from "../../../testing/partner.fixtures";
import { MergePartnersCommand } from "./merge-partners.command";
import { MergePartnersHandler } from "./merge-partners.handler";

const SURVIVOR_ID = "00000000-0000-4000-8000-00000000aaa1";
const SOURCE_ID = "00000000-0000-4000-8000-00000000bbb2";

describe("MergePartnersHandler", () => {
  function createHandler() {
    const survivor = partnerFixture({ id: SURVIVOR_ID, type: "CUSTOMER" });
    const source = partnerFixture({ id: SOURCE_ID, type: "SUPPLIER" });
    source.tags = ["kritik-tedarikci"];
    const partners = partnerRepositoryFixture(
      new Map([[survivor.id, survivor], [source.id, source]]),
    );
    const companyProfiles: jest.Mocked<ICompanyProfileRepository> = {
      findByPartnerId: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      update: jest.fn(),
      moveToPartner: jest.fn(),
      deleteByPartnerId: jest.fn(),
      listTaxNumberDuplicates: jest.fn().mockResolvedValue([]),
    };
    const contacts = {
      findById: jest.fn(), listByPartner: jest.fn(), save: jest.fn(),
      update: jest.fn(), delete: jest.fn(), clearPrimary: jest.fn(),
      search: jest.fn(), reassignPartner: jest.fn(), listEmailDuplicates: jest.fn(),
    } satisfies IContactRepository;
    const addresses = {
      findById: jest.fn(), listByPartner: jest.fn(), save: jest.fn(),
      update: jest.fn(), delete: jest.fn(), clearDefault: jest.fn(),
      clearAllDefaults: jest.fn(), reassignPartner: jest.fn(),
    } satisfies IAddressRepository;
    const notes = {
      findById: jest.fn(), listByPartner: jest.fn(), save: jest.fn(),
      update: jest.fn(), delete: jest.fn(), reassignPartner: jest.fn(),
    } satisfies INoteRepository;
    const activities = activityRepositoryFixture();
    const publisher = eventPublisherFixture();
    const handler = new MergePartnersHandler(
      partners, activities, companyProfiles, contacts, addresses, notes,
      publisher, unitOfWorkFixture(), actorFixture(),
    );
    return { handler, survivor, source, partners, contacts, addresses, notes, activities, publisher };
  }

  it("unions types, moves children and closes the source partner", async () => {
    const { handler, survivor, source, contacts, notes, publisher } = createHandler();

    const result = await handler.execute(new MergePartnersCommand(SURVIVOR_ID, SOURCE_ID));

    expect(result.isSuccess).toBe(true);
    expect(survivor.type).toBe("BOTH");
    expect(survivor.tags).toContain("kritik-tedarikci");
    expect(source.mergedIntoId).toBe(SURVIVOR_ID);
    expect(source.deletedAt).not.toBeNull();
    expect(contacts.reassignPartner).toHaveBeenCalledWith(SOURCE_ID, SURVIVOR_ID);
    expect(notes.reassignPartner).toHaveBeenCalledWith(SOURCE_ID, SURVIVOR_ID);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "partner.merged",
        payload: expect.objectContaining({
          mergedPartnerId: SOURCE_ID,
          survivorPartnerId: SURVIVOR_ID,
        }),
      }),
    );
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "partner.updated" }),
    );
  });

  it("rejects merging a partner into itself", async () => {
    const { handler, partners } = createHandler();

    const result = await handler.execute(new MergePartnersCommand(SURVIVOR_ID, SURVIVOR_ID));

    expect(result.isFailure).toBe(true);
    expect(result.match<unknown>((v) => v, (e) => e)).toMatchObject({ code: "MERGE_SAME_PARTNER" });
    expect(partners.update).not.toHaveBeenCalled();
  });
});
