import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodBody } from '../openapi/zod-openapi';
import { ZodValidationPipe, idParamSchema } from '@is-kontrol/shared-validation';
import type { IdParamDto } from '@is-kontrol/shared-validation';
import { AddNoteCommand } from '../../../application/commands/notes/add-note/add-note.command';
import { AddNoteHandler } from '../../../application/commands/notes/add-note/add-note.handler';
import { UpdateNoteCommand } from '../../../application/commands/notes/update-note/update-note.command';
import { UpdateNoteHandler } from '../../../application/commands/notes/update-note/update-note.handler';
import { DeleteNoteCommand } from '../../../application/commands/notes/delete-note/delete-note.command';
import { DeleteNoteHandler } from '../../../application/commands/notes/delete-note/delete-note.handler';
import { PinNoteCommand } from '../../../application/commands/notes/pin-note/pin-note.command';
import { PinNoteHandler } from '../../../application/commands/notes/pin-note/pin-note.handler';
import { ListPartnerNotesQuery } from '../../../application/queries/notes/list-partner-notes/list-partner-notes.query';
import { ListPartnerNotesHandler } from '../../../application/queries/notes/list-partner-notes/list-partner-notes.handler';
import { CustomerDomainResultInterceptor } from '../domain-result.interceptor';
import { addNoteSchema, pinNoteSchema, updateNoteSchema } from '../dto/notes/note.dto';
import type { AddNoteDto, PinNoteDto, UpdateNoteDto } from '../dto/notes/note.dto';

@ApiTags('notes')
@Controller()
@UseInterceptors(CustomerDomainResultInterceptor)
export class PartnerNotesController {
  constructor(
    private readonly addNote: AddNoteHandler,
    private readonly updateNote: UpdateNoteHandler,
    private readonly deleteNote: DeleteNoteHandler,
    private readonly pinNote: PinNoteHandler,
    private readonly listPartnerNotes: ListPartnerNotesHandler,
  ) {}

  @ZodBody(addNoteSchema)
  @Post('partners/:partnerId/notes') @HttpCode(HttpStatus.CREATED)
  async add(@Param('partnerId', new ZodValidationPipe(idParamSchema)) partnerId: IdParamDto,
    @Body(new ZodValidationPipe(addNoteSchema)) body: AddNoteDto) {
    return this.addNote.execute(new AddNoteCommand(partnerId, body.type, body.content, body.pinned));
  }

  @Get('partners/:partnerId/notes')
  async list(@Param('partnerId', new ZodValidationPipe(idParamSchema)) partnerId: IdParamDto) {
    return this.listPartnerNotes.execute(new ListPartnerNotesQuery(partnerId));
  }

  @ZodBody(updateNoteSchema)
  @Patch('notes/:noteId')
  async update(@Param('noteId', new ZodValidationPipe(idParamSchema)) noteId: IdParamDto,
    @Body(new ZodValidationPipe(updateNoteSchema)) body: UpdateNoteDto) {
    return this.updateNote.execute(new UpdateNoteCommand(noteId, body.type, body.content));
  }

  @ZodBody(pinNoteSchema)
  @Patch('notes/:noteId/pin') @HttpCode(HttpStatus.NO_CONTENT)
  async pin(@Param('noteId', new ZodValidationPipe(idParamSchema)) noteId: IdParamDto,
    @Body(new ZodValidationPipe(pinNoteSchema)) body: PinNoteDto) {
    return this.pinNote.execute(new PinNoteCommand(noteId, body.pinned));
  }

  @Delete('notes/:noteId') @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('noteId', new ZodValidationPipe(idParamSchema)) noteId: IdParamDto) {
    return this.deleteNote.execute(new DeleteNoteCommand(noteId));
  }
}
