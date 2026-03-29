import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';
import { ConversationType } from '@prisma/client';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ConversationType)
  @IsNotEmpty()
  type: ConversationType;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  participantIds?: number[];
}
