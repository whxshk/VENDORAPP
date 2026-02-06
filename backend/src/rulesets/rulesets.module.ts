import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RulesetsService } from './rulesets.service';
import { RulesetsController } from './rulesets.controller';
import { Ruleset, RulesetSchema } from '../database/schemas/Ruleset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ruleset.name, schema: RulesetSchema }]),
  ],
  controllers: [RulesetsController],
  providers: [RulesetsService],
  exports: [RulesetsService],
})
export class RulesetsModule {}
