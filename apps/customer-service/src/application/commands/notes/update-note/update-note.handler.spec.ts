import { NoteEntity } from "../../../../domain/entities/note.entity";
import type { INoteRepository } from "../../../../domain/repositories/note.repository.interface";
import {
  actorFixture,
  partnerFixture,
  partnerRepositoryFixture,
  unitOfWorkFixture,
} from "../../../testing/partner.fixtures";
import { UpdateNoteCommand } from "./update-note.command";
import { UpdateNoteHandler } from "./update-note.handler";

const AUTHOR_ID = "00000000-0000-4000-8000-00000000dd01";
const OTHER_USER_ID = "00000000-0000-4000-8000-00000000dd02";

describe("UpdateNoteHandler", () => {
  function createHandler(actorUserId: string | null) {
    const partner = partnerFixture();
    const note = new NoteEntity({
      id: "00000000-0000-4000-8000-00000000ee01",
      partnerId: partner.id,
      type: "CALL",
      content: "İlk görüşme",
      pinned: false,
      authorUserId: AUTHOR_ID,
      createdAt: new Date(),
    });
    const notes = {
      findById: jest.fn().mockResolvedValue(note),
      listByPartner: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reassignPartner: jest.fn(),
    } satisfies INoteRepository;
    const handler = new UpdateNoteHandler(
      partnerRepositoryFixture(new Map([[partner.id, partner]])),
      notes, unitOfWorkFixture(), actorFixture(actorUserId),
    );
    return { handler, note, notes };
  }

  it("lets the author edit their own note", async () => {
    const { handler, note, notes } = createHandler(AUTHOR_ID);

    const result = await handler.execute(
      new UpdateNoteCommand(note.id, "MEETING", "Güncellendi"),
    );

    expect(result.isSuccess).toBe(true);
    expect(notes.update).toHaveBeenCalledWith(
      expect.objectContaining({ type: "MEETING", content: "Güncellendi" }),
    );
  });

  it("forbids editing another user's note", async () => {
    const { handler, note, notes } = createHandler(OTHER_USER_ID);

    const result = await handler.execute(
      new UpdateNoteCommand(note.id, "NOTE", "İzinsiz"),
    );

    expect(result.isFailure).toBe(true);
    expect(result.match<unknown>((v) => v, (e) => e)).toMatchObject({ code: "NOTE_EDIT_FORBIDDEN" });
    expect(notes.update).not.toHaveBeenCalled();
  });
});
